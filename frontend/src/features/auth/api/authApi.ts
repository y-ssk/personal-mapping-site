/**
 * 認証APIクライアント。
 *
 * SPEC.md § 4.2 認証エンドポイントに準拠。
 */

import { apiClient } from '@/lib/api/client';
import { STORAGE_KEYS } from '@/lib/constants';

import { AUTH_ENDPOINTS, AUTH_MESSAGES } from '../constants';
import type {
  ApiUser,
  AuthTokens,
  LoginRequest,
  OAuthLoginResponse,
  OAuthRequest,
  RefreshTokenRequest,
  RegisterRequest,
  User,
} from '../types/auth';
import { toUser as convertToUser } from '../types/auth';

/**
 * 認証エラークラス
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * ログイン処理
 *
 * @param credentials - ログイン情報
 * @returns 認証トークン
 * @throws {AuthApiError} 認証失敗時
 */
export async function login(credentials: LoginRequest): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<AuthTokens>(AUTH_ENDPOINTS.LOGIN, credentials);
    const tokens = response.data;

    // トークンをローカルストレージに保存
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

    return tokens;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 400) {
      // ログイン失敗（入力エラー）
      throw new AuthApiError(
        AUTH_MESSAGES.LOGIN_FAILED,
        400,
        error.response.data as Record<string, string[]>
      );
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * ユーザー登録処理
 *
 * @param data - 登録情報
 * @returns 認証トークン
 * @throws {AuthApiError} 登録失敗時
 */
export async function register(data: RegisterRequest): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<AuthTokens>(AUTH_ENDPOINTS.REGISTER, data);
    const tokens = response.data;

    // トークンをローカルストレージに保存
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

    return tokens;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 400) {
      const errors = error.response.data as Record<string, string[]>;
      // メールアドレス重複チェック
      if (errors.email?.some((e) => e.includes('already'))) {
        throw new AuthApiError(AUTH_MESSAGES.EMAIL_EXISTS, 400, errors);
      }
      throw new AuthApiError(AUTH_MESSAGES.REGISTER_FAILED, 400, errors);
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * ログアウト処理
 *
 * @throws {AuthApiError} ログアウト失敗時
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
  } catch {
    // ログアウト失敗してもローカルのトークンは削除
  } finally {
    // ローカルストレージからトークン削除
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

/**
 * 現在のユーザー情報を取得
 *
 * @returns ユーザー情報
 * @throws {AuthApiError} 取得失敗時
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await apiClient.get<ApiUser>(AUTH_ENDPOINTS.ME);
    return convertToUser(response.data);
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new AuthApiError(AUTH_MESSAGES.UNAUTHORIZED, 401);
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * トークンリフレッシュ処理
 *
 * @param refreshToken - リフレッシュトークン
 * @returns 新しい認証トークン
 * @throws {AuthApiError} リフレッシュ失敗時
 */
export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<AuthTokens>(AUTH_ENDPOINTS.REFRESH, {
      refresh: refreshToken,
    } as RefreshTokenRequest);

    const tokens = response.data;

    // 新しいトークンを保存
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
    }

    return tokens;
  } catch (error: unknown) {
    // リフレッシュ失敗時はトークンを削除
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (isAxiosError(error) && error.response?.status === 401) {
      throw new AuthApiError(AUTH_MESSAGES.SESSION_EXPIRED, 401);
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Google OAuth認証
 *
 * @param data - OAuthリクエスト（access_tokenまたはcode）
 * @returns ユーザー情報と認証トークン
 * @throws {AuthApiError} 認証失敗時
 */
export async function googleLogin(data: OAuthRequest): Promise<{ user: User; tokens: AuthTokens }> {
  try {
    const response = await apiClient.post<OAuthLoginResponse>(AUTH_ENDPOINTS.GOOGLE, data);
    const { user, access, refresh } = response.data;

    // トークンを保存
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);

    return {
      user: convertToUser(user),
      tokens: { access, refresh },
    };
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 400) {
      throw new AuthApiError(
        AUTH_MESSAGES.OAUTH_FAILED,
        400,
        error.response.data as Record<string, string[]>
      );
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * GitHub OAuth認証
 *
 * @param data - OAuthリクエスト（access_tokenまたはcode）
 * @returns ユーザー情報と認証トークン
 * @throws {AuthApiError} 認証失敗時
 */
export async function githubLogin(data: OAuthRequest): Promise<{ user: User; tokens: AuthTokens }> {
  try {
    const response = await apiClient.post<OAuthLoginResponse>(AUTH_ENDPOINTS.GITHUB, data);
    const { user, access, refresh } = response.data;

    // トークンを保存
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);

    return {
      user: convertToUser(user),
      tokens: { access, refresh },
    };
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 400) {
      throw new AuthApiError(
        AUTH_MESSAGES.OAUTH_FAILED,
        400,
        error.response.data as Record<string, string[]>
      );
    }
    throw new AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
  }
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * Axiosエラー判定
 */
function isAxiosError(
  error: unknown
): error is { response?: { status: number; data: unknown }; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  );
}
