# タスクログ: #D009 依存パッケージ定義

## 基本情報
- **タスク名:** 依存パッケージ定義
- **実行日:** 2025-01-25
- **ブランチ:** feature/dependencies
- **PR:** https://github.com/y-ssk/personal-mapping-site/pull/4

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D009
./scripts/claude/run_task.sh D009
```

### 2. SPEC.md確認
- § 5.7 完全な技術スタック

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `backend/requirements/base.txt` | 共通パッケージ（Django, DRF, 認証等） |
| `backend/requirements/local.txt` | 開発用（pytest, black, debug-toolbar等） |
| `backend/requirements/production.txt` | 本番用（gunicorn, sentry-sdk） |
| `frontend/package.json` | Node.jsパッケージ定義 |

### 4. Backend パッケージ一覧

**base.txt:**
- Django==5.0.6
- djangorestframework==3.15.1
- django-filter==24.2
- dj-rest-auth==6.0.0
- django-allauth==0.63.3
- djangorestframework-simplejwt==5.3.1
- django-cors-headers==4.3.1
- django-ratelimit==4.1.0
- drf-spectacular==0.27.2
- psycopg[binary]==3.1.19
- django-mptt==0.16.0
- whitenoise==6.7.0
- python-decouple==3.8

**local.txt:**
- pytest==8.2.2
- pytest-django==4.8.0
- pytest-cov==5.0.0
- factory-boy==3.3.0
- django-debug-toolbar==4.4.2
- black==24.4.2
- flake8==7.0.0
- isort==5.13.2
- mypy==1.10.0

**production.txt:**
- gunicorn==22.0.0
- sentry-sdk==2.5.1

### 5. Frontend パッケージ一覧

**dependencies:**
- react@^18.3.1
- react-dom@^18.3.1
- react-router-dom@^6.23.1
- @tanstack/react-query@^5.45.1
- zustand@^4.5.2
- axios@^1.7.2
- leaflet@^1.9.4
- react-leaflet@^4.2.1
- react-hook-form@^7.52.0
- date-fns@^3.6.0
- @material-tailwind/react@^2.1.9

**devDependencies:**
- typescript@^5.4.5
- vite@^5.3.1
- tailwindcss@^3.4.4
- eslint@^8.57.0
- prettier@^3.3.2
- vitest@^1.6.0
- @testing-library/react@^16.0.0

---

## 追加修正: GitHub Actions CI トリガー条件

### 問題
`package.json` や `requirements/*.txt` の変更でCIがトリガーされ、
ソースコードがない状態でCI失敗

### 原因
- `frontend/**` → package.jsonの変更でもトリガー
- `backend/**` → requirements/*.txtの変更でもトリガー

### 修正内容

| ファイル | 変更前 | 変更後 |
|----------|--------|--------|
| `frontend-ci.yml` | `frontend/**` | `frontend/src/**/*.{ts,tsx,js,jsx,css}` + 設定ファイル |
| `backend-ci.yml` | `backend/**` | `backend/**/*.py` + `pyproject.toml`, `.flake8` |

### コミット
- `fe8c002` fix(ci): GitHub Actionsトリガー条件を拡張子で限定

---

## 成果物
- `backend/requirements/base.txt`
- `backend/requirements/local.txt`
- `backend/requirements/production.txt`
- `frontend/package.json`
- `.github/workflows/frontend-ci.yml` (修正)
- `.github/workflows/backend-ci.yml` (修正)

## 次のステップ
- #001 プロジェクト初期化で実際にインストール
