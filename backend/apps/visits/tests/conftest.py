"""
visitsテスト用のフィクスチャ。
"""

import pytest
from django.contrib.gis.geos import Point
from django.utils import timezone

from apps.locations.constants import LocationConstants
from apps.locations.models import Category, Location
from apps.users.models import User
from apps.visits.models import Visit

# ========================================
# テスト用定数
# ========================================
TOKYO_STATION = Point(139.7671, 35.6812, srid=LocationConstants.POINT_SRID)
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
        status=LocationConstants.STATUS_WANT_TO_VISIT,
    )


@pytest.fixture
def other_user_location(other_user: User, category: Category) -> Location:
    """他ユーザーのテスト用場所を作成。"""
    return Location.objects.create(
        user=other_user,
        name="他ユーザーの場所",
        point=TOKYO_STATION,
        category=category,
    )


# ========================================
# 訪問フィクスチャ
# ========================================
@pytest.fixture
def visit(user: User, location: Location) -> Visit:
    """テスト用訪問記録を作成。"""
    return Visit.objects.create(
        user=user,
        location=location,
        visited_at=timezone.now(),
        rating=4,
        review="良い雰囲気でした",
    )


@pytest.fixture
def visit_without_rating(user: User, location: Location) -> Visit:
    """評価なしのテスト用訪問記録を作成。"""
    return Visit.objects.create(
        user=user,
        location=location,
        visited_at=timezone.now(),
    )


@pytest.fixture
def multiple_visits(user: User, location: Location):
    """複数のテスト用訪問記録を作成。"""
    now = timezone.now()
    visits = [
        Visit.objects.create(
            user=user,
            location=location,
            visited_at=now - timezone.timedelta(days=30),
            rating=3,
            review="普通でした",
        ),
        Visit.objects.create(
            user=user,
            location=location,
            visited_at=now - timezone.timedelta(days=15),
            rating=4,
            review="良かったです",
        ),
        Visit.objects.create(
            user=user,
            location=location,
            visited_at=now,
            rating=5,
            review="最高でした",
        ),
    ]
    return visits
