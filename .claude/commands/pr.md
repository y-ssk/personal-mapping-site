# PR作成

Draft PRを作成します。

## 使用方法

引数: $ARGUMENTS（タスクID、省略可）

## 実行手順

1. 事前確認:
   - `git rev-parse --abbrev-ref HEAD`（現在ブランチ）
   - `git log origin/develop..HEAD --oneline`（コミット履歴）
2. PRタイトル生成（Conventional Commit形式）:
   - `<type>(<scope>): <description> #<task-id>`
3. PR本文生成:
   ```markdown
   ## Summary
   <変更要約>

   ## Test plan
   <テストチェックリスト>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```
4. PR作成:
   ```bash
   gh pr create --draft --title "..." --body "..." --base develop --assignee @me
   ```
5. PR URLを報告

## 注意

- ベースブランチは常に `develop`
- gh CLI認証済みであること
