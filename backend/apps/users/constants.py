"""
usersアプリの定数定義。

エラーメッセージやマジックナンバーを一元管理する。
"""


class UserErrorMessages:
    """ユーザー関連のエラーメッセージ。"""

    EMAIL_REQUIRED = "メールアドレスは必須です"
    EMAIL_ALREADY_EXISTS = "このメールアドレスは既に登録されています"
    SUPERUSER_MUST_BE_STAFF = "スーパーユーザーはis_staff=Trueである必要があります"
    SUPERUSER_MUST_BE_SUPERUSER = "スーパーユーザーはis_superuser=Trueである必要があります"
