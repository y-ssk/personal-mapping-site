# タスクログ: #D012 RAILWAY_MIGRATION.md作成

## 基本情報
- **タスク名:** RAILWAY_MIGRATION.md作成
- **実行日:** 2025-01-25
- **ブランチ:** docs/railway-migration
- **PR:** https://github.com/y-ssk/personal-mapping-site/pull/7

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D012
./scripts/claude/run_task.sh D012
```

### 2. SPEC.md確認
- § 6.3 本番環境（Railway - $5/月）
- § 6.5 Render → Railway 移行戦略
- § 10.3 Railwayデプロイ（本番）

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `docs/setup/RAILWAY_MIGRATION.md` | Railway移行ガイド |

### 4. ドキュメント構成

1. **概要**
   - アーキテクチャ図（Vercel + Railway Hobby Plan + PostgreSQL）
   - コスト比較: Render無料枠 vs Railway $5/月
   - 移行のタイミング

2. **前提条件**
   - Railway, Vercelアカウント
   - psqlコマンド

3. **移行手順**
   - Renderデータベースのバックアップ
   - Railwayプロジェクト作成
   - PostgreSQL追加・PostGIS有効化
   - バックエンドサービス設定
   - railway.toml追加（オプション）
   - データ復元
   - マイグレーション実行
   - デプロイ確認
   - Vercel環境変数更新
   - 動作確認

4. **ロールバック手順**
   - Vercel環境変数を戻す
   - Vercel再デプロイ
   - 推定ダウンタイム: 5分以内

5. **コスト管理**
   - $5上限設定
   - $4到達時にメール通知（80%）
   - $5上限で自動停止

6. **トラブルシューティング（5項目）**
   - デプロイ失敗
   - データベース接続エラー
   - PostGIS関連エラー
   - CORSエラー
   - 移行後にデータが表示されない

7. **移行後のメンテナンス**
   - 自動デプロイ
   - ログ確認
   - データベースバックアップ

8. **移行チェックリスト**

---

## 成果物
- `docs/setup/RAILWAY_MIGRATION.md`

## 次のステップ
- Render無料枠の制約が問題になった時に実行
