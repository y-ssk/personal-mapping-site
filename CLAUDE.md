# CLAUDE.md - Claude Code 開発ガイド

## ドキュメント情報
- **対象:** Claude Code (Opus)
- **目的:** 実装時の明確な指針提供
- **最終更新:** 2025-01-29

---

## ⚠️ 重要な原則

### 絶対に守ること

**1. SPEC.mdに厳密に従う**
- 実装前に必ず該当セクションを読む
- 仕様と異なる実装は**すべて却下される**
- 疑問があれば実装せず質問する

**2. 余計なことはしない**
- 仕様にない機能追加は禁止
- 「こうした方が良い」という独自判断での変更禁止
- ディレクトリ構造を勝手に変更しない
- データベーススキーマを勝手に変更しない

**3. 暫定対応（プレースホルダー実装）は原則禁止**

依存タスクが未完了の場合、暫定対応（Value(0)等のダミー値）を入れない。

| 状況 | 対応 |
|------|------|
| 依存モデルが未実装 | 依存タスクを先に実施するようタスク順序を変更 |
| 暫定対応が必要な場合 | 設計レビューで承認を得る + 解消タスクを必ず作成 |
| 既存の暫定対応 | 解消タスク（例: #010-A）を作成し、早期に解消 |

**暫定対応が承認される条件:**
1. 設計レビュー（senior-architect-reviewer）で明示的に承認されている
2. 解消タスクがTASKS.mdに登録されている
3. 暫定箇所がコード内で明確にマークされている（`# NOTE: 暫定実装`）
4. 暫定対応の影響範囲が限定的である

**禁止の理由:**
- 破壊的マイグレーションのリスク
- 技術的負債の蓄積
- リグレッションテストの複雑化

**4. テストは必須**
- Service層: カバレッジ≥80%
- Views: カバレッジ≥60%
- Hooks: カバレッジ≥70%

**5. ドキュメントは必須**
- JSDoc/Docstringを必ず書く
- 複雑なロジックにはコメント
- APIが変われば必ずOpenAPI更新
  - #D008で事前定義済みの場合: `[x] OpenAPI更新（#D008で定義済み）`
  - 未定義エンドポイントの場合: **同一タスク内で**openapi.ymlを更新
  - 「別タスクで対応」は禁止。具体的なタスクIDを必ず明記

**6. コメント・ドキュメントは日本語**
- コードコメントは日本語で記述
- JSDoc/Docstringは日本語で記述
- CLIヘルプメッセージは日本語で記述
- エラーメッセージは日本語で記述
- 英語を使用するのはi18n対応時のみ

**7. マジックナンバー禁止**
- 数値リテラルは必ず定数として定義
- 定数名は意味がわかる名前にする
- フロントエンド・バックエンド共通ルール

```typescript
// ❌ 悪い例
if (radius > 100) { ... }
const timeout = 5 * 60 * 1000;

// ✅ 良い例
const MAX_RADIUS_KM = 100;
const STALE_TIME_MS = 5 * 60 * 1000;  // 5分

if (radius > MAX_RADIUS_KM) { ... }
const timeout = STALE_TIME_MS;
```

```python
# ❌ 悪い例
if radius_km > 100:
    raise ValueError("半径が大きすぎます")

# ✅ 良い例
MAX_RADIUS_KM = 100

if radius_km > MAX_RADIUS_KM:
    raise ValueError(f"半径は{MAX_RADIUS_KM}km以下にしてください")
```

**8. エラーメッセージの一元管理**
- エラーメッセージはべた書きせず、まとまった単位で管理
- 機能ごとに定数ファイルを作成
- フロントエンド・バックエンド共通ルール

```typescript
// ❌ 悪い例
throw new Error('認証に失敗しました');
toast.error('場所の保存に失敗しました');

// ✅ 良い例: features/auth/constants/messages.ts
export const AUTH_MESSAGES = {
  LOGIN_FAILED: '認証に失敗しました',
  SESSION_EXPIRED: 'セッションが切れました。再ログインしてください',
  UNAUTHORIZED: 'この操作を行う権限がありません',
} as const;

// 使用側
throw new Error(AUTH_MESSAGES.LOGIN_FAILED);
```

```python
# ❌ 悪い例
raise ValidationError("半径が大きすぎます")
raise PermissionDenied("この場所を編集する権限がありません")

# ✅ 良い例: apps/locations/constants.py
class LocationMessages:
    """場所関連のエラーメッセージ"""
    RADIUS_TOO_LARGE = "半径は{max_km}km以下にしてください"
    NOT_FOUND = "指定された場所が見つかりません"
    PERMISSION_DENIED = "この場所を編集する権限がありません"

# 使用側
raise ValidationError(
    LocationMessages.RADIUS_TOO_LARGE.format(max_km=MAX_RADIUS_KM)
)
```

**ファイル配置:**
- フロントエンド: `features/<機能>/constants/messages.ts`
- バックエンド: `apps/<機能>/constants.py`

**9. タスクログへの追記**
- タスク完了後に追加修正を行った場合は `tasks/<id>/LOG.md` に必ず追記する
- 対話の形跡を残し、意思決定の経緯を追跡可能にする
- 日付を明記し、時系列で記録する

**追記すべき内容:**
- 修正のきっかけ（ユーザーからの指摘、レビュー結果など）
- 対話の要約（質問→回答→決定の流れ）
- 実施した変更内容
- コミットハッシュ

