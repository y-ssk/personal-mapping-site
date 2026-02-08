/**
 * 認証関連の型定義。
 *
 * OpenAPI仕様（docs/api/openapi.yml）に準拠。
 * APIレスポンスはsnake_case、フロントエンド内部はcamelCaseで統一。
 */

// ============================================
// API レスポンス型（snake_case）
// ============================================

/**
 * APIから返されるユーザー情報（snake_case）
 */
export interface ApiUser {
  id: number;
  email: string;
  display_name: string;
  oauth_provider: string | null;
  date_joined: string;
}

/**
 * 認証トークン（ログイン/登録成功時のレスポンス）
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * OAuth認証成功時のレスポンス
 */
export interface OAuthLoginResponse extends AuthTokens {
  user: ApiUser;
}

// ============================================
// フロントエンド内部型（camelCase）
// ============================================

/**
 * フロントエンドで使用するユーザー情報
 */
export interface User {
  id: number;
  email: string;
  displayName: string;
  oauthProvider: string | null;
  dateJoined: string;
}

// ============================================
// リクエスト型
// ============================================

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * ユーザー登録リクエスト
 */
export interface RegisterRequest {
  email: string;
  password1: string;
  password2: string;
  display_name?: string;
}

/**
 * OAuthリクエスト
 */
export interface OAuthRequest {
  access_token?: string;
  code?: string;
}

/**
 * トークンリフレッシュリクエスト
 */
export interface RefreshTokenRequest {
  refresh: string;
}

// ============================================
// エラー型
// ============================================

/**
 * APIバリデーションエラー
 */
export interface ApiValidationError {
  [field: string]: string[];
}

/**
 * 認証エラー
 */
export interface AuthError {
  non_field_errors?: string[];
  email?: string[];
  password?: string[];
  password1?: string[];
  password2?: string[];
  display_name?: string[];
}

// ============================================
// 変換関数
// ============================================

/**
 * APIユーザーをフロントエンドUser型に変換
 *
 * @param apiUser - APIから返されたユーザー情報
 * @returns フロントエンド用のUser
 */
export function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    displayName: apiUser.display_name,
    oauthProvider: apiUser.oauth_provider,
    dateJoined: apiUser.date_joined,
  };
}
