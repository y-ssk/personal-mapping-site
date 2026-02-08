"""
テスト環境用Django設定。
"""

from decouple import config

from .base import *  # noqa: F401, F403

DEBUG = False

# テスト用データベース - PostGIS対応
# LocationモデルがPointFieldを使用するため、PostGISが必要
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": config("DB_NAME", default="personal_mapping_test"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default="postgres"),
        "HOST": config("DB_HOST", default="db"),
        "PORT": config("DB_PORT", default="5432"),
    }
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