**10. PRへの追記**
- タスク完了後に追加修正を行った場合は PRの説明も更新する
- LOG.mdとPRの内容がちぐはぐにならないようにする
- `gh pr edit <number> --body` で説明を更新

**追記すべき内容:**
- 追加修正セクションを設ける
- 何を追加・変更したかを箇条書きで明記
- 関連するコミットハッシュ

**例:**
```markdown
## Summary
- 初期実装の内容...

## 追加修正（2026-01-31）
- JSONフィクスチャをシードスクリプトに移行
- NOTES.md作成ルールを追加
- コミット: d669b75, 462791d
```

**11. 解説ドキュメントの作成（docs/local/）**

解説系ドキュメントは**すべて `docs/local/` に配置する**。
このディレクトリは `.gitignore` で除外されており、個人の学習用として使用する。

**ドキュメント種別:**

| 種別 | ファイル名 | 作成タイミング | 内容 |
|------|-----------|--------------|------|
| 設計レビュー | `<id>_design_review.md` | `/design-review`実行時 | レビュー結果の詳細解説 |
| 実装ノート | `<id>_notes.md` | 実装完了時（任意） | 処理フロー・設計判断の解説 |

**実装ノートの記載内容:**
- 処理フロー（図やステップバイステップ）
- 設計判断の理由（なぜこの方式を選んだか）
- 代替案との比較
- 使用しているライブラリ/フレームワークの挙動解説
- 拡張方法

**例:**
```
docs/local/
├── 003_notes.md          # #003 カテゴリマスタデータ - 実装解説
├── 008_design_review.md  # #008 設計レビュー詳細
├── 010_notes.md          # #010 Location CRUD API - 実装解説
└── ...
```

**注意:**
- `docs/local/` は `.gitignore` で除外されているため、リポジトリには含まれない
- 個人の学習・参照用として自由に作成・編集できる
- 公式なドキュメントは `tasks/<id>/LOG.md` に記録する

**12. Dockerコンテナ上で実行**
- Lint、テスト、フォーマット等の動作確認は必ずDockerコンテナ上で行う
- ホスト環境のツールバージョンとの差異を防ぐため
- `docker compose exec backend <command>` または `docker compose exec frontend <command>` を使用

```bash
# ✅ 良い例: Dockerコンテナ上で実行
docker compose exec backend black --check .
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm test

# ❌ 悪い例: ホスト環境で実行
black --check backend/
pytest backend/
npm run lint
```

**13. PR作成は必ず`/pr`スキルを使用**
- PR作成時は必ず`/pr`スキルを使用する
- `gh pr create`を直接実行しない（再現性のため）
- `/pr`スキルは自動的に`--base develop`を指定する

```
# ✅ 良い例
/pr 006

# ❌ 悪い例
gh pr create --draft --base develop --title "..."  # 直接実行は禁止
gh pr create --draft --title "..."  # ベースブランチ指定漏れのリスク
```

**理由:**
- 再現性の確保（スキル経由で統一）
- ベースブランチ指定漏れの防止
- 自動化時の一貫性

**14. コミット前チェック（pre-commit）**

pre-commitを使用してコミット前にlint/formatを自動チェックする。

**初回セットアップ（必須）:**
```bash
# pre-commitのインストール（ホスト環境）
pip install pre-commit

# フックのインストール（リポジトリごとに1回）
pre-commit install
```

**動作:**
- `git commit`実行時に自動でlint/formatチェックが走る
- チェックに失敗するとコミットが中止される
- 自動修正された場合は再度`git add`してコミット

