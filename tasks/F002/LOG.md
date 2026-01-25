# タスクログ: #F002 PRベースブランチとタイトル形式の不整合修正

## 基本情報
- **タスク名:** PRベースブランチとタイトル形式の不整合修正
- **種別:** バグ修正
- **実行日:** 2025-01-25
- **ブランチ:** docs/railway-migration（D012と同一）
- **PR:** https://github.com/y-ssk/personal-mapping-site/pull/7（D012と同一）
- **発見タスク:** #D012実行時

## 問題

### 症状1: PRベースブランチがmainになる
- GitHubデフォルトブランチが`main`のまま
- `create_draft_pr.sh`がdevelopなければmainにフォールバック
- 方針では`develop`ブランチにPRを向けるべき

### 症状2: PRタイトルがConventional Commit形式でない
- 期待: `docs(setup): RAILWAY_MIGRATION.md作成 #D012`
- 実際: `#D012 RAILWAY_MIGRATION.md作成`
- `/task`コマンド経由でPR作成時に発生

## 原因

### ベースブランチ問題
- GitHubリポジトリのデフォルトブランチが`main`に設定されていた
- スクリプトがdevelopブランチ不在時にmainへフォールバックしていた

### タイトル形式問題
- `generate_pr_title()`関数が単純なブランチ名変換のみ実装
- Conventional Commit形式（type, scope, description）を考慮していなかった

## 実行内容

### 1. GitHubデフォルトブランチ変更
```bash
gh repo edit --default-branch develop
```

### 2. create_draft_pr.sh修正

#### ベースブランチ固定
```bash
# 変更前
local base_branch="develop"
if ! git rev-parse --verify "$base_branch" >/dev/null 2>&1; then
    base_branch="main"
fi

# 変更後
local base_branch="develop"
if ! git rev-parse --verify "$base_branch" >/dev/null 2>&1; then
    echo "エラー: developブランチが存在しません" >&2
    exit 1
fi
```

#### PRタイトル生成ロジック改善
- type: ブランチプレフィックスから自動判定
  - `docs/` → `docs`
  - `feature/` → `feat`
  - `fix/` → `fix`
  - `scripts/`, `chore/` → `chore`
- scope: ブランチ名キーワードから推測
- description: TASKS.mdから取得、なければブランチ名から生成
- task_id: 末尾に `#D012` 形式で追加

### 3. PR #7 修正
```bash
gh pr edit 7 --title "docs(setup): RAILWAY_MIGRATION.md作成 #D012"
gh pr edit 7 --base develop
```

## 成果物
- `scripts/claude/create_draft_pr.sh`（修正）

## コミット
- `43b00f9` fix: PRベースブランチをdevelopに固定
- `3a551c0` fix(tasks): PRタイトルをConventional Commit形式で生成

## 検証
```json
{
  "baseRefName": "develop",
  "title": "docs(setup): RAILWAY_MIGRATION.md作成 #D012"
}
```

## 影響範囲
- 今後の`/task`コマンドでのPR作成
- `./scripts/claude/create_draft_pr.sh`を使用するすべてのPR作成
