"""
LocationViewSetのテスト。

CLAUDE.md View層テストパターンに準拠。
カバレッジ≥60%を目標。
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.locations.constants import LocationConstants
from apps.locations.models import Location


@pytest.mark.django_db
class TestLocationViewSetList:
    """GET /api/v1/locations/ のテスト。"""

    def test_list_requires_authentication(self, api_client):
        """認証が必要。"""
        url = reverse("location-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_returns_user_locations(self, authenticated_client, location):
        """ユーザーの場所一覧を返す。"""
        url = reverse("location-list")

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) == 1
        assert results[0]["name"] == location.name

    def test_list_excludes_other_users_locations(
        self, authenticated_client, location, other_user_location
    ):
        """他ユーザーの場所は含まない。"""
        url = reverse("location-list")

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) == 1
        location_ids = [loc["id"] for loc in results]
        assert other_user_location.id not in location_ids

    def test_list_includes_annotations(self, authenticated_client, location):
        """visit_countとaverage_ratingが含まれる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert "visit_count" in results[0]
        assert "average_rating" in results[0]


@pytest.mark.django_db
class TestLocationViewSetRetrieve:
    """GET /api/v1/locations/{id}/ のテスト。"""

    def test_retrieve_returns_location(self, authenticated_client, location):
        """場所詳細を取得できる。"""
        url = reverse("location-detail", kwargs={"pk": location.id})

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == location.id
        assert response.data["name"] == location.name

    def test_retrieve_other_users_location_returns_404(
        self, authenticated_client, other_user_location
    ):
        """他ユーザーの場所は404を返す。"""
        url = reverse("location-detail", kwargs={"pk": other_user_location.id})

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_includes_category(self, authenticated_client, location):
        """カテゴリがネストされている。"""
        url = reverse("location-detail", kwargs={"pk": location.id})

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "category" in response.data
        assert response.data["category"]["name"] == location.category.name


