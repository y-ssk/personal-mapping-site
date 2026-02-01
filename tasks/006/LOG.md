# タスク #D006 実行ログ

## 基本情報
- **タスクID**: D006
- **タイトル**: バックエンド認証API
- **実行日**: 2026-02-01
- **ブランチ**: feature/auth-backend
- **PR**: https://github.com/y-ssk/personal-mapping-site/pull/17

## 実行内容

### 1. JWT設定追加
- `backend/config/settings/base.py`にSIMPLE_JWT設定追加
- アクセストークン: 60分、リフレッシュトークン: 7日
- `django.contrib.sites`とSITE_ID=1を追加（allauth用）

### 2. URL設定
- `backend/apps/users/urls.py`を新規作成
- `/api/v1/auth/`配下に5つのエンドポイント配置

### 3. カスタムシリアライザ
- `backend/apps/users/serializers.py`を新規作成
- `CustomRegisterSerializer`: display_name対応、メール重複チェック
- `CustomUserDetailsSerializer`: GET /api/v1/auth/me/ 用

### 4. テスト作成
- `test_auth_api.py`: 認証APIエンドポイントテスト（21件）
- `test_models.py`: Userモデルテスト（8件）
- `test_serializers.py`: シリアライザテスト（3件）
- 合計32件、カバレッジ100%

### 5. OpenAPI更新
- `UserRegister`スキーマ: email, password1, password2, display_name
- `User`スキーマ: id, email, display_name, date_joined
- ログインエラーレスポンス: 401→400に修正
- ログアウトレスポンス: 205→200に修正

## 解決した課題

### allauth Site.DoesNotExist
- **原因**: allauthがSiteオブジェクトを要求
- **解決**: conftest.pyにsetup_siteフィクスチャ追加、SITE_ID=1設定

### メール確認リダイレクトエラー
- **原因**: allauthがメール確認URLを生成しようとした
- **解決**: test.pyに`ACCOUNT_EMAIL_VERIFICATION = "none"`追加

### メール重複IntegrityError
- **原因**: dj-rest-authがDB挿入前にメール重複チェックをしない
- **解決**: CustomRegisterSerializerにvalidate_emailメソッド追加

## コミット
- `1836f4e` feat(auth): バックエンド認証API実装

## 成果物
- PR #17: https://github.com/y-ssk/personal-mapping-site/pull/17
