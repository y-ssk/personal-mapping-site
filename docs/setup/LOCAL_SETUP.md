# ローカル開発環境セットアップガイド

**最終更新:** 2026-02-01

このドキュメントでは、Personal Mapping Siteのローカル開発環境を構築する手順を説明します。

---

## 1. 前提条件

以下のソフトウェアがインストールされている必要があります。

| ソフトウェア | バージョン | 確認コマンド |
|-------------|-----------|-------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Node.js | 20.x | `node --version` |
| Python | 3.11+ | `python3 --version` |

### WSL2ユーザー向け

Windows環境の場合、WSL2 + Docker Desktop を推奨します。

```bash
# WSL2内で実行
wsl --version
```

---

## 2. クイックスタート（5分）

```bash
# 1. リポジトリをクローン
git clone https://github.com/y-ssk/personal-mapping-site.git
cd personal-mapping-site

# 2. 環境変数ファイルを作成
cp .env.example .env

# 3. Docker Composeで起動
docker compose up -d

# 4. データベースマイグレーション
docker compose exec backend python manage.py migrate

# 5. 開発サーバーにアクセス
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/api/docs/
```

---

## 3. 詳細手順

### 3.1 リポジトリのクローン

```bash
git clone https://github.com/y-ssk/personal-mapping-site.git
cd personal-mapping-site
```

### 3.2 環境変数の設定

```bash
# テンプレートをコピー
cp .env.example .env
```

`.env` ファイルを編集:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-for-development
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/personal_mapping

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# OAuth (開発時は空でも可)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3.3 Docker Composeで起動

```bash
# バックグラウンドで起動
docker compose up -d

# ログを確認
docker compose logs -f

# 特定サービスのログ
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### 3.4 データベースのセットアップ

```bash
# マイグレーション実行
docker compose exec backend python manage.py migrate

# スーパーユーザー作成（管理画面用）
docker compose exec backend python manage.py createsuperuser

# カテゴリマスタデータ投入（後で実装）
docker compose exec backend python manage.py loaddata categories
```

### 3.5 開発サーバーへのアクセス

| サービス | URL | 説明 |
|----------|-----|------|
| Frontend | http://localhost:5173 | Vite開発サーバー（ホットリロード） |
| Backend | http://localhost:8000 | Django開発サーバー |
| API Docs | http://localhost:8000/api/docs/ | Swagger UI |
| Admin | http://localhost:8000/admin/ | Django管理画面 |

---

## 4. 開発ワークフロー

### 4.1 コードの変更

Dockerボリュームマウントにより、コードの変更は自動的に反映されます。

- **Frontend:** Viteのホットリロードで即座に反映
- **Backend:** Djangoの開発サーバーが自動リロード

### 4.2 依存パッケージの追加

**Backend (Python):**
```bash
# requirements/base.txt を編集後
docker compose exec backend pip install -r requirements/local.txt

# または再ビルド
docker compose build backend
docker compose up -d backend
```

**Frontend (Node.js):**
```bash
# package.json を編集後
docker compose exec frontend npm install

# または再ビルド
docker compose build frontend
docker compose up -d frontend
```

### 4.3 データベースマイグレーション

```bash
# マイグレーションファイル作成
docker compose exec backend python manage.py makemigrations

# マイグレーション実行
docker compose exec backend python manage.py migrate
```

### 4.4 テスト実行

```bash
# Backend テスト
docker compose exec backend pytest

# カバレッジ付き
docker compose exec backend pytest --cov=apps --cov-report=term

# Frontend テスト
docker compose exec frontend npm test
```

### 4.5 Lint/Format

```bash
# Backend
docker compose exec backend black .
docker compose exec backend flake8 .
docker compose exec backend isort .

# Frontend
docker compose exec frontend npm run lint
docker compose exec frontend npm run format
```

---

## 5. よくある問題と解決方法

### Q1: Docker Composeが起動しない

**症状:** `docker compose up` でエラー

**解決策:**
```bash
# Docker Desktopが起動しているか確認
docker info

# 古いコンテナを削除
docker compose down -v
docker compose up -d --build
```

### Q2: データベース接続エラー

**症状:** `connection refused` や `database does not exist`

**解決策:**
```bash
# DBコンテナの状態確認
docker compose ps db
docker compose logs db

# DBコンテナを再起動
docker compose restart db

