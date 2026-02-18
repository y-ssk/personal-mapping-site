"""
locationsアプリのシリアライザ。

SPEC.md § 4.3 Location APIのリクエスト/レスポンス形式を定義。
"""

from django.contrib.gis.geos import Point
from rest_framework import serializers

from apps.locations.constants import LocationConstants, LocationMessages
from apps.locations.models import Category, Location


class CategorySerializer(serializers.ModelSerializer):
    """
    カテゴリのシリアライザ（読み取り用）。

    Attributes:
        id: カテゴリID。
        name: カテゴリ名。
        slug: スラッグ。
        icon: アイコン識別子。
        full_path: 完全パス（'飲食 / カフェ' 形式）。
        parent_id: 親カテゴリID。

    Example:
        >>> serializer = CategorySerializer(category)
        >>> serializer.data
        {'id': 1, 'name': 'カフェ', 'slug': 'cafe', 'full_path': '飲食 / カフェ', ...}
    """

    full_path = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "full_path", "parent_id"]
        read_only_fields = fields

    def get_full_path(self, obj: Category) -> str:
        """完全パスを取得。"""
        return obj.get_full_path()


class GeoPointField(serializers.Field):
    """
    GeoJSONのPoint形式を扱うカスタムフィールド。

    入力形式:
        {"type": "Point", "coordinates": [経度, 緯度]}

    出力形式:
        {"type": "Point", "coordinates": [経度, 緯度]}

    Example:
        >>> field = GeoPointField()
        >>> field.to_internal_value({"type": "Point", "coordinates": [139.7, 35.6]})
        <Point object at ...>
    """

    def to_representation(self, value: Point) -> dict:
        """PointオブジェクトをGeoJSON形式に変換。"""
        if value is None:
            return None
        return {
            "type": "Point",
            "coordinates": [value.x, value.y],
        }

    def to_internal_value(self, data: dict) -> Point:
        """GeoJSON形式をPointオブジェクトに変換。"""
        if data is None:
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        if not isinstance(data, dict):
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        if data.get("type") != "Point":
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        coordinates = data.get("coordinates")
        if not coordinates or len(coordinates) != 2:
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        try:
            lng, lat = float(coordinates[0]), float(coordinates[1])
        except (TypeError, ValueError):
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        # 座標範囲チェック
        if not (-180 <= lng <= 180) or not (-90 <= lat <= 90):
            raise serializers.ValidationError(LocationMessages.INVALID_POINT)

        return Point(lng, lat, srid=LocationConstants.POINT_SRID)


class LocationSerializer(serializers.ModelSerializer):
    """
    場所のシリアライザ（読み取り用）。

    SPEC.md § 4.10のレスポンス形式に準拠。

    Attributes:
        id: 場所ID。
        name: 場所名。
        point: 座標（GeoJSON Point形式）。
        address: 住所。
        category: カテゴリ（ネスト）。
        tags: タグリスト。
        status: ステータス。
        notes: メモ。
        website: WebサイトURL。
        phone: 電話番号。
        visit_count: 訪問回数。
        average_rating: 平均評価。
        created_at: 作成日時。
        updated_at: 更新日時。

    Example:
        >>> serializer = LocationSerializer(location)
        >>> serializer.data['point']
        {'type': 'Point', 'coordinates': [139.7454, 35.6586]}
    """

    point = GeoPointField()
    category = CategorySerializer(read_only=True)
    visit_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "point",
            "address",
            "category",
            "tags",
            "status",
            "notes",
            "website",
            "phone",
            "visit_count",
            "average_rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "visit_count",
            "average_rating",
            "created_at",
            "updated_at",
        ]


class LocationCreateSerializer(serializers.ModelSerializer):
    """
    場所作成・更新用のシリアライザ（書き込み用）。

    SPEC.md § 4.3のリクエスト形式（LocationCreate）に準拠。

    Attributes:
        name: 場所名（必須）。
        point: 座標（必須、GeoJSON Point形式）。
        address: 住所。
        category_id: カテゴリID。
        tags: タグリスト。
        status: ステータス。
        notes: メモ。
        website: WebサイトURL。
        phone: 電話番号。

    Example:
        >>> data = {
        ...     'name': '東京タワー',
        ...     'point': {'type': 'Point', 'coordinates': [139.7454, 35.6586]},
        ...     'category_id': 1
        ... }
        >>> serializer = LocationCreateSerializer(data=data)
        >>> serializer.is_valid()
        True
    """

    point = GeoPointField()
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Location
        fields = [
            "name",
            "point",
            "address",
            "category_id",
            "tags",
            "status",
            "notes",
            "website",
            "phone",
        ]

    def validate_status(self, value: str) -> str:
        """ステータスのバリデーション。"""
        if value is not None:
            valid_statuses = [choice[0] for choice in LocationConstants.STATUS_CHOICES]
            if value not in valid_statuses:
                raise serializers.ValidationError(
                    LocationMessages.INVALID_STATUS.format(valid_statuses=valid_statuses)
                )
        return value

    def to_representation(self, instance: Location) -> dict:
        """作成・更新後のレスポンスはLocationSerializerを使用。"""
        return LocationSerializer(instance).data


class LocationWithDistanceSerializer(LocationSerializer):
    """
    距離情報付き場所のシリアライザ。

    近傍検索（nearby/）のレスポンスで使用。
    LocationSerializerを継承し、distanceフィールドを追加。

    Attributes:
        distance: 検索中心点からの距離（km）。
        （LocationSerializerの全フィールドを継承）

    Example:
        >>> serializer = LocationWithDistanceSerializer(location_with_distance)
        >>> serializer.data['distance']
        1.234
    """

    distance = serializers.SerializerMethodField()

    class Meta(LocationSerializer.Meta):
        fields = LocationSerializer.Meta.fields + ["distance"]

    def get_distance(self, obj: Location) -> float | None:
        """
        距離をkm単位で取得。

        Args:
            obj: annotateされたLocationオブジェクト。

        Returns:
            距離（km）。annotateされていない場合はNone。
        """
        if hasattr(obj, "distance") and obj.distance is not None:
            # GeoDjangoのDistanceオブジェクトから km を取得
            return round(obj.distance.km, 3)
        return None
