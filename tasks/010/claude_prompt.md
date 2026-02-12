# Claude Code実行プロンプト - タスク #010

以下のタスクを実装してください。

## 重要な制約

1. **SPEC.mdに厳密に従う** - 仕様と異なる実装はすべて却下されます
2. **余計なことはしない** - 仕様にない機能追加は禁止
3. **テストは必須** - Service層カバレッジ>=80%
4. **ドキュメントは必須** - JSDoc/Docstringを必ず書く

## 参照ドキュメント

- SPEC.md: 技術仕様
- CLAUDE.md: 開発ガイド
- docs/api/openapi.yml: API仕様

## タスク詳細

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

## 実装手順

1. まず関連するSPECセクションを読んでください
2. 既存コードのパターンに従ってください
3. テストを必ず作成してください
4. 実装後、変更内容を報告してください

---

*このプロンプトは自動生成されました*
