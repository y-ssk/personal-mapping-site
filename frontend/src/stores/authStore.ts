/**
 * Zustandを使用した認証状態ストア。
 *
 * アプリケーション全体でユーザー認証状態を管理する。
 * SPEC.md § 2.2「グローバル状態は認証と地図中心のみ」に準拠。
 */
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/lib/constants';

import type { User } from '@/features/auth/types/auth';

interface AuthState {
  /** 現在のユーザー情報 */
  user: User | null;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** 認証状態読み込み中かどうか */
  isLoading: boolean;
  /** ユーザー情報をセット */
  setUser: (user: User | null) => void;
  /** ローディング状態をセット */
  setLoading: (loading: boolean) => void;
  /** ログアウト処理 */
  logout: () => void;
}

/**
 * ユーザー状態を管理する認証ストア。
 *
 * @example
 * ```typescript
 * const { user, isAuthenticated, logout } = useAuthStore();
 *
 * if (isAuthenticated) {
 *   console.log(`こんにちは、${user?.displayName}さん`);
 * }
 * ```
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    // アクセストークンとリフレッシュトークンの両方を削除
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