**pre-commitでチェックされる内容:**
| ツール | 対象 | 内容 |
|--------|------|------|
| Black | backend/*.py | Pythonフォーマット |
| flake8 | backend/*.py | Python lint |
| isort | backend/*.py | インポート順 |
| ESLint | frontend/*.ts(x) | TypeScript lint |
| Prettier | frontend/* | フォーマット |

**追加で手動確認が必要な項目:**
```bash
# テスト実行（pre-commitには含まれない）
docker compose exec backend pytest
docker compose exec frontend npm test

# マイグレーション適用確認（モデル変更時）
docker compose exec backend python manage.py migrate
```

**ファイル確認:**
| ファイル | 対応 |
|----------|------|
| `.claude/settings.local.json` | 変更あれば別コミット |
| `.claude/agents/*.md` | 新規・変更あればコミット |
| `tasks/<id>/LOG.md` | タスク完了時に必ずコミット |

**--no-verify使用時の必須確認:**

ホスト環境でpre-commitが失敗した場合、`--no-verify`を使用する前に
Docker内で以下を**すべて**実行すること：

```bash
# フロントエンド
docker compose exec frontend npm run lint -- --max-warnings=0
docker compose exec frontend npm run format:check  # ★Prettier
docker compose exec frontend npm test -- --run

# バックエンド
docker compose exec backend black --check .
docker compose exec backend flake8 .
docker compose exec backend isort --check .
docker compose exec backend pytest
```

**1項目でも未実行で`--no-verify`を使用してはならない。**

**15. エージェントレビューの実施と記録**
- タスク完了後、専門エージェントによるレビューを実施する
- レビュー依頼と結果は必ず `tasks/<id>/LOG.md` に記録する
- 重要な指摘事項は対応方針を明記する

**16. Sub Agent調査結果の即時記録**
- Sub Agentで調査・分析した結果は、**コード修正前に**必ず `tasks/<id>/LOG.md` に記録する
- これにより、VSCode/Claude Codeがクラッシュしても調査結果が失われない
- 「記録→修正」の順序を徹底する

**⚠️ 重要な理由:**
- Sub Agentでの調査はトークンを大量に消費する
- 記録せずに修正に入ると、クラッシュ時にすべて失われる
- 再調査は時間・コストの無駄

**記録すべき内容:**
| 項目 | 内容 |
|------|------|
| 失敗概要 | 何が失敗したか、エラー件数 |
| 根本原因 | ファイル、行番号、エラー内容、原因 |
| 修正方針 | 具体的な修正手順 |

**フロー:**
```
1. CI失敗/問題を調査（Sub Agent使用可）
2. 調査結果をLOG.mdに記録  ← ★必ずここで記録
3. コード修正を実施
4. コミット＆プッシュ
```

**17. PRレビュー対応ルール**

PRにレビューコメントが付いた場合、以下のフローで対応する。

**対応フロー:**
```
1. /pr-feedback <pr-number> でコメントを取得
2. 各コメントに対して対応方針を選択（E/F/D/S）
3. エージェントが対応案・根拠・返信案を提示
4. ユーザーが承認/修正/却下
5. 修正対応の場合: コード修正 → コミット → プッシュ
6. 返信コメントを自動投稿
7. LOG.mdに対応内容を記録
8. PR本文に「追加修正」セクションを追記
```

**対応種別:**
| 選択 | 意味 |
|------|------|
| E | 説明（Explain）- コメントで返信 |
| F | 修正（Fix）- コード修正を実施 |
| D | 保留（Defer）- 次回タスク化（TECH-XXX） |
| S | スキップ - 対応不要 |

**判断者の明記（責務明確化）:**

コメント返信には必ず判断者と根拠を明記する。

| 判断者 | 表記 |
|--------|------|
| ユーザー手動 | `@{username}（手動判断）` |
| エージェント承認済み | `Claude Code（@{username} 承認）` |
| エージェント自動 | `Claude Code（自動判断: {根拠}）` |

**返信フォーマット:**
```markdown
> {元のコメント内容}

**判断:** {判断者}
**根拠:** {根拠}
**原因:** {なぜこの指摘が発生したか}
**対応:** {何をどう修正したか}

- コミット: {commit_hash}
```

**自動判断の条件（ユーザー承認不要）:**
- SPEC.md/CLAUDE.mdに明確な規定がある場合
- 既存パターンとの整合性が明確な場合
- 軽微な修正（typo、フォーマット）

**それ以外はユーザー承認必須**

**LOG.mdへの記録:**
- 対応サマリー（コメント、判断者、対応、根拠）
- 詳細（投稿者、原因、対応内容、コミット）
- 保留項目はTASKS.mdにTECH-XXXとして追加

### 実装前設計レビュー

実装タスク（3桁数字ID）の実行開始時、**実装前**にsenior-architect-reviewerによる設計レビューを実施する。

**目的:**
- SPEC.md/CLAUDE.md準拠の事前確認
- 設計判断の明確化
- 未定義事項の早期検出
- 手戻りの削減

**実行タイミング:**
- `/task <id>` 実行後、Sub Agent呼び出し前

**確認観点:**
| 観点 | 確認内容 |
|------|----------|
| SPEC整合性 | タスク要件がSPEC.mdと矛盾していないか |
| アーキテクチャ準拠 | ディレクトリ構造、Service層パターン等 |
| 責務分離 | ビジネスロジックがservices.py、View層が薄くなる設計か |
| 影響範囲 | 既存コードへの影響、依存関係 |
| テスト可能性 | テストカバレッジ要件を満たせる設計か |
| 未定義事項 | SPEC/CLAUDEで未定義の判断が必要か |

**評価基準:**
| 評価 | 定義 | 次のアクション |
|------|------|----------------|
| 承認 | 問題なし | 実装開始 |
| Blocker付き承認 | Blocker解決後に実装可能 | Blockerを解決してから実装開始 |
| 要修正 | 設計変更が必要 | 設計修正後に再レビュー |

**指摘事項の分類:**
| 分類 | 定義 | 対応 |
|------|------|------|
| Blocker | 解決しないと実装不可 | 今回必ず対応 |
| Decision Required | ユーザー判断が必要 | 判断材料を提示し、ユーザーが選択 |
| Info | 実装時の注意事項 | 対応不要（実装時に従う） |

**Decision Required項目の提示形式:**
判断材料を必ず提示すること：
- **根拠**: SPEC.md/CLAUDE.mdの該当箇所、または未定義である旨
- **選択肢**: 具体的な選択肢（a/b/c等）
- **推奨**: 推奨する選択肢とその理由
- **リスク**: 各選択肢のトレードオフ

```markdown
# 例
## Decision Required

### 1. タグフィルタ条件
- **根拠**: SPEC.md § 4.3には`tags={tag1,tag2}`のみ記載、AND/ORは未定義
- **選択肢**: (a) OR (b) AND
- **推奨**: (a) OR - 一般的なUX慣行、ユーザーが期待する動作
- **リスク**: (b) ANDは絞り込みすぎて結果が0件になりやすい
```

**選択肢:**
| 入力 | 意味 |
|------|------|
| Y | Blockerなし、Decision Required項目は推奨を採用して実装開始 |
| D | Decision Required項目に個別回答（例: `1a 2b 3a`） |
| Q <質問> | 追加の質問をする |
| A | タスク実行を中止 |

**設計レビュー結果の提示ルール:**

1. **選択肢は省略せず全て提示する**
   - Blocker/Decision Requiredの選択肢は(a)(b)(c)等すべて記載
   - 各選択肢の内容と、採用できない理由があれば明記
   - エージェント出力をそのまま転記せず、ユーザーが判断できる形に整理

2. **実質一択の場合は判断を求めない**
   - 他の選択肢がSPEC違反・実現不可能等で実質一択の場合
   - 「こう実装します」と宣言して進める（承認不要）
   - 例: 「(b)はSPEC違反、(c)は依存タスク未完了のため、(a)で実装します」

3. **判断を求めるのは以下の場合のみ**
   - 複数の有効な選択肢があり、トレードオフがある場合
   - SPEC.md/CLAUDE.mdで未定義の仕様判断が必要な場合
   - ユーザーの好みや方針に依存する場合

4. **提示フォーマット**
   ```markdown
   ## 判断が必要な項目

   ### 1. [項目名]
   - **背景**: なぜ判断が必要か
   - **選択肢**:
     - (a) [内容] - [メリット/デメリット]
     - (b) [内容] - [メリット/デメリット]
   - **推奨**: (a) - [理由]

   ## 判断不要で進める項目
   - [項目]: [選択内容] で実装（理由: [他選択肢が不可な理由]）
   ```

**エビデンス収集要件:**

設計レビューでは、以下のエビデンスを**必ず**収集・提示する。
単に引用するだけでなく、「何を読み取ったか」「どう解釈したか」を含めて記録する。

1. **OpenAPI仕様の該当スキーマ**
   - 対象エンティティの型定義を引用（行番号付き）
   - フィールドの分類・構造をまとめる（表や図で整理）
   - フロントエンドで変換が必要なフィールドを特定
   - ネストした型の依存関係を把握

2. **SPEC.md/CLAUDE.mdの該当セクション**
   - ディレクトリ構造、アーキテクチャの引用
   - 判断に関わるルールの引用
   - 引用した内容の解釈（なぜこのルールが適用されるか）

3. **既存コードのパターン**
   - 類似機能の実装を読み、パターンを抽出
   - ファイルパスと該当行番号を明示
   - 具体的なコード例を引用
   - パターンの構造を図式化（ディレクトリツリー、処理フロー等）

4. **解釈と設計判断への繋がり**
   - 収集したエビデンスから何がわかったか
   - それが設計判断にどう影響するか
   - 採用する選択肢の根拠

**スキップ条件:**
- ドキュメント系タスク（D001-D017）は設計レビュー不要
- 軽微なバグ修正（F001等）は任意
- 技術的負債タスク（TECH-XXX）は任意

**経過記録・改善の仕組み:**

設計レビューの経過を記録し、品質向上・改善に努める。

1. **設計レビュー結果のLOG.md記録**
   - 設計レビュー結果は必ず `tasks/<id>/LOG.md` に記録
   - 判断した内容、選択した選択肢、その理由を明記
   - 判断不要で進めた項目も記録（透明性確保）

   ```markdown
   ## 設計レビュー（YYYY-MM-DD）

   ### 収集エビデンス

   #### 1. [対象エンティティ]の構造（[ソース]:[行番号]）

   [フィールドの分類・構造を表や図で整理]

   **解釈:**
   - [何を読み取ったか]
   - [設計判断への影響]

   #### 2. 既存パターン: [類似機能]

   ```
   [ディレクトリ構造やパターンの図式化]
   ```

   **解釈:**
   - [パターンの特徴]
   - [今回の実装への適用方針]

   ### 判断した項目
   | 項目 | 選択 | 理由 |
   |------|------|------|
   | [項目名] | (a) | [理由] |

   ### 判断不要で進めた項目
   | 項目 | 選択 | 理由（他選択肢が不可な理由） |
   |------|------|------------------------------|
   | [項目名] | (a) | (b)はSPEC違反、(c)は依存未完了 |

   ### Info（実装時の注意事項）
   - [注意事項1]
   - [注意事項2]
   ```

2. **問題発生時の振り返り記録**
   - レビュープロセスで問題が発生した場合、`docs/RETROSPECTIVE.md` に記録
   - 問題の内容、原因、改善策を明記
   - 改善策はCLAUDE.mdへのルール追加として反映

   ```markdown
   ## YYYY-MM-DD: [問題の概要]

   ### 問題
   [何が起きたか]

   ### 原因
   [なぜ起きたか]

   ### 改善策
   [どう改善するか]

   ### 反映先
   - CLAUDE.md § [セクション名] に追記済み
   ```

3. **改善提案の仕組み**
   - エージェントまたはユーザーが改善提案を行う場合、まずルール案を提示
   - ユーザー承認後にCLAUDE.mdに反映
   - 反映後、`docs/RETROSPECTIVE.md` に経緯を記録

### 実装後レビュー

**レビュー種別と対応エージェント:**
| レビュー種別 | エージェント | 観点 |
|-------------|-------------|------|
| 設計レビュー | senior-architect-reviewer | SPEC.md/CLAUDE.md準拠、アーキテクチャ整合性、拡張性 |
| 実装レビュー | code-reviewer | コード品質、テストカバレッジ、セキュリティ |
| 地理計算レビュー | geo-domain-specialist | PostGIS、座標系、距離計算の正確性 |
| UXレビュー | ux-designer-reviewer | 画面遷移、操作性、ユーザー体験 |
| テストレビュー | qa-test-engineer | 境界値、異常系、仕様準拠 |

**実装エージェント:**
| エージェント | 用途 |
|-------------|------|
| implementation-engineer | 設計決定後のコード実装、SPEC/CLAUDE準拠の実装 |

**LOG.mdへの記録形式:**
```markdown
## エージェントレビュー（YYYY-MM-DD）

### レビュー依頼
<依頼内容の概要>

### 設計レビュー（senior-architect-reviewer）
**総合評価:** 承認 / Blocker付き承認 / 要修正

#### 良い点
- ...

#### 改善提案
| 重要度 | 内容 | 対応方針 |
|--------|------|----------|
| 高/中/低 | ... | やること / 根拠・理由・懸念 |

**対応方針の記載ルール:**
対応方針には以下の情報を必ず併記すること：
- **やること**: 具体的なアクション（例: 「定数ファイルに移動」「テスト追加」）
- **根拠・理由**: なぜその対応が必要か（例: 「CLAUDE.md §6 マジックナンバー禁止」）
- **懸念**: 対応しない場合のリスク（例: 「保守性低下」「仕様変更時に修正漏れ」）

```markdown
# ✅ 良い例
| 中 | max_length=50がハードコード | 定数化する / CLAUDE.md §6準拠、変更時に追跡困難になる |

# ❌ 悪い例
| 中 | max_length=50がハードコード | 対応する |
```

### 実装レビュー（code-reviewer）
**総合評価:** 承認 / Blocker付き承認 / 要修正

#### 指摘事項
| 重要度 | 内容 | 場所 | 対応方針 |
|--------|------|------|----------|
| Blocker/Should Fix/Nice to Have | ... | ... | やること / 根拠・理由・懸念 |

### レビュー結果への対応
#### 即時対応
- ...

#### 次回タスクで対応
- ...
```

**評価基準:**
- **承認**: 問題なし、そのままマージ可能
- **Blocker付き承認**: Blocker解決後にマージ可能
- **要修正**: 設計変更が必要、再レビュー必須

**レビュー範囲の判断:**
| タスク種別 | 必須レビュー | 備考 |
|-----------|-------------|------|
| 実装タスク | 設計 + 実装 + 該当専門領域 | フルレビュー |
| ドキュメント更新のみ | 設計レビューのみ | 修正箇所が明確かつ軽微なら修正不要 |
| 軽微な修正 | 設計レビューのみ | typo修正、コメント追加など |

**レビューループの制限:**
- レビュー→修正のループは**最大2回まで**
- 2回のループで解決しない場合は、仕様自体に問題がある可能性
- その場合は人が仕様を見直すことを検討する
- 無限ループを避け、根本原因に対処する

**レビュー後の対応フロー:**

```
レビュー完了
    │
    ├─ Blocker あり → 即時修正 → PR更新
    │
    ├─ Should Fix あり
    │      │
    │      ├─ 今回対応すべき → 即時修正 → PR更新
    │      │
    │      └─ 次回対応でOK → TASKS.mdにタスク追加（必須）
    │
    └─ Nice to Have → 任意（タスク化推奨）

    ↓（対応完了後）

    /design-review実行確認 → ユーザーに確認
```

**設計レビュードキュメント作成:**
- 実装後レビュー完了後、ユーザーに`/design-review`実行の要否を確認する
- 確認メッセージ例: 「`/design-review`で設計レビューの詳細ドキュメントを作成しますか？(y/N)」
- 作成する場合: `docs/local/<id>_design_review.md`に詳細解説を出力
- 作成しない場合: LOG.mdへの記録のみで完了

**Should Fixの対応判断基準:**

| 判断 | 条件 |
|------|------|
| 今回対応すべき | 未対応だとクリティカルな問題に寄与する場合 |
| 次回対応でOK | 動作する＆タスク成立要件を満たしている場合 |

**具体例:**
- **今回対応すべき**: セキュリティ脆弱性、データ不整合の可能性、テスト失敗
- **次回対応でOK**: 定数化、Docstring追加、コードスタイル改善

**「次回対応」のタスク化ルール:**
- 「次回対応」「次回タスクで対応」と判断した項目は、**必ずTASKS.mdにタスクとして追加**する
- タスクIDは `#TECH-XXX`（技術的負債）形式で採番
- 関連タスクIDをLOG.mdにも記載
- タスク化しないと対応するタイミングがなくなるため、必須ルールとする

**例:**
```markdown
## 技術的負債 [0/N]

### ⬜ #TECH-001 認証API定数化
- **発生元:** #D006
- **優先度:** 低
- **内容:**
  - JWT設定のマジックナンバー定数化
  - テストパスワードの定数化
  - display_name max_length定数化
```

---

## 🔍 検証ルール

### 検証手段と用途

| 検証手段 | 用途 | 実行タイミング |
|----------|------|----------------|
| pre-commit | フォーマット、lint | コミット前（自動） |
| TypeScript型チェック | 型安全性の検証 | CI/ローカル |
| GitHub Actions | lint, test, build, coverage | Push時（自動） |
| OpenAPI検証 | API仕様の構文・整合性チェック | Push時（自動） |
| テストコード | ロジック検証（pytest, vitest） | CI/ローカル |
| 実装前設計レビュー | SPEC準拠・アーキテクチャ確認 | 実装タスク開始時 |
| 実装後コードレビュー | 品質・テストカバレッジ検証 | タスク完了時 |
| Test Plan手動確認 | Docker動作、UI確認等 | PR作成前 |

### 使い分けフロー

```
[コード品質] → pre-commit（自動） + GitHub Actions（lint/format）
[型安全性]   → TypeScript型チェック（CI + ローカル）
[ロジック]   → テストコード + GitHub Actions（pytest/vitest）
[API仕様]    → OpenAPI検証（CI）
[設計準拠]   → 実装前: senior-architect-reviewer
              実装後: code-reviewer + qa-test-engineer
[手動確認]   → Test Plan実行 + qa-test-engineer
```

### カバレッジ要件（再掲）

- Service層: ≥80%
- Views: ≥60%
- Hooks: ≥70%

---

## 📁 プロジェクト構造

### フロントエンド

```
frontend/
├── src/
│   ├── features/              # 機能モジュール（独立性重視）
│   │   ├── locations/
│   │   │   ├── components/    # Location専用コンポーネント
│   │   │   ├── hooks/         # Location専用フック
│   │   │   ├── api/           # Location APIクライアント
│   │   │   ├── types/         # Location型定義
│   │   │   └── index.ts       # 公開API
│   │   ├── visits/
│   │   ├── trips/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── components/            # 共通コンポーネントのみ
│   │   ├── MapView/
│   │   ├── FilterBar/
│   │   └── ui/
│   ├── hooks/                # 共通フック
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts     # Axiosインスタンス
│   │   │   └── generated/    # OpenAPI自動生成（編集禁止）
│   │   ├── maps/
│   │   │   ├── interface.ts
│   │   │   ├── leaflet.ts
│   │   │   └── factory.ts
│   │   └── utils/
│   ├── stores/               # Zustand（最小限）
│   │   ├── authStore.ts
│   │   └── mapStore.ts
│   └── types/
```

**ルール:**
- `features/`内のモジュールは互いに直接importしない
- `components/`は2つ以上の機能で使う場合のみ配置
- グローバル状態は認証と地図中心のみ

### バックエンド

```
backend/
├── apps/
│   ├── locations/
│   │   ├── models.py          # データモデルのみ
│   │   ├── serializers.py     # DRFシリアライザ
│   │   ├── views.py           # 薄い（HTTP処理のみ）
│   │   ├── services.py        # ビジネスロジック（重要）
│   │   ├── filters.py
│   │   ├── urls.py
│   │   └── tests/
│   │       ├── test_models.py
│   │       ├── test_services.py   # 最重要
│   │       └── test_views.py
│   ├── visits/
│   ├── trips/
│   └── users/
├── core/
│   ├── models.py             # AbstractBaseModel
│   ├── services.py
│   └── permissions.py
└── config/
    └── settings/
```

**ルール:**
- `models.py`: データモデル定義のみ、ビジネスロジック禁止
- `views.py`: HTTP処理のみ、ビジネスロジック禁止
- `services.py`: すべてのビジネスロジックはここ

---

## 💻 コーディング規約

### TypeScript

#### 命名規則

```typescript
// コンポーネント: PascalCase
LocationCard.tsx
MapView.tsx

// ファイル: camelCase
locationApi.ts
useLocations.ts

// 関数/変数: camelCase
const fetchLocations = () => {};
const isLoading = false;

// 定数: UPPER_SNAKE_CASE
const MAX_RADIUS_KM = 50;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 型/インターフェース: PascalCase
interface Location {}
type LocationStatus = 'want_to_visit' | 'not_interested';
```

#### JSDoc（必須）

```typescript
/**
 * 指定半径内の場所を検索する
 *
 * PostGISを使用した地理空間クエリ。結果は距離順。
 *
 * @param point - 中心座標 (緯度, 経度)
 * @param radiusKm - 検索半径（km、最大100km）
 * @param filters - オプションのフィルタ
 * @returns 距離情報付き場所の配列
 * @throws {Error} radiusKmが最大値を超える場合
 *
 * @example
 * ```typescript
 * const locations = await findNearbyLocations(
 *   { lat: 35.6812, lng: 139.7671 },
 *   5,
 *   { category: 'cafe' }
 * );
 * ```
 */
