"""
認証APIエンドポイントのテスト。

SPEC.md § 4.2 認証エンドポイントに準拠。
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.users.models import User


@pytest.mark.django_db
class TestRegisterEndpoint:
    """POST /api/v1/auth/register/ のテスト。"""

    URL = "/api/v1/auth/register/"

    def test_register_success(self, api_client, user_data):
        """正常な登録が成功する。"""
        response = api_client.post(self.URL, user_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert "access" in response.data
        assert "refresh" in response.data
        assert User.objects.filter(email=user_data["email"]).exists()

    def test_register_with_display_name(self, api_client, user_data):
        """display_name付きで登録できる。"""
        response = api_client.post(self.URL, user_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email=user_data["email"])
        assert user.display_name == user_data["display_name"]

    def test_register_without_display_name(self, api_client):
        """display_nameなしで登録できる。"""
        data = {
            "email": "nodisplay@example.com",
            "password1": "TestPass123!",
            "password2": "TestPass123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email=data["email"])
        assert user.display_name == ""

    def test_register_duplicate_email(self, api_client, user):
        """重複するメールアドレスでは登録できない。"""
        data = {
            "email": user.email,  # 既存ユーザーのメールアドレス
            "password1": "NewPass123!",
            "password2": "NewPass123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, api_client):
        """弱いパスワードでは登録できない。"""
        data = {
            "email": "weak@example.com",
            "password1": "123",  # 短すぎる
            "password2": "123",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, api_client):
        """パスワードが一致しない場合は登録できない。"""
        data = {
            "email": "mismatch@example.com",
            "password1": "TestPass123!",
            "password2": "DifferentPass123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_email(self, api_client):
        """無効なメールアドレスでは登録できない。"""
        data = {
            "email": "not-an-email",
            "password1": "TestPass123!",
            "password2": "TestPass123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLoginEndpoint:
    """POST /api/v1/auth/login/ のテスト。"""

    URL = "/api/v1/auth/login/"

    def test_login_success(self, api_client, user):
        """正しい認証情報でログインできる。"""
        data = {
            "email": user.email,
            "password": "ExistingPass123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, api_client, user):
        """間違ったパスワードではログインできない。"""
        data = {
            "email": user.email,
            "password": "WrongPassword123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """存在しないユーザーではログインできない。"""
        data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_email(self, api_client):
        """メールアドレスなしではログインできない。"""
        data = {
            "password": "SomePassword123!",
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_password(self, api_client, user):
        """パスワードなしではログインできない。"""
        data = {
            "email": user.email,
        }
        response = api_client.post(self.URL, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestRefreshEndpoint:
    """POST /api/v1/auth/refresh/ のテスト。"""

    URL = "/api/v1/auth/refresh/"
    LOGIN_URL = "/api/v1/auth/login/"

    def test_refresh_success(self, api_client, user):
        """有効なリフレッシュトークンでアクセストークンを更新できる。"""
        # ログインしてトークンを取得
        login_data = {
            "email": user.email,
            "password": "ExistingPass123!",
        }
        login_response = api_client.post(self.LOGIN_URL, login_data, format="json")
        refresh_token = login_response.data["refresh"]

        # リフレッシュ
        response = api_client.post(self.URL, {"refresh": refresh_token}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_refresh_invalid_token(self, api_client):
        """無効なリフレッシュトークンではエラーになる。"""
        response = api_client.post(self.URL, {"refresh": "invalid-token"}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_missing_token(self, api_client):
        """リフレッシュトークンがない場合はエラーになる。"""
        response = api_client.post(self.URL, {}, format="json")

        # simplejwtは空のトークンでも401を返す
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        ]


@pytest.mark.django_db
class TestMeEndpoint:
    """GET /api/v1/auth/me/ のテスト。"""

    URL = "/api/v1/auth/me/"

    def test_me_authenticated(self, authenticated_client, user):
        """認証済みユーザーは自分の情報を取得できる。"""
        response = authenticated_client.get(self.URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email
        assert response.data["display_name"] == user.display_name
        assert "id" in response.data
        assert "date_joined" in response.data

    def test_me_unauthenticated(self, api_client):
        """未認証ユーザーはアクセスできない。"""
        response = api_client.get(self.URL)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_with_jwt(self, api_client, user):
        """JWTトークンで認証してアクセスできる。"""
        # ログインしてトークンを取得
        login_data = {
            "email": user.email,
            "password": "ExistingPass123!",
        }
        login_response = api_client.post("/api/v1/auth/login/", login_data, format="json")
        access_token = login_response.data["access"]

        # JWTで認証してアクセス
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = api_client.get(self.URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email


@pytest.mark.django_db
class TestLogoutEndpoint:
    """POST /api/v1/auth/logout/ のテスト。"""

    URL = "/api/v1/auth/logout/"

    def test_logout_authenticated(self, authenticated_client):
        """認証済みユーザーはログアウトできる。"""
        response = authenticated_client.post(self.URL)

        assert response.status_code == status.HTTP_200_OK

    def test_logout_unauthenticated(self, api_client):
        """未認証ユーザーもログアウトエンドポイントにアクセスできる。"""
        # dj-rest-authのデフォルトではログアウトは認証不要
        response = api_client.post(self.URL)

        # 200または401のどちらかが返る（設定による）
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
