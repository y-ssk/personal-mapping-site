"""
locationsアプリの定数定義。
"""


class CategoryConstants:
    """カテゴリ関連の定数。"""

    NAME_MAX_LENGTH = 100
    SLUG_MAX_LENGTH = 50
    ICON_MAX_LENGTH = 50


class CategoryMessages:
    """カテゴリ関連のメッセージ。"""

    NOT_FOUND = "指定されたカテゴリが見つかりません"
    SLUG_DUPLICATE = "このスラッグは既に使用されています"


class LocationConstants:
    """Location関連の定数。"""

    NAME_MAX_LENGTH = 255
    STATUS_MAX_LENGTH = 20
    PHONE_MAX_LENGTH = 20
    POINT_SRID = 4326  # WGS84座標系

    # ステータス値
    STATUS_WANT_TO_VISIT = "want_to_visit"
    STATUS_NOT_INTERESTED = "not_interested"

    STATUS_CHOICES = [
        (STATUS_WANT_TO_VISIT, "行きたい"),
        (STATUS_NOT_INTERESTED, "興味なし"),
    ]


class LocationMessages:
    """Location関連のメッセージ。"""

    NOT_FOUND = "指定された場所が見つかりません"
    PERMISSION_DENIED = "この場所を編集する権限がありません"
    INVALID_POINT = "無効な座標が指定されました"
