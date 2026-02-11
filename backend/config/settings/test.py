"""
テスト環境用Django設定。
"""

import dj_database_url
from decouple import config

from .base import *  # noqa: F401, F403

DEBUG = False

# テスト用データベース - PostGIS対応
# LocationモデルがPointFieldを使用するため、PostGISが必要
# CI環境: DATABASE_URL環境変数を使用
# ローカルDocker環境: デフォルトのDB接続を使用
DATABASE_URL = config(
    "DATABASE_URL", default="postgresql://postgres:postgres@db:5432/personal_mapping_test"
)

DATABASES = {
    "default": dj_database_url.parse(DATABASE_URL, engine="django.contrib.gis.db.backends.postgis")
}

# パスワードハッシュ化の高速化
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# メール - テスト環境ではローカルメモリ
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# キャッシュ - テスト環境ではローカルメモリ
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# テスト環境ではメール確認を無効化
ACCOUNT_EMAIL_VERIFICATION = "none"
