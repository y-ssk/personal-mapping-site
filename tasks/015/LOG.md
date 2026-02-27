# タスク #015: Location作成・編集UI - 実行ログ

## 基本情報
- **開始日:** 2026-02-27
- **ブランチ:** feature/location-form
- **依存:** #014-B

## タスク概要
DetailPanel内にLocation作成・編集フォームを実装する。
地図クリックで座標取得、カテゴリ選択、タグ入力、バリデーション機能を含む。

## 進捗
- [x] 設計レビュー
- [x] 実装（Step 1: MapService/MapView地図クリック機能追加）
- [x] 実装（Step 2: Category API バックエンド追加）
- [x] 実装（Step 3: Category API フロントエンド追加）
- [x] 実装（Step 4: LocationForm コンポーネント）
- [x] 実装（Step 5: DashboardPage統合）
- [x] テスト（153 passed, 17 test files）
- [x] コードレビュー
- [x] CI lint/型エラー修正
- [ ] コミット・PR

## 実装詳細（2026-02-27）

### Step 1: MapService/MapView地図クリック機能追加
- `frontend/src/lib/maps/types.ts`: MapClickHandler型を追加
- `frontend/src/lib/maps/interface.ts`: setMapClickHandlerメソッドをインターフェースに追加
- `frontend/src/lib/maps/leaflet.ts`: Leafletのmap.on('click')で実装、destroy時にクリーンアップ
- `frontend/src/components/MapView/MapView.tsx`: onMapClick propを追加、useEffectでハンドラ更新
- `frontend/src/lib/maps/index.ts`: MapClickHandler型をエクスポート
- `frontend/src/lib/maps/__tests__/leaflet.test.ts`: モックにon()メソッド追加

### Step 2: Category API バックエンド
- `backend/apps/locations/views.py`: CategoryViewSet（ReadOnlyModelViewSet）を追加
- `backend/apps/locations/category_urls.py`: カテゴリURLルーティング新規作成
- `backend/config/urls.py`: /api/v1/categories/を登録

### Step 3: Category API フロントエンド
- `frontend/src/features/locations/api/categoryApi.ts`: カテゴリAPI関数
- `frontend/src/features/locations/hooks/useCategories.ts`: useCategoriesフック
- `frontend/src/features/locations/constants/index.ts`: CATEGORY_ENDPOINTS, CATEGORY_QUERY_KEYS, LOCATION_FORM_CONSTANTS追加
- `frontend/src/features/locations/constants/messages.ts`: CATEGORY_MESSAGES, LOCATION_FORM_MESSAGES追加

### Step 4: LocationFormコンポーネント
- `frontend/src/features/locations/components/LocationForm.tsx`:
  - React Hook Form使用（SPEC準拠）
  - 新規/編集モードの切り替え（isEditMode）
  - 座標: react-hook-form外でuseStateで管理、clickedPointをuseEffectで反映
  - カテゴリ選択: useCategoriesフックでAPI取得、selectで表示
  - タグ入力: TagInputサブコンポーネント（Enter/カンマで追加、×で削除）
  - バリデーション: 場所名必須/255文字制限、座標必須、電話番号20文字制限、URL形式
  - 送信: LatLng→GeoJSON変換してuseCreateLocation/useUpdateLocation呼び出し
  - エラー表示: apiErrorとフィールドバリデーションの両方対応

### Step 5: DashboardPage統合
- panelMode状態（view/create/edit）をuseStateで管理
- 地図クリック: フォーム閉→新規作成モード、フォーム開→座標更新
- 新規追加ボタン: LocationListPanelヘッダー上部に配置
- LocationCard編集ボタン→編集モード
- 成功トースト表示（3秒自動消去）

### テスト
- `frontend/src/features/locations/__tests__/LocationForm.test.tsx`: 17テスト
  - 新規作成モード: フォームレンダリング、作成ボタン、カテゴリ選択肢、ステータス選択肢、座標ヒント、座標表示、バリデーション（名前必須、座標必須）、API呼び出し、キャンセル
  - 編集モード: 既存データ初期化、更新ボタン、タグ表示、API呼び出し
  - バリデーション: 電話番号文字数超過
  - タグ入力: 追加、削除

## 設計レビュー（2026-02-27）

### 総合評価: Blocker付き承認

### 収集エビデンス

#### 1. LocationCreateRequest構造（openapi.yml）
| フィールド | 型 | 必須 | 制約 |
|-----------|----|----|------|
| name | string | Yes | maxLength: 255 |
| point | GeoPoint | Yes | GeoJSON形式 |
| address | string | No | - |
| category_id | integer/null | No | 存在するカテゴリID |
| tags | string[] | No | - |
| status | enum/null | No | want_to_visit / not_interested |
| notes | string | No | - |
| website | string (uri) | No | - |
| phone | string | No | maxLength: 20 |

#### 2. 既存パターン: LoginForm
- react-hook-formのuseFormを使用
- register()でフィールドバインド、handleSubmit()でサブミット
- aria-invalid + aria-describedbyでエラー表示

#### 3. MapService/MapViewの現状
- MapService interfaceに地図クリックハンドラのメソッドがない
- LeafletMapServiceに地図クリックハンドラがない
- MapViewにonMapClick propがない

#### 4. Category APIの状態
- OpenAPI仕様では/categories/は定義済み
- バックエンドにCategoryViewSet/URLルーティングが未実装

### Blocker

#### Blocker-1: 地図クリックハンドラの追加
- MapService interfaceにsetMapClickHandlerを追加
- LeafletMapServiceにLeafletのmap.on('click')実装を追加
- MapViewにonMapClick propを追加
- → このタスク内で対応（LocationForm実装の前提条件）

