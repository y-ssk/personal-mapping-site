# Personal Mapping Site

Google Mapsのブックマーク機能を大幅に拡張した個人向けマッピングサービス。

## 🎯 プロジェクト概要

場所データベース構築、訪問履歴管理、旅行計画を統合した個人向けWebアプリケーション。

### 主要機能

- **場所管理** - ブックマーク、階層カテゴリ、自由タグ、ステータス管理
- **訪問記録** - 同一場所への複数回訪問対応、5段階評価、長文レビュー
- **旅行計画** - 柔軟な計画作成（候補→順序付き→詳細スケジュール）、計画→実績の管理
- **地理空間検索** - PostGISによる近傍検索、距離計算、ルート最適化
- **おすすめ機能** - 訪問パターンに基づくスマート提案（将来的にML活用）
- **共有機能** - 場所リストの公開URL生成

### なぜこのプロジェクト？

- Google Mapsのブックマークは訪問履歴を記録できない
- 同じ場所への複数回訪問を個別に管理したい
- 旅行の計画と実績を分けて管理したい
- 個人の場所データベースを構築したい

---

## 🚀 クイックスタート

### 前提条件

- Docker Desktop 20.10+
- Git 2.30+
- 8GB RAM以上

### 5分でローカル環境構築

```bash
# 1. リポジトリクローン
git clone <https://github.com/y-ssk/personal-mapping-site.git>
cd personal-mapping-site

# 2. 全サービス起動
docker-compose up -d

# 3. マイグレーション実行
docker-compose exec backend python manage.py migrate

# 4. スーパーユーザー作成
docker-compose exec backend python manage.py createsuperuser

# 5. アクセス
# フロントエンド: http://localhost:5173
# バックエンドAPI: http://localhost:8000/api/v1/
# Django管理画面: http://localhost:8000/admin/
```

詳細な環境構築手順: **[docs/setup/LOCAL_SETUP.md](docs/setup/LOCAL_SETUP.md)**

---

## 📚 ドキュメント

### 必読ドキュメント

| ドキュメント | 目的 | いつ読む？ |
|------------|------|-----------|
| **[SPEC.md](SPEC.md)** | 技術仕様書（63KB） | 実装前に必ず読む |
| **[CLAUDE.md](CLAUDE.md)** | 開発ガイド（20KB） | コード書く前に読む |
| **[docs/WORKFLOW.md](docs/WORKFLOW.md)** | タスク実行フロー | タスク実行時（必読） |
| **[docs/AGENTS.md](docs/AGENTS.md)** | エージェント・自動化戦略 | Sub Agent詳細確認時 |
| **[docs/TASKS.md](docs/TASKS.md)** | タスク管理（全56タスク） | タスク選択時 |

### その他ドキュメント

- **[docs/api/openapi.yml](docs/api/openapi.yml)** - OpenAPI 3.0仕様
- **[docs/setup/LOCAL_SETUP.md](docs/setup/LOCAL_SETUP.md)** - ローカル環境構築
- **[docs/setup/RENDER_DEPLOYMENT.md](docs/setup/RENDER_DEPLOYMENT.md)** - Renderデプロイ手順
- **[docs/setup/RAILWAY_MIGRATION.md](docs/setup/RAILWAY_MIGRATION.md)** - Railway移行手順
- **[docs/SKILL.md](docs/SKILL.md)** - スキル管理ドキュメント

---

## 🛠️ 技術スタック

### フロントエンド
- **言語:** TypeScript 5
- **フレームワーク:** React 18 + Vite 5
- **状態管理:** TanStack Query v5（サーバー状態）+ Zustand v4（UI状態）
- **スタイリング:** Tailwind CSS 3 + material-tailwind
- **地図:** Leaflet 1.9（MVP）→ Google Maps（将来）
- **テスト:** Vitest + React Testing Library