export async function findNearbyLocations(
  point: Point,
  radiusKm: number,
  filters?: LocationFilters
): Promise<LocationWithDistance[]> {
  // 実装
}
```

#### React パターン

```typescript
// ✅ 良い例: 関数コンポーネント + hooks
interface LocationCardProps {
  location: Location;
  onEdit?: (location: Location) => void;
}

export function LocationCard({ location, onEdit }: LocationCardProps) {
  const handleClick = () => {
    onEdit?.(location);
  };

  return (
    <div onClick={handleClick}>
      <h3>{location.name}</h3>
      <p>{location.category.name}</p>
    </div>
  );
}

// ❌ 悪い例: クラスコンポーネント
class LocationCard extends React.Component { }
```

#### TanStack Query パターン

```typescript
// hooks/useLocations.ts
export function useLocations(filters?: LocationFilters) {
  return useQuery({
    queryKey: ['locations', filters],
    queryFn: () => locationApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5分
  });
}

// hooks/useCreateLocation.ts
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LocationCreate) => locationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
```

### Python

#### 命名規則

```python
# ファイル: snake_case
location_service.py
nearby_search.py

# クラス: PascalCase
class LocationService:
class RecommendationEngine:

# 関数/変数: snake_case
def find_nearby_locations():
user_count = 10

