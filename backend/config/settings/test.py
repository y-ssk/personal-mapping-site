"""
テスト環境用Django設定。
"""
from .base import *  # noqa: F401, F403

import dj_database_url

DEBUG = False

# テスト用データベース - SQLite（高速化のため）
# PostGISが必要なテストはlocal.pyを使用
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# パスワードハッシュ化の高速化
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# メール - テスト環境ではローカルメモリ
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# キャッシュ - テスト環境ではローカルメモリ
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
