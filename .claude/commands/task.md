# タスク実行コマンド

タスクID: $ARGUMENTS

## 実行手順

1. まず `./scripts/claude/setup_task.sh $ARGUMENTS` を実行してタスクを準備してください
2. 次に `./scripts/claude/run_task.sh $ARGUMENTS` でプロンプトを生成してください
3. 生成された `tasks/$ARGUMENTS/claude_prompt.md` を読んでタスクを実行してください

## 重要な制約

- SPEC.mdに厳密に従うこと
- CLAUDE.mdのコーディング規約を守ること
- 余計な機能追加は禁止
- テストは必須

## 完了後

1. 変更をコミットしてpushしてください
2. Draft PRを作成してください
3. docs/TASKS.mdのタスク#$ARGUMENTSを完了にしてください
4. tasks/$ARGUMENTS/LOG.md を作成して実行ログを記録してください
