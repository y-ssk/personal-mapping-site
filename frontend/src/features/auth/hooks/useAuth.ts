/**
 * 認証状態統合フック。
 *
 * アプリ起動時の認証状態初期化と、認証関連の状態・関数を提供する。
 */
import { useEffect } from 'react';

import { STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

import { getCurrentUser } from '../api/authApi';
import type { User } from '../types/auth';

interface UseAuthResult {
  /** ユーザー情報 */
  user: User | null;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** 認証状態読み込み中かどうか */
  isLoading: boolean;
}

/**
 * 認証状態を管理する統合フック。
 *
 * アプリ起動時に呼び出し、トークンが存在する場合はユーザー情報を取得する。
 * ZustandストアとTanStack Queryの状態を統合して提供する。
 *
 * @returns 認証状態
 *
 * @example
 * ```typescript
 * // App.tsxで使用
 * function App() {
 *   const { isLoading, isAuthenticated } = useAuth();
 *
 *   if (isLoading) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return (
 *     <Routes>
 *       <Route path="/login" element={<LoginPage />} />
 *       <Route
 *         path="/dashboard"
 *         element={
 *           isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
 *         }
 *       />
 *     </Routes>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthResult {
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        // トークンがない場合はローディング完了
        setLoading(false);
        return;
      }

      try {
        // ユーザー情報を取得
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        // 認証エラー（トークン無効など）
        setUser(null);
      }
    };

    initializeAuth();
  }, [setUser, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}
