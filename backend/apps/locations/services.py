"""
locationsアプリのビジネスロジック。

CLAUDE.md Service層パターンに従い、ビジネスロジックをここに集約。
View層は薄く保ち、このService層に処理を委譲する。
"""

from typing import Any, Optional

from django.contrib.auth import get_user_model
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Avg, Count, QuerySet
from rest_framework.exceptions import ValidationError

from apps.locations.constants import LocationConstants, LocationMessages
from apps.locations.models import Location

User = get_user_model()


class LocationService:
    """
    場所関連のビジネスロジック。

    CRUD操作とフィルタリングを提供。
    View層からはこのServiceを通じてLocationを操作する。

    Example:
        >>> service = LocationService()
        >>> locations = service.get_user_locations(user, filters={'category': 1})
        >>> location = service.create_location(user, {'name': 'カフェ', 'point': ...})
    """

    def _annotate_visit_stats(self, queryset: QuerySet[Location]) -> QuerySet[Location]:
        """
        訪問統計をannotateする。

        Visitモデル（#016）を使用して、訪問回数と平均評価を計算。

        Args:
            queryset: annotate対象のQuerySet。

        Returns:
            _visit_count, _average_ratingがannotateされたQuerySet。
        """
        return queryset.annotate(
            _visit_count=Count("visits"),
            _average_rating=Avg("visits__rating"),
        )

    def get_base_queryset(self, user: User) -> QuerySet[Location]:
        """
        ユーザーの場所ベースQuerySetを取得。

        N+1問題を避けるため、select_relatedとannotateを使用。
        visit_countとaverage_ratingはannotateで計算。
        フィルタリングはdjango-filter（LocationFilter）に委譲。

        Args:
            user: 場所を所有するユーザー。

        Returns:
            annotate済みの場所QuerySet。

        Example:
            >>> service = LocationService()
            >>> queryset = service.get_base_queryset(user)
        """
        queryset = Location.objects.filter(user=user).select_related("category")
        return self._annotate_visit_stats(queryset)

    def get_location(self, user: User, location_id: int) -> Location | None:
        """
        ユーザーの場所を取得。

        Args:
            user: 場所を所有するユーザー。
            location_id: 場所ID。

        Returns:
            場所オブジェクト。存在しない場合はNone。

        Example:
            >>> service = LocationService()
            >>> location = service.get_location(user, 1)
        """
        try:
            queryset = Location.objects.filter(user=user).select_related("category")
            return self._annotate_visit_stats(queryset).get(id=location_id)
        except Location.DoesNotExist:
            return None

    def create_location(self, user: User, data: dict[str, Any]) -> Location:
        """
        場所を作成。

        Args:
            user: 場所を所有するユーザー。
            data: 場所データ（Serializerでバリデーション済み）。

        Returns:
            作成された場所オブジェクト。

        Example:
            >>> service = LocationService()
            >>> location = service.create_location(user, {
            ...     'name': '東京タワー',
            ...     'point': Point(139.7454, 35.6586, srid=4326),
            ...     'category': category_obj,
            ... })
        """
        location = Location.objects.create(user=user, **data)

        # annotate付きで再取得（visit_count, average_rating含む）
        return self.get_location(user, location.id)

    def update_location(
        self,
        location: Location,
        data: dict[str, Any],
        partial: bool = False,
    ) -> Location:
        """
        場所を更新。

        Args:
            location: 更新対象の場所。
            data: 更新データ（Serializerでバリデーション済み）。
            partial: 部分更新かどうか（PATCHの場合True）。

        Returns:
            更新された場所オブジェクト。

        Example:
            >>> service = LocationService()
            >>> location = service.update_location(
            ...     location,
            ...     {'name': '新しい名前'},
            ...     partial=True
            ... )
        """
        for field, value in data.items():
            setattr(location, field, value)
        location.save()

        # annotate付きで再取得（visit_count, average_rating含む）
        return self.get_location(location.user, location.id)

    def delete_location(self, location: Location) -> None:
        """
        場所を削除。

        Args:
            location: 削除対象の場所。

        Example:
            >>> service = LocationService()
            >>> service.delete_location(location)
        """
        location.delete()

    def find_nearby(
        self,
        user: User,
        point: Point,
        radius_km: float,
        category_id: Optional[int] = None,
        tags: Optional[list[str]] = None,
    ) -> QuerySet[Location]:
        """
        PostGISを使用して指定半径内の場所を検索。

        この関数はPostGISの距離演算子を使用して地理空間検索を実行。
        結果は中心点からの距離順にソート。

        Args:
            user: 場所を所有するユーザー。
            point: 検索の中心点（PostGIS Point、SRID 4326）。
            radius_km: 検索半径（km）。最大は{MAX_RADIUS_KM}km。
            category_id: 結果をフィルタするカテゴリID（任意）。
            tags: 結果をフィルタするタグリスト（任意、OR条件）。

        Returns:
            'distance'フィールドがannotateされたLocationのQuerySet。
            中心点からの近い順にソート済み。

        Raises:
            ValidationError: radius_kmが範囲外の場合。

        Example:
            >>> from django.contrib.gis.geos import Point
            >>> center = Point(139.7671, 35.6812, srid=4326)
            >>> service = LocationService()
            >>> cafes = service.find_nearby(user, center, 5.0, category_id=1)
            >>> for cafe in cafes[:5]:
            ...     print(f"{{cafe.name}}: {{cafe.distance.km:.2f}}km")
        """
        # 半径バリデーション
        if radius_km < LocationConstants.MIN_RADIUS_KM:
            raise ValidationError(
                LocationMessages.RADIUS_TOO_SMALL.format(min_km=LocationConstants.MIN_RADIUS_KM)
            )
        if radius_km > LocationConstants.MAX_RADIUS_KM:
            raise ValidationError(
                LocationMessages.RADIUS_TOO_LARGE.format(max_km=LocationConstants.MAX_RADIUS_KM)
            )

        # PostGIS距離クエリ
        queryset = (
            Location.objects.filter(
                user=user,
                point__distance_lte=(point, D(km=radius_km)),
            )
            .select_related("category")
            .annotate(distance=Distance("point", point))
            .order_by("distance")
        )

        # 訪問統計をannotate
        queryset = self._annotate_visit_stats(queryset)

        # カテゴリフィルタ
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)

        # タグフィルタ（OR条件: 既存LocationFilterと一貫性を保つ）
        if tags:
            from django.db.models import Q

            tag_query = Q()
            for tag in tags:
                tag_query |= Q(tags__contains=[tag])
            queryset = queryset.filter(tag_query)

        return queryset