@pytest.mark.django_db
class TestLocationViewSetCreate:
    """POST /api/v1/locations/ のテスト。"""

    def test_create_location_with_all_fields(self, authenticated_client, category):
        """全フィールドで場所を作成できる。"""
        url = reverse("location-list")
        data = {
            "name": "新しい場所",
            "point": {"type": "Point", "coordinates": [139.7000, 35.6500]},
            "address": "東京都新宿区1-1-1",
            "category_id": category.id,
            "tags": ["wifi", "静か"],
            "status": LocationConstants.STATUS_WANT_TO_VISIT,
            "notes": "テストメモ",
            "website": "https://test.example.com",
            "phone": "03-1111-2222",
        }

        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "新しい場所"
        assert response.data["category"]["id"] == category.id

    def test_create_location_with_minimum_fields(self, authenticated_client):
        """最小限のフィールドで場所を作成できる。"""
        url = reverse("location-list")
        data = {
            "name": "最小場所",
            "point": {"type": "Point", "coordinates": [139.7000, 35.6500]},
        }

        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "最小場所"

    def test_create_location_with_invalid_point(self, authenticated_client):
        """無効な座標でバリデーションエラー。"""
        url = reverse("location-list")
        data = {
            "name": "無効な座標",
            "point": {"type": "Point", "coordinates": [999, 999]},  # 範囲外
        }

        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_requires_authentication(self, api_client):
        """認証が必要。"""
        url = reverse("location-list")
        data = {
            "name": "認証なし",
            "point": {"type": "Point", "coordinates": [139.7000, 35.6500]},
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLocationViewSetUpdate:
    """PUT /api/v1/locations/{id}/ のテスト。"""

    def test_update_location(self, authenticated_client, location, category):
        """場所を更新できる。"""
        url = reverse("location-detail", kwargs={"pk": location.id})
        data = {
            "name": "更新された場所",
            "point": {"type": "Point", "coordinates": [139.8000, 35.7000]},
            "address": "更新された住所",
            "category_id": category.id,
            "tags": ["更新タグ"],
            "status": LocationConstants.STATUS_NOT_INTERESTED,
            "notes": "更新メモ",
            "website": "https://updated.example.com",
            "phone": "03-9999-8888",
        }

        response = authenticated_client.put(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "更新された場所"

    def test_update_other_users_location_returns_404(
        self, authenticated_client, other_user_location, category
    ):
        """他ユーザーの場所は更新できない。"""
        url = reverse("location-detail", kwargs={"pk": other_user_location.id})
        data = {
            "name": "ハック試行",
            "point": {"type": "Point", "coordinates": [139.7000, 35.6500]},
        }

        response = authenticated_client.put(url, data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestLocationViewSetPartialUpdate:
    """PATCH /api/v1/locations/{id}/ のテスト。"""

    def test_partial_update_single_field(self, authenticated_client, location):
        """単一フィールドを部分更新できる。"""
        url = reverse("location-detail", kwargs={"pk": location.id})
        data = {"name": "部分更新テスト"}

        response = authenticated_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "部分更新テスト"
        # 他のフィールドは変更されない
        assert response.data["address"] == location.address

    def test_partial_update_tags(self, authenticated_client, location):
        """タグを部分更新できる。"""
        url = reverse("location-detail", kwargs={"pk": location.id})
        data = {"tags": ["新タグ1", "新タグ2"]}

        response = authenticated_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["tags"] == ["新タグ1", "新タグ2"]


@pytest.mark.django_db
class TestLocationViewSetDestroy:
    """DELETE /api/v1/locations/{id}/ のテスト。"""

    def test_delete_location(self, authenticated_client, location):
        """場所を削除できる。"""
        url = reverse("location-detail", kwargs={"pk": location.id})
        location_id = location.id

        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Location.objects.filter(id=location_id).exists()

    def test_delete_other_users_location_returns_404(
        self, authenticated_client, other_user_location
    ):
        """他ユーザーの場所は削除できない。"""
        url = reverse("location-detail", kwargs={"pk": other_user_location.id})

        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # 削除されていないことを確認
        assert Location.objects.filter(id=other_user_location.id).exists()


@pytest.mark.django_db
class TestLocationViewSetFilters:
    """フィルタ機能のテスト。"""

    def test_filter_by_category(self, authenticated_client, multiple_locations, category):
        """カテゴリでフィルタできる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"category": category.id})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # カフェは2つ（カフェA、カフェC渋谷）
        assert len(results) == 2
        for loc in results:
            assert loc["category"]["id"] == category.id

    def test_filter_by_status(self, authenticated_client, multiple_locations):
        """ステータスでフィルタできる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"status": LocationConstants.STATUS_WANT_TO_VISIT})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # want_to_visitは2つ（カフェA、カフェC渋谷）
        assert len(results) == 2

    def test_filter_by_tags_or_condition(self, authenticated_client, multiple_locations):
        """タグフィルタはOR条件。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"tags": "wifi,静か"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # wifi: カフェA、カフェC渋谷  静か: レストランB、カフェC渋谷
        # OR条件なので3つ全部
        assert len(results) == 3

    def test_search_by_name(self, authenticated_client, multiple_locations):
        """名前で検索できる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"search": "カフェ"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # カフェA、カフェC渋谷
        assert len(results) == 2

    def test_search_by_address(self, authenticated_client, multiple_locations):
        """住所で検索できる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"search": "渋谷"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # カフェC渋谷
        assert len(results) == 1
        assert "渋谷" in results[0]["name"]

    def test_ordering_by_name(self, authenticated_client, multiple_locations):
        """名前でソートできる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"ordering": "name"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        names = [loc["name"] for loc in results]
        assert names == sorted(names)

    def test_ordering_by_created_at_desc(self, authenticated_client, multiple_locations):
        """作成日時の降順でソートできる。"""
        url = reverse("location-list")

        response = authenticated_client.get(url, {"ordering": "-created_at"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # 最後に作成されたものが最初
        assert results[0]["name"] == "カフェC渋谷"


@pytest.mark.django_db
class TestLocationViewSetNearby:
    """GET /api/v1/locations/nearby/ のテスト。"""

    def test_nearby_returns_locations_within_radius(self, authenticated_client, nearby_locations):
        """半径内の場所を返す。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 3.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        # 3km以内は東京駅近くと銀座
        assert len(response.data) == 2

    def test_nearby_includes_distance(self, authenticated_client, nearby_locations):
        """距離が含まれる。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 5.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert "distance" in response.data[0]
        assert response.data[0]["distance"] > 0

    def test_nearby_sorted_by_distance(self, authenticated_client, nearby_locations):
        """距離順にソートされている。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 100.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        distances = [loc["distance"] for loc in response.data]
        assert distances == sorted(distances)

    def test_nearby_filters_by_category(self, authenticated_client, nearby_locations, category):
        """カテゴリでフィルタできる。"""
        url = reverse("location-nearby")
        params = {
            "lat": 35.6812,
            "lng": 139.7671,
            "radius": 100.0,
            "category": category.id,
        }

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        for loc in response.data:
            assert loc["category"]["id"] == category.id

    def test_nearby_filters_by_tags(self, authenticated_client, nearby_locations):
        """タグでフィルタできる。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 100.0, "tags": "wifi"}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        for loc in response.data:
            assert "wifi" in loc["tags"]

    def test_nearby_requires_lat(self, authenticated_client):
        """latは必須。"""
        url = reverse("location-nearby")
        params = {"lng": 139.7671, "radius": 5.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "lat" in response.data

    def test_nearby_requires_lng(self, authenticated_client):
        """lngは必須。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "radius": 5.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "lng" in response.data

    def test_nearby_requires_radius(self, authenticated_client):
        """radiusは必須。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "radius" in response.data

    def test_nearby_validates_radius_max(self, authenticated_client):
        """半径の最大値をバリデーション。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 150.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_nearby_validates_coordinates(self, authenticated_client):
        """座標範囲をバリデーション。"""
        url = reverse("location-nearby")
        params = {"lat": 999.0, "lng": 139.7671, "radius": 5.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_nearby_requires_authentication(self, api_client):
        """認証が必要。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 5.0}

        response = api_client.get(url, params)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_nearby_excludes_other_users_locations(
        self, authenticated_client, nearby_locations, other_user_location
    ):
        """他ユーザーの場所は含まない。"""
        url = reverse("location-nearby")
        params = {"lat": 35.6812, "lng": 139.7671, "radius": 100.0}

        response = authenticated_client.get(url, params)

        assert response.status_code == status.HTTP_200_OK
        location_ids = [loc["id"] for loc in response.data]
        assert other_user_location.id not in location_ids
