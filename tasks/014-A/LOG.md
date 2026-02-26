# タスク #014-A: PanelLayout基盤 + DashboardPage - 実行ログ

## 基本情報
- **タスクID:** #014-A
- **ブランチ:** feature/panel-layout
- **開始日:** 2026-02-23
- **ステータス:** 完了
- **PR:** #27（#014, #014-A, #014-Bをまとめて含める）

---

## 実行履歴

### 2026-02-23: タスク開始

#### タスク概要
- PanelLayoutコンポーネント作成（リサイズ可能）
- SidePanel / MainPanel / DetailPanel コンポーネント
- DashboardPage作成（PanelLayout + MapView + LocationList）
- App.tsx ルーティング更新
- MainLayout を Outlet対応に変更
- テスト作成

#### 設計決定（親タスク#014で決定済み）
- D案（パネル分割型）採用
- Google Maps風UI
- TOPページ（`/`）にDashboardPageを配置

---

## 設計レビュー（2026-02-23）

### 収集エビデンス

#### SPEC.md準拠確認
- § 1.2 J: ダッシュボード（TOPページ、カスタマイズ可能ウィジェット）
- § 2.2.1: Feature-based構造（features/dashboard/）
- § 5.7: React Router v6

#### CLAUDE.md準拠確認
- 共通コンポーネント（PanelLayout）は`components/`に配置
- 型定義は同一ファイルに配置
- JSDoc/コメントは日本語

#### 既存コードパターン
- App.tsx: 現在はchildren方式でMainLayout使用
- MapView: `components/MapView/`に配置済み
- LocationList: `features/locations/components/`に配置済み

### 推奨ディレクトリ構成

```
frontend/src/
├── components/
│   └── PanelLayout/
│       ├── PanelLayout.tsx    # 型定義含む
│       ├── SidePanel.tsx
│       ├── MainPanel.tsx
│       ├── index.ts
│       └── __tests__/
│           └── PanelLayout.test.tsx
├── features/
│   └── dashboard/
│       ├── pages/
│       │   └── DashboardPage.tsx
│       └── index.ts
```

### 判断が必要な項目

| # | 項目 | 選択肢 | 推奨 |
|---|------|--------|------|
| 1 | MainLayoutのOutlet対応 | (a) Outlet方式 / (b) children維持 | (a) |
| 2 | パネルリサイズ方式 | (a) CSS固定幅 / (b) CSS resize / (c) ライブラリ | (a) |

### 実装時の注意事項
1. PanelLayout関連の型定義は同一ファイルに配置
2. JSDoc/コメントは日本語
3. MainLayoutの`h-screen`と`overflow-hidden`で画面全体カバー
4. `features/dashboard/index.ts`でDashboardPageをエクスポート
5. Hooks: カバレッジ>=70%

### ユーザー判断（2026-02-23）

| # | 項目 | 選択 | 理由 |
|---|------|------|------|
| 1 | MainLayout方式 | **(a) Outlet方式** | 将来のルート拡張が容易 |
| 2 | パネルリサイズ | **(c) ライブラリ** | UX優先、Google Maps風UIの意図を活かす |

**追加指示:**
- 実装コストが高い場合は分解して考える
- 拡張性・将来性を考慮しながら慎重に進める

### 使用ライブラリ
- `react-resizable-panels`: パネルリサイズ用
  - 公式: https://github.com/bvaughn/react-resizable-panels
  - 軽量、React 18対応、アクセシビリティ対応

---

## 実装

### Step 1: react-resizable-panels インストール
```bash
docker compose exec frontend npm install react-resizable-panels
```
✅ 完了

### Step 2: PanelLayoutコンポーネント作成
- `frontend/src/components/PanelLayout/PanelLayout.tsx`
- `frontend/src/components/PanelLayout/index.ts`

**機能:**
- react-resizable-panelsを使用したリサイズ可能パネル
- デスクトップ: 横並び（サイドパネル30%、メインパネル70%）
- モバイル: 縦並び（上半分地図、下半分リスト）
- リサイズハンドルにビジュアルフィードバック

✅ 完了

### Step 3: MainLayout Outlet対応
- `frontend/src/components/MainLayout/MainLayout.tsx`
- `frontend/src/components/MainLayout/index.ts`