### バックエンド
- **言語:** Python 3.11
- **フレームワーク:** Django 5.0 + Django REST Framework 3.14
- **地理空間:** GeoDjango + PostGIS 3.3
- **認証:** JWT（Simple JWT）+ OAuth（Google/GitHub）
- **WSGIサーバー:** Gunicorn + WhiteNoise（nginxなし）
- **テスト:** pytest + pytest-django

### データベース
- **RDBMS:** PostgreSQL 15
- **拡張:** PostGIS 3.3（地理空間データ）

### インフラ・開発
- **開発環境:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **コミット前チェック:** pre-commit（Black, flake8, isort, ESLint, Prettier）
- **MVP:** Render無料枠（$0/月）
- **本番:** Railway Hobby（$5/月）

---

## 📐 アーキテクチャの特徴

### なぜこの技術選定？

**React + Vite（vs Next.js）:**
- ✅ セキュリティ（最近のNext.js脆弱性回避）
- ✅ シンプル（認証アプリにSEO不要）
- ✅ 高速な開発サーバー

**Django + GeoDjango（vs Rails/Spring Boot）:**
- ✅ 最強のPostGIS統合（3行で地理空間クエリ）
- ✅ DRFで高速API開発
- ✅ 将来のML統合に最適

**Service層パターン:**
- ✅ 薄いView（HTTP処理のみ）
- ✅ 太いService（ビジネスロジック）
- ✅ テスト容易性・再利用性

**nginxなし:**
- ✅ 1,000-10,000ユーザーならGunicorn + WhiteNoiseで十分
- ✅ シンプルな構成
- ✅ ボトルネックは別（DBクエリ、シリアライズ）

詳細: **[SPEC.md § 5（技術スタックと選定根拠）](SPEC.md)**

---

## 📊 開発進捗

**全体:** 19/56タスク完了（34%）

| フェーズ | 進捗 | 状態 |
|---------|-----|------|
| フェーズ0: ドキュメント整備 | 10/17 | 🔄 進行中 |
| Claude Code Skills | 8/8 | ✅ 完了 |
| 技術的負債 | 0/6 | ⬜ 未着手 |
| フェーズ1: 環境構築 | 1/5 | 🔄 進行中 |
| フェーズ2: 認証システム | 0/3 | ⬜ 未着手 |
| フェーズ3: コア機能（Location） | 0/9 | ⬜ 未着手 |
| フェーズ4: 訪問記録（Visit） | 0/3 | ⬜ 未着手 |
| フェーズ5: 旅行計画（Trip） | 0/6 | ⬜ 未着手 |
| フェーズ6: ダッシュボード | 0/3 | ⬜ 未着手 |
| フェーズ7: 共有機能 | 0/1 | ⬜ 未着手 |

詳細: **[docs/TASKS.md](docs/TASKS.md)**

---

## 🤝 開発ワークフロー

### Claude Codeスキルでタスクを実行する

**詳細ガイド: [docs/WORKFLOW.md](docs/WORKFLOW.md)**

```
[Claude Code] タスク実行
    /task <id>
         |
         v
[Claude Code] 設計レビュー（自動）
    senior-architect-reviewer による SPEC/CLAUDE 準拠確認
         |
         v
[Claude Code] 実装
    implementation-engineer または手動実装
         |
         v
[Claude Code] 実装後レビュー（自動）
    code-reviewer + qa-test-engineer
         |
         v
[Claude Code] 変更レビュー
    /review
         |
         v
[Claude Code] PR作成
    /pr <id>
         |
         v
[Claude Code] ログ記録
    /log <id>
```

### 利用可能なスキル

| コマンド | 説明 |
|----------|------|
| `/task <id>` | タスク実行 |
| `/spec <section>` | SPEC.md参照 |
| `/guide [keyword]` | CLAUDE.md参照 |
| `/progress` | 進捗サマリー |
| `/review` | 変更レビュー |
| `/pr <id>` | PR作成 |
| `/log <id>` | ログ記録 |
| `/checklist <id>` | チェックリスト管理 |
| `/design-review <id>` | 設計レビュー詳細 |

