/**
 * API関連の定数。
 *
 * HTTPステータスコードやAPIエンドポイントを一元管理する。
 */

/** HTTPステータスコード */
export const HTTP_STATUS = {
  /** 成功 */
  OK: 200,
  /** 作成成功 */
  CREATED: 201,
  /** 認証エラー */
  UNAUTHORIZED: 401,
  /** 権限エラー */
  FORBIDDEN: 403,
  /** 未検出 */
  NOT_FOUND: 404,
  /** サーバーエラー */
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** API関連のエラーメッセージ */
export const API_MESSAGES = {
  /** ネットワークエラー */
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  /** 認証エラー */
  UNAUTHORIZED: '認証に失敗しました。再ログインしてください',
  /** サーバーエラー */
  SERVER_ERROR: 'サーバーエラーが発生しました',
} as const;
