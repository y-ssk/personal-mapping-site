# Render デプロイガイド（MVP本番環境）

**最終更新:** 2025-01-25

このドキュメントでは、Personal Mapping SiteをRender（無料枠）にデプロイする手順を説明します。

---

## 1. 概要

### アーキテクチャ

```
┌─────────────┐         ┌──────────────────┐
│   Vercel    │         │  Render Free     │
│(Frontend)   │◄────────┤  Web Service     │
│             │  HTTPS  │  - Django        │
│  - 静的配信 │         │  - Gunicorn      │
│  - CDN      │         │  - WhiteNoise    │
│  - 無料     │         │  - 15分スリープ  │
└─────────────┘         └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Render PostgreSQL│
                        │ - PostGIS有効    │
                        │ - 1GB            │
                        │ - 90日期限       │
                        └──────────────────┘
```

### コスト

| サービス | プラン | 月額 |
|----------|--------|------|
| Vercel | Hobby | $0 |
| Render Web Service | Free | $0 |
| Render PostgreSQL | Free | $0 |
| **合計** | | **$0** |

### 制約

| 項目 | 制約 |
|------|------|
| バックエンド | 15分非アクティブでスリープ（起動に約30秒） |
| データベース | 90日後に期限切れ（再作成可能） |
| 用途 | ポートフォリオ、デモ、MVP検証 |

---

## 2. 前提条件

