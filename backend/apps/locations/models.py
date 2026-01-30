"""
locationsアプリのデータモデル。

SPEC.md § 3.3.2に基づくCategoryモデルを定義。
"""
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class Category(MPTTModel):
    """
    階層カテゴリ（django-mptt使用）。

    場所を分類するためのシステム提供カテゴリ。
    django-mpttを使用して階層構造を効率的に管理する。

    Attributes:
        name: カテゴリ名（例: 'レストラン', 'カフェ'）。
        slug: URL用のスラッグ（一意、例: 'restaurant', 'cafe'）。
        parent: 親カテゴリ（Noneの場合はルートカテゴリ）。
        icon: アイコン識別子（オプション）。
        created_at: 作成日時。

    Example:
        >>> # 階層構造の例
        >>> # 飲食 > レストラン > イタリアン
        >>> # 飲食 > カフェ
        >>> # 観光 > 美術館 > 現代美術
    """

    name = models.CharField(
        max_length=100,
        verbose_name='カテゴリ名'
    )
    slug = models.SlugField(
        unique=True,
        verbose_name='スラッグ'
    )
    parent = TreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='親カテゴリ'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='アイコン'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='作成日時'
    )

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        db_table = 'categories'
        verbose_name = 'カテゴリ'
        verbose_name_plural = 'カテゴリ'

    def __str__(self):
        return self.name

    def get_full_path(self):
        """
        完全パスを取得。

        Returns:
            str: '飲食 / レストラン / イタリアン' 形式のパス文字列。

        Example:
            >>> italian = Category.objects.get(slug='italian')
            >>> italian.get_full_path()
            '飲食 / レストラン / イタリアン'
        """
        ancestors = self.get_ancestors(include_self=True)
        return ' / '.join([cat.name for cat in ancestors])
