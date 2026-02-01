"""
認証関連のシリアライザ。

dj-rest-authのデフォルトシリアライザを拡張。
"""

from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers

from apps.users.constants import UserErrorMessages
from apps.users.models import User


class CustomRegisterSerializer(RegisterSerializer):
    """
    カスタム登録シリアライザ。

    dj-rest-authのRegisterSerializerを拡張し、
    display_nameフィールドを追加。
    """

    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_email(self, email):
        """
        メールアドレスの重複をチェックする。

        Args:
            email: 検証するメールアドレス。

        Returns:
            str: 検証済みのメールアドレス。

        Raises:
            serializers.ValidationError: メールアドレスが既に登録されている場合。
        """
        email = super().validate_email(email)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(UserErrorMessages.EMAIL_ALREADY_EXISTS)
        return email

    def get_cleaned_data(self):
        """
        バリデーション後のクリーンなデータを返す。

        Returns:
            dict: クリーンなデータ。display_nameを含む。
        """
        data = super().get_cleaned_data()
        data["display_name"] = self.validated_data.get("display_name", "")
        return data

    def save(self, request):
        """
        ユーザーを保存する。

        Args:
            request: HTTPリクエスト。

        Returns:
            User: 作成されたユーザーインスタンス。
        """
        user = super().save(request)
        user.display_name = self.cleaned_data.get("display_name", "")
        user.save()
        return user


class CustomUserDetailsSerializer(UserDetailsSerializer):
    """
    カスタムユーザー詳細シリアライザ。

    GET /api/v1/auth/me/ のレスポンス用。
    OAuth認証ユーザーかどうかの判別にoauth_providerを含む。
    """

    class Meta:
        model = User
        fields = ("id", "email", "display_name", "oauth_provider", "date_joined")
        read_only_fields = ("id", "email", "oauth_provider", "date_joined")
