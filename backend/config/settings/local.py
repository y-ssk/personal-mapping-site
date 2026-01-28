"""
ローカル開発環境用Django設定。
"""
from .base import *  # noqa: F401, F403

import dj_database_url
from decouple import config

DEBUG = True

# データベース - PostgreSQL with PostGIS
DATABASE_URL = config(
    'DATABASE_URL',
    default='postgresql://postgres:postgres@db:5432/personal_mapping'
)

DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        engine='django.contrib.gis.db.backends.postgis'
    )
}


# デバッグツールバー
INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
INTERNAL_IPS = ['127.0.0.1', 'localhost']


# メール - 開発環境ではコンソール出力
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# 開発環境では全ホスト許可
ALLOWED_HOSTS = ['*']
