# タスクログ: #D013 GOOGLE_MAPS_MIGRATION.md作成

## 基本情報
- **タスク名:** GOOGLE_MAPS_MIGRATION.md作成
- **実行日:** 2025-01-25
- **ブランチ:** docs/maps-migration
- **PR:** (作成予定)

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D013
./scripts/claude/run_task.sh D013
```

### 2. SPEC.md確認
- § 5.4 地図: Leaflet → Google Maps
- `lib/maps/interface.ts`での抽象化パターン
- MapServiceインターフェースの設計

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `docs/setup/GOOGLE_MAPS_MIGRATION.md` | Google Maps移行ガイド |

### 4. ドキュメント構成

1. **概要**
   - アーキテクチャ図（MapServiceインターフェース経由）
   - 機能比較: Leaflet vs Google Maps
   - コスト試算（月額$200無料枠）
   - 移行のタイミング

2. **前提条件**
   - Google Cloud Platformアカウント
   - 請求先アカウント設定
   - MapServiceインターフェースでの抽象化

3. **移行手順**
   - Google Cloud Platform設定
   - APIキー作成と制限
   - 予算アラート設定
   - 環境変数設定
   - GoogleMapsService実装（コード例付き）
   - ファクトリー更新
   - SDK読み込み設定
   - 型定義インストール

4. **ロールバック手順**
   - 環境変数変更のみで即座に戻せる

5. **コスト管理**
   - 使用量モニタリング
   - コスト削減のベストプラクティス
   - 予算超過時の対応

6. **トラブルシューティング（5項目）**
   - 地図が表示されない
   - Places APIエラー
   - 請求関連のエラー
   - 本番環境でのみ動作しない
   - TypeScriptの型エラー

7. **移行チェックリスト**

---

## 成果物
- `docs/setup/GOOGLE_MAPS_MIGRATION.md`

## 次のステップ
- 場所検索機能が必要になった時に実行
- Places APIを活用したい時に実行
