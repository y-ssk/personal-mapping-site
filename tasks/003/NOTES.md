# タスク #003 実装ノート

## シードスクリプト解説

### ファイル
`backend/apps/locations/management/commands/seed_categories.py`

### 概要

Django management commandとしてカテゴリマスタデータを投入するスクリプト。
`python manage.py seed_categories` で実行可能。

### データ構造

```python
CATEGORY_DATA = {
    'slug': {
        'name': 'カテゴリ名',
        'icon': 'アイコン名',
        'children': [
            {'slug': 'child-slug', 'name': '子カテゴリ名', 'icon': 'icon'},
            ...
        ]
    },
    ...
}
```

**設計意図:**
- 辞書のキーにslugを使用 → 一意性が自明
- 子カテゴリはリストで定義 → 順序を保持
- lft/rght/tree_id は定義不要 → django-mpttが自動計算

### 処理フロー

```
1. コマンドライン引数解析
   └── --dry-run: 実際の投入なしで内容確認

2. 既存データ削除（冪等性確保）
   └── Category.objects.all().delete()
   └── MPTTのツリー構造も自動的にクリア

3. ルートカテゴリ作成
   └── parent=None で作成
   └── django-mpttが lft, rght, tree_id を自動設定

4. 子カテゴリ作成
   └── parent=root で作成
   └── django-mpttが階層情報を自動計算
```

### なぜJSONフィクスチャではないか

| 観点 | JSONフィクスチャ | シードスクリプト |
|------|------------------|------------------|
| lft/rght計算 | 手動で計算必要 | 自動（MPTT任せ） |
| バリデーション | 実行時エラー | 定義時に型チェック |
| 冪等性 | loaddata --ignorenonexistent | 明示的に制御可能 |
| 可読性 | pk, model, fields の冗長構造 | シンプルな辞書 |

### django-mpttの自動計算

```python
# 作成時
root = Category.objects.create(name='飲食', slug='food-drink', parent=None)
# → lft=1, rght=2, tree_id=1, level=0 が自動設定

child = Category.objects.create(name='ラーメン', slug='ramen', parent=root)
# → lft=2, rght=3, tree_id=1, level=1 が自動設定
# → root.rght が自動的に更新される
```

### 冪等性の実現

```python
# 既存データを全削除してから再作成
deleted_count = Category.objects.count()
if deleted_count > 0:
    Category.objects.all().delete()
```

**注意:** 本番環境でLocationがCategoryを参照している場合、
外部キー制約でエラーになる。本番でのカテゴリ変更は別途マイグレーションが必要。

### 使用例

```bash
# ドライラン（実際の変更なし）
docker compose exec backend python manage.py seed_categories --dry-run

# 実行
docker compose exec backend python manage.py seed_categories

# 確認
docker compose exec backend python manage.py shell -c "
from apps.locations.models import Category
for c in Category.objects.all():
    print(f'{\"  \" * c.level}{c.name} (lft={c.lft}, rght={c.rght})')
"
```

### 拡張方法

新しいカテゴリを追加する場合：

```python
# CATEGORY_DATA に追加
'new-root': {
    'name': '新カテゴリ',
    'icon': 'new-icon',
    'children': [
        {'slug': 'child1', 'name': '子1', 'icon': 'icon1'},
    ],
},
```

子カテゴリのみ追加する場合は、既存ルートの `children` リストに追加。
