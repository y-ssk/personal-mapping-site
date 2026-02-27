"""
locationsアプリのビュー。

CLAUDE.md Thin Viewパターンに従い、HTTP処理のみを行う。
ビジネスロジックはLocationServiceに委譲。
"""

from django.contrib.gis.geos import Point
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.locations.constants import LocationConstants, LocationMessages
from apps.locations.filters import LocationFilter
from apps.locations.models import Category
from apps.locations.serializers import (
    CategorySerializer,
    LocationCreateSerializer,
    LocationSerializer,
    LocationWithDistanceSerializer,
)
from apps.locations.services import LocationService


class LocationViewSet(viewsets.ModelViewSet):
    """
    場所のCRUDエンドポイント。

    SPEC.md § 4.3で定義されたエンドポイントを実装。
    ビジネスロジックはLocationServiceに委譲。

    Endpoints:
        GET /api/v1/locations/ - 一覧取得
        POST /api/v1/locations/ - 作成
        GET /api/v1/locations/{id}/ - 詳細取得
        PUT /api/v1/locations/{id}/ - 更新（完全）
        PATCH /api/v1/locations/{id}/ - 更新（部分）
        DELETE /api/v1/locations/{id}/ - 削除

    Filters:
        category: カテゴリID
        tags: タグ（カンマ区切り）
        status: ステータス
        search: テキスト検索
        ordering: ソート順
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LocationFilter

    def __init__(self, *args, **kwargs):
        """ServiceをDIで注入可能にする。"""
        super().__init__(*args, **kwargs)
        self.service = LocationService()

    def get_queryset(self):
        """
        ユーザーの場所のみを返す。

        N+1問題対策のため、Serviceのget_base_querysetを使用。
        """
        return self.service.get_base_queryset(self.request.user)

    def get_serializer_class(self):
        """
        アクションに応じたシリアライザを返す。

        作成・更新: LocationCreateSerializer
        それ以外: LocationSerializer
        """
        if self.action in ["create", "update", "partial_update"]:
            return LocationCreateSerializer
        return LocationSerializer

    def create(self, request, *args, **kwargs):
        """
        場所を作成。

        POST /api/v1/locations/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        location = self.service.create_location(
            user=request.user,
            data=serializer.validated_data,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        場所を更新（完全）。

        PUT /api/v1/locations/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)

        location = self.service.update_location(
            location=instance,
            data=serializer.validated_data,
            partial=False,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """
        場所を更新（部分）。

        PATCH /api/v1/locations/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        location = self.service.update_location(
            location=instance,
            data=serializer.validated_data,
            partial=True,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        場所を削除。

        DELETE /api/v1/locations/{id}/
        """
        instance = self.get_object()
        self.service.delete_location(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def nearby(self, request):
        """
        近傍検索エンドポイント。

        GET /api/v1/locations/nearby/

        クエリパラメータ:
            lat: 緯度（必須）
            lng: 経度（必須）
            radius: 検索半径km（必須）
            category: カテゴリID（任意）
            tags: タグ（任意、カンマ区切り）

        Returns:
            距離情報付き場所の配列（距離順）。

        Raises:
            ValidationError: 必須パラメータ欠落、または無効な値の場合。
        """
        # 必須パラメータ取得
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius = request.query_params.get("radius")

        # 必須パラメータチェック
        if lat is None:
            raise ValidationError({"lat": LocationMessages.MISSING_PARAMETER.format(param="lat")})
        if lng is None:
            raise ValidationError({"lng": LocationMessages.MISSING_PARAMETER.format(param="lng")})
        if radius is None:
            raise ValidationError(
                {"radius": LocationMessages.MISSING_PARAMETER.format(param="radius")}
            )

        # 型変換・バリデーション
        try:
            lat_float = float(lat)
            lng_float = float(lng)
            radius_float = float(radius)
        except (TypeError, ValueError):
            raise ValidationError({"detail": LocationMessages.INVALID_COORDINATES})

        # 座標範囲チェック
        if not (-90 <= lat_float <= 90) or not (-180 <= lng_float <= 180):
            raise ValidationError({"detail": LocationMessages.INVALID_COORDINATES})

        # Pointオブジェクト生成（経度, 緯度の順序）
        point = Point(lng_float, lat_float, srid=LocationConstants.POINT_SRID)

        # オプションパラメータ
        category_id = request.query_params.get("category")
        if category_id is not None:
            try:
                category_id = int(category_id)
            except (TypeError, ValueError):
                category_id = None

        tags_param = request.query_params.get("tags")
        tags = None
        if tags_param:
            tags = [tag.strip() for tag in tags_param.split(",") if tag.strip()]

        # サービス呼び出し
        locations = self.service.find_nearby(
            user=request.user,
            point=point,
            radius_km=radius_float,
            category_id=category_id,
            tags=tags,
        )

        # シリアライズ
        serializer = LocationWithDistanceSerializer(locations, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    カテゴリの読み取り専用エンドポイント。

    OpenAPI仕様のカテゴリエンドポイントに準拠。
    カテゴリツリーの一覧取得と詳細取得を提供。

    Endpoints:
        GET /api/v1/categories/ - カテゴリ一覧取得
        GET /api/v1/categories/{id}/ - カテゴリ詳細取得
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
