"""
locationsアプリのビジネスロジック。

CLAUDE.md Service層パターンに従い、ビジネスロジックをここに集約。
View層は薄く保ち、このService層に処理を委譲する。
"""

from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import FloatField, IntegerField, QuerySet, Value

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

        NOTE: Visitモデル実装後（#016）に以下に変更:
        - _visit_count: Count("visits")
        - _average_rating: Avg("visits__rating")

        Args:
            queryset: annotate対象のQuerySet。

        Returns:
            _visit_count, _average_ratingがannotateされたQuerySet。
        """
        return queryset.annotate(
            _visit_count=Value(0, output_field=IntegerField()),
            _average_rating=Value(None, output_field=FloatField()),
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
