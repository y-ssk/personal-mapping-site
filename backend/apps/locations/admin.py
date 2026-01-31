"""
locationsアプリの管理画面設定。
"""
from django.contrib import admin
from mptt.admin import DraggableMPTTAdmin

from apps.locations.models import Category


@admin.register(Category)
class CategoryAdmin(DraggableMPTTAdmin):
    """
    Categoryモデルの管理画面設定。

    DraggableMPTTAdminを使用して階層構造をドラッグ＆ドロップで
    並べ替え可能にする。
    """

    list_display = (
        'tree_actions',
        'indented_title',
        'slug',
        'icon',
        'created_at',
    )
    list_display_links = ('indented_title',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'slug')
    ordering = ('tree_id', 'lft')
