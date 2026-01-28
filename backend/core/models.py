"""
Personal Mapping Siteの共通抽象モデル。

共通フィールドと機能を持つベースモデルを提供する。
"""
from django.db import models


class TimestampedModel(models.Model):
    """
    作成日時と更新日時を持つ抽象ベースモデル。

    Attributes:
        created_at: レコードが作成された日時。
        updated_at: レコードが最後に更新された日時。
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
