/**
 * 認証機能モジュール。
 *
 * SPEC.md § 2.2.1 Feature-based構造に準拠。
 * 認証関連のコンポーネント、フック、型、APIを提供する。
 */

// コンポーネント
export { LoginForm, RegisterForm, OAuthButtons, OAuthCallback } from './components';

// ページ
export { LoginPage, RegisterPage } from './pages';

// フック
export { useAuth, useLogin, useLogout, useRegister, useCurrentUser } from './hooks';

// 型
export type {
  User,
  ApiUser,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  OAuthRequest,
} from './types/auth';
export { toUser } from './types/auth';

// 定数
export { AUTH_MESSAGES, AUTH_LABELS, AUTH_CONSTANTS, AUTH_ENDPOINTS } from './constants';

// API
export { AuthApiError } from './api/authApi';
