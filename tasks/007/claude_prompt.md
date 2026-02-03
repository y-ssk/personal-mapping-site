# Claude Code実行プロンプト - タスク #007

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

# タスク #007: OAuth統合（Google/GitHub）

## 概要
OAuth統合（Google/GitHub）

## SPEC参照
SPEC.md § 8.1.3

## タスク情報
### ⬜ #007 OAuth統合（Google/GitHub）
- **優先度:** 高
- **見積:** 3h
- **依存:** #006
- **ブランチ:** feature/oauth
- **SPEC参照:** SPEC.md § 8.1.3
- **チェックリスト:**
  - [ ] django-allauth設定
  - [ ] Google OAuth設定
  - [ ] GitHub OAuth設定
  - [ ] OAuthエンドポイント実装
  - [ ] テスト作成
  - [ ] OpenAPI更新
- **成果物:**
  - OAuth設定
  - テストコード

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
