"""
Django settings for production.
"""
from .base import *  # noqa: F401, F403

import dj_database_url
from decouple import config

DEBUG = False

# Database - PostgreSQL with PostGIS
DATABASE_URL = config('DATABASE_URL')

DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        engine='django.contrib.gis.db.backends.postgis'
    )
}


# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# Email - Configure for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
