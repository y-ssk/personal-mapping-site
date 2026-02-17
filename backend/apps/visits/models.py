"""
visitsアプリのデータモデル。

SPEC.md § 3.3.4 Visitモデルを定義。
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.visits.constants import VisitConstants
from core.models import TimestampedModel


class Visit(TimestampedModel):
    """
    訪問記録（1回の訪問）。

    ユーザーが場所を訪問した記録を管理する。
    同一場所への複数回訪問をサポート。

    Attributes:
        user: この訪問を記録したユーザー。
        location: 訪問した場所。
        visited_at: 訪問日時。
        rating: 評価（1-5、任意）。
        review: レビュー・感想（任意）。
        actual_trip: 紐付けられた実際の旅行（任意）。

    Example:
        >>> from django.utils import timezone
        >>> visit = Visit.objects.create(
        ...     user=user,
        ...     location=location,
        ...     visited_at=timezone.now(),
        ...     rating=4,
        ...     review='静かで作業しやすかった'
        ... )
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="visits",
        verbose_name="ユーザー",
    )
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.CASCADE,
        related_name="visits",
        verbose_name="場所",
    )

    # 訪問詳細
    visited_at = models.DateTimeField(verbose_name="訪問日時")
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(VisitConstants.RATING_MIN),
            MaxValueValidator(VisitConstants.RATING_MAX),
        ],
        verbose_name="評価",
    )
    review = models.TextField(blank=True, verbose_name="レビュー")

    # NOTE: 暫定実装 - ActualTripモデル未実装（#020で解消）
    # Djangoは文字列参照FKをサポート（遅延評価）
    # ActualTripモデル実装後、このコメントを削除
    actual_trip = models.ForeignKey(
        "trips.ActualTrip",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="visits",
        verbose_name="実際の旅行",
    )

    class Meta:
        db_table = "visits"
        verbose_name = "訪問記録"
        verbose_name_plural = "訪問記録"
        ordering = ["-visited_at"]
        indexes = [
            models.Index(fields=["user", "visited_at"]),
            models.Index(fields=["location", "visited_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.location.name} ({self.visited_at.date()})"