# 定数: UPPER_SNAKE_CASE
MAX_RADIUS_KM = 100
DEFAULT_PAGE_SIZE = 20

# プライベートメソッド: _先頭アンダースコア
def _calculate_score(self):
```

#### Docstring（必須）

```python
def find_nearby_locations(
    point: Point,
    radius_km: float,
    category: Optional[str] = None
) -> QuerySet[Location]:
    """
    PostGISを使用して指定半径内の場所を検索。

    この関数はPostGISの距離演算子を使用して地理空間検索を実行。
    結果は中心点からの距離順にソート。

    Args:
        point: 検索の中心点（PostGIS Point、SRID 4326）。
               例: Point(139.7671, 35.6812, srid=4326)
        radius_km: 検索半径（km）。最大は100km。
        category: 結果をフィルタするカテゴリslug。
                  例: 'cafe', 'restaurant'

    Returns:
        'distance'フィールドが注釈されたLocationのQuerySet。
        中心点からの近い順にソート済み。

    Raises:
        ValueError: radius_kmが負数またはMAX_RADIUS_KMを超える場合。

    Example:
        >>> center = Point(139.7671, 35.6812, srid=4326)
        >>> cafes = find_nearby_locations(center, 5.0, category='cafe')
        >>> for cafe in cafes[:5]:
        ...     print(f"{cafe.name}: {cafe.distance.km:.2f}km")
    """
    if radius_km <= 0 or radius_km > MAX_RADIUS_KM:
        raise ValueError(f"半径は0から{MAX_RADIUS_KM}kmの間")

    # 実装
