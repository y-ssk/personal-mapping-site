"""
Personal Mapping Siteの基本Django設定。

全環境で共通の設定を定義する。
"""

from datetime import timedelta
from pathlib import Path

from decouple import config

# プロジェクトのベースディレクトリ
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# セキュリティ警告: 本番環境ではシークレットキーを秘密にすること
SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key")

# セキュリティ警告: 本番環境ではDEBUGをFalseにすること
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=lambda v: [s.strip() for s in v.split(",")]
)


# アプリケーション定義
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",  # GeoDjango
    "django.contrib.sites",  # allauth用
]

# サイトID（allauth用）
SITE_ID = 1

THIRD_PARTY_APPS = [
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "mptt",  # 階層カテゴリ用
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
    "dj_rest_auth",
    "dj_rest_auth.registration",
]

LOCAL_APPS = [
    "apps.users",
    "apps.locations",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# データベース
# local.py または production.py で設定


# パスワードバリデーション
# SPEC.md § 8.1: 最低8文字、大文字、小文字、数字を含む
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# 国際化設定
LANGUAGE_CODE = "ja"
TIME_ZONE = "Asia/Tokyo"
USE_I18N = True
USE_TZ = True


# 静的ファイル（CSS、JavaScript、画像）
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# デフォルト主キーフィールドタイプ
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# カスタムユーザーモデル
AUTH_USER_MODEL = "users.User"


# Django REST Framework設定
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}


# drf-spectacular設定（OpenAPIスキーマ生成）
SPECTACULAR_SETTINGS = {
    "TITLE": "Personal Mapping Site API",
    "DESCRIPTION": "Personal location management and travel planning API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# CORS設定
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173",
    cast=lambda v: [s.strip() for s in v.split(",")],
)


# allauth設定（認証バックエンド）
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = "optional"


# dj-rest-auth設定（REST API認証）
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": False,
    "TOKEN_MODEL": None,
    "REGISTER_SERIALIZER": "apps.users.serializers.CustomRegisterSerializer",
    "USER_DETAILS_SERIALIZER": "apps.users.serializers.CustomUserDetailsSerializer",
}


# Simple JWT設定
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}


# OAuth設定（SPEC.md § 8.1.3）
# 環境変数から取得（設定されていない場合は空文字列）
GOOGLE_OAUTH_CLIENT_ID = config("GOOGLE_OAUTH_CLIENT_ID", default="")
GOOGLE_OAUTH_CLIENT_SECRET = config("GOOGLE_OAUTH_CLIENT_SECRET", default="")
GITHUB_OAUTH_CLIENT_ID = config("GITHUB_OAUTH_CLIENT_ID", default="")
GITHUB_OAUTH_CLIENT_SECRET = config("GITHUB_OAUTH_CLIENT_SECRET", default="")

# django-allauth SocialAccount設定
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": [
            "profile",
            "email",
        ],
        "AUTH_PARAMS": {
            "access_type": "online",
        },
    },
    "github": {
        "SCOPE": [
            "user",
            "email",
        ],
    },
}

# OAuth認証後の自動リンク設定
# 同じメールアドレスの既存アカウントに自動リンク
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
