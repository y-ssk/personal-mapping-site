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

---

## 追加議論（2026-02-01）

### きっかけ
ユーザーからログイン失敗時のステータスコード（400 vs 401）についてChatGPTにレビューさせた結果を共有され、Claude Codeの見解を求められた。

### 議論の要約

#### 背景
- ログイン失敗時に400を返すのか401を返すのかは、設計判断として明示的に決定されていなかった
- Claude Codeは「dj-rest-authのデフォルト動作（400）に従っている」と説明
- ChatGPTから「テストは仕様ではない」「設計判断の根拠としては弱い」との指摘

#### ChatGPTの分析
1. **dj-rest-authの設計思想**
   - ログインは「認証」ではなく「フォーム入力」として扱う
   - 認証失敗 = 入力値の検証エラー → 400 Bad Request

2. **400と401の違い**
   - 401: 保護されたリソースへのアクセス失敗（RFC的な「認証」）
   - 400: 入力値が不正（バリデーションエラー）

3. **指摘事項**
   - 「テストが400だから正しい」は設計根拠として弱い
   - どちらを選んでも良いが「理由を書くべき」

#### 結論
- **採用**: 400（dj-rest-auth流）を維持
- **理由**:
  1. SPA + フォーム主体のUIに適合
  2. 外部クライアントを想定しない個人利用アプリ
  3. フレームワークのデフォルトに従うことでメンテナンス性維持

### 対応内容
- SPEC.md セクション8.1に「認証APIエラーレスポンス設計」を追記
- 設計方針と採用理由を明文化
- 将来の拡張時の注意事項も記載
