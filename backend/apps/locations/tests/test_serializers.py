"""
シリアライザのテスト。

GeoPointField、LocationSerializer、LocationCreateSerializerのバリデーションをテスト。
"""

import pytest
from django.contrib.gis.geos import Point

from apps.locations.constants import LocationConstants, LocationMessages
from apps.locations.serializers import (
    CategorySerializer,
    GeoPointField,
    LocationCreateSerializer,
    LocationSerializer,
)


class TestGeoPointField:
    """GeoPointFieldのテスト。"""

    def test_to_representation_returns_geojson(self):
        """PointオブジェクトをGeoJSON形式に変換。"""
        field = GeoPointField()
        point = Point(139.7671, 35.6812, srid=LocationConstants.POINT_SRID)

        result = field.to_representation(point)

        assert result == {
            "type": "Point",
            "coordinates": [139.7671, 35.6812],
        }

    def test_to_representation_returns_none_for_none(self):
        """NoneはNoneを返す。"""
        field = GeoPointField()

        result = field.to_representation(None)

        assert result is None

    def test_to_internal_value_creates_point(self):
        """GeoJSON形式からPointオブジェクトを作成。"""
        field = GeoPointField()
        data = {"type": "Point", "coordinates": [139.7671, 35.6812]}

        result = field.to_internal_value(data)

        assert isinstance(result, Point)
        assert result.x == 139.7671
        assert result.y == 35.6812
        assert result.srid == LocationConstants.POINT_SRID

    def test_to_internal_value_raises_for_none(self):
        """Noneはバリデーションエラー。"""
        field = GeoPointField()

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(None)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_invalid_type(self):
        """無効なtypeはバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Polygon", "coordinates": [139.7671, 35.6812]}

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_missing_coordinates(self):
        """coordinatesがないとバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Point"}

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_invalid_coordinates_length(self):
        """座標が2つでないとバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Point", "coordinates": [139.7671]}

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_out_of_range_longitude(self):
        """経度が範囲外だとバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Point", "coordinates": [181, 35.6812]}  # 経度範囲外

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_out_of_range_latitude(self):
        """緯度が範囲外だとバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Point", "coordinates": [139.7671, 91]}  # 緯度範囲外

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)

    def test_to_internal_value_raises_for_non_numeric_coordinates(self):
        """数値以外の座標はバリデーションエラー。"""
        field = GeoPointField()
        data = {"type": "Point", "coordinates": ["abc", "def"]}

        with pytest.raises(Exception) as exc_info:
            field.to_internal_value(data)

        assert LocationMessages.INVALID_POINT in str(exc_info.value)


@pytest.mark.django_db
class TestCategorySerializer:
    """CategorySerializerのテスト。"""

    def test_serializes_category(self, category):
        """カテゴリをシリアライズ。"""
        serializer = CategorySerializer(category)

        assert serializer.data["id"] == category.id
        assert serializer.data["name"] == "カフェ"
        assert serializer.data["slug"] == "cafe"
        assert serializer.data["icon"] == "coffee"

    def test_includes_full_path(self, category):
        """full_pathが含まれる。"""
        serializer = CategorySerializer(category)

        assert "full_path" in serializer.data


@pytest.mark.django_db
class TestLocationSerializer:
    """LocationSerializerのテスト。"""

    def test_serializes_location(self, location):
        """場所をシリアライズ。"""
        # visit_count, average_ratingのためにannotateされたオブジェクトが必要
        from apps.locations.services import LocationService

        service = LocationService()
        annotated_location = service.get_location(location.user, location.id)

        serializer = LocationSerializer(annotated_location)

        assert serializer.data["id"] == location.id
        assert serializer.data["name"] == location.name
        assert serializer.data["address"] == location.address

    def test_point_is_geojson_format(self, location):
        """pointはGeoJSON形式。"""
        from apps.locations.services import LocationService

        service = LocationService()
        annotated_location = service.get_location(location.user, location.id)

        serializer = LocationSerializer(annotated_location)

        assert serializer.data["point"]["type"] == "Point"
        assert "coordinates" in serializer.data["point"]

    def test_category_is_nested(self, location):
        """categoryはネスト形式。"""
        from apps.locations.services import LocationService

        service = LocationService()
        annotated_location = service.get_location(location.user, location.id)

        serializer = LocationSerializer(annotated_location)

        assert serializer.data["category"]["id"] == location.category.id
        assert serializer.data["category"]["name"] == location.category.name

    def test_includes_annotations(self, location):
        """visit_countとaverage_ratingが含まれる。"""
        from apps.locations.services import LocationService

        service = LocationService()
        annotated_location = service.get_location(location.user, location.id)

        serializer = LocationSerializer(annotated_location)

        assert "visit_count" in serializer.data
        assert "average_rating" in serializer.data


@pytest.mark.django_db
class TestLocationCreateSerializer:
    """LocationCreateSerializerのテスト。"""

    def test_validates_valid_data(self, category):
        """有効なデータはバリデーション成功。"""
        data = {
            "name": "テスト場所",
            "point": {"type": "Point", "coordinates": [139.7671, 35.6812]},
            "address": "東京都千代田区",
            "category_id": category.id,
            "tags": ["wifi"],
            "status": LocationConstants.STATUS_WANT_TO_VISIT,
        }

        serializer = LocationCreateSerializer(data=data)

        assert serializer.is_valid(), serializer.errors

    def test_name_is_required(self):
        """nameは必須。"""
        data = {
            "point": {"type": "Point", "coordinates": [139.7671, 35.6812]},
        }

        serializer = LocationCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert "name" in serializer.errors

    def test_point_is_required(self):
        """pointは必須。"""
        data = {
            "name": "テスト場所",
        }

        serializer = LocationCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert "point" in serializer.errors

    def test_validates_invalid_status(self, category):
        """無効なステータスはバリデーションエラー。"""
        data = {
            "name": "テスト場所",
            "point": {"type": "Point", "coordinates": [139.7671, 35.6812]},
            "status": "invalid_status",
        }

        serializer = LocationCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert "status" in serializer.errors

    def test_category_id_is_optional(self):
        """category_idはオプション。"""
        data = {
            "name": "テスト場所",
            "point": {"type": "Point", "coordinates": [139.7671, 35.6812]},
        }

        serializer = LocationCreateSerializer(data=data)

        assert serializer.is_valid(), serializer.errors

    def test_validates_nonexistent_category(self):
        """存在しないカテゴリIDはバリデーションエラー。"""
        data = {
            "name": "テスト場所",
            "point": {"type": "Point", "coordinates": [139.7671, 35.6812]},
            "category_id": 99999,
        }

        serializer = LocationCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert "category_id" in serializer.errors
