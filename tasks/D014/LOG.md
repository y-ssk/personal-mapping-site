# タスクログ: #D014 migrate_to_railway.sh作成

## 基本情報
- **タスク名:** migrate_to_railway.sh作成
- **実行日:** 2025-01-25
- **ブランチ:** scripts/railway-migration
- **PR:** (作成予定)

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D014
./scripts/claude/run_task.sh D014
```

### 2. 参照ドキュメント確認
- docs/setup/RAILWAY_MIGRATION.md - 移行手順の詳細

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `scripts/deploy/migrate_to_railway.sh` | Railway移行スクリプト |

### 4. スクリプト機能

#### 実行ステップ
1. **前提条件確認** - psql, curl, 環境変数
2. **バックアップ** - Renderデータベースのpg_dump
3. **PostGIS有効化** - Railway PostgreSQLでCREATE EXTENSION
4. **データ復元** - バックアップからの復元
5. **マイグレーション** - 手動確認（Railway Shell経由）
6. **ヘルスチェック** - APIエンドポイント確認

#### オプション
- `--help` - ヘルプ表示
- `--dry-run` - 実行内容の確認のみ
- `--skip-backup` - バックアップスキップ
- `--skip-restore` - 復元スキップ
- `--skip-health-check` - ヘルスチェックスキップ
- `--backup-file FILE` - バックアップファイル指定
- `--backup-dir DIR` - バックアップディレクトリ指定

#### 環境変数
- `RENDER_DATABASE_URL` - Render外部データベースURL
- `RAILWAY_DATABASE_URL` - Railway公開データベースURL
- `RAILWAY_API_URL` - RailwayバックエンドAPIのURL

#### 特徴
- カラー出力によるログの視認性向上
- 各ステップでの確認プロンプト
- 復元前の確認ダイアログ
- ヘルスチェックのリトライ機能（5回）
- 完了後の次のステップ案内

---

## 成果物
- `scripts/deploy/migrate_to_railway.sh`

## 次のステップ
- Render無料枠の制約が問題になった時に実行
- docs/setup/RAILWAY_MIGRATION.mdと併用
