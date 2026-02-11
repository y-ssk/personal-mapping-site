# タスク #010: Location CRUD API

## 概要
Location CRUD API

## SPEC参照
SPEC.md § 4.3.1

## タスク情報
### ⬜ #010 Location CRUD API
- **優先度:** 最高
- **見積:** 4h
- **依存:** #009
- **ブランチ:** feature/location-crud
- **SPEC参照:** SPEC.md § 4.3.1
- **チェックリスト:**
  - [ ] LocationSerializer作成
  - [ ] LocationService作成
  - [ ] LocationViewSet作成
  - [ ] URLルーティング
  - [ ] テスト作成（カバレッジ≥80%）
  - [ ] OpenAPI更新
- **成果物:**
  - `backend/apps/locations/serializers.py`
  - `backend/apps/locations/services.py`
  - `backend/apps/locations/views.py`
  - `backend/apps/locations/urls.py`

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
