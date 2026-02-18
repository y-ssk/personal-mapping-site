"""
tripsアプリのデータモデル。

NOTE: 暫定実装 - #020で本実装
Visitモデルからの参照を可能にするための最小限のスケルトン。
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import TimestampedModel

# 定数（#020で constants.py に移動）
RATING_MIN = 1
RATING_MAX = 5


class PlannedTrip(TimestampedModel):
    """
    旅行計画（スケルトン）。

    NOTE: 暫定実装 - #019で本実装
    SPEC.md § 3.3.5参照。
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="planned_trips",
        verbose_name="ユーザー",
    )
    name = models.CharField(max_length=255, verbose_name="旅行名")
    description = models.TextField(blank=True, verbose_name="説明")

    # 日付範囲（任意）
    start_date = models.DateField(null=True, blank=True, verbose_name="開始日")
    end_date = models.DateField(null=True, blank=True, verbose_name="終了日")

    class Meta:
        db_table = "planned_trips"
        verbose_name = "旅行計画"
        verbose_name_plural = "旅行計画"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ActualTrip(TimestampedModel):
    """
    実際の旅行記録（スケルトン）。

    NOTE: 暫定実装 - #020で本実装
    SPEC.md § 3.3.7参照。
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="actual_trips",
        verbose_name="ユーザー",
    )
    name = models.CharField(max_length=255, verbose_name="旅行名")
    description = models.TextField(blank=True, verbose_name="説明")

    # 実際の日付（必須）
    start_date = models.DateField(verbose_name="開始日")
    end_date = models.DateField(verbose_name="終了日")

    # 元の計画へのリンク（任意）
    planned_trip = models.OneToOneField(
        PlannedTrip,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actual_trip",
        verbose_name="元の計画",
    )

    # 旅行全体のレビュー
    overall_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(RATING_MIN), MaxValueValidator(RATING_MAX)],
        verbose_name="総合評価",
    )
    overall_review = models.TextField(blank=True, verbose_name="総合レビュー")

    class Meta:
        db_table = "actual_trips"
        verbose_name = "実際の旅行"
        verbose_name_plural = "実際の旅行"
        ordering = ["-start_date"]

    def __str__(self):
        return self.name
