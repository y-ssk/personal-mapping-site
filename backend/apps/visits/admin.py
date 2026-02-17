"""
visitsアプリの管理画面設定。
"""

from django.contrib import admin

from apps.visits.models import Visit


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    """
    Visitモデルの管理画面設定。

    訪問記録の一覧表示、検索、フィルタリングを提供する。
    """

    list_display = (
        "id",
        "user",
        "location",
        "visited_at",
        "rating",
        "created_at",
    )
    list_filter = ("rating", "visited_at", "created_at")
    search_fields = ("user__email", "location__name", "review")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("user", "location")
    ordering = ("-visited_at",)
    date_hierarchy = "visited_at"

    fieldsets = (
        (None, {"fields": ("user", "location")}),
        ("訪問詳細", {"fields": ("visited_at", "rating", "review")}),
        # NOTE: actual_tripはActualTripモデル実装後（#020）に追加
        # ("旅行", {"fields": ("actual_trip",)}),
        ("日時", {"fields": ("created_at", "updated_at")}),
    )