- GitHubリポジトリにコードがプッシュ済み
- [Render](https://render.com/) アカウント作成済み
- [Vercel](https://vercel.com/) アカウント作成済み

---

## 3. バックエンドのデプロイ（Render）

### 3.1 PostgreSQL データベースの作成

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. **New +** → **PostgreSQL** を選択
3. 設定:
   - **Name:** `personal-mapping-db`
   - **Region:** `Singapore (Southeast Asia)` または最寄りのリージョン
   - **PostgreSQL Version:** `15`
   - **Instance Type:** `Free`
4. **Create Database** をクリック

5. **PostGIS拡張の有効化:**
   - データベースの **Connect** タブを開く
   - **PSQL Command** をコピーしてローカルで実行:
   ```bash
   psql <connection-string>
   ```
   - PostGIS拡張を有効化:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

6. **Internal Database URL** をメモ（後で使用）

### 3.2 Web Serviceの作成

1. **New +** → **Web Service** を選択
2. **Build and deploy from a Git repository** を選択
3. GitHubリポジトリを接続し、`personal-mapping-site` を選択
4. 設定:
   - **Name:** `personal-mapping-api`
   - **Region:** データベースと同じリージョン
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements/production.txt`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance Type:** `Free`

5. **Environment Variables** を設定:

| Key | Value |
|-----|-------|
| `DEBUG` | `False` |
| `SECRET_KEY` | `<ランダムな文字列を生成>` |
| `ALLOWED_HOSTS` | `personal-mapping-api.onrender.com` |
| `DATABASE_URL` | `<PostgreSQLのInternal Database URL>` |
| `CORS_ALLOWED_ORIGINS` | `https://personal-mapping-site.vercel.app` |
| `PYTHON_VERSION` | `3.11.9` |

6. **Create Web Service** をクリック

### 3.3 マイグレーションの実行

初回デプロイ後、Render ShellまたはSSHでマイグレーションを実行:

```bash
# Render Dashboard → Web Service → Shell
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata categories  # カテゴリマスタ
```

---

## 4. フロントエンドのデプロイ（Vercel）

### 4.1 プロジェクトのインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New...** → **Project** を選択
3. GitHubリポジトリを接続し、`personal-mapping-site` を選択
4. 設定:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Environment Variables** を設定:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://personal-mapping-api.onrender.com/api/v1` |

6. **Deploy** をクリック

### 4.2 カスタムドメイン（オプション）

1. **Project Settings** → **Domains**
2. カスタムドメインを追加
3. DNSレコードを設定

---

## 5. 動作確認

### 5.1 バックエンドの確認

```bash
# ヘルスチェック
curl https://personal-mapping-api.onrender.com/api/v1/health/

# API Docs
# ブラウザで https://personal-mapping-api.onrender.com/api/docs/ にアクセス
```

### 5.2 フロントエンドの確認

- ブラウザで `https://personal-mapping-site.vercel.app` にアクセス
- ログイン/登録が動作することを確認

---

## 6. CI/CD設定

### 6.1 自動デプロイ

**Render:**
- `main` ブランチへのプッシュで自動デプロイ
- `backend/` 配下の変更時のみトリガー

**Vercel:**
- `main` ブランチへのプッシュで自動デプロイ
- `frontend/` 配下の変更時のみトリガー

### 6.2 プレビューデプロイ

**Vercel:**
- PRごとにプレビューURLが自動生成

---

## 7. トラブルシューティング

### Q1: バックエンドが起動しない

**症状:** デプロイ失敗またはヘルスチェック失敗

**解決策:**
1. Render Dashboard → Logs を確認
2. 環境変数が正しく設定されているか確認
3. `requirements/production.txt` の依存関係を確認

```bash
# よくある原因
- DATABASE_URLが未設定または不正
- SECRET_KEYが未設定
- GDALライブラリがない（PostGIS用）
```

### Q2: データベース接続エラー

**症状:** `connection refused` または `database does not exist`

**解決策:**
1. PostgreSQLが起動しているか確認
2. **Internal Database URL** を使用しているか確認（External URLではない）
3. PostGIS拡張が有効か確認

### Q3: CORSエラー

**症状:** フロントエンドからAPIにアクセスできない

**解決策:**
1. `CORS_ALLOWED_ORIGINS` にVercelのURLが含まれているか確認
2. プロトコル（https://）を含めて正確に設定

```python
# 正しい例
CORS_ALLOWED_ORIGINS=https://personal-mapping-site.vercel.app

# 間違い例
CORS_ALLOWED_ORIGINS=personal-mapping-site.vercel.app  # https://がない
```

### Q4: スリープ後の起動が遅い

**症状:** 15分以上アクセスがないと、次回アクセス時に30秒程度かかる

**解決策:**
- これはRender無料枠の仕様です
- 回避策: 外部からの定期的なヘルスチェック（UptimeRobot等）
- 恒久対策: Railwayへの移行（$5/月）

### Q5: データベースの90日期限

**症状:** 90日後にデータベースが削除される

**解決策:**
1. 期限前にバックアップを取得
2. 新しいデータベースを作成
3. バックアップからリストア
4. Web Serviceの`DATABASE_URL`を更新

```bash
# バックアップ
pg_dump <old-database-url> > backup.sql

# リストア
psql <new-database-url> < backup.sql
```

---

## 8. 本番移行（Railway）

Render無料枠の制約が問題になった場合、Railwayへの移行を検討してください。

詳細は [RAILWAY_MIGRATION.md](./RAILWAY_MIGRATION.md) を参照。

**移行のタイミング:**
- ユーザー数が増えてスリープが問題になった
- 90日ごとのDB再作成が煩わしい
- 本番レベルのパフォーマンスが必要

---

## 付録: render.yaml（Blueprint）

自動デプロイ用の設定ファイル:

```yaml
# render.yaml
services:
  - type: web
    name: personal-mapping-api
    env: python
    region: singapore
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements/production.txt
    startCommand: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
    envVars:
      - key: DEBUG
        value: "False"
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOWED_HOSTS
        value: personal-mapping-api.onrender.com
      - key: DATABASE_URL
        fromDatabase:
          name: personal-mapping-db
          property: connectionString
      - key: PYTHON_VERSION
        value: "3.11.9"

databases:
  - name: personal-mapping-db
    plan: free
    region: singapore
    postgresMajorVersion: 15
```

---

## 関連ドキュメント

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - ローカル開発環境
- [RAILWAY_MIGRATION.md](./RAILWAY_MIGRATION.md) - Railway移行ガイド
- [SPEC.md](../../SPEC.md) § 6.2 - MVP本番環境仕様
