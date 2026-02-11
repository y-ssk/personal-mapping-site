"""
LocationServiceのテスト。

CLAUDE.md Service層テストパターンに準拠。
カバレッジ≥80%を目標。
"""

import pytest
from django.contrib.gis.geos import Point

from apps.locations.constants import LocationConstants
from apps.locations.models import Location
from apps.locations.services import LocationService


@pytest.mark.django_db
class TestLocationServiceGetBaseQueryset:
    """get_base_querysetのテスト。"""

    def test_returns_user_locations_only(self, user, location, other_user_location):
        """ユーザー自身の場所のみを返す。"""
        service = LocationService()

        result = service.get_base_queryset(user)

        assert result.count() == 1
        assert result.first().id == location.id

    def test_includes_visit_count_annotation(self, user, location):
        """visit_countがannotateされている。"""
        service = LocationService()

        result = service.get_base_queryset(user)
        loc = result.first()

        assert hasattr(loc, "visit_count")
        assert loc.visit_count == 0  # 訪問なし

    def test_includes_average_rating_annotation(self, user, location):
        """average_ratingがannotateされている。"""
        service = LocationService()

        result = service.get_base_queryset(user)
        loc = result.first()

        assert hasattr(loc, "average_rating")
        assert loc.average_rating is None  # 訪問なし

    def test_returns_empty_for_user_with_no_locations(self, other_user):
        """場所がないユーザーには空のQuerySetを返す。"""
        service = LocationService()

        result = service.get_base_queryset(other_user)

        assert result.count() == 0


@pytest.mark.django_db
class TestLocationServiceGetLocation:
    """get_locationのテスト。"""

    def test_returns_location_for_valid_id(self, user, location):
        """有効なIDで場所を取得できる。"""
        service = LocationService()

        result = service.get_location(user, location.id)

        assert result is not None
        assert result.id == location.id
        assert result.name == location.name

    def test_returns_none_for_nonexistent_id(self, user):
        """存在しないIDではNoneを返す。"""
        service = LocationService()

        result = service.get_location(user, 99999)

        assert result is None

    def test_returns_none_for_other_users_location(self, user, other_user_location):
        """他ユーザーの場所にはアクセスできない。"""
        service = LocationService()

        result = service.get_location(user, other_user_location.id)

        assert result is None

    def test_includes_annotations(self, user, location):
        """annotateが含まれている。"""
        service = LocationService()

        result = service.get_location(user, location.id)

        assert hasattr(result, "visit_count")
        assert hasattr(result, "average_rating")


@pytest.mark.django_db
class TestLocationServiceCreateLocation:
    """create_locationのテスト。"""

    def test_creates_location_with_all_fields(self, user, category):
        """全フィールドで場所を作成できる。"""
        service = LocationService()
        data = {
            "name": "新しいカフェ",
            "point": Point(139.7000, 35.6500, srid=LocationConstants.POINT_SRID),
            "address": "東京都渋谷区1-1-1",
            "category": category,
            "tags": ["wifi", "電源"],
            "status": LocationConstants.STATUS_WANT_TO_VISIT,
            "notes": "おすすめ",
            "website": "https://newcafe.example.com",
            "phone": "03-9999-8888",
        }

        result = service.create_location(user, data)

        assert result is not None
        assert result.name == "新しいカフェ"
        assert result.user == user
        assert result.category == category
        assert "wifi" in result.tags
        assert result.status == LocationConstants.STATUS_WANT_TO_VISIT

    def test_creates_location_with_minimum_fields(self, user):
        """最小限のフィールドで場所を作成できる。"""
        service = LocationService()
        data = {
            "name": "最小場所",
            "point": Point(139.7000, 35.6500, srid=LocationConstants.POINT_SRID),
        }

        result = service.create_location(user, data)

        assert result is not None
        assert result.name == "最小場所"
        assert result.category is None
        assert result.tags == []

    def test_returns_location_with_annotations(self, user, category):
        """作成された場所にはannotateが含まれる。"""
        service = LocationService()
        data = {
            "name": "Annotateテスト",
            "point": Point(139.7000, 35.6500, srid=LocationConstants.POINT_SRID),
            "category": category,
        }

        result = service.create_location(user, data)

        assert hasattr(result, "visit_count")
        assert result.visit_count == 0


@pytest.mark.django_db
class TestLocationServiceUpdateLocation:
    """update_locationのテスト。"""

    def test_updates_single_field(self, user, location):
        """単一フィールドを更新できる。"""
        service = LocationService()
        data = {"name": "更新されたカフェ"}

        result = service.update_location(location, data, partial=True)

        assert result.name == "更新されたカフェ"
        # 他のフィールドは変更されない
        assert result.address == location.address

    def test_updates_multiple_fields(self, user, location):
        """複数フィールドを更新できる。"""
        service = LocationService()
        data = {
            "name": "新しい名前",
            "notes": "新しいメモ",
            "status": LocationConstants.STATUS_NOT_INTERESTED,
        }

        result = service.update_location(location, data, partial=True)

        assert result.name == "新しい名前"
        assert result.notes == "新しいメモ"
        assert result.status == LocationConstants.STATUS_NOT_INTERESTED

    def test_updates_point(self, user, location):
        """座標を更新できる。"""
        service = LocationService()
        new_point = Point(140.0000, 36.0000, srid=LocationConstants.POINT_SRID)
        data = {"point": new_point}

        result = service.update_location(location, data, partial=True)

        assert result.point.x == 140.0000
        assert result.point.y == 36.0000

    def test_updates_category(self, user, location, category_restaurant):
        """カテゴリを更新できる。"""
        service = LocationService()
        data = {"category": category_restaurant}

        result = service.update_location(location, data, partial=True)

        assert result.category == category_restaurant

    def test_returns_location_with_annotations(self, user, location):
        """更新された場所にはannotateが含まれる。"""
        service = LocationService()
        data = {"name": "Annotateテスト"}

        result = service.update_location(location, data, partial=True)

        assert hasattr(result, "visit_count")
        assert hasattr(result, "average_rating")


@pytest.mark.django_db
class TestLocationServiceDeleteLocation:
    """delete_locationのテスト。"""

    def test_deletes_location(self, user, location):
        """場所を削除できる。"""
        service = LocationService()
        location_id = location.id

        service.delete_location(location)

        assert not Location.objects.filter(id=location_id).exists()

    def test_does_not_affect_other_locations(self, user, location, other_user_location):
        """他の場所には影響しない。"""
        service = LocationService()

        service.delete_location(location)

        assert Location.objects.filter(id=other_user_location.id).exists()
