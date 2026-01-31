# 開発ワークフローガイド

**最終更新:** 2025-01-25

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
[6] Test Plan実行   → Claude Code ★PR作成前に必須
[7] Draft PR作成    → WSL または Claude Code
[8] TASKS.md更新    → Claude Code
[9] ログ記録        → Claude Code
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

### Step 6: Test Plan実行

**実行環境:** Claude Code

**重要:** PR作成前にTest Planを実行し、確認結果をPR本文に記載する。

**ドキュメント系タスクの確認項目:**
- リンク先が存在するか
- SPEC.mdの該当セクションと整合しているか
- コード例がある場合、構文が正しいか

**スクリプト系タスクの確認項目:**
- `--help` が動作するか
- `--dry-run` が動作するか
- 前提条件チェックが機能するか
- 関連ドキュメントとの整合性

**実行例:**
```bash
# リンク確認
ls -la docs/setup/LOCAL_SETUP.md docs/setup/RENDER_DEPLOYMENT.md

# スクリプト動作確認
./scripts/deploy/migrate_to_railway.sh --help
./scripts/deploy/migrate_to_railway.sh --dry-run
```

**CI/CD自動化の判断:**
- 実装タスクの場合、CI/CDで自動テストが必要かをこのステップで判断
- 必要な場合はGitHub Actionsのワークフローに追加

---

### Step 7: Draft PR作成

**実行環境:** WSL または Claude Code

**⚠️ 重要: ベースブランチは常に `develop`**

**WSLで実行:**
```bash
./scripts/claude/create_draft_pr.sh <task-id>
```

**Claude Codeで実行:**
```
> Draft PRを作成してください。ベースブランチはdevelopです。
> タスク#<task-id>の内容に基づいてPR説明を生成してください。
> Test Plan確認結果をPR本文に記載してください。
```

**前提条件:**
- GitHub CLI (gh) がインストール済み
- `gh auth login` で認証済み
- **Step 6のTest Planが完了していること**
- **ベースブランチは `develop`（mainへのPRは禁止）**

**PR本文のTest Planセクション形式:**
```markdown
## Test plan

### 確認結果
- [x] 項目1 - 確認内容
- [x] 項目2 - 確認内容
- [ ] 項目3 - 未確認（理由）
```

---

### Step 8: TASKS.md更新

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

### Step 9: ログ記録

**実行環境:** Claude Code

```
> tasks/<task-id>/LOG.md を作成してください。
> 以下の内容を記録:
> - 実行したプロンプト
> - 実装内容のサマリー
> - レビュー時の質問と回答
> - 完了日時
```

**ログファイル配置:**
- 機能タスク: `tasks/Dxxx/LOG.md`
- バグ修正: `tasks/Fxxx/LOG.md`

**ログファイル形式:**
```markdown
# タスクログ: #<task-id> <title>

## 基本情報
- **タスク名:** <title>
- **実行日:** YYYY-MM-DD
- **ブランチ:** <branch-name>
- **PR:** <pr-url>

## 実行内容

### 1. タスク準備
<実行したコマンド>

### 2. SPEC.md確認
<参照したセクション>

### 3. 作成したファイル
| ファイル | 内容 |
|----------|------|
| `path/to/file` | 説明 |

## 成果物
- <file1>
- <file2>

## 次のステップ
- <次のアクション>
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

## バグ修正・改善タスク運用

スクリプトやツールのバグ修正・改善については、以下のルールに従う。

### タスク番号体系

| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `Dxxx` | 開発環境・新規機能 | D001, D007 |
| `Fxxx` | バグ修正・改善 | F001, F002 |
| `xxx` | 本体機能（3桁数字） | 001, 004 |

### ブランチ命名規則

```
fix/<スクリプト名>-<内容>
```

**例:**
- `fix/review-changes-untracked` - review_changes.shのuntracked対応
- `fix/setup-task-validation` - setup_task.shのバリデーション修正

### 優先度基準

| 優先度 | 条件 |
|--------|------|
| 最高 | ワークフローが停止する・進行できない |
| 高 | ワークフローに影響があるが回避策あり |
| 中 | 利便性向上・軽微な不具合 |
| 低 | あれば良い程度の改善 |

### テスト要件

- **手動確認必須**: 実際のタスクで動作検証
- **再現手順記載**: バグの場合は再現手順をTASK.mdに記載
- **修正確認**: 修正後に同じ手順で問題が解消されることを確認

### 起票フォーマット

```markdown
### ⬜ #F001 <スクリプト名>修正 - <内容>
- **優先度:** 最高/高/中/低
- **見積:** Xh
- **ブランチ:** fix/<スクリプト名>-<内容>
- **発生タスク:** #Dxxx（発見したタスク）
- **成果物:**
  - `scripts/xxx/yyy.sh`
- **再現手順:**
  1. xxx
  2. yyy
- **期待動作:** zzz
- **チェックリスト:**
  - [ ] 修正実装
  - [ ] 動作確認
```

---

## クイックリファレンス

### 全ステップをClaude Code中心で実行

```
1. > ./scripts/claude/setup_task.sh D006 を実行してください
2. > ./scripts/claude/run_task.sh D006 を実行してください
3. > tasks/D006/claude_prompt.md を読んでタスクを実行してください
4. （実装完了後）
5. > 変更をコミットしてpushしてください
6. > Test Planを実行して確認結果を記録してください
7. > Draft PRを作成してください。ベースブランチはdevelopです。Test Plan確認結果をPR本文に記載してください
8. > docs/TASKS.mdのタスク#D006を完了にしてください
9. > tasks/D006/LOG.md を作成して実行ログを記録してください
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
