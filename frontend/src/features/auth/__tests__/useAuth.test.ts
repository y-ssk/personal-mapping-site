/**
 * useAuthフックのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 *
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import * as authApi from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

// authApiをモック
vi.mock('../api/authApi');

// localStorage をモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// authStoreをモック
const mockSetUser = vi.fn();
const mockSetLoading = vi.fn();
let mockUser: authApi.User | null = null;
let mockIsAuthenticated = false;
let mockIsLoading = true;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    setUser: mockSetUser,
    setLoading: mockSetLoading,
  })),
}));

const mockGetCurrentUser = vi.mocked(authApi.getCurrentUser);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUser = null;
    mockIsAuthenticated = false;
    mockIsLoading = true;
  });

  it('トークンがない場合、ローディングを終了する', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it('トークンがある場合、ユーザー情報を取得する', async () => {
    const mockUserData = {
      id: 1,
      email: 'test@example.com',
      displayName: 'テストユーザー',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    };

    localStorageMock.getItem.mockReturnValue('mock-access-token');
    mockGetCurrentUser.mockResolvedValueOnce(mockUserData);

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(mockUserData);
    });
  });

  it('トークンが無効な場合、ユーザーをnullに設定する', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token');
    mockGetCurrentUser.mockRejectedValueOnce(
      new authApi.AuthApiError('Unauthorized', 401)
    );

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });

  it('user, isAuthenticated, isLoadingを返す', () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
      displayName: 'テストユーザー',
      oauthProvider: null,
      dateJoined: '2025-01-01T00:00:00Z',
    };
    mockIsAuthenticated = true;
    mockIsLoading = false;

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('ネットワークエラー時、ユーザーをnullに設定する', async () => {
    localStorageMock.getItem.mockReturnValue('mock-access-token');
    mockGetCurrentUser.mockRejectedValueOnce(new Error('Network Error'));

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });
});
