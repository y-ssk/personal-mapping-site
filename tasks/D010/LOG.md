# タスクログ: #D010 LOCAL_SETUP.md作成

## 基本情報
- **タスク名:** LOCAL_SETUP.md作成
- **実行日:** 2025-01-25
- **ブランチ:** docs/local-setup
- **PR:** https://github.com/y-ssk/personal-mapping-site/pull/5

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D010
./scripts/claude/run_task.sh D010
```

### 2. SPEC.md確認
- § 6.1 開発環境（Docker Compose）

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `docs/setup/LOCAL_SETUP.md` | ローカル開発環境セットアップガイド |

### 4. ドキュメント構成

1. **前提条件**
   - Docker 20.10+
   - Docker Compose 2.0+
   - Git 2.30+
   - Node.js 20.x
   - Python 3.11+

2. **クイックスタート（5分）**
   - リポジトリクローン
   - 環境変数設定
   - Docker Compose起動
   - マイグレーション実行

3. **詳細手順**
   - 環境変数の説明
   - Docker Composeコマンド
   - データベースセットアップ
   - アクセスURL一覧

4. **開発ワークフロー**
   - コード変更の反映
   - 依存パッケージ追加
   - マイグレーション
   - テスト実行
   - Lint/Format

5. **トラブルシューティング（6項目）**
   - Docker Compose起動失敗
   - データベース接続エラー
   - PostGIS拡張エラー
   - ホットリロード不具合
   - ポート競合
   - 権限エラー

6. **サービスの停止**
7. **次のステップ**
8. **付録: Docker Compose構成**

---

## 成果物
- `docs/setup/LOCAL_SETUP.md`

## 次のステップ
- #001 プロジェクト初期化後に手順を実際に検証
