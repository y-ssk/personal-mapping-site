"""
Category・Locationモデルのテスト。
"""

import pytest
from django.contrib.gis.geos import Point

from apps.locations.constants import LocationConstants
from apps.locations.models import Category, Location


@pytest.fixture
def root_category(db):
    """ルートカテゴリのフィクスチャ。"""
    return Category.objects.create(name="飲食", slug="food-drink", icon="utensils")


@pytest.fixture
def child_category(db, root_category):
    """子カテゴリのフィクスチャ。"""
    return Category.objects.create(
        name="レストラン", slug="restaurant", parent=root_category, icon="restaurant"
    )


@pytest.fixture
def grandchild_category(db, child_category):
    """孫カテゴリのフィクスチャ。"""
    return Category.objects.create(
        name="イタリアン", slug="italian", parent=child_category, icon="pizza"
    )


@pytest.mark.django_db
class TestCategoryModel:
    """Categoryモデルのテスト。"""

    def test_create_root_category(self, root_category):
        """ルートカテゴリを作成できる。"""
        assert root_category.pk is not None
        assert root_category.name == "飲食"
        assert root_category.slug == "food-drink"
        assert root_category.parent is None
        assert root_category.level == 0

    def test_create_child_category(self, child_category, root_category):
        """子カテゴリを作成できる。"""
        assert child_category.pk is not None
        assert child_category.parent == root_category
        assert child_category.level == 1

    def test_create_grandchild_category(self, grandchild_category, child_category):
        """孫カテゴリを作成できる。"""
        assert grandchild_category.pk is not None
        assert grandchild_category.parent == child_category
        assert grandchild_category.level == 2

    def test_str_returns_name(self, root_category):
        """__str__がカテゴリ名を返す。"""
        assert str(root_category) == "飲食"

    def test_get_full_path_root(self, root_category):
        """ルートカテゴリのget_full_pathが正しいパスを返す。"""
        assert root_category.get_full_path() == "飲食"

    def test_get_full_path_child(self, child_category):
        """子カテゴリのget_full_pathが正しいパスを返す。"""
        assert child_category.get_full_path() == "飲食 / レストラン"

    def test_get_full_path_grandchild(self, grandchild_category):
        """孫カテゴリのget_full_pathが正しいパスを返す。"""
        assert grandchild_category.get_full_path() == "飲食 / レストラン / イタリアン"

    def test_get_ancestors(self, grandchild_category, child_category, root_category):
        """get_ancestorsが祖先カテゴリを返す。"""
        ancestors = list(grandchild_category.get_ancestors())
        assert len(ancestors) == 2
        assert ancestors[0] == root_category
        assert ancestors[1] == child_category

    def test_get_descendants(self, root_category, child_category, grandchild_category):
        """get_descendantsが子孫カテゴリを返す。"""
        descendants = list(root_category.get_descendants())
        assert len(descendants) == 2
        assert child_category in descendants
        assert grandchild_category in descendants

    def test_get_children(self, root_category, child_category):
        """直接の子カテゴリを取得できる。"""
        # 別の子カテゴリを追加
        cafe = Category.objects.create(
            name="カフェ", slug="cafe", parent=root_category, icon="coffee"
        )
        children = list(root_category.get_children())
        assert len(children) == 2
        assert child_category in children
        assert cafe in children

    def test_slug_unique(self, root_category):
        """slugが一意である。"""
        with pytest.raises(Exception):
            Category.objects.create(name="重複テスト", slug="food-drink", icon="test")  # 既存のslug

    def test_is_leaf_node(self, root_category, grandchild_category):
        """is_leaf_nodeが正しく判定する。"""
        assert not root_category.is_leaf_node()
        assert grandchild_category.is_leaf_node()

    def test_is_root_node(self, root_category, child_category):
        """is_root_nodeが正しく判定する。"""
        assert root_category.is_root_node()
        assert not child_category.is_root_node()


