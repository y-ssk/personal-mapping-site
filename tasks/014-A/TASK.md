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