```

#### Service層パターン（重要）

```python
# views.py - 薄い（10-20行）
class LocationViewSet(viewsets.ModelViewSet):
    """
    場所のCRUDエンドポイント。
    ビジネスロジックはLocationServiceに委譲。
    """

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """近傍検索エンドポイント"""
        # 1. パラメータ解析
        lat = float(request.query_params['lat'])
        lng = float(request.query_params['lng'])
        radius = float(request.query_params['radius'])
        category = request.query_params.get('category')

        # 2. サービス呼び出し
        point = Point(lng, lat, srid=4326)
        service = LocationService()
        locations = service.find_nearby(
            user=request.user,
            point=point,
            radius_km=radius,
            category=category
        )

        # 3. シリアライズして返す
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)

# services.py - ビジネスロジック
class LocationService:
    """場所関連のビジネスロジック"""

    def find_nearby(
        self,
        user: User,
        point: Point,
        radius_km: float,
        category: Optional[str] = None
    ) -> QuerySet[Location]:
        """近傍検索のビジネスロジック"""
        # バリデーション
        if radius_km > MAX_RADIUS_KM:
            raise ValidationError(f"半径は{MAX_RADIUS_KM}km以下")

        # PostGISクエリ
        locations = Location.objects.filter(
            user=user,
            point__distance_lte=(point, D(km=radius_km))
        ).annotate(
            distance=Distance('point', point)
        ).order_by('distance')

        # カテゴリフィルタ
        if category:
            locations = locations.filter(category__slug=category)

        return locations
