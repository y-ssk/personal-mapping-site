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
3. PR本文生成（下記テンプレート参照）
4. PR作成:
   ```bash
   gh pr create --draft --title "..." --body "..." --base develop --assignee @me
   ```
5. PR URLを報告

## PR本文テンプレート

```markdown
## Summary
<変更要約（箇条書き）>

## Test plan

### 確認結果
- [x] 項目1 - 確認内容（実行結果）
- [x] 項目2 - 確認内容（実行結果）
- [ ] 項目3 - 未確認（理由）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Test Plan形式ルール（重要）

1. **`### 確認結果`サブセクションを必ず追加**
2. **チェックボックスの使い分け:**
   - `[x]` - 確認済み（実行結果を記載）
   - `[ ]` - 未確認（理由を記載）
3. **各項目の形式:** `- [x/空白] 項目名 - 確認内容`

### 典型的な確認項目

```markdown
### 確認結果
- [x] pytest実行 - Nテスト全て成功
- [x] カバレッジ確認 - N%達成
- [x] flake8/black - エラーなし
- [ ] 手動テスト - 環境依存のため未実行
```

## 注意

- ベースブランチは常に `develop`
- gh CLI認証済みであること
- **確認済み項目は必ず`[x]`にすること**
