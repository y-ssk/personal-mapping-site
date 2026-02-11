"""
locationsテスト用のフィクスチャ。
"""

import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from apps.locations.constants import LocationConstants
from apps.locations.models import Category, Location
from apps.users.models import User

# ========================================
# テスト用定数
# ========================================
TOKYO_STATION = Point(139.7671, 35.6812, srid=LocationConstants.POINT_SRID)
SHIBUYA_STATION = Point(139.7016, 35.6580, srid=LocationConstants.POINT_SRID)
TEST_PASSWORD = "TestPass123!"


# ========================================
# ユーザーフィクスチャ
# ========================================
@pytest.fixture
def user(db) -> User:
    """テスト用ユーザーを作成。"""
    return User.objects.create_user(
        email="test@example.com",
        password=TEST_PASSWORD,
        display_name="テストユーザー",
    )


@pytest.fixture
def other_user(db) -> User:
    """他のテスト用ユーザーを作成。"""
    return User.objects.create_user(
        email="other@example.com",
        password=TEST_PASSWORD,
        display_name="他のユーザー",
    )


# ========================================
# APIクライアントフィクスチャ
# ========================================
@pytest.fixture
def api_client() -> APIClient:
    """APIクライアントを返す。"""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client: APIClient, user: User) -> APIClient:
    """認証済みAPIクライアントを返す。"""
    api_client.force_authenticate(user=user)
    return api_client


# ========================================
# カテゴリフィクスチャ
# ========================================
@pytest.fixture
def category(db) -> Category:
    """テスト用カテゴリを作成。"""
    return Category.objects.create(
        name="カフェ",
        slug="cafe",
        icon="coffee",
    )


@pytest.fixture
def category_restaurant(db) -> Category:
    """テスト用カテゴリ（レストラン）を作成。"""
    return Category.objects.create(
        name="レストラン",
        slug="restaurant",
        icon="restaurant",
    )


# ========================================
# 場所フィクスチャ
# ========================================
@pytest.fixture
def location(user: User, category: Category) -> Location:
    """テスト用場所を作成。"""
    return Location.objects.create(
        user=user,
        name="テストカフェ",
        point=TOKYO_STATION,
        address="東京都千代田区丸の内1-9-1",
        category=category,
        tags=["wifi", "静か"],
        status=LocationConstants.STATUS_WANT_TO_VISIT,
        notes="良い雰囲気のカフェ",
        website="https://example.com",
        phone="03-1234-5678",
    )


@pytest.fixture
def location_without_category(user: User) -> Location:
    """カテゴリなしのテスト用場所を作成。"""
    return Location.objects.create(
        user=user,
        name="カテゴリなし場所",
        point=SHIBUYA_STATION,
    )


@pytest.fixture
def other_user_location(other_user: User, category: Category) -> Location:
    """他ユーザーのテスト用場所を作成。"""
    return Location.objects.create(
        user=other_user,
        name="他ユーザーの場所",
        point=SHIBUYA_STATION,
        category=category,
    )


@pytest.fixture
def multiple_locations(user: User, category: Category, category_restaurant: Category):
    """複数のテスト用場所を作成。"""
    locations = [
        Location.objects.create(
            user=user,
            name="カフェA",
            point=Point(139.7000, 35.6500, srid=LocationConstants.POINT_SRID),
            category=category,
            tags=["wifi"],
            status=LocationConstants.STATUS_WANT_TO_VISIT,
        ),
        Location.objects.create(
            user=user,
            name="レストランB",
            point=Point(139.7100, 35.6600, srid=LocationConstants.POINT_SRID),
            category=category_restaurant,
            tags=["静か"],
            status=LocationConstants.STATUS_NOT_INTERESTED,
        ),
        Location.objects.create(
            user=user,
            name="カフェC渋谷",
            point=Point(139.7016, 35.6580, srid=LocationConstants.POINT_SRID),
            category=category,
            tags=["wifi", "静か"],
            status=LocationConstants.STATUS_WANT_TO_VISIT,
            address="東京都渋谷区",
        ),
    ]
    return locations