```

---

## 🧪 テスト戦略

### バックエンドテスト

#### Fixture

```python
# conftest.py
@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='testpass123'
    )

@pytest.fixture
def tokyo_center():
    return Point(139.7671, 35.6812, srid=4326)

@pytest.fixture
def sample_locations(user, tokyo_center):
    category = Category.objects.create(name='カフェ', slug='cafe')
    locations = []
    for i in range(5):
        loc = Location.objects.create(
            user=user,
            name=f'カフェ{i+1}',
            point=Point(
                tokyo_center.x + (i * 0.01),
                tokyo_center.y + (i * 0.01),
                srid=4326
            ),
            category=category
        )
        locations.append(loc)
    return locations
```

#### Service層テスト（最重要）

```python
@pytest.mark.django_db
class TestLocationService:
    def test_find_nearby_within_radius(
        self, user, tokyo_center, sample_locations
    ):
        """半径内の場所を正しく検索できる"""
        service = LocationService()

        results = service.find_nearby(user, tokyo_center, radius_km=5.0)

        assert results.count() == 3
        assert all(loc.distance.km <= 5.0 for loc in results)
        assert results[0].distance < results[1].distance

    def test_find_nearby_excludes_other_users(
        self, user, other_user, tokyo_center
    ):
        """他ユーザーの場所は含まれない"""
        # other_userの場所作成
        Location.objects.create(
            user=other_user,
            name='他ユーザーのカフェ',
            point=tokyo_center,
            category=Category.objects.first()
        )

        service = LocationService()
        results = service.find_nearby(user, tokyo_center, radius_km=5.0)

        # userの場所のみ
        assert all(loc.user == user for loc in results)
```

### フロントエンドテスト

#### Hookテスト

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocations } from '../useLocations';

describe('useLocations', () => {
  const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('場所を正常に取得', async () => {
    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
```

---

## 📝 実装ワークフロー

### ステップ1: 仕様確認

```bash
# SPEC.md該当セクション確認
# OpenAPI仕様確認
# データモデル確認
```

