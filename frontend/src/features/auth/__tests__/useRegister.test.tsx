/**
 * useRegisterフックのテスト。
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
import { useRegister } from '../hooks/useRegister';
import { AUTH_MESSAGES } from '../constants';

// authApiをモック
vi.mock('../api/authApi');

// authStoreをモック
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setUser: vi.fn(),
  })),
}));

const mockRegister = vi.mocked(authApi.register);
const mockGetCurrentUser = vi.mocked(authApi.getCurrentUser);

describe('useRegister', () => {
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

  it('登録成功時、ユーザー情報を返す', async () => {
    const mockUser = {
      id: 1,
      email: 'newuser@example.com',
      displayName: '新規ユーザー',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    };

    mockRegister.mockResolvedValueOnce({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    });
    mockGetCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useRegister(), { wrapper });

    const user = await result.current.register({
      email: 'newuser@example.com',
      password1: 'password123',
      password2: 'password123',
      display_name: '新規ユーザー',
    });

    expect(user).toEqual(mockUser);
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password1: 'password123',
      password2: 'password123',
      display_name: '新規ユーザー',
    });
    expect(mockGetCurrentUser).toHaveBeenCalled();
  });

  it('メールアドレス重複時、エラーをスロー', async () => {
    const authError = new authApi.AuthApiError(
      AUTH_MESSAGES.EMAIL_EXISTS,
      400,
      { email: ['A user with that email already exists.'] }
    );
    mockRegister.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await expect(
      result.current.register({
        email: 'existing@example.com',
        password1: 'password123',
        password2: 'password123',
      })
    ).rejects.toThrow(AUTH_MESSAGES.EMAIL_EXISTS);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('バリデーションエラー時、適切なエラーをスロー', async () => {
    const authError = new authApi.AuthApiError(
      AUTH_MESSAGES.REGISTER_FAILED,
      400,
      { password1: ['This password is too short.'] }
    );
    mockRegister.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await expect(
      result.current.register({
        email: 'test@example.com',
        password1: 'short',
        password2: 'short',
      })
    ).rejects.toThrow(AUTH_MESSAGES.REGISTER_FAILED);
  });

  it('ネットワークエラー時、適切なエラーをスロー', async () => {
    const networkError = new authApi.AuthApiError(AUTH_MESSAGES.NETWORK_ERROR);
    mockRegister.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await expect(
      result.current.register({
        email: 'test@example.com',
        password1: 'password123',
        password2: 'password123',
      })
    ).rejects.toThrow(AUTH_MESSAGES.NETWORK_ERROR);
  });

  it('reset()でエラーがクリアされる', async () => {
    const authError = new authApi.AuthApiError(AUTH_MESSAGES.REGISTER_FAILED, 400);
    mockRegister.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    try {
      await result.current.register({
        email: 'test@example.com',
        password1: 'password123',
        password2: 'password123',
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

  it('display_nameが省略可能', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      displayName: '',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    };

    mockRegister.mockResolvedValueOnce({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    });
    mockGetCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useRegister(), { wrapper });

    const user = await result.current.register({
      email: 'test@example.com',
      password1: 'password123',
      password2: 'password123',
      // display_nameを省略
    });

    expect(user).toEqual(mockUser);
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      password1: 'password123',
      password2: 'password123',
    });
  });
});
