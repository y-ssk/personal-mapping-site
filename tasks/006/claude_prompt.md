# Claude Code実行プロンプト - タスク #006

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

# タスク #006: バックエンド認証API

## 概要
バックエンド認証API

## SPEC参照
SPEC.md § 8.1, § 3.3.1

## タスク情報
### ⬜ #006 バックエンド認証API
- **優先度:** 最高
- **見積:** 4h
- **依存:** #001
- **ブランチ:** feature/auth-backend
- **SPEC参照:** SPEC.md § 8.1, § 3.3.1
- **チェックリスト:**
  - [ ] Userモデル作成
  - [ ] JWT設定（Simple JWT）
  - [ ] 認証エンドポイント実装
    - [ ] POST /api/v1/auth/register/
    - [ ] POST /api/v1/auth/login/
    - [ ] POST /api/v1/auth/refresh/
    - [ ] GET /api/v1/auth/me/
  - [ ] シリアライザ作成
  - [ ] テスト作成（カバレッジ≥80%）
  - [ ] OpenAPI更新
  - [ ] Postman/curl動作確認
- **成果物:**
  - `backend/apps/users/`全ファイル
  - `docs/api/openapi.yml`（更新）

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
