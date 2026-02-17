"""
visitsアプリの設定。
"""

from django.apps import AppConfig


class VisitsConfig(AppConfig):
    """訪問記録アプリケーション設定。"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.visits"
    verbose_name = "訪問記録"
