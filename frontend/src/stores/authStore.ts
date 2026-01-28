/**
 * Zustandを使用した認証状態ストア。
 *
 * アプリケーション全体でユーザー認証状態を管理する。
 */
import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

/**
 * ユーザー状態を管理する認証ストア。
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
    localStorage.removeItem('access_token');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
