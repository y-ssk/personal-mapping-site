# Claude Code実行プロンプト - タスク #013

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

# タスク #013: フロントエンド Location一覧

## 概要
フロントエンド Location一覧

## SPEC参照
'なし'

## タスク情報
### ⬜ #013 フロントエンド Location一覧
- **優先度:** 最高
- **見積:** 4h
- **依存:** #010
- **ブランチ:** feature/location-list-frontend
- **チェックリスト:**
  - [ ] Location型定義
  - [ ] locationApi作成
  - [ ] useLocations hook作成
  - [ ] LocationList component作成
  - [ ] LocationCard component作成
  - [ ] FilterBar component作成
  - [ ] テスト作成
- **成果物:**
  - `frontend/src/features/locations/`

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
