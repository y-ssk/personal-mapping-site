"""
locationsアプリの設定。
"""

from django.apps import AppConfig


class LocationsConfig(AppConfig):
    """locationsアプリの設定クラス。"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.locations"
    verbose_name = "場所管理"