### ステップ2: バックエンド実装

```
1. models.py（必要なら）
2. serializers.py
3. services.py（ビジネスロジック）
4. views.py（薄く）
5. tests/test_services.py（最重要）
6. tests/test_views.py
```

### ステップ3: フロントエンド実装

```
1. types/
2. api/
3. hooks/
4. components/
5. tests/
```

### ステップ4: 統合確認

```bash
# Docker起動
docker-compose up -d

# バックエンドテスト
docker-compose exec backend pytest

# フロントエンドテスト
docker-compose exec frontend npm test

# 手動確認
# http://localhost:5173
```

### ステップ5: OpenAPI更新

```yaml
# 新しいエンドポイントを追加した場合
docs/api/openapi.yml を更新
```

---

## 🚫 やってはいけないこと

### ❌ 悪い例: Fat View

```python
# ❌ viewsにビジネスロジック
class LocationViewSet(viewsets.ModelViewSet):
    def nearby(self, request):
        # 50行のビジネスロジック...
        # PostGISクエリ...
        # フィルタリング...
        # スコア計算...
        # → これは全部servicesに移動すべき
```

### ❌ 悪い例: グローバル状態の乱用

```typescript
// ❌ Zustandに何でも入れる
const useAppStore = create((set) => ({
  locations: [],
  visits: [],
  trips: [],
  // → これらはTanStack Queryで管理すべき
}));
```

### ❌ 悪い例: feature間の直接import

```typescript
// ❌ features間で直接import
import { LocationCard } from '@/features/locations/components/LocationCard';

// ✅ 共通化が必要なら components/ へ移動
import { LocationCard } from '@/components/LocationCard';
```

---

## ✅ 良い例集

### ✅ Thin View + Service

```python
# ✅ views.py
class LocationViewSet(viewsets.ModelViewSet):
    def nearby(self, request):
        point = Point(request.data['lng'], request.data['lat'])
        service = LocationService()
        locations = service.find_nearby(
            user=request.user,
            point=point,
            radius_km=request.data['radius']
        )
        return Response(LocationSerializer(locations, many=True).data)

# ✅ services.py
class LocationService:
    def find_nearby(self, user, point, radius_km):
        # ビジネスロジック
```

### ✅ Feature-based構造

```typescript
// ✅ features/locations/index.ts
export { LocationList } from './components/LocationList';
export { useLocations } from './hooks/useLocations';
export type { Location, LocationFilters } from './types/location';

// 他のfeatureから使用
import { useLocations, type Location } from '@/features/locations';
```

---

## 🔧 開発ツール

### VSCode拡張（推奨）

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### コマンド

```bash
# Lint
docker-compose exec backend black .
docker-compose exec backend flake8 .
docker-compose exec frontend npm run lint

# テスト
docker-compose exec backend pytest
docker-compose exec frontend npm test

# 型チェック
docker-compose exec frontend npm run type-check
```

---

## 📚 参考資料

- SPEC.md - 技術仕様（必読）
- docs/api/openapi.yml - API仕様
- [Django](https://docs.djangoproject.com/ja/)
- [DRF](https://www.django-rest-framework.org/)
- [React](https://ja.react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

---

## 🎯 Claude Code Skills

### 利用可能なスキル

| コマンド | 説明 | 使用例 |
|----------|------|--------|
| `/task <id>` | タスク実行 | `/task D007` |
| `/workflow` | ワークフロー確認 | `/workflow` |
| `/log <id>` | ログ記録 | `/log D007` |
| `/spec <section>` | SPEC.md参照 | `/spec 4.3.1` |
| `/guide [keyword]` | コーディング規約参照 | `/guide constants` |
| `/progress` | 進捗サマリー表示 | `/progress` |
| `/setup <env>` | 環境構築ガイド | `/setup local` |
| `/checklist <id>` | チェックリスト管理 | `/checklist D007` |
| `/review` | 変更レビュー | `/review` |
| `/pr <id>` | PR作成 | `/pr D007` |
| `/pr-feedback <pr>` | PRレビュー対応 | `/pr-feedback 23` |
| `/design-review <id>` | 設計レビュー詳細解説 | `/design-review 008` |

### スキル追加ルール

**8. 頻出処理のスキル化**

タスク実行中に以下の条件を満たす処理を検出した場合、スキル追加を提案する：

1. **検出条件**
   - 同じ処理が3回以上繰り返されている
   - 複数のタスクで共通して使用される可能性が高い
   - コマンド化することで効率が上がる

2. **確認フロー**
   ```
   この処理をスキルとして追加しますか？
   処理内容: <処理の説明>
   コマンド案: /<command-name>

   追加する場合は 'y' と回答してください (y/N):
   ```

3. **追加時のルール**
   - 既存スキルと重複しないこと（重複チェック必須）
   - `.claude/commands/<command>.md` に作成
   - CLAUDE.mdのスキル一覧に追加
   - docs/TASKS.mdにタスクとして記録

4. **重複チェック**
   - 既存スキルの機能と重複する場合は追加しない
   - 類似機能がある場合は既存スキルの拡張を検討

5. **詳細ルール**
   - スキル管理の詳細は [docs/SKILL.md](docs/SKILL.md) を参照

---

**このガイドに従えば、SPEC.mdに準拠した高品質な実装が可能です。**

**疑問があれば実装前に必ず質問してください。**
