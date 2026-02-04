/**
 * ログアウト処理用フック。
 *
 * TanStack Queryを使用してログアウトAPIを呼び出す。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { logout, AuthApiError } from '../api/authApi';

interface UseLogoutResult {
  /** ログアウト実行関数 */
  logout: () => Promise<void>;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: AuthApiError | null;
}

/**
 * ログアウト処理を行うカスタムフック。
 *
 * @returns ログアウト関連の状態と関数
 *
 * @example
 * ```typescript
 * const { logout, isLoading } = useLogout();
 *
 * const handleLogout = async () => {
 *   await logout();
 *   navigate('/login');
 * };
 * ```
 */
export function useLogout(): UseLogoutResult {
  const storeLogout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      // APIログアウト実行（トークン削除もauthApi内で行う）
      await logout();

      // Zustandストアをリセット
      storeLogout();

      // TanStack Queryのキャッシュをクリア
      queryClient.clear();
    },
  });

  return {
    logout: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error as AuthApiError | null,
  };
}
