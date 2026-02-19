# タスク #012: 検索・フィルタ機能 - 実行ログ

## 基本情報
- **開始日:** 2026-02-19
- **ブランチ:** feature/location-filters
- **SPEC参照:** SPEC.md § 4.3.1

---

## 設計レビュー（2026-02-19）

### 評価: Blocker付き承認

### 判断した項目

| 項目 | 選択 | 理由 |
|------|------|------|
| タグフィルタ条件 | (a) OR条件 | 一般的なUX慣行、結果が0件になりにくい。SPEC未定義のため推奨を採用 |

### 判断不要で進めた項目

| 項目 | 選択 | 理由 |
|------|------|------|
| ディレクトリ構造 | 既存構造維持 | SPEC.md § 2.3.2で`filters.py`が定義済み |
| Filter責務配置 | filters.py | CLAUDE.md準拠 |

### Blocker対応

| 項目 | 対応 |
|------|------|
| テスト未作成 | test_filters.py を新規作成 |

### Info（実装時の注意事項）

- visited_atソート: Visit0件のLocationはNULL値（PostgreSQLではLAST扱い）
- qsプロパティ: `_annotated_visited_at`フラグは動作するが、Django標準外の手法

---

## 実装内容

### 変更ファイル

1. `backend/apps/locations/filters.py`
   - visited_atソート機能追加（`filter_queryset`で`latest_visited_at`をannotate）
   - docstring更新（SPEC.md § 4.3.1参照）
   - **修正**: `qs`プロパティ→`filter_queryset`に変更（OrderingFilter適用前にannotate必要）

2. `backend/apps/locations/tests/test_filters.py`（新規）
   - LocationFilterのユニットテスト（23件）

### テスト結果

```
apps/locations/tests/ - 146 passed
apps/locations/tests/test_filters.py - 23 passed
```

**カバレッジ対象:**
- カテゴリフィルタ
- タグフィルタ（OR条件）
- ステータスフィルタ
- テキスト検索（name, address）
- ソート機能（created_at, name, visited_at）
- 複合フィルタ

---
