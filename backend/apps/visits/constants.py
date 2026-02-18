"""
visitsアプリの定数定義。
"""


class VisitConstants:
    """Visit関連の定数。"""

    RATING_MIN = 1
    RATING_MAX = 5


class VisitMessages:
    """Visit関連のメッセージ。"""

    NOT_FOUND = "指定された訪問記録が見つかりません"
    PERMISSION_DENIED = "この訪問記録を編集する権限がありません"
    INVALID_RATING = (
        f"評価は{VisitConstants.RATING_MIN}から"
        f"{VisitConstants.RATING_MAX}の間で指定してください"
    )
    LOCATION_REQUIRED = "訪問先の場所を指定してください"
    VISITED_AT_REQUIRED = "訪問日時を指定してください"
