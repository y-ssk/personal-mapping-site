"""
認証関連のURLパターン。

SPEC.md § 4.2 認証エンドポイントに準拠。
"""

from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView
from django.urls import path

from apps.users.views import GitHubLogin, GoogleLogin

app_name = "users"

urlpatterns = [
    # POST /api/v1/auth/register/ - 新規登録
    path("register/", RegisterView.as_view(), name="register"),
    # POST /api/v1/auth/login/ - ログイン
    path("login/", LoginView.as_view(), name="login"),
    # POST /api/v1/auth/logout/ - ログアウト
    path("logout/", LogoutView.as_view(), name="logout"),
    # POST /api/v1/auth/refresh/ - トークン更新
    path("refresh/", get_refresh_view().as_view(), name="token_refresh"),
    # GET /api/v1/auth/me/ - 現在のユーザー情報
    path("me/", UserDetailsView.as_view(), name="user_details"),
    # POST /api/v1/auth/google/ - Google OAuth（SPEC.md § 8.1.3）
    path("google/", GoogleLogin.as_view(), name="google_login"),
    # POST /api/v1/auth/github/ - GitHub OAuth（SPEC.md § 8.1.3）
    path("github/", GitHubLogin.as_view(), name="github_login"),
]
