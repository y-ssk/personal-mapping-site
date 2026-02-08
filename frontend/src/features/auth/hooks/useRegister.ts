/**
 * ユーザー登録処理用フック。
 *
 * TanStack Queryを使用して登録APIを呼び出す。
 */
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import { register, getCurrentUser, AuthApiError } from '../api/authApi';
import type { RegisterRequest, User } from '../types/auth';

interface UseRegisterResult {
  /** 登録実行関数 */
  register: (data: RegisterRequest) => Promise<User>;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: AuthApiError | null;
  /** エラーをリセット */
  reset: () => void;
}

/**
 * ユーザー登録処理を行うカスタムフック。
 *
 * @returns 登録関連の状態と関数
 *
 * @example
 * ```typescript
 * const { register, isLoading, error } = useRegister();
 *
 * const handleSubmit = async (data: RegisterRequest) => {
 *   try {
 *     await register(data);
 *     navigate('/dashboard');
 *   } catch {
 *     // エラーはerrorに格納される
 *   }
 * };
 * ```
 */
export function useRegister(): UseRegisterResult {
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: async (data: RegisterRequest): Promise<User> => {
      // 登録実行（トークン保存はauthApi内で行う）
      await register(data);

      // ユーザー情報を取得
      const user = await getCurrentUser();

      // Zustandストアに保存
      setUser(user);

      return user;
    },
  });

  return {
    register: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error as AuthApiError | null,
    reset: mutation.reset,
  };
}
