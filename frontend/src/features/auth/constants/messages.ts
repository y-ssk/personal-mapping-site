/**
 * 認証関連のエラーメッセージ。
 *
 * CLAUDE.md § 7 エラーメッセージの一元管理に準拠。
 */

/** 認証メッセージ */
export const AUTH_MESSAGES = {
  /** ログイン失敗 */
  LOGIN_FAILED: 'メールアドレスまたはパスワードが正しくありません',
  /** ログイン成功 */
  LOGIN_SUCCESS: 'ログインしました',
  /** 登録成功 */
  REGISTER_SUCCESS: 'アカウントを作成しました',
  /** 登録失敗 */
  REGISTER_FAILED: 'アカウントの作成に失敗しました',
  /** ログアウト成功 */
  LOGOUT_SUCCESS: 'ログアウトしました',
  /** セッション期限切れ */
  SESSION_EXPIRED: 'セッションが切れました。再ログインしてください',
  /** 未認証エラー */
  UNAUTHORIZED: 'この操作を行う権限がありません',
  /** OAuth失敗 */
  OAUTH_FAILED: '外部認証に失敗しました。再度お試しください',
  /** パスワード不一致 */
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  /** メールアドレス重複 */
  EMAIL_EXISTS: 'このメールアドレスは既に登録されています',
  /** ネットワークエラー */
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
} as const;

/** フォームラベル */
export const AUTH_LABELS = {
  EMAIL: 'メールアドレス',
  PASSWORD: 'パスワード',
  PASSWORD_CONFIRM: 'パスワード（確認）',
  DISPLAY_NAME: '表示名',
  LOGIN_BUTTON: 'ログイン',
  REGISTER_BUTTON: 'アカウント作成',
  LOGOUT_BUTTON: 'ログアウト',
  GOOGLE_LOGIN: 'Googleでログイン',
  GITHUB_LOGIN: 'GitHubでログイン',
  HAVE_ACCOUNT: '既にアカウントをお持ちの方',
  NO_ACCOUNT: 'アカウントをお持ちでない方',
  LOGIN_LINK: 'ログインはこちら',
  REGISTER_LINK: '新規登録はこちら',
} as const;

/** プレースホルダー */
export const AUTH_PLACEHOLDERS = {
  EMAIL: 'example@email.com',
  PASSWORD: '8文字以上で入力',
  DISPLAY_NAME: '表示名を入力（任意）',
} as const;
