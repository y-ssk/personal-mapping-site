/**
 * ログイン処理用フック。
 *
 * TanStack Queryを使用してログインAPIを呼び出す。
 */
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { login, getCurrentUser, AuthApiError } from '../api/authApi';
import type { LoginRequest, User } from '../types/auth';

interface UseLoginResult {
  /** ログイン実行関数 */
  login: (credentials: LoginRequest) => Promise<User>;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: AuthApiError | null;
  /** エラーをリセット */
  reset: () => void;
}

/**
 * ログイン処理を行うカスタムフック。
 *
 * @returns ログイン関連の状態と関数
 *
 * @example
 * ```typescript
 * const { login, isLoading, error } = useLogin();
 *
 * const handleSubmit = async (data: LoginRequest) => {
 *   try {
 *     await login(data);
 *     navigate('/dashboard');
 *   } catch {
 *     // エラーはerrorに格納される
 *   }
 * };
 * ```
 */
export function useLogin(): UseLoginResult {
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<User> => {
      // ログイン実行（トークン保存はauthApi内で行う）
      await login(credentials);

      // ユーザー情報を取得
      const user = await getCurrentUser();

      // Zustandストアに保存
      setUser(user);

      return user;
    },
  });

  return {
    login: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error as AuthApiError | null,
    reset: mutation.reset,
  };
}