@pytest.fixture
def user(db):
    """テスト用ユーザーのフィクスチャ。"""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
    )


@pytest.fixture
def tokyo_point():
    """東京駅の座標フィクスチャ。"""
    return Point(139.7671, 35.6812, srid=LocationConstants.POINT_SRID)


@pytest.fixture
def location(db, user, root_category, tokyo_point):
    """Locationのフィクスチャ。"""
    return Location.objects.create(
        user=user,
        name="東京駅",
        point=tokyo_point,
        address="東京都千代田区丸の内1丁目",
        category=root_category,
        status=LocationConstants.STATUS_WANT_TO_VISIT,
        notes="テストメモ",
    )


@pytest.mark.django_db
class TestLocationModel:
    """Locationモデルのテスト。"""

    def test_create_location(self, location, user, root_category):
        """Locationを作成できる。"""
        assert location.pk is not None
        assert location.user == user
        assert location.name == "東京駅"
        assert location.category == root_category
        assert location.status == LocationConstants.STATUS_WANT_TO_VISIT

    def test_location_point_srid(self, location):
        """PointのSRIDが正しく設定される。"""
        assert location.point.srid == LocationConstants.POINT_SRID

    def test_location_point_coordinates(self, location, tokyo_point):
        """Pointの座標が正しく保存される。"""
        assert location.point.x == tokyo_point.x
        assert location.point.y == tokyo_point.y

    def test_str_returns_name(self, location):
        """__str__が場所名を返す。"""
        assert str(location) == "東京駅"

    def test_location_without_category(self, user, tokyo_point):
        """カテゴリなしでLocationを作成できる。"""
        location = Location.objects.create(
            user=user,
            name="カテゴリなし場所",
            point=tokyo_point,
        )
        assert location.pk is not None
        assert location.category is None

    def test_location_without_status(self, user, tokyo_point):
        """ステータスなしでLocationを作成できる。"""
        location = Location.objects.create(
            user=user,
            name="ステータスなし場所",
            point=tokyo_point,
        )
        assert location.pk is not None
        assert location.status is None

    def test_location_status_choices(self, user, tokyo_point):
        """ステータスの選択肢が正しく動作する。"""
        # want_to_visit
        loc1 = Location.objects.create(
            user=user,
            name="行きたい場所",
            point=tokyo_point,
            status=LocationConstants.STATUS_WANT_TO_VISIT,
        )
        assert loc1.status == "want_to_visit"

        # not_interested
        loc2 = Location.objects.create(
            user=user,
            name="興味なし場所",
            point=Point(139.0, 35.0, srid=LocationConstants.POINT_SRID),
            status=LocationConstants.STATUS_NOT_INTERESTED,
        )
        assert loc2.status == "not_interested"

    def test_location_tags_default(self, user, tokyo_point):
        """tagsのデフォルト値が空リストである。"""
        location = Location.objects.create(
            user=user,
            name="タグなし場所",
            point=tokyo_point,
        )
        assert location.tags == []

    def test_location_tags_json(self, user, tokyo_point):
        """tagsにJSONを保存できる。"""
        tags = ["観光", "グルメ", "デート"]
        location = Location.objects.create(
            user=user,
            name="タグあり場所",
            point=tokyo_point,
            tags=tags,
        )
        assert location.tags == tags

    def test_location_timestamps(self, location):
        """created_atとupdated_atが設定される。"""
        assert location.created_at is not None
        assert location.updated_at is not None

    @pytest.mark.skip(reason="Visitモデル未実装（#016で実装予定）")
    def test_visit_count_no_visits(self, location):
        """訪問がない場合visit_countが0を返す。"""
        assert location.visit_count == 0

    @pytest.mark.skip(reason="Visitモデル未実装（#016で実装予定）")
    def test_average_rating_no_visits(self, location):
        """訪問がない場合average_ratingがNoneを返す。"""
        assert location.average_rating is None

    def test_location_ordering(self, user, tokyo_point):
        """Locationがcreated_atの降順でソートされる。"""
        loc1 = Location.objects.create(user=user, name="場所1", point=tokyo_point)
        loc2 = Location.objects.create(
            user=user,
            name="場所2",
            point=Point(140.0, 36.0, srid=LocationConstants.POINT_SRID),
        )
        locations = list(Location.objects.all())
        # 新しい順（降順）
        assert locations[0] == loc2
        assert locations[1] == loc1

    def test_location_cascade_delete_user(self, location, user):
        """ユーザー削除時にLocationも削除される。"""
        location_id = location.id
        user.delete()
        assert not Location.objects.filter(id=location_id).exists()

    def test_location_set_null_category(self, location, root_category):
        """カテゴリ削除時にLocationのcategoryがNULLになる。"""
        root_category.delete()
        location.refresh_from_db()
        assert location.category is None

    # === 境界値テスト ===

    def test_name_max_length_boundary(self, user, tokyo_point):
        """nameフィールドの最大長（255文字）で正常保存できる。"""
        max_name = "あ" * LocationConstants.NAME_MAX_LENGTH
        location = Location.objects.create(
            user=user,
            name=max_name,
            point=tokyo_point,
        )
        assert len(location.name) == LocationConstants.NAME_MAX_LENGTH

    def test_name_exceeds_max_length(self, user, tokyo_point):
        """nameフィールドが最大長を超えるとエラー。"""
        from django.db import DataError

        over_max_name = "あ" * (LocationConstants.NAME_MAX_LENGTH + 1)
        with pytest.raises(DataError):
            Location.objects.create(
                user=user,
                name=over_max_name,
                point=tokyo_point,
            )

    def test_website_valid_url(self, user, tokyo_point):
        """有効なURLを保存できる。"""
        location = Location.objects.create(
            user=user,
            name="URLテスト",
            point=tokyo_point,
            website="https://example.com/path?query=1",
        )
        assert location.website == "https://example.com/path?query=1"

    def test_website_invalid_url(self, user, tokyo_point):
        """無効なURLはバリデーションエラー。"""
        from django.core.exceptions import ValidationError

        location = Location(
            user=user,
            name="無効URLテスト",
            point=tokyo_point,
            website="not-a-valid-url",
        )
        with pytest.raises(ValidationError):
            location.full_clean()

    def test_point_longitude_boundary(self, user):
        """経度の境界値（-180, 180）で正常保存できる。"""
        # 経度 -180（日付変更線西側）
        loc1 = Location.objects.create(
            user=user,
            name="経度-180",
            point=Point(-180, 0, srid=LocationConstants.POINT_SRID),
        )
        assert loc1.point.x == -180

        # 経度 180（日付変更線東側）
        loc2 = Location.objects.create(
            user=user,
            name="経度180",
            point=Point(180, 0, srid=LocationConstants.POINT_SRID),
        )
        assert loc2.point.x == 180

    def test_point_latitude_boundary(self, user):
        """緯度の境界値（-90, 90）で正常保存できる。"""
        # 緯度 -90（南極点）
        loc1 = Location.objects.create(
            user=user,
            name="南極点",
            point=Point(0, -90, srid=LocationConstants.POINT_SRID),
        )
        assert loc1.point.y == -90

        # 緯度 90（北極点）
        loc2 = Location.objects.create(
            user=user,
            name="北極点",
            point=Point(0, 90, srid=LocationConstants.POINT_SRID),
        )
        assert loc2.point.y == 90

    def test_status_invalid_choice(self, user, tokyo_point):
        """無効なステータス値はバリデーションエラー。"""
        from django.core.exceptions import ValidationError

        location = Location(
            user=user,
            name="無効ステータス",
            point=tokyo_point,
            status="invalid_status",
        )
        with pytest.raises(ValidationError):
            location.full_clean()
