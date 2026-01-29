# 環境構築ガイド表示

環境種別に応じたセットアップガイドを表示します。

## 使用方法

引数: $ARGUMENTS

## 環境種別

- `local` → docs/setup/LOCAL_SETUP.md
- `render` → docs/setup/RENDER_DEPLOYMENT.md
- `railway` → docs/setup/RAILWAY_MIGRATION.md
- `maps` → docs/setup/GOOGLE_MAPS_MIGRATION.md

## 実行手順

1. 引数で指定された環境種別を判定
2. 対応するドキュメントを読んで表示
3. 引数がなければ利用可能な環境種別の一覧を表示
