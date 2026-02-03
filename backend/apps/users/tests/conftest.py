"""
認証テスト用のフィクスチャ。
"""

import pytest
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture(autouse=True)
def setup_site(db):
    """allauthに必要なSiteオブジェクトを作成する。"""
    site, _ = Site.objects.get_or_create(
        id=1,
        defaults={"domain": "testserver", "name": "Test Server"},
    )
    return site


@pytest.fixture
def google_social_app(setup_site):
    """Google OAuth用のSocialAppを作成する。"""
    app, _ = SocialApp.objects.get_or_create(
        provider="google",
        defaults={
            "name": "Google",
            "client_id": "test-google-client-id",
            "secret": "test-google-secret",
        },
    )
    app.sites.add(setup_site)
    return app


@pytest.fixture
def github_social_app(setup_site):
    """GitHub OAuth用のSocialAppを作成する。"""
    app, _ = SocialApp.objects.get_or_create(
        provider="github",
        defaults={
            "name": "GitHub",
            "client_id": "test-github-client-id",
            "secret": "test-github-secret",
        },
    )
    app.sites.add(setup_site)
    return app


@pytest.fixture
def api_client():
    """APIクライアントを返す。"""
    return APIClient()


@pytest.fixture
def user_data():
    """テスト用ユーザーデータを返す。"""
    return {
        "email": "test@example.com",
        "password1": "TestPass123!",
        "password2": "TestPass123!",
        "display_name": "テストユーザー",
    }


@pytest.fixture
def user(db):
    """テスト用ユーザーを作成して返す。"""
    return User.objects.create_user(
        email="existing@example.com",
        password="ExistingPass123!",
        display_name="既存ユーザー",
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """認証済みAPIクライアントを返す。"""
    api_client.force_authenticate(user=user)
    return api_client
