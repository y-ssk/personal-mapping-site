"""
locationsアプリの管理画面設定。
"""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from mptt.admin import DraggableMPTTAdmin

from apps.locations.models import Category, Location


@admin.register(Category)
class CategoryAdmin(DraggableMPTTAdmin):
    """
    Categoryモデルの管理画面設定。

    DraggableMPTTAdminを使用して階層構造をドラッグ＆ドロップで
    並べ替え可能にする。
    """

    list_display = (
        "tree_actions",
        "indented_title",
        "slug",
        "icon",
        "created_at",
    )
    list_display_links = ("indented_title",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")
    ordering = ("tree_id", "lft")


@admin.register(Location)
class LocationAdmin(GISModelAdmin):
    """
    Locationモデルの管理画面設定。

    GISModelAdminを使用して地図上での座標入力を可能にする。
    """

    list_display = (
        "name",
        "user",
        "category",
        "status",
        "created_at",
    )
    list_filter = ("status", "category", "created_at")
    search_fields = ("name", "address", "user__username")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("user", "category")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("user", "name", "category", "status")}),
        ("位置情報", {"fields": ("point", "address")}),
        ("詳細", {"fields": ("tags", "notes", "website", "phone")}),
        ("日時", {"fields": ("created_at", "updated_at")}),
    )