**変更内容:**
- childrenプロップ → Outlet方式に変更
- h-screen + overflow-hidden でフルスクリーン対応
- ヘッダー固定（flex-none）、コンテンツ領域可変（flex-1）
- PanelLayoutと連携可能な構造

✅ 完了

### Step 4: DashboardPage作成
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- `frontend/src/features/dashboard/index.ts`

**機能:**
- PanelLayout + LocationList + MapView統合
- useLocationsフックでデータ取得
- 場所クリックで地図中心を移動（mapStore連携）
- ページネーション対応
- 読み込み中・エラー状態の表示

✅ 完了

### Step 5: App.tsxルーティング更新
- `frontend/src/App.tsx` を修正

**変更内容:**
- MainLayoutをcomponents/から import
- DashboardPageをfeatures/dashboardから import
- ネストルート + Outletパターンに変更
- インラインのMainLayout, HomePageを削除

✅ 完了

### Step 6: テスト作成
- `frontend/src/components/PanelLayout/__tests__/PanelLayout.test.tsx` (7テスト)
- `frontend/src/components/MainLayout/__tests__/MainLayout.test.tsx` (11テスト)
- `frontend/src/features/dashboard/__tests__/DashboardPage.test.tsx` (8テスト)

**テスト結果:**
```
 Test Files  14 passed (14)
      Tests  117 passed (117)
```

✅ 完了

---

---

## 実装レビュー（2026-02-24）

### 総合評価: Blocker付き承認

### 良い点
1. CLAUDE.md準拠の型定義配置（共通コンポーネントは同一ファイル）
2. 定数化の徹底（PANEL_SIZES, DASHBOARD_CONSTANTS, HEADER_HEIGHT_CLASS）
3. JSDoc/コメントの日本語記述
4. Feature-based構造の遵守（features/dashboard/）
5. テストの網羅性（26テスト追加）
6. React Router v6のOutletパターン適用
7. レスポンシブ対応（デスクトップ/モバイル切り替え）
8. 地図-リスト連動の基盤（mapStore連携）

### 指摘事項
| 重要度 | 内容 | 場所 | 対応方針 |
|--------|------|------|----------|
| Should Fix | App.tsxのハードコード文字列「読み込み中...」 | App.tsx:44 | 今回対応 / CLAUDE.md エラーメッセージ一元管理 |
| Should Fix | HEADER_HEIGHT_CLASSエクスポート漏れ | MainLayout.tsx:14 | 次回対応（TECH-009）/ 現時点で外部参照不要 |
| Should Fix | LocationListPropsのJSDoc未記載 | LocationList.tsx:12-27 | 次回対応（TECH-010）/ 既存ファイル、動作に影響なし |
| Nice to Have | LoadingState/ErrorState共通化 | DashboardPage.tsx | 将来的にcomponents/ui/に配置 |

### 対応内容
#### 即時対応
- [x] App.tsxのハードコード文字列を定数化
  - `lib/constants/ui.ts`に`UI_MESSAGES.LOADING`を追加
  - App.tsxで定数を使用するように修正

#### 次回タスクで対応
- TECH-009: MainLayout定数のエクスポート
- TECH-010: LocationListPropsのJSDoc追加

---

## チェックリスト
- [x] PanelLayoutコンポーネント作成（リサイズ可能）
- [x] SidePanel / MainPanel / DetailPanel コンポーネント
- [x] DashboardPage作成（PanelLayout + MapView + LocationList）
- [x] App.tsx ルーティング更新
- [x] MainLayout を Outlet対応に変更
- [x] テスト作成

---

## 完了（2026-02-24）

### コミット
- `0d5c6c7` feat(frontend): PanelLayout基盤 + DashboardPage #014-A

### マージ
- `feature/panel-layout` → `feature/map-display`
- PR #27に含める

### 成果物
| ファイル | 説明 |
|----------|------|
| `frontend/src/components/PanelLayout/` | リサイズ可能パネルレイアウト |
| `frontend/src/components/MainLayout/` | Outlet対応メインレイアウト |
| `frontend/src/features/dashboard/` | ダッシュボードページ |
| `frontend/src/lib/constants/ui.ts` | 共通UI定数 |
| テストファイル3件 | PanelLayout, MainLayout, DashboardPage |

### 次タスク
- #014-B: 地図-リスト連動 + レスポンシブ
