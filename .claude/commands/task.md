# タスク実行コマンド

タスクID: $ARGUMENTS

## 実行手順

1. まず `./scripts/claude/setup_task.sh $ARGUMENTS` を実行してタスクを準備してください
2. 次に `./scripts/claude/run_task.sh $ARGUMENTS` でプロンプトを生成してください
3. **【実装前設計レビュー】** 実装タスクの場合、senior-architect-reviewerエージェントを呼び出し以下を確認:
   - SPEC.md/CLAUDE.mdとの整合性
   - アーキテクチャ・責務分離の妥当性
   - 未定義事項の検出
4. レビュー結果を人に提示し、対応方針を確認:
   - **Y**: すべて盛り込む
   - **P 1,3**: 番号指定で一部のみ盛り込む
   - **S**: スキップして実装開始
   - **Q <質問>**: 追加質問
   - **A**: タスク中止
5. 生成された `tasks/$ARGUMENTS/claude_prompt.md` とレビュー指摘を統合してタスクを実行してください

## スキップ条件

以下のタスクは実装前設計レビューをスキップ可能:
- ドキュメント系タスク（D001-D017）
- 軽微なバグ修正（F001等）
- 技術的負債タスク（TECH-XXX）

## 重要な制約

- SPEC.mdに厳密に従うこと
- CLAUDE.mdのコーディング規約を守ること
- 余計な機能追加は禁止
- テストは必須

## 完了後

1. 変更をコミットしてpushしてください
2. `/pr $ARGUMENTS` でDraft PRを作成してください
3. docs/TASKS.mdのタスク#$ARGUMENTSを完了にしてください
4. tasks/$ARGUMENTS/LOG.md を作成して実行ログを記録してください
5. 実装後レビュー（設計 + 実装）を実施し、LOG.mdに記録してください
