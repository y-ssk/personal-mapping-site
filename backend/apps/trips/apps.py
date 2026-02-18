"""
tripsアプリの設定。
"""

from django.apps import AppConfig


class TripsConfig(AppConfig):
    """旅行管理アプリケーション設定。"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.trips"
    verbose_name = "旅行"
