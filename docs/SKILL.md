# Claude Code Skills 管理ガイド

**最終更新:** 2025-01-29

---

## 概要

Claude Code Skillsは、スラッシュコマンド（`/command`）で呼び出せる機能です。
頻出する処理をスキル化することで、開発効率を向上させます。

---

## スキル一覧

| コマンド | 説明 | ファイル | 移行元 |
|----------|------|----------|--------|
| `/task <id>` | タスク実行（実装前設計レビュー含む） | `.claude/commands/task.md` | - |
| `/workflow` | ワークフロー確認 | `.claude/commands/workflow.md` | - |
| `/log <id>` | ログ記録 | `.claude/commands/log.md` | - |
| `/spec <section>` | SPEC.md参照 | `.claude/commands/spec.md` | - |
| `/guide [keyword]` | CLAUDE.md参照 | `.claude/commands/guide.md` | - |
| `/progress` | 進捗サマリー | `.claude/commands/progress.md` | - |
| `/setup <env>` | 環境構築ガイド | `.claude/commands/setup.md` | - |
| `/checklist <id>` | チェックリスト管理 | `.claude/commands/checklist.md` | `check_item.sh` |
| `/review` | 変更レビュー | `.claude/commands/review.md` | `review_changes.sh` |
| `/pr <id>` | PR作成 | `.claude/commands/pr.md` | `create_draft_pr.sh` |
| `/pr-feedback <pr>` | PRレビュー対応 | `.claude/commands/pr-feedback.md` | - |

---

## スキル詳細

### /task - タスク実行

実装タスクの場合、実装前にsenior-architect-reviewerによる設計レビューを自動実行します。

**フロー:**
```
/task <id>
    ↓
setup_task.sh実行
    ↓
run_task.sh実行（プロンプト生成）
    ↓
【実装前設計レビュー】← 実装タスクのみ
    ↓
レビュー結果表示 → 対応方針選択（Y/P/S/Q/A）
    ↓
実装開始
```

**選択肢:**
| 入力 | 意味 |
|------|------|
| Y | 指摘事項をすべてタスクに盛り込む |
| P 1,3 | 番号指定で一部のみ盛り込む |
| S | スキップして実装開始 |
| Q <質問> | 追加の質問をする |
| A | タスク実行を中止 |

**スキップ対象:**
- ドキュメント系タスク（D001-D017）
- バグ修正タスク（F001等）
- 技術的負債タスク（TECH-XXX）

---

### /pr-feedback - PRレビュー対応

PRのレビューコメントを取得し、対応を支援します。

**フロー:**
```
/pr-feedback <pr-number>
    ↓
コメント取得・一覧表示
    ↓
各コメントに対応選択（E/F/D/S）
    ↓
エージェントが対応案を提示 → ユーザー承認
    ↓
返信投稿 + コード修正（必要な場合）
    ↓
LOG.md更新
```

**対応種別:**
| 選択 | 意味 |
|------|------|
| E | 説明（Explain）- コメントで返信 |
| F | 修正（Fix）- コード修正を実施 |
| D | 保留（Defer）- 次回タスク化 |
| S | スキップ - 対応不要 |

**判断者の表記:**
| 判断者 | 表記 |
|--------|------|
| ユーザー手動 | `@{username}（手動判断）` |
| エージェント承認済み | `Claude Code（@{username} 承認）` |
| エージェント自動 | `Claude Code（自動判断: {根拠}）` |

**責務明確化:**
- コメント返信には必ず判断者と根拠を明記
- 原因（なぜ指摘が発生したか）と対応内容を明記
- 自動判断はSPEC/CLAUDE準拠の明確なケースのみ

---

## スキル追加ルール

### 1. 追加条件

以下の条件を満たす処理をスキルとして追加を検討：

1. **頻出性**: 同じ処理が3回以上繰り返されている
2. **汎用性**: 複数のタスクで共通して使用される
3. **効率化**: コマンド化することで効率が上がる

### 2. 確認フロー

タスク実行中に上記条件を満たす処理を検出した場合：

```
この処理をスキルとして追加しますか？
処理内容: <処理の説明>
コマンド案: /<command-name>

追加する場合は 'y' と回答してください (y/N):
```

**ユーザーが `y` と回答した場合のみ追加を実行**

### 3. 重複チェック（必須）

追加前に以下を確認：

1. 既存スキルの機能と重複していないか
2. 類似機能がある場合は既存スキルの拡張を検討
3. 重複がある場合は追加しない

**重複チェック方法:**
```bash
# スキル一覧確認
ls -la .claude/commands/

# スキル内容確認
cat .claude/commands/<command>.md
```

### 4. 追加時の作業

1. `.claude/commands/<command>.md` を作成
2. このファイル（SKILL.md）のスキル一覧を更新
3. CLAUDE.mdのスキル一覧を更新
4. docs/TASKS.mdにタスクとして記録（完了扱い）
5. docs/tasks/<task-id>/LOG.md に実装ログを記録

---

## スキルファイル形式

```markdown
# <スキル名>

<1行説明>

## 使用方法

/<command> <arguments>

## 引数

- `<arg1>`: 説明

## 実行内容

1. ステップ1
2. ステップ2

## 例

```
/<command> example
```
```

---

## スクリプトからの移行

既存スクリプトをスキルに移行する場合のガイドライン：

### 移行対象

| スクリプト | 移行先スキル | 状態 |
|-----------|-------------|------|
| `scripts/claude/review_changes.sh` | `/review` | ✅ 移行完了 |
| `scripts/claude/create_draft_pr.sh` | `/pr` | ✅ 移行完了 |
| `scripts/tasks/check_item.sh` | `/checklist` | ✅ 移行完了 |

### 移行しないもの

以下のスクリプトはWSL/シェルでの実行が適切なため、スキルに移行しない：

| スクリプト | 理由 |
|-----------|------|
| `scripts/claude/setup_task.sh` | ディレクトリ作成、ブランチ操作など |
| `scripts/claude/run_task.sh` | ファイル生成 |
| `scripts/claude/commit_and_push.sh` | 対話形式、pre-commit実行 |
| `scripts/tasks/update_task.sh` | 単純なファイル編集 |
| `scripts/deploy/migrate_to_railway.sh` | デプロイ操作 |
| `scripts/deploy/backup_database.sh` | DB操作 |

---

## 関連ドキュメント

- [CLAUDE.md](../CLAUDE.md) - 開発ガイド、スキル追加ルール
- [docs/TASKS.md](TASKS.md) - タスク管理
- [docs/WORKFLOW.md](WORKFLOW.md) - 開発ワークフロー
