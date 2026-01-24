# Claude Code実行プロンプト - タスク #D007

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

# タスク #D007: Lint/Format設定

## 概要
Lint/Format設定

## SPEC参照
'なし'

## タスク情報
### ⬜ #D007 Lint/Format設定
- **優先度:** 最高
- **見積:** 0.5h
- **依存:** #D001
- **ブランチ:** feature/lint-setup
- **成果物:**
  - `.pre-commit-config.yaml`
  - `frontend/.eslintrc.json`
  - `frontend/.prettierrc`
  - `backend/pyproject.toml`
  - `backend/.flake8`
- **チェックリスト:**
  - [ ] pre-commit設定
  - [ ] ESLint設定
  - [ ] Prettier設定
  - [ ] Black設定
  - [ ] flake8設定
  - [ ] isort設定
  - [ ] pre-commit install確認

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
