"""
本番環境用Django設定。
"""

import dj_database_url
from decouple import config

from .base import *  # noqa: F401, F403

DEBUG = False

# データベース - PostgreSQL with PostGIS
DATABASE_URL = config("DATABASE_URL")

DATABASES = {
    "default": dj_database_url.parse(DATABASE_URL, engine="django.contrib.gis.db.backends.postgis")
}


# セキュリティ設定
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# メール - 本番環境用SMTP設定
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