# 接続テスト
docker compose exec db psql -U postgres -d personal_mapping -c "SELECT 1"
```

### Q3: PostGIS拡張が有効でない

**症状:** `type "geometry" does not exist`

**解決策:**
```bash
# PostGIS拡張を手動で有効化
docker compose exec db psql -U postgres -d personal_mapping -c "CREATE EXTENSION IF NOT EXISTS postgis"
```

### Q4: フロントエンドのホットリロードが効かない

**症状:** ファイル変更が反映されない

**解決策:**
```bash
# WSL2の場合、ファイル監視の設定を確認
# frontend/vite.config.ts に追加:
# server: { watch: { usePolling: true } }

# コンテナ再起動
docker compose restart frontend
```

### Q5: ポートが既に使用されている

**症状:** `port is already allocated`

**解決策:**
```bash
# 使用中のポートを確認
lsof -i :5173  # Frontend
lsof -i :8000  # Backend

# 該当プロセスを終了するか、docker-compose.ymlでポートを変更
```

**補足:** データベース（PostgreSQL）はコンテナ間通信のみ（`expose`）のため、ホストの5432ポートとは競合しません。

### Q6: 権限エラー（Permission denied）

**症状:** ファイル作成/編集時に権限エラー

**解決策:**
```bash
# ファイル所有者を確認
ls -la

# 権限を修正
sudo chown -R $USER:$USER .
```

### Q7: node_modulesが消える・依存関係エラー

**症状:** `npm install` 後にモジュールが見つからない

**解決策:**
```bash
# docker-compose.ymlでnode_modulesをボリュームマウント対象外にしている
# コンテナ内でインストールし直す
docker compose exec frontend npm install

# それでも解決しない場合はボリュームを再作成
docker compose down
docker volume rm personal-mapping-site_node_modules 2>/dev/null || true
docker compose up -d --build frontend
```

### Q8: マイグレーションエラー

**症状:** `relation does not exist` または `column does not exist`

**解決策:**
```bash
# マイグレーションの状態を確認
docker compose exec backend python manage.py showmigrations

# マイグレーションをリセット（開発環境のみ）
docker compose exec backend python manage.py migrate --fake-initial

# それでも解決しない場合はDBを再作成
docker compose down -v
docker compose up -d
docker compose exec backend python manage.py migrate
```

### Q9: 環境変数が反映されない

**症状:** 設定を変更したのに反映されない

**解決策:**
```bash
# docker-compose.ymlで環境変数を直接設定している場合
# .envファイルは参照されません
# docker-compose.ymlの environment セクションを編集

# コンテナを再起動して反映
docker compose down
docker compose up -d
```

**補足:** 現在のdocker-compose.ymlは環境変数を直接設定しています。`.env`ファイルはテンプレートとして参照用です。

### Q10: WSL2でファイル変更が反映されない

**症状:** Windowsホストでファイルを編集しても反映されない

**解決策:**
```bash
# WSL2内でファイルを編集することを推奨
# /mnt/c/... ではなく、WSL2のファイルシステムで作業

# WSL2内にリポジトリをクローン
cd ~
git clone https://github.com/y-ssk/personal-mapping-site.git

# ViteのポーリングモードはデフォルトでON
# 反映が遅い場合はコンテナを再起動
docker compose restart frontend
```

---

## 6. サービスの停止

```bash
# コンテナを停止（データは保持）
docker compose stop

# コンテナを削除（データは保持）
docker compose down

# コンテナとボリュームを削除（データも削除）
docker compose down -v
```

---

## 7. 次のステップ

1. [CLAUDE.md](../../CLAUDE.md) - 開発ガイドを確認
2. [WORKFLOW.md](../WORKFLOW.md) - 開発ワークフローを確認
3. [docs/TASKS.md](../TASKS.md) - タスク一覧を確認
4. [SPEC.md](../../SPEC.md) - 技術仕様を確認

---

## 付録: Docker Compose構成

```
┌─────────────────────────────────────────┐
│      Docker Compose (ローカル)          │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │Frontend  │  │Backend   │  │  DB   │ │
│  │Vite:5173 │◄─┤Django:   │◄─┤PostGIS│ │
│  │(ホット   │  │8000      │  │:5432  │ │
│  │リロード) │  │(ホット   │  │       │ │
│  │          │  │リロード) │  │       │ │
│  └──────────┘  └──────────┘  └───────┘ │
│                                          │
│  Volume Mount: ライブコード同期          │
└─────────────────────────────────────────┘
```

| サービス | イメージ | ポート | 用途 |
|----------|---------|--------|------|
| frontend | node:20 | 5173 | Vite開発サーバー |
| backend | python:3.11 | 8000 | Django開発サーバー |
| db | postgis/postgis:15-3.3 | 5432 | PostgreSQL + PostGIS |
