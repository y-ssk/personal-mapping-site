"""
カテゴリマスタデータのシードスクリプト。

使用方法:
    python manage.py seed_categories

このスクリプトは冪等性を持ち、既存データを削除して再作成する。
"""

from django.core.management.base import BaseCommand

from apps.locations.models import Category

# カテゴリデータ定義
# 構造: { 'slug': {'name': '名前', 'icon': 'アイコン', 'children': [...]} }
CATEGORY_DATA = {
    "food-drink": {
        "name": "飲食",
        "icon": "utensils",
        "children": [
            {"slug": "ramen", "name": "ラーメン", "icon": "ramen"},
            {"slug": "izakaya", "name": "居酒屋", "icon": "sake"},
            {"slug": "teishoku", "name": "定食屋", "icon": "rice"},
            {"slug": "machichuka", "name": "町中華", "icon": "noodles"},
            {"slug": "ethnic", "name": "エスニック", "icon": "globe"},
            {"slug": "cafe", "name": "カフェ", "icon": "coffee"},
            {"slug": "bar", "name": "バー", "icon": "wine"},
            {"slug": "sweets", "name": "スイーツ", "icon": "cake"},
            {"slug": "italian", "name": "イタリアン", "icon": "pizza"},
            {"slug": "french", "name": "フレンチ", "icon": "croissant"},
            {"slug": "washoku", "name": "和食", "icon": "fish"},
            {"slug": "chinese", "name": "中華", "icon": "dumpling"},
            {"slug": "yakiniku", "name": "焼肉", "icon": "meat"},
            {"slug": "sushi", "name": "寿司", "icon": "sushi"},
            {"slug": "yakitori", "name": "焼き鳥", "icon": "poultry"},
            {"slug": "udon-soba", "name": "うどん・そば", "icon": "noodles"},
            {"slug": "curry", "name": "カレー", "icon": "curry"},
            {"slug": "hamburger", "name": "ハンバーガー", "icon": "burger"},
            {"slug": "other-food", "name": "その他飲食", "icon": "restaurant"},
        ],
    },
    "accommodation": {
        "name": "宿泊",
        "icon": "bed",
        "children": [
            {"slug": "hotel", "name": "ホテル", "icon": "hotel"},
            {"slug": "ryokan", "name": "旅館", "icon": "ryokan"},
            {"slug": "minshuku", "name": "民宿", "icon": "house"},
            {"slug": "guesthouse", "name": "ゲストハウス", "icon": "hostel"},
        ],
    },
    "shopping": {
        "name": "買い物",
        "icon": "shopping-bag",
        "children": [
            {"slug": "shopping-mall", "name": "ショッピングモール", "icon": "mall"},
            {"slug": "outlet", "name": "アウトレット", "icon": "outlet"},
            {"slug": "supermarket", "name": "スーパー", "icon": "cart"},
            {"slug": "beauty-salon", "name": "美容院", "icon": "scissors"},
            {"slug": "clothing", "name": "服", "icon": "shirt"},
            {"slug": "cosmetics", "name": "コスメ", "icon": "lipstick"},
            {"slug": "sports-goods", "name": "スポーツ用品", "icon": "sneaker"},
            {"slug": "outdoor-goods", "name": "アウトドア用品", "icon": "tent"},
            {"slug": "zakka", "name": "雑貨", "icon": "gift"},
            {"slug": "bookstore", "name": "本屋", "icon": "book"},
        ],
    },
    "leisure": {
        "name": "レジャー・観光",
        "icon": "sun",
        "children": [
            {"slug": "onsen", "name": "温泉施設", "icon": "hot-spring"},
            {"slug": "cinema", "name": "映画館", "icon": "film"},
            {"slug": "flower-park", "name": "フラワーパーク", "icon": "flower"},
            {"slug": "park-nature", "name": "公園・自然", "icon": "tree"},
            {"slug": "shrine-temple", "name": "神社・寺院", "icon": "torii"},
            {"slug": "museum", "name": "美術館・博物館", "icon": "museum"},
            {"slug": "theme-park", "name": "テーマパーク", "icon": "ferris-wheel"},
            {"slug": "sports-facility", "name": "スポーツ施設", "icon": "stadium"},
        ],
    },
    "other": {
        "name": "その他",
        "icon": "more",
        "children": [],
    },
}


class Command(BaseCommand):
    """カテゴリマスタデータを投入するコマンド。"""

    help = "カテゴリマスタデータを投入する（既存データは削除される）"

    def add_arguments(self, parser):
        """コマンドライン引数を追加。"""
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="実際には投入せず、内容を確認のみ行う",
        )

    def handle(self, *args, **options):
        """コマンド実行。"""
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("ドライランモード（実際の変更なし）"))
            self._print_categories()
            return

        # 既存データ削除
        deleted_count = Category.objects.count()
        if deleted_count > 0:
            Category.objects.all().delete()
            self.stdout.write(f"既存カテゴリ {deleted_count}件 を削除しました")

        # カテゴリ作成
        created_count = 0
        for slug, data in CATEGORY_DATA.items():
            root = Category.objects.create(
                name=data["name"],
                slug=slug,
                icon=data["icon"],
                parent=None,
            )
            created_count += 1
            self.stdout.write(f"  ルート: {root.name}")

            for child_data in data.get("children", []):
                child = Category.objects.create(
                    name=child_data["name"],
                    slug=child_data["slug"],
                    icon=child_data["icon"],
                    parent=root,
                )
                created_count += 1
                self.stdout.write(f"    └ {child.name}")

        self.stdout.write(self.style.SUCCESS(f"\nカテゴリ {created_count}件 を作成しました"))

    def _print_categories(self):
        """ドライランでカテゴリ構造を表示。"""
        total = 0
        for slug, data in CATEGORY_DATA.items():
            self.stdout.write(f'\n{data["name"]} ({slug})')
            total += 1
            for child in data.get("children", []):
                self.stdout.write(f'  └ {child["name"]} ({child["slug"]})')
                total += 1
        self.stdout.write(f"\n合計: {total}件")
