/**
 * ローカルストレージのキー定数。
 *
 * ストレージアクセス時のキー名を一元管理する。
 */

/** 認証関連のストレージキー */
export const STORAGE_KEYS = {
  /** JWTアクセストークン */
  ACCESS_TOKEN: 'access_token',
  /** JWTリフレッシュトークン */
  REFRESH_TOKEN: 'refresh_token',
} as const;
