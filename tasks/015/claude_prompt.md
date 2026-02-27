# Claude Code実行プロンプト - タスク #015

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

# タスク #015: Location作成・編集UI

## 概要
Location作成・編集UI

## SPEC参照
'なし'

## タスク情報
### ⬜ #015 Location作成・編集UI
- **優先度:** 最高
- **見積:** 3h
- **依存:** #014-B
- **ブランチ:** feature/location-form
- **設計方針:** DetailPanel内で表示（パネル分割UIと統一）
- **チェックリスト:**
  - [ ] LocationForm component作成（DetailPanel内表示前提）
  - [ ] 地図クリックで座標取得（MapViewとの連携）
  - [ ] カテゴリ選択UI
  - [ ] タグ入力UI
  - [ ] useCreateLocation hook
  - [ ] useUpdateLocation hook
  - [ ] バリデーション
  - [ ] テスト作成
- **成果物:**
  - `frontend/src/features/locations/components/LocationForm.tsx`

---

## フェーズ4: 訪問記録（Visit） [0/3]

> **Note:** #016 Visitモデル実装は、暫定実装解消のためフェーズ3に移動しました。


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
