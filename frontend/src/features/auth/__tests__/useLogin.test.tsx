/**
 * useLoginフックのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import * as authApi from '../api/authApi';
import { useLogin } from '../hooks/useLogin';
import { AUTH_MESSAGES } from '../constants';

// authApiをモック
vi.mock('../api/authApi');

// authStoreをモック
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setUser: vi.fn(),
  })),
}));

const mockLogin = vi.mocked(authApi.login);
const mockGetCurrentUser = vi.mocked(authApi.getCurrentUser);

describe('useLogin', () => {
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('ログイン成功時、ユーザー情報を返す', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      displayName: 'テストユーザー',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    };

    mockLogin.mockResolvedValueOnce({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    });
    mockGetCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useLogin(), { wrapper });

    const user = await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user).toEqual(mockUser);
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockGetCurrentUser).toHaveBeenCalled();
  });

  it('ログイン失敗時（400）、認証エラーをスロー', async () => {
    const authError = new authApi.AuthApiError(
      AUTH_MESSAGES.LOGIN_FAILED,
      400,
      { non_field_errors: ['Unable to log in with provided credentials.'] }
    );
    mockLogin.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(
      result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow(AUTH_MESSAGES.LOGIN_FAILED);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe(AUTH_MESSAGES.LOGIN_FAILED);
    });
  });

  it('ネットワークエラー時、適切なエラーをスロー', async () => {
    const networkError = new authApi.AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
    mockLogin.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(AUTH_MESSAGES.NETWORK_ERROR);
  });

  it('reset()でエラーがクリアされる', async () => {
    const authError = new authApi.AuthApiError(AUTH_MESSAGES.LOGIN_FAILED, 400);
    mockLogin.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useLogin(), { wrapper });

    try {
      await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    } catch {
      // エラーは期待通り
    }

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    result.current.reset();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it('isLoadingが正しく更新される', async () => {
    let resolveLogin: (value: authApi.AuthTokens) => void;
    const loginPromise = new Promise<authApi.AuthTokens>((resolve) => {
      resolveLogin = resolve;
    });

    mockLogin.mockReturnValueOnce(loginPromise as Promise<authApi.AuthTokens>);
    mockGetCurrentUser.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      displayName: 'テストユーザー',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    expect(result.current.isLoading).toBe(false);

    const loginPromiseResult = result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    resolveLogin!({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    });

    await loginPromiseResult;

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
