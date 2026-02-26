# タスク #014-B: 地図-リスト連動 + レスポンシブ - 実行ログ

## 基本情報
- **タスクID:** #014-B
- **ブランチ:** feature/map-list-sync
- **開始日:** 2026-02-24
- **ステータス:** 実装中
- **PR:** #27（#014, #014-A, #014-Bをまとめて含める）

---

## 設計レビュー（2026-02-24）

### 収集エビデンス

#### SPEC.md準拠確認
- § 2.2.1 Feature-based構造: `features/locations/components/`にLocation専用コンポーネント配置
- § 5.3 グローバル状態: 認証と地図中心のみ（選択状態は拡張解釈）

#### 既存コードパターン
- DashboardPage: PanelLayout + LocationList + MapView統合済み
- mapStore: center/setCenterのみ（selectedLocationId未定義）
- MapView: mapServiceRefでLeafletインスタンス保持

### 判断した項目

| # | 項目 | 選択 | 理由 |
|---|------|------|------|
| 1 | 選択状態の管理 | (a) mapStore | 地図UIの一部として自然、propsドリリング回避 |
| 2 | スクロール連動 | (a) useRef + scrollIntoView | 標準的なReactパターン |
| 3 | マーカーハイライト | (a) メソッド追加 | MapServiceインターフェースの責務 |
| 4 | DetailPanel配置 | (a) components/ | Visit/Trip等で再利用可能 |

### 判断不要で進めた項目

| 項目 | 選択内容 | 理由 |
|------|----------|------|
| LocationListPanelの配置 | `features/locations/components/` | SPEC.md § 2.2.1準拠 |
| レスポンシブ対応 | 既存PanelLayoutを活用 | 既にモバイル対応済み |
| 型定義の配置 | CLAUDE.md準拠 | 共通=同一ファイル、features=types/分離 |

### Info（実装時の注意事項）
- scrollIntoView: `behavior: 'smooth', block: 'center'`
- ハイライト: リストは`ring-2 ring-blue-500`、マーカーはサイズ変更
- テストカバレッジ: LocationListPanel ≥70%, DetailPanel ≥50%

---

## 実装（2026-02-24）

### Step 1: mapStoreに選択状態追加
- `frontend/src/stores/mapStore.ts`
  - `selectedLocationId` / `setSelectedLocationId` 追加
  - `hoveredLocationId` / `setHoveredLocationId` 追加

### Step 2: MapServiceインターフェースにハイライト機能追加
- `frontend/src/lib/maps/interface.ts`: `highlightMarker(locationId: number | null)` 追加
- `frontend/src/lib/maps/constants.ts`: `MARKER_ICON_SIZE` 定数追加（通常/ハイライト）
- `frontend/src/lib/maps/leaflet.ts`:
  - constructor追加（normalIcon, highlightedIcon作成）
  - `highlightMarker`メソッド実装（アイコン切り替え）
  - `addMarker`でカスタムアイコン使用

### Step 3: LocationListPanel作成
- `frontend/src/features/locations/components/LocationListPanel.tsx`
  - 縦並びリスト表示
  - `useRef` + `Map`でリストアイテム参照管理
  - `selectedLocationId`変更時に`scrollIntoView`
  - ホバー時に`setHoveredLocationId`呼び出し
  - 選択状態の視覚的フィードバック（ring-2 ring-blue-500）

### Step 4: DetailPanel作成
- `frontend/src/components/PanelLayout/DetailPanel.tsx`
  - オーバーレイパネル（モバイル: 下から、デスクトップ: 右から）
  - `isOpen`, `onClose`, `title`, `children` props
  - `role="dialog"`, `aria-modal="true"` でアクセシビリティ対応
  - オーバーレイクリックで閉じる

### Step 5: DashboardPage統合
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
  - LocationListPanel使用に変更
  - DetailPanel統合（選択時に表示）
  - マーカークリック / リストクリックで選択・中心移動

### Step 6: MapView更新
- `frontend/src/components/MapView/MapView.tsx`
  - `hoveredLocationId`監視
  - `useEffect`でハイライト連動

### Step 7: テスト作成・修正
- `frontend/src/features/locations/__tests__/LocationListPanel.test.tsx` 新規作成（9テスト）
- `frontend/src/components/PanelLayout/__tests__/DetailPanel.test.tsx` 新規作成（7テスト）
- `frontend/src/features/dashboard/__tests__/DashboardPage.test.tsx` 更新（モック修正）
- `frontend/src/components/MapView/__tests__/MapView.test.tsx` 更新（highlightMarkerモック追加）
- `frontend/src/lib/maps/__tests__/leaflet.test.ts` 更新（MockIconクラス追加）
- `frontend/src/lib/maps/__tests__/factory.test.ts` 更新（MockIconクラス追加）

### 確認結果
- テスト: 136件全て成功
- Lint: エラーなし
- Prettier: フォーマット済み

---

## チェックリスト
- [x] LocationListPanel作成（縦並びリスト表示）
- [x] マーカークリック → リストスクロール連動
- [x] リストホバー → マーカーハイライト
- [x] レスポンシブ対応（モバイル: 縦並び切り替え）
- [x] DetailPanel オーバーレイ表示
- [x] テスト作成

---

## エージェントレビュー（2026-02-24）

### 実装レビュー（code-reviewer）
**総合評価:** 承認（APPROVED）

#### 良い点
- CLAUDE.md準拠: 定数化徹底、JSDoc日本語記述、エラーメッセージ一元管理
- SPEC.md準拠: Feature-based構造、共通コンポーネント型定義ルール遵守
- コード品質: アクセシビリティ属性適切、useCallback活用、useRef連動
- テスト品質: モック設計適切、主要ユースケースカバー
- セキュリティ: XSS脆弱性なし

#### 指摘事項
| 重要度 | 件数 |
|--------|------|
| Blocker | 0件 |
| Should Fix | 0件 |
| Nice to Have | 3件（うち1件は既にTECH-008として登録済み） |

#### Nice to Have（対応不要）
1. LocationListItem内のスタイル定数化追加 - 過度な定数化は可読性低下のリスク、現状維持
2. MapServiceインターフェースsetView追加 - 既にTECH-008として登録済み
3. テストカバレッジ確認 - 主要ユースケースカバー済み、十分

### レビュー結果への対応
即時対応: なし
次回タスクで対応: なし（既存TECH-008で対応予定）
