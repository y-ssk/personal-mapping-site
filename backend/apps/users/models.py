"""
Personal Mapping Siteのカスタムユーザーモデル。

usernameの代わりにemailを主要な識別子として使用する。
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.users.constants import UserErrorMessages


class UserManager(BaseUserManager):
    """
    emailを一意の識別子とするカスタムユーザーマネージャー。
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        指定されたemailとpasswordで通常ユーザーを作成・保存する。

        Args:
            email: ユーザーのメールアドレス（必須）。
            password: ユーザーのパスワード。
            **extra_fields: ユーザーモデルの追加フィールド。

        Returns:
            User: 作成されたユーザーインスタンス。

        Raises:
            ValueError: emailが指定されていない場合。
        """
        if not email:
            raise ValueError(UserErrorMessages.EMAIL_REQUIRED)
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        指定されたemailとpasswordでスーパーユーザーを作成・保存する。

        Args:
            email: ユーザーのメールアドレス（必須）。
            password: ユーザーのパスワード。
            **extra_fields: ユーザーモデルの追加フィールド。

        Returns:
            User: 作成されたスーパーユーザーインスタンス。
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(UserErrorMessages.SUPERUSER_MUST_BE_STAFF)
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(UserErrorMessages.SUPERUSER_MUST_BE_SUPERUSER)

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    emailを主要な識別子とするカスタムユーザーモデル。

    Attributes:
        email: 認証用の一意のメールアドレス。
        username: オプションのユーザー名（認証には不要）。
        display_name: アプリケーションで表示されるユーザーの表示名。
    """

    username = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"
        verbose_name = "ユーザー"
        verbose_name_plural = "ユーザー"

    def __str__(self):
        return self.email
