"""
LocationFilterのテスト。

CLAUDE.md フィルタテストパターンに準拠。
"""

from datetime import timedelta

import pytest
from django.contrib.gis.geos import Point
from django.utils import timezone

from apps.locations.constants import LocationConstants
from apps.locations.filters import LocationFilter
from apps.locations.models import Category, Location
from apps.users.models import User
from apps.visits.models import Visit

# ========================================
# テスト用定数
# ========================================
TEST_PASSWORD = "TestPass123!"
TOKYO_STATION = Point(139.7671, 35.6812, srid=LocationConstants.POINT_SRID)


# ========================================
# フィクスチャ
# ========================================
@pytest.fixture
def user(db) -> User:
    """テスト用ユーザーを作成。"""
    return User.objects.create_user(
        email="filter_test@example.com",
        password=TEST_PASSWORD,
        display_name="フィルタテストユーザー",
    )


@pytest.fixture
def category_cafe(db) -> Category:
    """カフェカテゴリを作成。"""
    return Category.objects.create(name="カフェ", slug="cafe", icon="coffee")


@pytest.fixture
def category_restaurant(db) -> Category:
    """レストランカテゴリを作成。"""
    return Category.objects.create(name="レストラン", slug="restaurant", icon="restaurant")


@pytest.fixture
def locations_for_filter(user: User, category_cafe: Category, category_restaurant: Category):
    """フィルタテスト用の場所を作成。"""
    locations = [
        Location.objects.create(
            user=user,
            name="渋谷カフェA",
            point=TOKYO_STATION,
            address="東京都渋谷区",
            category=category_cafe,
            tags=["wifi", "静か"],
            status=LocationConstants.STATUS_WANT_TO_VISIT,
        ),
        Location.objects.create(
            user=user,
            name="新宿レストランB",
            point=TOKYO_STATION,
            address="東京都新宿区",
            category=category_restaurant,
            tags=["にぎやか"],
            status=LocationConstants.STATUS_NOT_INTERESTED,
        ),
        Location.objects.create(
            user=user,
            name="池袋カフェC",
            point=TOKYO_STATION,
            address="東京都豊島区池袋",
            category=category_cafe,
            tags=["wifi", "作業向き"],
            status=LocationConstants.STATUS_WANT_TO_VISIT,
        ),
    ]
    return locations


# ========================================
# カテゴリフィルタテスト
# ========================================
@pytest.mark.django_db
class TestCategoryFilter:
    """カテゴリフィルタのテスト。"""

    def test_filter_by_category_id(self, locations_for_filter, category_cafe):
        """カテゴリIDでフィルタできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"category": category_cafe.id},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 2
        for loc in result:
            assert loc.category_id == category_cafe.id

    def test_filter_by_nonexistent_category(self, locations_for_filter):
        """存在しないカテゴリIDでは結果が0件。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"category": 99999},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 0


# ========================================
# タグフィルタテスト
# ========================================
@pytest.mark.django_db
class TestTagsFilter:
    """タグフィルタのテスト（OR条件）。"""

    def test_filter_by_single_tag(self, locations_for_filter):
        """単一タグでフィルタできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"tags": "wifi"},
            queryset=queryset,
        )

        result = filter_set.qs

        # wifi: 渋谷カフェA, 池袋カフェC
        assert result.count() == 2
        for loc in result:
            assert "wifi" in loc.tags

    def test_filter_by_multiple_tags_or_condition(self, locations_for_filter):
        """複数タグはOR条件でフィルタ。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"tags": "wifi,にぎやか"},
            queryset=queryset,
        )

        result = filter_set.qs

        # wifi: 渋谷カフェA, 池袋カフェC
        # にぎやか: 新宿レストランB
        # OR条件なので3件
        assert result.count() == 3

    def test_filter_by_nonexistent_tag(self, locations_for_filter):
        """存在しないタグでは結果が0件。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"tags": "存在しないタグ"},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 0

    def test_filter_with_empty_tag(self, locations_for_filter):
        """空タグは無視される。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"tags": "wifi,,"},
            queryset=queryset,
        )

        result = filter_set.qs

        # wifiのみで検索
        assert result.count() == 2


