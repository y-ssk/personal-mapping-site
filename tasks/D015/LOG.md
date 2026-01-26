# タスクログ: #D015 backup_database.sh作成

## 基本情報
- **タスク名:** backup_database.sh作成
- **実行日:** 2025-01-26
- **ブランチ:** scripts/db-backup
- **PR:** (作成予定)

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D015
./scripts/claude/run_task.sh D015
```

### 2. 参照ドキュメント確認
- docs/setup/RAILWAY_MIGRATION.md - バックアップ手順
- docs/setup/RENDER_DEPLOYMENT.md - pg_dumpコマンド形式
- scripts/deploy/migrate_to_railway.sh - スクリプトパターン参考

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `scripts/deploy/backup_database.sh` | データベースバックアップスクリプト |

### 4. スクリプト機能

#### 実行内容
1. **前提条件確認** - pg_dump、環境変数
2. **バックアップ** - pg_dumpでデータベースダンプ
3. **圧縮** - オプションでgzip圧縮
4. **古いバックアップ削除** - 保持日数に基づく自動削除

#### オプション
- `--help` - ヘルプ表示
- `--dry-run` - 実行内容の確認のみ
- `--compress` - gzip圧縮（.sql.gz）
- `--output FILE` - 出力ファイル名指定
- `--backup-dir DIR` - バックアップディレクトリ指定
- `--retention DAYS` - 保持日数（デフォルト30日、0で削除無効）
- `--cleanup-only` - 古いファイル削除のみ

#### 環境変数
- `DATABASE_URL` - データベース接続URL（必須）
- `RENDER_DATABASE_URL` - Renderデータベース（代替）
- `RAILWAY_DATABASE_URL` - Railwayデータベース（代替）

#### 特徴
- カラー出力による視認性向上
- migrate_to_railway.shと同じパターン
- バックアップ一覧表示機能
- 複数のデータベースURL対応

## Test Plan確認結果

### 確認項目
- [x] `--help` が動作する
- [x] `--dry-run` が動作する
- [x] 前提条件チェックが機能する（pg_dumpなし時にエラー）
- [x] docs/setup/RAILWAY_MIGRATION.mdのpg_dumpコマンドと整合
- [x] docs/setup/RENDER_DEPLOYMENT.mdのバックアップ手順と整合
- [x] migrate_to_railway.shと同じパターン使用

## 成果物
- `scripts/deploy/backup_database.sh`

## 次のステップ
- 本番環境デプロイ前にバックアップ実行
- 定期的なバックアップ運用の検討
