# 開発ワークフローガイド

**最終更新:** 2025-01-24

このドキュメントは、タスク実行の一連の流れを説明します。
WSL上で実行するか、Claude Code上で実行するかを明確に区別しています。

---

## 概要フロー

```
[1] タスク準備      → WSL または Claude Code
[2] プロンプト生成  → WSL または Claude Code
[3] Claude Code実行 → Claude Code
[4] 変更レビュー    → WSL（対話形式）
[5] コミット&Push   → WSL または Claude Code
[6] Draft PR作成    → WSL または Claude Code
[7] TASKS.md更新    → Claude Code
[8] ログ記録        → Claude Code
```

---

## 詳細ワークフロー

### Step 1: タスク準備

**実行環境:** WSL または Claude Code

```bash
# WSLで実行
./scripts/claude/setup_task.sh <task-id>

# 例
./scripts/claude/setup_task.sh D006
./scripts/claude/setup_task.sh 004
```

**実行内容:**
- `tasks/<task-id>/` ディレクトリ作成
- `tasks/<task-id>/TASK.md` 生成
- ブランチ作成（TASKS.mdに記載されている場合）
- TASKS.md ステータス更新（作業中）

**--dry-run で事前確認:**
```bash
./scripts/claude/setup_task.sh D006 --dry-run
```

---

### Step 2: プロンプト生成

**実行環境:** WSL または Claude Code

```bash
./scripts/claude/run_task.sh <task-id>
```

**実行内容:**
- `tasks/<task-id>/TASK.md` を読み込み
- Claude Code用プロンプト生成
- `tasks/<task-id>/claude_prompt.md` に出力

---

### Step 3: Claude Code実行

**実行環境:** Claude Code

**方法A: プロンプトファイルを指定して実行**
```
Claude Codeで以下を入力:
> tasks/<task-id>/claude_prompt.md を読んでタスクを実行してください
```

**方法B: 直接指示**
```
Claude Codeで以下を入力:
> docs/TASKS.mdのタスク#<task-id>を実装してください。
> 実装前にSPEC.mdとCLAUDE.mdを確認してください。
```

**Claude Code内での確認事項:**
1. SPEC.md該当セクションを読む
2. CLAUDE.mdのコーディング規約を確認
3. 既存コードのパターンを確認
4. 実装を行う
5. テストを作成

---

### Step 4: 変更レビュー

**実行環境:** WSL（対話形式）

```bash
./scripts/claude/review_changes.sh <task-id>
```

**対話内容:**
1. `git status` で変更ファイル一覧表示
2. `git diff --stat` で変更概要表示
3. 詳細差分表示（y/N）
4. テスト実行（y/N）- Docker環境がある場合
5. Lint実行（y/N）- Docker環境がある場合
6. 承認/却下/キャンセル選択

**レビュー結果の記録:**
- 質問と回答はログファイルに記録される（Step 8）

---

### Step 5: コミット & Push

**実行環境:** WSL または Claude Code

**WSLで実行:**
```bash
./scripts/claude/commit_and_push.sh <task-id>
```

**Claude Codeで実行:**
```
> 変更をコミットしてpushしてください。
> Conventional Commitメッセージを使用してください。
```

**実行内容:**
1. pre-commit実行（インストール済みの場合）
2. Conventional Commitメッセージ生成
3. `git add .`
4. `git commit`
5. `git push origin <branch>`

---

### Step 6: Draft PR作成

**実行環境:** WSL または Claude Code

**WSLで実行:**
```bash
./scripts/claude/create_draft_pr.sh <task-id>
```

**Claude Codeで実行:**
```
> Draft PRを作成してください。
> タスク#<task-id>の内容に基づいてPR説明を生成してください。
```

**前提条件:**
- GitHub CLI (gh) がインストール済み
- `gh auth login` で認証済み

---

### Step 7: TASKS.md更新

**実行環境:** Claude Code

```
> docs/TASKS.mdのタスク#<task-id>を完了にしてください。
> チェックリストも全てチェックしてください。
```

**または WSLで実行:**
```bash
./scripts/tasks/update_task.sh <task-id> done
./scripts/tasks/check_item.sh <task-id> "<item-text>"
```

---

### Step 8: ログ記録

