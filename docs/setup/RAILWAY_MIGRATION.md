# Railway 移行ガイド（Render → Railway）

**最終更新:** 2025-01-25

このドキュメントでは、Render無料枠からRailway（$5/月）へ移行する手順を説明します。

---

## 1. 概要

### 移行後のアーキテクチャ

```
┌─────────────┐         ┌──────────────────┐
│   Vercel    │         │    Railway       │
│(Frontend)   │◄────────┤  Hobby Plan      │
│             │  HTTPS  │  ($5/月)         │
│  - 静的配信 │         │  - Django        │
│  - CDN      │         │  - Gunicorn      │
│  - 無料     │         │  - WhiteNoise    │
│             │         │  - 常時稼働      │
└─────────────┘         └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Railway PostgreSQL│
                        │ - PostGIS有効    │
                        │ - プラン含む     │
                        │ - 自動バックアップ│
                        └──────────────────┘
```

### コスト比較

| 項目 | Render無料枠 | Railway |
|------|--------------|---------|
| 月額 | $0 | $5 |
| バックエンド | 15分スリープ | 常時稼働 |
| データベース | 90日期限 | 永続的 |
| パフォーマンス | 制限あり | 本番レベル |
| コスト上限 | - | $5（自動停止） |

### 移行のタイミング

以下のいずれかに該当する場合、移行を検討してください:

- Render無料枠の制約（スリープ、90日DB期限）が問題になった
- 本番運用を開始する
- ユーザー数が増えてパフォーマンスが必要
- 安定した稼働が求められる

---

## 2. 前提条件

