# AGENTS.md - CI/CD・自動化戦略

## ドキュメント情報
- **目的:** Claude Code実行、Git/GitHub統合、CI/CDの完全自動化
- **最終更新:** 2025-01-23

---

## 🎯 全体フロー

```
タスク準備 → Claude Code実行 → レビュー → commit/push → Draft PR → CI実行
```

---

## 📋 Claude Code実行ワークフロー

### 1. タスク準備

```bash
./scripts/claude/setup_task.sh <task-id>

# 例: #004 バックエンド認証API
./scripts/claude/setup_task.sh 004
```

**実行内容:**
1. `tasks/004/`ディレクトリ作成
2. SPEC.md該当セクション抽出 → `tasks/004/spec_excerpt.md`
3. タスクファイル生成 → `tasks/004/TASK.md`
4. ブランチ作成 → `feature/auth-backend`
5. TASKS.md更新（ステータス: 🔄作業中）

**生成されるTASK.md:**
```markdown
# タスク #004: バックエンド認証API

## 概要
JWT認証システムの実装

## SPEC参照
- SPEC.md § 8.1（認証・認可）
- SPEC.md § 3.3.1（Userモデル）
- docs/api/openapi.yml（認証エンドポイント）

## 実装内容

### 1. Userモデル作成
- `backend/apps/users/models.py`
- AbstractUserを拡張
- OAuth対応フィールド

### 2. JWT設定
- `config/settings/base.py`
- Simple JWT設定

### 3. 認証エンドポイント実装
- POST /api/v1/auth/register/
- POST /api/v1/auth/login/
- POST /api/v1/auth/refresh/
- GET /api/v1/auth/me/

### 4. テスト作成
- `backend/apps/users/tests/test_views.py`
- カバレッジ≥80%

### 5. OpenAPI更新
- docs/api/openapi.yml

## チェックリスト
- [ ] Userモデル作成
- [ ] マイグレーション作成
- [ ] JWT設定
- [ ] 認証エンドポイント実装
- [ ] シリアライザ作成
- [ ] テスト作成（カバレッジ≥80%）
- [ ] OpenAPI更新
- [ ] 動作確認（Postman/curl）

## 成果物
- backend/apps/users/models.py
- backend/apps/users/serializers.py
- backend/apps/users/views.py
- backend/apps/users/tests/
- backend/apps/users/migrations/
- docs/api/openapi.yml（更新）

## 重要な制約
- SPEC.mdに厳密に従うこと
- 勝手な機能追加禁止
- テスト必須
```

### 2. Claude Code実行

```bash
./scripts/claude/run_task.sh 004
```

**実行内容:**
1. `tasks/004/TASK.md`を読み込み
2. Claude Codeへのプロンプト生成
3. `tasks/004/claude_prompt.md`に出力

**手動ステップ:**
- Claude Codeで`tasks/004/claude_prompt.md`を開く
- プロンプトをClaude Codeに貼り付けて実行
- 実装完了を待つ

**将来的な自動化:**
```bash
# Claude Code CLIが提供されれば
claude-code execute --prompt tasks/004/claude_prompt.md
```

### 3. 変更レビュー

```bash
./scripts/claude/review_changes.sh 004
```

**実行内容:**
1. `git diff`で変更確認
2. 追加/変更ファイル一覧表示
3. テスト実行
   ```bash
   docker-compose exec backend pytest apps/users/
   ```
4. Lint実行
   ```bash
   docker-compose exec backend black apps/users/
   docker-compose exec backend flake8 apps/users/
   ```
5. 承認/却下プロンプト

### 4. Commit & Push

```bash
./scripts/claude/commit_and_push.sh 004
```

**実行内容:**
1. pre-commit自動実行（全ファイル）
2. Conventional Commitメッセージ生成
   ```
   feat(auth): バックエンド認証APIを実装
   ```
3. `git add .`
4. `git commit`
5. `git push origin feature/auth-backend`
6. TASKS.md更新（進捗更新）

### 5. Draft PR作成

```bash
./scripts/claude/create_draft_pr.sh 004
```

**実行内容:**
1. GitHub CLI (gh)でDraft PR作成
2. PR説明自動生成（TASK.mdから）
3. レビュアー割り当て（@me）
4. ラベル追加（feature, backend等）

**生成されるPR説明:**
```markdown
## 実装内容
- バックエンド認証API（JWT）
- Userモデル作成（OAuth対応）
- 4つの認証エンドポイント実装

## チェックリスト
- [x] SPEC.mdに準拠
- [x] テスト作成済み（カバレッジ82%）
- [x] pre-commit通過
- [ ] 手動動作確認（レビュアー）
- [x] OpenAPI更新

## 関連
- タスク: #004
- SPEC.md: § 8.1
- ブランチ: feature/auth-backend
```

### 6. CI実行（自動）

**GitHub Actionsが自動実行:**
- Backend CI: Lint + Test
- OpenAPI Validation

**結果:**
- ✅ 全通過 → Draft PR準備完了
- ❌ 失敗 → 修正必要

---

## 🤖 GitHub Actions

### Backend CI

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements/local.txt
      
      - name: Black
        run: |
          cd backend
          black --check .
      
      - name: flake8
        run: |
          cd backend
          flake8 .
      
      - name: isort
        run: |
          cd backend
          isort --check-only .

  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y gdal-bin libgdal-dev
      
      - name: Install Python dependencies
        run: |
          cd backend
          pip install -r requirements/local.txt
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          cd backend
          python manage.py migrate
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          cd backend
          pytest --cov=apps --cov-report=term --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
