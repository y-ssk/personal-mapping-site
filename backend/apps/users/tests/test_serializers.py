"""
認証関連シリアライザのテスト。
"""

import pytest

from apps.users.models import User
from apps.users.serializers import CustomUserDetailsSerializer


@pytest.mark.django_db
class TestCustomUserDetailsSerializer:
    """CustomUserDetailsSerializerのテスト。"""

    def test_serializer_fields(self):
        """シリアライザが正しいフィールドを持つ。"""
        user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
            display_name="テストユーザー",
        )
        serializer = CustomUserDetailsSerializer(user)

        assert "id" in serializer.data
        assert "email" in serializer.data
        assert "display_name" in serializer.data
        assert "date_joined" in serializer.data
        # パスワードは含まれない
        assert "password" not in serializer.data

    def test_serializer_read_only_fields(self):
        """id、email、date_joinedは読み取り専用。"""
        user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
        )
        serializer = CustomUserDetailsSerializer(user)

        assert "id" in serializer.Meta.read_only_fields
        assert "email" in serializer.Meta.read_only_fields
        assert "date_joined" in serializer.Meta.read_only_fields
