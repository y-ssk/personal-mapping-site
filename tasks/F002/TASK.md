# タスク #F002: PRベースブランチとタイトル形式の不整合修正

## 概要
PRベースブランチとタイトル形式の不整合修正

## 種別
バグ修正

## タスク情報
### ✅ #F002 PRベースブランチとタイトル形式の不整合修正
- **優先度:** 高
- **見積:** 0.5h
- **ブランチ:** docs/railway-migration（D012と同一）
- **発見タスク:** #D012
- **完了日:** 2025-01-25
- **成果物:**
  - `scripts/claude/create_draft_pr.sh`（修正）

## 問題
1. PRベースブランチがmainになる
2. PRタイトルがConventional Commit形式でない

## 修正内容
- GitHubデフォルトブランチをdevelopに変更
- PRベースブランチをdevelopに固定（mainフォールバック削除）
- PRタイトルをConventional Commit形式で自動生成
