# タスク #014-B: ### ⬜ #014-B 地図-リスト連動 + レスポンシブ

## 概要
### ⬜ #014-B 地図-リスト連動 + レスポンシブ

## SPEC参照
'なし'

## タスク情報
### ⬜ #014-B 地図-リスト連動 + レスポンシブ
- **優先度:** 最高
- **見積:** 4h
- **依存:** #014-A
- **ブランチ:** feature/map-list-sync
- **チェックリスト:**
  - [ ] LocationListPanel作成（縦並びリスト表示）
  - [ ] マーカークリック → リストスクロール連動
  - [ ] リストホバー → マーカーハイライト
  - [ ] レスポンシブ対応（モバイル: 縦並び切り替え）
  - [ ] DetailPanel オーバーレイ表示
  - [ ] テスト作成
- **成果物:**
  - `frontend/src/features/locations/components/LocationListPanel.tsx`
  - `frontend/src/components/PanelLayout/DetailPanel.tsx`

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
