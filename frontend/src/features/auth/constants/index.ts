/**
 * 認証関連の定数。
 *
 * CLAUDE.md § 6 マジックナンバー禁止に準拠。
 */

export * from './messages';

/** 認証関連の定数 */
export const AUTH_CONSTANTS = {
  /** パスワード最小文字数 */
  PASSWORD_MIN_LENGTH: 8,
  /** 表示名最大文字数 */
  DISPLAY_NAME_MAX_LENGTH: 100,
  /** メールアドレス最大文字数 */
  EMAIL_MAX_LENGTH: 254,
} as const;

/** APIエンドポイント */
export const AUTH_ENDPOINTS = {
  REGISTER: '/api/v1/auth/register/',
  LOGIN: '/api/v1/auth/login/',
  LOGOUT: '/api/v1/auth/logout/',
  REFRESH: '/api/v1/auth/refresh/',
  ME: '/api/v1/auth/me/',
  GOOGLE: '/api/v1/auth/google/',
  GITHUB: '/api/v1/auth/github/',
} as const;

/** OAuthプロバイダー */
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
} as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS];
