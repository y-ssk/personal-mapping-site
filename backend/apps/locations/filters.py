"""
locationsアプリのフィルタ定義。

SPEC.md § 4.1「django-filterによる柔軟なクエリ」に準拠。
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from django.db.models import Q

from apps.locations.constants import LocationConstants
from apps.locations.models import Location

if TYPE_CHECKING:
    from django.db.models import QuerySet


class LocationFilter(django_filters.FilterSet):
    """
    場所のフィルタセット。

    SPEC.md § 4.3で定義されたフィルタリングを実装。

    Filters:
        category: カテゴリID。
        tags: タグ（カンマ区切り、OR条件）。
        status: ステータス。
        search: テキスト検索（name, address）。
        ordering: ソート順。

    Example:
        >>> filter = LocationFilter(
        ...     data={'category': 1, 'status': 'want_to_visit'},
        ...     queryset=Location.objects.all()
        ... )
        >>> filter.qs
        <QuerySet [...]>
    """

    category = django_filters.NumberFilter(field_name="category_id")
    tags = django_filters.CharFilter(method="filter_tags")
    status = django_filters.ChoiceFilter(choices=LocationConstants.STATUS_CHOICES)
    search = django_filters.CharFilter(method="filter_search")
    ordering = django_filters.OrderingFilter(
        fields=(
            ("created_at", "created_at"),
            ("name", "name"),
            # visited_atは#016（Visitモデル実装）後に追加
        ),
    )

    class Meta:
        model = Location
        fields = ["category", "tags", "status", "search", "ordering"]

    def filter_tags(
        self, queryset: "QuerySet[Location]", name: str, value: str
    ) -> "QuerySet[Location]":
        """
        タグフィルタ（OR条件）。

        複数タグ指定時は、いずれかのタグを含む場所を返す。

        Args:
            queryset: フィルタ対象のQuerySet。
            name: フィールド名（未使用）。
            value: カンマ区切りのタグ文字列。

        Returns:
            フィルタ済みのQuerySet。

        Example:
            >>> # ?tags=wifi,静か → wifiまたは静かを含む場所
        """
        if not value:
            return queryset

        tag_list = [t.strip() for t in value.split(",") if t.strip()]
        if not tag_list:
            return queryset

        tag_query = Q()
        for tag in tag_list:
            tag_query |= Q(tags__contains=[tag])

        return queryset.filter(tag_query)

    def filter_search(
        self, queryset: "QuerySet[Location]", name: str, value: str
    ) -> "QuerySet[Location]":
        """
        テキスト検索（name, address）。

        Args:
            queryset: フィルタ対象のQuerySet。
            name: フィールド名（未使用）。
            value: 検索文字列。

        Returns:
            フィルタ済みのQuerySet。

        Example:
            >>> # ?search=渋谷 → 名前または住所に「渋谷」を含む場所
        """
        if not value:
            return queryset

        return queryset.filter(Q(name__icontains=value) | Q(address__icontains=value))
