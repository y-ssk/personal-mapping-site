"""
locationsアプリのデータモデル。

SPEC.md § 3.3.2 Categoryモデル、§ 3.3.3 Locationモデルを定義。
"""

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

from apps.locations.constants import LocationConstants
from core.models import TimestampedModel


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

    name = models.CharField(max_length=100, verbose_name="カテゴリ名")
    slug = models.SlugField(unique=True, verbose_name="スラッグ")
    parent = TreeForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="親カテゴリ",
    )
    icon = models.CharField(max_length=50, blank=True, verbose_name="アイコン")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    class MPTTMeta:
        order_insertion_by = ["name"]

    class Meta:
        db_table = "categories"
        verbose_name = "カテゴリ"
        verbose_name_plural = "カテゴリ"

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
        return " / ".join([cat.name for cat in ancestors])


class Location(TimestampedModel):
    """
    場所（ブックマーク）。

    ユーザーが保存した場所を管理する。PostGISを使用して地理空間データを格納。

    Attributes:
        user: この場所を所有するユーザー。
        name: 場所の名前（例: 'スターバックス 渋谷店'）。
        point: 地理座標（PostGIS PointField、WGS84座標系）。
        address: 住所（オプション）。
        category: 場所のカテゴリ（外部キー）。
        tags: タグのリスト（JSONField）。
        status: ステータス（'行きたい' or '興味なし'）。
        notes: メモ（オプション）。
        website: WebサイトURL（オプション）。
        phone: 電話番号（オプション）。

    Example:
        >>> from django.contrib.gis.geos import Point
        >>> location = Location.objects.create(
        ...     user=user,
        ...     name='東京タワー',
        ...     point=Point(139.7454, 35.6586, srid=4326),
        ...     category=Category.objects.get(slug='tourism'),
        ...     status='want_to_visit'
        ... )
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="locations",
        verbose_name="ユーザー",
    )
    name = models.CharField(
        max_length=LocationConstants.NAME_MAX_LENGTH,
        verbose_name="場所名",
    )

    # 地理空間（PostGIS）
    point = gis_models.PointField(
        srid=LocationConstants.POINT_SRID,
        verbose_name="座標",
    )
    address = models.TextField(blank=True, verbose_name="住所")

    # 分類
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="locations",
        verbose_name="カテゴリ",
    )
    tags = models.JSONField(default=list, blank=True, verbose_name="タグ")

    # ステータス
    status = models.CharField(
        max_length=LocationConstants.STATUS_MAX_LENGTH,
        choices=LocationConstants.STATUS_CHOICES,
        null=True,
        blank=True,
        verbose_name="ステータス",
    )

    # メタデータ
    notes = models.TextField(blank=True, verbose_name="メモ")
    website = models.URLField(blank=True, verbose_name="Webサイト")
    phone = models.CharField(
        max_length=LocationConstants.PHONE_MAX_LENGTH,
        blank=True,
        verbose_name="電話番号",
    )

    class Meta:
        db_table = "locations"
        verbose_name = "場所"
        verbose_name_plural = "場所"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "category"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return self.name

    @property
    def visit_count(self):
        """
        訪問回数を取得。

        Returns:
            int: この場所への訪問回数。

        Note:
            一覧取得時はN+1問題を避けるため、
            Service層でannotate(visit_count=Count('visits'))を使用すること。
            Visitモデル実装（#016）まではダミー値を返す。
        """
        # NOTE: Visitモデル実装後（#016）に以下に変更:
        # return self.visits.count()
        if hasattr(self, "_visit_count"):
            return self._visit_count
        return 0

    @property
    def average_rating(self):
        """
        平均評価を取得。

        Returns:
            float | None: 平均評価（1-5）。評価がない場合はNone。

        Note:
            一覧取得時はN+1問題を避けるため、
            Service層でannotate(average_rating=Avg('visits__rating'))を使用すること。
            Visitモデル実装（#016）まではダミー値を返す。
        """
        # NOTE: Visitモデル実装後（#016）に以下に変更:
        # ratings = self.visits.exclude(rating__isnull=True).values_list("rating", flat=True)
        # return sum(ratings) / len(ratings) if ratings else None
        if hasattr(self, "_average_rating"):
            return self._average_rating
        return None
