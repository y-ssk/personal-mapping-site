# タスク #003: カテゴリマスタデータ作成

## 概要
カテゴリマスタデータ作成

## SPEC参照
SPEC.md § 3.3.2

## タスク情報
### ⬜ #003 カテゴリマスタデータ作成
- **優先度:** 高
- **見積:** 2h
- **依存:** #002
- **ブランチ:** feature/category-master
- **SPEC参照:** SPEC.md § 3.3.2
- **チェックリスト:**
  - [ ] Categoryモデル作成（django-mptt）
  - [ ] 初期カテゴリデータ作成（fixture）
  - [ ] 管理画面設定
  - [ ] マイグレーション
  - [ ] データ投入確認
- **成果物:**
  - `backend/apps/locations/models.py`（Category）
  - `backend/apps/locations/fixtures/categories.json`

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
