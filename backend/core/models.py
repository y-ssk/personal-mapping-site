"""
Core abstract models for Personal Mapping Site.

Provides base models with common fields and functionality.
"""
from django.db import models


class TimestampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at timestamps.

    Attributes:
        created_at: Timestamp when the record was created.
        updated_at: Timestamp when the record was last updated.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