- [Railway](https://railway.app/) アカウント作成済み
- GitHubリポジトリが接続済み
- 現在のRender環境が稼働中
- ローカルに `psql` コマンドがインストール済み

---

## 3. 移行手順

### 3.1 Renderデータベースのバックアップ

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. PostgreSQLデータベースを選択
3. **Connect** タブで **External Database URL** をコピー

```bash
# バックアップ取得
pg_dump "<render-external-database-url>" > backup_$(date +%Y%m%d).sql

# バックアップファイルを確認
ls -la backup_*.sql
```

### 3.2 Railwayプロジェクトの作成

1. [Railway Dashboard](https://railway.app/dashboard) にログイン
2. **New Project** → **Deploy from GitHub repo** を選択
3. `personal-mapping-site` リポジトリを選択
4. **Add variables** で以下の変数を設定しないまま、一旦作成

### 3.3 PostgreSQLの追加

1. プロジェクト内で **New** → **Database** → **Add PostgreSQL** を選択
2. PostgreSQLサービスが作成される
3. **Connect** タブで接続情報を確認

#### PostGIS拡張の有効化

1. PostgreSQLサービスの **Connect** タブを開く
2. **Public Networking** を有効化（一時的）
3. ローカルから接続:

```bash
psql "<railway-public-database-url>"
```

4. PostGIS拡張を有効化:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

5. **Public Networking** を無効化（セキュリティのため）

### 3.4 バックエンドサービスの設定

1. バックエンドサービスを選択
2. **Settings** タブで以下を設定:

| 項目 | 値 |
|------|-----|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements/production.txt` |
| Start Command | `gunicorn config.wsgi:application` |

3. **Variables** タブで環境変数を設定:

| Key | Value |
|-----|-------|
| `DEBUG` | `False` |
| `SECRET_KEY` | `<新しいランダム文字列を生成>` |
| `ALLOWED_HOSTS` | `<railway-service-name>.railway.app` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `CORS_ALLOWED_ORIGINS` | `https://personal-mapping-site.vercel.app` |
| `PYTHON_VERSION` | `3.11.9` |

**注意:** `DATABASE_URL` はRailwayの変数参照構文を使用します。

### 3.5 railway.tomlの追加（オプション）

プロジェクトルートに `railway.toml` を追加すると、設定を自動化できます:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "gunicorn config.wsgi:application"
healthcheckPath = "/api/v1/health/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 3.6 データの復元

1. PostgreSQLサービスの **Public Networking** を一時的に有効化
2. バックアップを復元:

```bash
psql "<railway-public-database-url>" < backup_YYYYMMDD.sql
```

3. **Public Networking** を無効化

### 3.7 マイグレーションの実行

Railwayのシェルまたはローカルから実行:

```bash
# Railway Shellで実行
cd backend
python manage.py migrate
python manage.py createsuperuser  # 必要に応じて
```

### 3.8 デプロイの確認

1. バックエンドサービスの **Deployments** タブでデプロイ状況を確認
2. ヘルスチェック:

```bash
curl https://<your-service>.railway.app/api/v1/health/
```

### 3.9 Vercel環境変数の更新

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクト → **Settings** → **Environment Variables**
3. `VITE_API_BASE_URL` を更新:

```
https://<your-railway-service>.railway.app/api/v1
```

4. **Redeploy** を実行

### 3.10 動作確認

1. フロントエンドにアクセス
2. ログイン/登録が動作することを確認
3. データが正しく表示されることを確認
4. 地図機能が動作することを確認

---

## 4. ロールバック手順

問題が発生した場合、すぐにRenderに戻すことができます。

### 4.1 Vercel環境変数を戻す

```
VITE_API_BASE_URL=https://personal-mapping-api.onrender.com/api/v1
```

### 4.2 Vercelを再デプロイ

Vercel Dashboardから **Redeploy** を実行

### 4.3 Renderが稼働中であることを確認

Render Dashboardでバックエンドサービスがアクティブであることを確認

**推定ダウンタイム:** ロールバックは5分以内で完了

---

## 5. コスト管理

### 5.1 予算上限の設定

Railwayでは月額上限を設定できます:

1. **Project Settings** → **Usage Limits**
2. **Hard limit** を `$5` に設定
3. **Soft limit** を `$4` に設定（80%でメール通知）

### 5.2 コストアラート

| 設定 | アクション |
|------|----------|
| $4到達時（80%） | メール通知 |
| $5上限 | 自動停止 |

**重要:** $5上限設定により、予期せぬ課金は発生しません。

---

## 6. トラブルシューティング

### Q1: デプロイが失敗する

**症状:** ビルドまたは起動に失敗

**解決策:**
1. Railway Dashboard → **Deployments** → **View Logs** を確認
2. よくある原因:
   - `requirements/production.txt` のパッケージが不足
   - 環境変数が未設定
   - Pythonバージョンの不一致

```bash
# ログで確認すべき項目
- ModuleNotFoundError: パッケージ不足
- ImproperlyConfigured: 環境変数未設定
```

### Q2: データベース接続エラー

**症状:** `connection refused` または `database does not exist`

**解決策:**
1. `DATABASE_URL` が正しく設定されているか確認
2. Railway変数参照構文 `${{Postgres.DATABASE_URL}}` を使用
3. PostgreSQLサービスが起動しているか確認

### Q3: PostGIS関連のエラー

**症状:** `type "geometry" does not exist`

**解決策:**
1. PostgreSQLに接続してPostGIS拡張を確認:

```sql
SELECT PostGIS_Version();
```

2. 拡張がなければ作成:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Q4: CORSエラー

**症状:** フロントエンドからAPIにアクセスできない

**解決策:**
1. `CORS_ALLOWED_ORIGINS` にVercelのURLが含まれているか確認
2. プロトコル（https://）を含めて正確に設定:

```python
# 正しい例
CORS_ALLOWED_ORIGINS=https://personal-mapping-site.vercel.app

# 間違い例
CORS_ALLOWED_ORIGINS=personal-mapping-site.vercel.app
```

### Q5: 移行後にデータが表示されない

**症状:** バックアップからの復元後、データが見えない

**解決策:**
1. マイグレーションが適用されているか確認:

```bash
python manage.py showmigrations
```

2. データベースにデータがあるか確認:

```sql
SELECT COUNT(*) FROM locations_location;
```

3. ユーザーIDが一致しているか確認（バックアップに含まれている必要あり）

---

## 7. 移行後のメンテナンス

### 7.1 自動デプロイ

`main` ブランチへのプッシュで自動デプロイされます。

### 7.2 ログ確認

Railway Dashboard → サービス → **Deployments** → **View Logs**

### 7.3 データベースバックアップ

Railwayは自動バックアップを提供しますが、定期的な手動バックアップも推奨:

```bash
# 週次バックアップスクリプト（ローカル実行）
pg_dump "<railway-database-url>" > backup_$(date +%Y%m%d).sql
```

---

## 8. 移行チェックリスト

移行完了時に以下を確認:

- [ ] Renderデータベースのバックアップ取得
- [ ] Railwayプロジェクト作成
- [ ] PostgreSQL追加・PostGIS有効化
- [ ] 環境変数設定
- [ ] データ復元
- [ ] マイグレーション実行
- [ ] バックエンドヘルスチェック成功
- [ ] Vercel環境変数更新
- [ ] フロントエンド動作確認
- [ ] ログイン/登録動作確認
- [ ] 地図機能動作確認
- [ ] 予算上限設定（$5）

---

## 関連ドキュメント

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - ローカル開発環境
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Renderデプロイガイド
- [SPEC.md](../../SPEC.md) § 6.3 - 本番環境仕様
- [SPEC.md](../../SPEC.md) § 6.5 - 移行戦略