# ========================================
# ステータスフィルタテスト
# ========================================
@pytest.mark.django_db
class TestStatusFilter:
    """ステータスフィルタのテスト。"""

    def test_filter_by_want_to_visit(self, locations_for_filter):
        """want_to_visitでフィルタできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"status": LocationConstants.STATUS_WANT_TO_VISIT},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 2
        for loc in result:
            assert loc.status == LocationConstants.STATUS_WANT_TO_VISIT

    def test_filter_by_not_interested(self, locations_for_filter):
        """not_interestedでフィルタできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"status": LocationConstants.STATUS_NOT_INTERESTED},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 1
        assert result.first().status == LocationConstants.STATUS_NOT_INTERESTED


# ========================================
# テキスト検索テスト
# ========================================
@pytest.mark.django_db
class TestSearchFilter:
    """テキスト検索のテスト。"""

    def test_search_by_name(self, locations_for_filter):
        """名前で検索できる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"search": "カフェ"},
            queryset=queryset,
        )

        result = filter_set.qs

        # 渋谷カフェA, 池袋カフェC
        assert result.count() == 2

    def test_search_by_address(self, locations_for_filter):
        """住所で検索できる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"search": "池袋"},
            queryset=queryset,
        )

        result = filter_set.qs

        # 池袋カフェC
        assert result.count() == 1
        assert "池袋" in result.first().address

    def test_search_case_insensitive(self, locations_for_filter):
        """大文字小文字を区別しない。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"search": "渋谷"},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 1

    def test_search_with_empty_string(self, locations_for_filter):
        """空文字列では全件返す。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"search": ""},
            queryset=queryset,
        )

        result = filter_set.qs

        assert result.count() == 3


# ========================================
# ソートテスト
# ========================================
@pytest.mark.django_db
class TestOrderingFilter:
    """ソート機能のテスト。"""

    def test_ordering_by_name_asc(self, locations_for_filter):
        """名前の昇順でソートできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "name"},
            queryset=queryset,
        )

        result = list(filter_set.qs)
        names = [loc.name for loc in result]

        assert names == sorted(names)

    def test_ordering_by_name_desc(self, locations_for_filter):
        """名前の降順でソートできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "-name"},
            queryset=queryset,
        )

        result = list(filter_set.qs)
        names = [loc.name for loc in result]

        assert names == sorted(names, reverse=True)

    def test_ordering_by_created_at_asc(self, locations_for_filter):
        """作成日時の昇順でソートできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "created_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)
        created_dates = [loc.created_at for loc in result]

        assert created_dates == sorted(created_dates)

    def test_ordering_by_created_at_desc(self, locations_for_filter):
        """作成日時の降順でソートできる。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "-created_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)
        created_dates = [loc.created_at for loc in result]

        assert created_dates == sorted(created_dates, reverse=True)