### Decision Required項目

#### D-1: カテゴリ選択UIにおけるCategories API不在
- (a) このタスク内でCategoryViewSet + URL登録を最小限実装【推奨】
- (b) ハードコード暫定（CLAUDE.md § 3 暫定対応禁止に抵触）
- (c) 省略（タスク要件違反）

#### D-2: フォームモード管理
- (a) DashboardPageにuseStateでモード管理【推奨】
- (b) mapStoreに追加（SPEC § 2.2.1 グローバル状態最小限に抵触）
- (c) DetailPanel拡張（再利用性低下）

#### D-3: 地図クリックUX
- (a) 直接フォームを開く
- (b) 座標取得モード
- (c) 両方対応【推奨】

### 判断不要で進めた項目
| 項目 | 選択 | 理由 |
|------|------|------|
| React Hook Form使用 | 必須 | SPEC.md明記、package.json導入済み |
| LocationForm配置 | features/locations/components/ | TASK.md成果物に明記 |
| useCreateLocation/useUpdateLocation | 既存使用 | 既にuseLocations.ts内に実装済み |
| バリデーション定数 | constants/に追加 | CLAUDE.md § 7, § 8 準拠 |
| テスト配置 | components/__tests__/ | SPEC.md § 9.3 準拠 |

### ユーザー判断（2026-02-27）
- **D-1**: (a) このタスク内でCategory API最小限実装 → 採用
- **D-2**: (a) DashboardPageにuseStateでモード管理 → 採用
- **D-3**: (c) 両方対応（フォーム閉→新規作成、フォーム開→座標更新） → 採用

### Info（実装時の注意事項）
- フォーム内部LatLng → 送信時GeoJSON変換
- 編集モードではdefaultValuesにLocation変換値を設定
- タグ入力: テキスト入力+Enter/カンマ追加、外部ライブラリ不要
- MapClick: マーカークリックとは別イベント（干渉なし）

## コードレビュー（2026-02-28）

### 実装レビュー（code-reviewer）
**総合評価:** Blocker付き承認

#### 良い点
- CLAUDE.md §7（マジックナンバー禁止）、§8（エラーメッセージ一元管理）に完全準拠
- JSDoc/コメント日本語統一
- React Hook Form + TanStack Queryパターンが既存と一貫
- アクセシビリティ（aria-label, aria-invalid等）が適切
- タグ入力UIの丁寧な実装（Enter/カンマ/Backspace/blur対応）

#### 指摘事項
| 重要度 | 内容 | 場所 | 対応方針 |
|--------|------|------|----------|
| Blocker | MapView.tsx: onMapClickがundefinedになった際にハンドラが解除されない | MapView.tsx:149-154 | no-opハンドラで上書きするよう修正 |
| Blocker | MapView.test.tsx: モックにsetMapClickHandlerが欠落 | MapView.test.tsx:24 | モックにsetMapClickHandler追加 |
| Should Fix | DashboardPage.tsx: setTimeout 3000がマジックナンバー | DashboardPage.tsx:239 | DASHBOARD_CONSTANTS.TOAST_DISPLAY_MS定数化 |
| Should Fix | TagInput: Props型のinterface定義・JSDoc不足 | LocationForm.tsx:91 | TagInputProps interfaceを定義 |
| Should Fix | category_id parseIntの安全性（NaN対策） | LocationForm.tsx:245 | Number.isNaNチェック追加 |
| Should Fix | status型キャストの安全性 | LocationForm.tsx:247 | 型キャスト順序修正 |
| Nice to Have | components/index.tsからLocationFormエクスポート漏れ | index.ts | 追加 |
| Nice to Have | useCategories/categoryApi/CategoryViewSetのテスト不在 | - | 次回タスクで検討 |

### レビュー結果への対応
#### 即時対応（2026-02-28）
- Blocker-1: MapView.tsx onMapClickハンドラ解除 → `onMapClick ?? (() => {})` で解除対応
- Blocker-2: MapView.test.tsx モック追加 → `setMapClickHandler: vi.fn()` 追加
- Should Fix-1: DashboardPage.tsx マジックナンバー → `TOAST_DISPLAY_MS: 3000` 定数化
- Should Fix-2: TagInput Props → `TagInputProps` interface定義 + JSDoc追加
- Should Fix-3: category_id → `Number.isNaN` チェック追加
- Should Fix-4: status → 型キャスト修正 `(data.status || null) as LocationStatus | null`
- Nice to Have: components/index.tsからLocationFormエクスポート追加

#### 次回タスクで検討
- useCategories, categoryApi, CategoryViewSetのテスト追加

### CI lint/型エラー修正（2026-02-28）

CIで落ちていた既存のlint/型エラーを修正。

#### 修正内容
| 問題 | ファイル | 修正 |
|------|---------|------|
| Prettier: 65ファイルのフォーマット不整合 | frontend/src/全般 | `prettier --write src/` で一括修正 |
| TypeScript: react-resizable-panels v4.6.5 API変更 | PanelLayout.tsx | `PanelGroup`→`Group`, `PanelResizeHandle`→`Separator`, `direction`→`orientation` |
| TypeScript: Category型にparentId欠落 | LocationListPanel.test.tsx | テストモックに`parentId: null`追加 |
| TypeScript: LocationFilters型不整合 | useLocations.ts:60 | `as Record<string, unknown>`で型安全にキャスト |

#### CI検証結果
- ESLint: パス（0 warnings）
- Prettier: パス
- TypeScript `tsc --noEmit`: パス（0 errors）
- Frontend テスト: 17 files, 153 passed
- Backend テスト: 213 passed
- Black/flake8/isort: パス
