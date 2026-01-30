"""
Categoryモデルのテスト。
"""
import pytest
from apps.locations.models import Category


@pytest.fixture
def root_category(db):
    """ルートカテゴリのフィクスチャ。"""
    return Category.objects.create(
        name='飲食',
        slug='food-drink',
        icon='utensils'
    )


@pytest.fixture
def child_category(db, root_category):
    """子カテゴリのフィクスチャ。"""
    return Category.objects.create(
        name='レストラン',
        slug='restaurant',
        parent=root_category,
        icon='restaurant'
    )


@pytest.fixture
def grandchild_category(db, child_category):
    """孫カテゴリのフィクスチャ。"""
    return Category.objects.create(
        name='イタリアン',
        slug='italian',
        parent=child_category,
        icon='pizza'
    )


@pytest.mark.django_db
class TestCategoryModel:
    """Categoryモデルのテスト。"""

    def test_create_root_category(self, root_category):
        """ルートカテゴリを作成できる。"""
        assert root_category.pk is not None
        assert root_category.name == '飲食'
        assert root_category.slug == 'food-drink'
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
        assert str(root_category) == '飲食'

    def test_get_full_path_root(self, root_category):
        """ルートカテゴリのget_full_pathが正しいパスを返す。"""
        assert root_category.get_full_path() == '飲食'

    def test_get_full_path_child(self, child_category):
        """子カテゴリのget_full_pathが正しいパスを返す。"""
        assert child_category.get_full_path() == '飲食 / レストラン'

    def test_get_full_path_grandchild(self, grandchild_category):
        """孫カテゴリのget_full_pathが正しいパスを返す。"""
        assert grandchild_category.get_full_path() == '飲食 / レストラン / イタリアン'

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
            name='カフェ',
            slug='cafe',
            parent=root_category,
            icon='coffee'
        )
        children = list(root_category.get_children())
        assert len(children) == 2
        assert child_category in children
        assert cafe in children

    def test_slug_unique(self, root_category):
        """slugが一意である。"""
        with pytest.raises(Exception):
            Category.objects.create(
                name='重複テスト',
                slug='food-drink',  # 既存のslug
                icon='test'
            )

    def test_is_leaf_node(self, root_category, grandchild_category):
        """is_leaf_nodeが正しく判定する。"""
        assert not root_category.is_leaf_node()
        assert grandchild_category.is_leaf_node()

    def test_is_root_node(self, root_category, child_category):
        """is_root_nodeが正しく判定する。"""
        assert root_category.is_root_node()
        assert not child_category.is_root_node()