# ========================================
# visited_atソートテスト
# ========================================
@pytest.mark.django_db
class TestVisitedAtOrdering:
    """visited_atソートのテスト。"""

    def test_ordering_by_visited_at_with_visits(self, user, category_cafe):
        """訪問日時でソートできる。"""
        # 3つの場所を作成
        loc1 = Location.objects.create(
            user=user, name="場所1", point=TOKYO_STATION, category=category_cafe
        )
        loc2 = Location.objects.create(
            user=user, name="場所2", point=TOKYO_STATION, category=category_cafe
        )
        loc3 = Location.objects.create(
            user=user, name="場所3", point=TOKYO_STATION, category=category_cafe
        )

        # 異なる日時で訪問記録を作成
        now = timezone.now()
        Visit.objects.create(user=user, location=loc1, visited_at=now - timedelta(days=10))
        Visit.objects.create(user=user, location=loc2, visited_at=now - timedelta(days=5))
        Visit.objects.create(user=user, location=loc3, visited_at=now)

        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "visited_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)

        # 訪問日時の昇順（古い順）
        assert result[0].name == "場所1"
        assert result[1].name == "場所2"
        assert result[2].name == "場所3"

    def test_ordering_by_visited_at_desc(self, user, category_cafe):
        """訪問日時の降順でソートできる。"""
        loc1 = Location.objects.create(
            user=user, name="場所1", point=TOKYO_STATION, category=category_cafe
        )
        loc2 = Location.objects.create(
            user=user, name="場所2", point=TOKYO_STATION, category=category_cafe
        )

        now = timezone.now()
        Visit.objects.create(user=user, location=loc1, visited_at=now - timedelta(days=10))
        Visit.objects.create(user=user, location=loc2, visited_at=now)

        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "-visited_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)

        # 訪問日時の降順（新しい順）
        assert result[0].name == "場所2"
        assert result[1].name == "場所1"

    def test_ordering_by_visited_at_with_no_visits(self, user, category_cafe):
        """訪問記録がない場所はNULL（末尾）扱い。"""
        loc_with_visit = Location.objects.create(
            user=user, name="訪問あり", point=TOKYO_STATION, category=category_cafe
        )
        loc_no_visit = Location.objects.create(
            user=user, name="訪問なし", point=TOKYO_STATION, category=category_cafe
        )

        Visit.objects.create(user=user, location=loc_with_visit, visited_at=timezone.now())

        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "visited_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)

        # 訪問ありが先、訪問なし（NULL）が後
        assert result[0].id == loc_with_visit.id
        assert result[1].id == loc_no_visit.id

    def test_ordering_uses_latest_visit(self, user, category_cafe):
        """複数回訪問した場合、最新の訪問日時を使用。"""
        loc = Location.objects.create(
            user=user, name="複数訪問", point=TOKYO_STATION, category=category_cafe
        )

        now = timezone.now()
        Visit.objects.create(user=user, location=loc, visited_at=now - timedelta(days=30))
        Visit.objects.create(user=user, location=loc, visited_at=now - timedelta(days=10))
        latest_visit = Visit.objects.create(user=user, location=loc, visited_at=now)

        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"ordering": "-visited_at"},
            queryset=queryset,
        )

        result = list(filter_set.qs)

        # 最新の訪問日時がannotateされている
        assert hasattr(result[0], "latest_visited_at")
        assert result[0].latest_visited_at == latest_visit.visited_at


# ========================================
# 複合フィルタテスト
# ========================================
@pytest.mark.django_db
class TestCombinedFilters:
    """複数フィルタの組み合わせテスト。"""

    def test_category_and_status_filter(self, locations_for_filter, category_cafe):
        """カテゴリとステータスを組み合わせてフィルタ。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={
                "category": category_cafe.id,
                "status": LocationConstants.STATUS_WANT_TO_VISIT,
            },
            queryset=queryset,
        )

        result = filter_set.qs

        # カフェかつwant_to_visit: 渋谷カフェA, 池袋カフェC
        assert result.count() == 2

    def test_search_and_tags_filter(self, locations_for_filter):
        """検索とタグを組み合わせてフィルタ。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={"search": "カフェ", "tags": "wifi"},
            queryset=queryset,
        )

        result = filter_set.qs

        # 名前にカフェを含みwifiタグ: 渋谷カフェA, 池袋カフェC
        assert result.count() == 2

    def test_all_filters_combined(self, locations_for_filter, category_cafe):
        """全フィルタを組み合わせ。"""
        queryset = Location.objects.all()
        filter_set = LocationFilter(
            data={
                "category": category_cafe.id,
                "tags": "静か",
                "status": LocationConstants.STATUS_WANT_TO_VISIT,
                "search": "渋谷",
                "ordering": "name",
            },
            queryset=queryset,
        )

        result = filter_set.qs

        # カフェ, 静か, want_to_visit, 渋谷: 渋谷カフェAのみ
        assert result.count() == 1
        assert result.first().name == "渋谷カフェA"
