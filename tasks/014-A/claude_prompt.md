# Claude Code実行プロンプト - タスク #014-A

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

# タスク #014-A: ### ⬜ #014-A PanelLayout基盤 + DashboardPage

## 概要
### ⬜ #014-A PanelLayout基盤 + DashboardPage

## SPEC参照
SPEC.md § 1.2 J（ダッシュボード）

## タスク情報
### ⬜ #014-A PanelLayout基盤 + DashboardPage
- **優先度:** 最高
- **見積:** 4h
- **依存:** #014
- **ブランチ:** feature/panel-layout
- **SPEC参照:** SPEC.md § 1.2 J（ダッシュボード）
- **設計決定:** D案（パネル分割型）採用 - Google Maps風UI
- **チェックリスト:**
  - [ ] PanelLayoutコンポーネント作成（リサイズ可能）
  - [ ] SidePanel / MainPanel / DetailPanel コンポーネント
  - [ ] DashboardPage作成（PanelLayout + MapView + LocationList）
  - [ ] App.tsx ルーティング更新
  - [ ] MainLayout を Outlet対応に変更
  - [ ] テスト作成
- **成果物:**
  - `frontend/src/components/PanelLayout/`
  - `frontend/src/features/dashboard/pages/DashboardPage.tsx`

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
