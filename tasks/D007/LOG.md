# タスクログ: #D007 Lint/Format設定

## 実行日時
2025-01-24

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D007
```
- stashが必要だった（`.claude/settings.local.json`の変更があったため）
- `feature/lint-setup` ブランチを `develop` から作成

### 2. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `.pre-commit-config.yaml` | pre-commit設定（ESLint, Prettier, Black, flake8, isort, pre-commit-hooks） |
| `frontend/.eslintrc.json` | ESLint設定（single quote, TypeScript, React対応） |
| `frontend/.prettierrc` | Prettier設定（singleQuote, semi, tabWidth:2） |
| `backend/pyproject.toml` | Black + isort + pytest + coverage設定 |
| `backend/.flake8` | flake8設定（line-length=100, ignore E203/W503） |

### 3. SPEC.md準拠
- すべての設定はSPEC.mdの「開発ツール」セクションに記載された内容に基づく
- ESLint: single quote, semi, no-console warn
- Prettier: singleQuote, semi, tabWidth 2, trailingComma es5
- Black: line-length 100, target-version py311
- isort: profile "black"
- flake8: max-line-length 100, ignore E203,W503

---

## 課題・問題点

### review_changes.sh の設計不備

**問題:**
- `review_changes.sh` は「コミット前にレビューする」目的のスクリプト
- 内部で `git diff` を使用している
- しかし、新規作成ファイル（untracked）は `git diff` では表示されない
- 結果: 新規ファイルを作成するタスクでは、レビュー機能が正しく動作しない

**再現手順:**
1. 新規ファイルを作成（今回のLint設定ファイルなど）
2. `./scripts/claude/review_changes.sh D007` を実行
3. 新規ファイルの内容が表示されず、スクリプトがエラー終了

**改善案:**
1. `git status --porcelain` で untracked ファイルを検出
2. untracked ファイルの内容も `cat` 等で表示する
3. または `git add -N`（intent to add）を使って diff 対象に含める

**優先度:** 高（ワークフローの根幹に関わる）

### レビュー周りのやりとり記録

**問題提起（ユーザー）:**
- `review_changes.sh` がuntrackedファイルを処理できないのは、ワークフローの順番からしておかしい
- コミット前にレビューする段取りなのに、新規ファイルがレビューできない

**確認事項（ユーザー）:**
- スクリプト修正時の運用ルールが決まっていない
- 起票する前に運用ルールを決める必要がある

**対応:**
1. WORKFLOW.mdに「バグ修正・改善タスク運用」セクションを追加
   - タスク番号体系: `Fxxx`（Fix）
   - ブランチ命名: `fix/<スクリプト名>-<内容>`
   - 優先度基準: ワークフロー影響度で判断
   - テスト要件: 手動確認必須
2. TASKS.mdに「バグ修正・改善」セクションを追加
3. #F001として `review_changes.sh` 修正タスクを起票

---

## 追加成果物（運用ルール整備）

| ファイル | 変更内容 |
|----------|----------|
| `docs/WORKFLOW.md` | 「バグ修正・改善タスク運用」セクション追加 |
| `docs/TASKS.md` | 「バグ修正・改善」セクション追加、#F001起票 |

---

## 次のステップ
1. 本タスク（D007）のコミット・プッシュ
2. PR作成
3. #F001 の実行（review_changes.sh修正）
