# Claude Code実行プロンプト - タスク #D006

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

# タスク #D006: GitHub Actions設定

## 概要
GitHub Actions設定

## SPEC参照
'なし'

## タスク情報
### ⬜ #D006 GitHub Actions設定
- **優先度:** 最高
- **見積:** 1h
- **依存:** #D001
- **ブランチ:** feature/github-actions
- **成果物:**
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/frontend-ci.yml`
  - `.github/workflows/openapi-validate.yml`
- **チェックリスト:**
  - [ ] Backend CI実装
  - [ ] Frontend CI実装
  - [ ] OpenAPI検証実装
  - [ ] Codecov統合
  - [ ] 動作確認

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
