/**
 * useLogoutフックのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 *
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import * as authApi from '../api/authApi';
import { useLogout } from '../hooks/useLogout';

// authApiをモック
vi.mock('../api/authApi');

// モック関数
const mockStoreLogout = vi.fn();
const mockQueryClientClear = vi.fn();

// authStoreをモック（セレクターパターン対応）
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      logout: mockStoreLogout,
      setUser: vi.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

const mockLogout = vi.mocked(authApi.logout);

describe('useLogout', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    // QueryClientのclearをスパイ
    vi.spyOn(queryClient, 'clear').mockImplementation(mockQueryClientClear);
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('ログアウト成功時、ストアとキャッシュがクリアされる', async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper });

    await result.current.logout();

    expect(mockLogout).toHaveBeenCalled();
    expect(mockStoreLogout).toHaveBeenCalled();
    expect(mockQueryClientClear).toHaveBeenCalled();
  });

  it('APIエラーでもストアとキャッシュはクリアされる', async () => {
    // ログアウトAPIがエラーでも、ローカルはクリアされるべき
    mockLogout.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useLogout(), { wrapper });

    // エラーがスローされる
    await expect(result.current.logout()).rejects.toThrow();

    // しかしストアとキャッシュはクリアされる
    expect(mockStoreLogout).toHaveBeenCalled();
    expect(mockQueryClientClear).toHaveBeenCalled();
  });

  it('isLoadingが正しく更新される', async () => {
    let resolveLogout: () => void;
    const logoutPromise = new Promise<void>((resolve) => {
      resolveLogout = resolve;
    });

    mockLogout.mockReturnValueOnce(logoutPromise);

    const { result } = renderHook(() => useLogout(), { wrapper });

    expect(result.current.isLoading).toBe(false);

    const logoutPromiseResult = result.current.logout();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    resolveLogout!();
    await logoutPromiseResult;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('複数回呼び出しても正常に動作する', async () => {
    mockLogout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper });

    await result.current.logout();
    await result.current.logout();

    expect(mockLogout).toHaveBeenCalledTimes(2);
    expect(mockStoreLogout).toHaveBeenCalledTimes(2);
  });
});
