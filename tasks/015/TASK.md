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
