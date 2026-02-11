# タスク #009: Locationモデル実装

## 概要
Locationモデル実装

## SPEC参照
SPEC.md § 3.3.3

## タスク情報
### ⬜ #009 Locationモデル実装
- **優先度:** 最高
- **見積:** 3h
- **依存:** #002, #003
- **ブランチ:** feature/location-model
- **SPEC参照:** SPEC.md § 3.3.3
- **チェックリスト:**
  - [ ] Locationモデル作成
  - [ ] PostGISフィールド設定
  - [ ] プロパティ実装（visit_count, average_rating）
  - [ ] 管理画面設定
  - [ ] マイグレーション
  - [ ] テスト作成
- **成果物:**
  - `backend/apps/locations/models.py`（Location）
  - マイグレーションファイル

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