**実行環境:** Claude Code

```
> docs/tasks/<task-id>.log を作成してください。
> 以下の内容を記録:
> - 実行したプロンプト
> - 実装内容のサマリー
> - レビュー時の質問と回答
> - 完了日時
```

**ログファイル形式:**
```markdown
# タスク #<task-id> 実行ログ

## 基本情報
- タスク名: <title>
- 実行日: YYYY-MM-DD
- ブランチ: <branch-name>
- PR: <pr-url>

## 実行プロンプト
<claude_prompt.mdの内容>

## 実装サマリー
- <変更点1>
- <変更点2>

## レビュー記録
### 質問1
Q: <質問>
A: <回答>

## 成果物
- <file1>
- <file2>
```

---

## 例外ケースの対応

### E1: テスト失敗

**状況:** Step 4のレビューでテストが失敗

**対応:**
1. Claude Codeで修正を依頼
   ```
   > テストが失敗しています。以下のエラーを修正してください:
   > <エラー内容>
   ```
2. 修正後、Step 4から再実行

### E2: Lint失敗

**状況:** pre-commitまたはLintが失敗

**対応:**
1. Claude Codeで修正を依頼
   ```
   > Lintエラーがあります。修正してください:
   > <エラー内容>
   ```
2. 自動修正が可能な場合:
   ```bash
   # WSLで実行
   docker-compose exec backend black .
   docker-compose exec frontend npm run lint:fix
   ```

### E3: コンフリクト発生

**状況:** pushまたはPR作成時にコンフリクト

**対応:**
```bash
# WSLで実行
git fetch origin
git rebase origin/develop  # または origin/main
# コンフリクト解決後
git add .
git rebase --continue
git push --force-with-lease
```

### E4: CI失敗

**状況:** GitHub ActionsのCIが失敗

**対応:**
1. GitHub上でCI結果を確認
2. Claude Codeで修正を依頼
3. 修正後、再pushでCIが再実行される

### E5: Docker環境なし

**状況:** テスト/Lintをスキップしたい

**対応:**
- review_changes.shの対話でスキップを選択
- CIに任せる（push後にGitHub Actionsで実行）

---

## クイックリファレンス

### 全ステップをClaude Code中心で実行

```
1. > ./scripts/claude/setup_task.sh D006 を実行してください
2. > ./scripts/claude/run_task.sh D006 を実行してください
3. > tasks/D006/claude_prompt.md を読んでタスクを実行してください
4. （実装完了後）
5. > 変更をコミットしてpushしてください
6. > Draft PRを作成してください
7. > docs/TASKS.mdのタスク#D006を完了にしてください
8. > docs/tasks/D006.log を作成して実行ログを記録してください
```

### WSL中心で実行（Claude Codeは実装のみ）

```bash
# WSLで実行
./scripts/claude/setup_task.sh D006
./scripts/claude/run_task.sh D006

# Claude Codeで実装

# WSLで実行
./scripts/claude/review_changes.sh D006
./scripts/claude/commit_and_push.sh D006
./scripts/claude/create_draft_pr.sh D006
./scripts/tasks/update_task.sh D006 done
```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/AGENTS.md](AGENTS.md) | スクリプト詳細、CI/CD設定 |
| [docs/TASKS.md](TASKS.md) | タスク一覧、進捗管理 |
| [CLAUDE.md](../CLAUDE.md) | コーディング規約 |
| [SPEC.md](../SPEC.md) | 技術仕様 |

---

## スクリプト一覧

| スクリプト | 説明 | --help | --dry-run |
|-----------|------|--------|-----------|
| `scripts/claude/setup_task.sh` | タスク準備 | Yes | Yes |
| `scripts/claude/run_task.sh` | プロンプト生成 | Yes | Yes |
| `scripts/claude/review_changes.sh` | 変更レビュー | Yes | Yes |
| `scripts/claude/commit_and_push.sh` | コミット&Push | Yes | Yes |
| `scripts/claude/create_draft_pr.sh` | Draft PR作成 | Yes | Yes |
| `scripts/tasks/update_task.sh` | ステータス更新 | Yes | Yes |
| `scripts/tasks/check_item.sh` | チェック項目更新 | Yes | Yes |
