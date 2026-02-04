/**
 * 現在のユーザー情報取得フック。
 *
 * TanStack Queryを使用してユーザー情報APIを呼び出す。
 */
import { useQuery } from '@tanstack/react-query';

import { STORAGE_KEYS } from '@/lib/constants';

import { getCurrentUser, AuthApiError } from '../api/authApi';
import type { User } from '../types/auth';

/** クエリキー */
const CURRENT_USER_QUERY_KEY = ['auth', 'currentUser'] as const;

/** キャッシュ有効期間（5分） */
const STALE_TIME_MS = 5 * 60 * 1000;

interface UseCurrentUserResult {
  /** ユーザー情報 */
  user: User | undefined;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: AuthApiError | null;
  /** 再取得関数 */
  refetch: () => void;
}

/**
 * 現在のユーザー情報を取得するカスタムフック。
 *
 * トークンが存在する場合のみAPIを呼び出す。
 *
 * @returns ユーザー情報と状態
 *
 * @example
 * ```typescript
 * const { user, isLoading, error } = useCurrentUser();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage />;
 * if (user) return <UserProfile user={user} />;
 * ```
 */
export function useCurrentUser(): UseCurrentUserResult {
  // トークンが存在する場合のみクエリを実行
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: STALE_TIME_MS,
    enabled: hasToken,
    retry: false, // 認証エラー時はリトライしない
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error as AuthApiError | null,
    refetch: query.refetch,
  };
}

/** クエリキーをエクスポート（キャッシュ操作用） */
export { CURRENT_USER_QUERY_KEY };