```

### Frontend CI

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: ESLint
        run: |
          cd frontend
          npm run lint
      
      - name: Prettier
        run: |
          cd frontend
          npm run format:check
      
      - name: TypeScript
        run: |
          cd frontend
          npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/coverage-final.json
```

### OpenAPI Validation

```yaml
# .github/workflows/openapi-validate.yml
name: OpenAPI Validation

on:
  push:
    paths:
      - 'docs/api/openapi.yml'
  pull_request:
    paths:
      - 'docs/api/openapi.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install validator
        run: npm install -g @apidevtools/swagger-cli
      
      - name: Validate OpenAPI spec
        run: swagger-cli validate docs/api/openapi.yml
```

---

## 🔒 Pre-commit

```yaml
# .pre-commit-config.yaml
repos:
  # Python
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        files: ^backend/
  
  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        files: ^backend/
        args: ['--config=backend/.flake8']
  
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        files: ^backend/
  
  # TypeScript/JavaScript
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: ^frontend/.*\.[jt]sx?$
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/eslint-plugin'
          - '@typescript-eslint/parser'
  
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: ^frontend/.*\.(ts|tsx|js|jsx|json|css|md)$
  
  # 一般
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']
```

**インストール:**
```bash
pip install pre-commit
pre-commit install
```

**実行:**
```bash
# 自動実行（コミット時）
git commit -m "..."

# 手動実行
pre-commit run --all-files
```

---

## 📊 タスク進捗管理

### TASKS.md更新

```bash
# ステータス更新
./scripts/tasks/update_task.sh 004 in-progress
./scripts/tasks/update_task.sh 004 done

# チェックリスト更新
./scripts/tasks/check_item.sh 004 "Userモデル作成"
```

**自動更新タイミング:**
- `setup_task.sh` → ⬜ → 🔄
- `commit_and_push.sh` → チェックリスト更新
- PR merge → 🔄 → ✅

---

## 🔄 継続的インテグレーション

### PRマージフロー

```
Draft PR作成
  ↓
CI全通過
  ↓
レビュアー承認（自分）
  ↓
Draft解除
  ↓
develop にマージ
  ↓
ブランチ削除
  ↓
TASKS.md更新（✅完了）
```

### developへのマージ

```bash
# Draft解除
gh pr ready

# マージ
gh pr merge --squash --delete-branch

# TASKS.md更新
./scripts/tasks/update_task.sh 004 done
```

---

## 📝 スクリプト一覧

### Claude Code実行系
1. `scripts/claude/setup_task.sh <task-id>` - タスク準備
2. `scripts/claude/run_task.sh <task-id>` - Claude Code実行プロンプト生成
3. `scripts/claude/review_changes.sh <task-id>` - 変更レビュー
4. `scripts/claude/commit_and_push.sh <task-id>` - Commit & Push
5. `scripts/claude/create_draft_pr.sh <task-id>` - Draft PR作成

### タスク管理系
6. `scripts/tasks/update_task.sh <task-id> <status>` - ステータス更新
7. `scripts/tasks/check_item.sh <task-id> <item>` - チェックリスト更新
8. `scripts/tasks/list_tasks.sh [status]` - タスク一覧表示

### デプロイ系（将来）
9. `scripts/deploy/backup_database.sh` - DBバックアップ
10. `scripts/deploy/restore_database.sh` - DB復元
11. `scripts/deploy/migrate_to_railway.sh` - Railway移行

---

## 🎓 使用例

### 新機能実装（#004 認証API）

```bash
# 1. タスク準備
./scripts/claude/setup_task.sh 004
# → tasks/004/ 作成
# → feature/auth-backend ブランチ作成

# 2. Claude Code実行
./scripts/claude/run_task.sh 004
# → tasks/004/claude_prompt.md 生成
# → Claude Codeに貼り付けて実行

# 3. 実装完了後、レビュー
./scripts/claude/review_changes.sh 004
# → git diff確認
# → テスト実行
# → 承認/却下

# 4. Commit & Push
./scripts/claude/commit_and_push.sh 004
# → pre-commit実行
# → git push
# → GitHub Actions実行

# 5. Draft PR作成
./scripts/claude/create_draft_pr.sh 004
# → Draft PR自動作成

# 6. CI通過確認後、マージ
gh pr ready
gh pr merge --squash --delete-branch

# 7. タスク完了
./scripts/tasks/update_task.sh 004 done
```

---

## 🚀 将来の自動化

### Claude Code CLI統合（将来）

```bash
# 完全自動化フロー
./scripts/claude/auto_implement.sh 004

# 実行内容:
# 1. setup_task.sh
# 2. claude-code execute（自動）
# 3. review_changes.sh（自動承認オプション）
# 4. commit_and_push.sh
# 5. create_draft_pr.sh
# 6. CI待機 → 自動マージ（オプション）
```

### AIレビュー統合

```yaml
# .github/workflows/ai-review.yml
- name: AI Code Review
  uses: openai/code-review-action@v1
  with:
    model: gpt-4
    rules: |
      - SPEC.mdに準拠しているか
      - テストカバレッジは十分か
      - ドキュメント更新されているか
```

---

**このAGENTS.mdに従えば、Claude Codeを使った効率的な開発フローが実現できます。**
