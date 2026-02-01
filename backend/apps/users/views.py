"""
OAuth認証ビュー。

SPEC.md § 4.2 / § 8.1.3 準拠。
Google OAuth と GitHub OAuth のログインエンドポイントを提供する。
"""

from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings


class GoogleLogin(SocialLoginView):
    """
    Google OAuth認証ログインエンドポイント。

    POSTリクエストでGoogleから取得したアクセストークンを受け取り、
    ユーザー認証を行う。認証成功時はJWTトークンを返す。

    SPEC.md § 4.2: POST /api/v1/auth/google/

    Request Body:
        access_token (str): Googleから取得したアクセストークン
        または
        code (str): Googleから取得した認可コード

    Response:
        200 OK: {
            "access": "JWT access token",
            "refresh": "JWT refresh token",
            "user": { ... }
        }
        400 Bad Request: 認証失敗
    """

    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else None
    client_class = OAuth2Client


class GitHubLogin(SocialLoginView):
    """
    GitHub OAuth認証ログインエンドポイント。

    POSTリクエストでGitHubから取得したアクセストークンを受け取り、
    ユーザー認証を行う。認証成功時はJWTトークンを返す。

    SPEC.md § 4.2: POST /api/v1/auth/github/

    Request Body:
        access_token (str): GitHubから取得したアクセストークン
        または
        code (str): GitHubから取得した認可コード

    Response:
        200 OK: {
            "access": "JWT access token",
            "refresh": "JWT refresh token",
            "user": { ... }
        }
        400 Bad Request: 認証失敗
    """

    adapter_class = GitHubOAuth2Adapter
    callback_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else None
    client_class = OAuth2Client