### 仕様駆動開発（SDD）

このプロジェクトは**仕様駆動開発（Specification-Driven Development）**で進めます。

詳細: **[docs/AGENTS.md](docs/AGENTS.md)** | **[docs/WORKFLOW.md](docs/WORKFLOW.md)**

### 重要な原則

**✅ すべきこと:**
- SPEC.mdを読んでから実装
- 仕様に厳密に従う
- テストを必ず作成
- 不明点は質問する
- 設計レビューを受ける

**❌ してはいけないこと:**
- 仕様にない機能の追加
- 勝手な改善や最適化
- アーキテクチャの変更
- 仕様を読まずに実装
- **暫定対応（プレースホルダー実装）**

詳細: **[SPEC.md（冒頭の重要原則）](SPEC.md)** | **[CLAUDE.md](CLAUDE.md)**

---

## 🧪 テスト・品質管理

### カバレッジ目標

```
バックエンド:
├─ Service層:   ≥ 80%（最重要）
├─ Views:       ≥ 60%
├─ Models:      ≥ 70%
└─ Utils:       ≥ 80%

フロントエンド:
├─ Services/Hooks: ≥ 70%
├─ Components:     ≥ 50%
└─ Utils:          ≥ 80%
```

### コマンド

```bash
# Lint/Format
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

## 🚀 デプロイ

### MVP（無料枠 - $0/月）

```
Render無料:
- フロントエンド: Vercel（無料）
- バックエンド: Render Web Service（無料、15分スリープ）
- データベース: Render PostgreSQL（無料、90日期限）

制約: 受け入れ可能（ポートフォリオ用途）
```

### 本番（Railway - $5/月）

```
Railway + Vercel:
- フロントエンド: Vercel（無料）
- バックエンド: Railway Hobby（$5/月、常時稼働）
- データベース: Railway PostgreSQL（含む）

メリット: スリープなし、永続DB
```

詳細: **[SPEC.md § 6（インフラ構成）](SPEC.md)**

---

## 📈 将来の拡張（優先順位順）

1. **カスタムカテゴリ**（高）- ユーザー定義カテゴリツリー
2. **フォトアルバム**（高）- 訪問ごとに複数画像、S3統合
3. **AIおすすめ**（高）- 機械学習モデル、協調フィルタリング
4. **外部統合**（中）- Googleカレンダー、天気API
5. **高度な分析**（中）- ヒートマップ、トレンド、予算追跡
6. **一括操作**（中）- 複数選択、バッチ編集
7. **Google Maps移行**（中）- Places API統合
8. **旅行共有**（中）- 協働旅行計画
9. **モバイルアプリ**（低）- React Native
10. **ソーシャル機能**（低）- フォロー、共有おすすめ

---

## 🔧 開発環境

### 推奨VSCode拡張

- Python
- Black Formatter
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### コマンド一覧

```bash
# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f backend
docker-compose logs -f frontend

# コンテナ内シェル
docker-compose exec backend bash
docker-compose exec frontend sh

# 停止
docker-compose down

# 完全クリーン
docker-compose down -v
```

---

## 📝 Git規約

### ブランチ戦略

```
main          → 本番環境
develop       → ステージング環境
feature/*     → 機能開発
bugfix/*      → バグ修正
hotfix/*      → 緊急修正
```

### コミットメッセージ

```
<type>(<scope>): <subject>

例:
feat(locations): 近傍検索エンドポイントを追加
fix(visits): 日付バリデーションロジックを修正
docs(api): Trip用OpenAPIスキーマを更新
```

---

## 📄 ライセンス

MIT License

---

## 👤 作成者

**roca**

- 目的: ポートフォリオ、技術コミュニティ発表、フリーランス案件獲得

---

**最終更新:** 2026年2月12日
