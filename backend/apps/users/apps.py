"""
usersアプリの設定。
"""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    """usersアプリの設定クラス。"""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'ユーザー'
