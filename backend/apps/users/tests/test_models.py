"""
Userモデルのテスト。
"""

import pytest

from apps.users.models import User


@pytest.mark.django_db
class TestUserModel:
    """Userモデルのテスト。"""

    def test_create_user(self):
        """通常ユーザーを作成できる。"""
        user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
        )

        assert user.email == "test@example.com"
        assert user.check_password("TestPass123!")
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_user_with_display_name(self):
        """display_name付きでユーザーを作成できる。"""
        user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
            display_name="テストユーザー",
        )

        assert user.display_name == "テストユーザー"

    def test_create_user_without_email_raises_error(self):
        """メールアドレスなしでユーザーを作成するとエラーになる。"""
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="TestPass123!")

    def test_create_superuser(self):
        """スーパーユーザーを作成できる。"""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="AdminPass123!",
        )

        assert admin.email == "admin@example.com"
        assert admin.is_staff
        assert admin.is_superuser

    def test_create_superuser_must_be_staff(self):
        """スーパーユーザーはis_staff=Trueでなければならない。"""
        with pytest.raises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="AdminPass123!",
                is_staff=False,
            )

    def test_create_superuser_must_be_superuser(self):
        """スーパーユーザーはis_superuser=Trueでなければならない。"""
        with pytest.raises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="AdminPass123!",
                is_superuser=False,
            )

    def test_user_str(self):
        """ユーザーの文字列表現はメールアドレス。"""
        user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
        )

        assert str(user) == "test@example.com"

    def test_email_is_unique(self):
        """メールアドレスは一意。"""
        User.objects.create_user(
            email="unique@example.com",
            password="TestPass123!",
        )

        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email="unique@example.com",
                password="AnotherPass123!",
            )

    def test_username_field_is_email(self):
        """USERNAME_FIELDはemail。"""
        assert User.USERNAME_FIELD == "email"

    def test_required_fields_is_empty(self):
        """REQUIRED_FIELDSは空。"""
        assert User.REQUIRED_FIELDS == []
