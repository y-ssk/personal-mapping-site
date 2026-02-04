/**
 * 認証APIクライアントのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  googleLogin,
  githubLogin,
  AuthApiError,
} from '../api/authApi';
import { AUTH_MESSAGES, AUTH_ENDPOINTS } from '../constants';
import { apiClient } from '@/lib/api/client';

// apiClientをモック
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// localStorageをモック
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

const mockPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(apiClient.get);

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('成功時、トークンを返しローカルストレージに保存する', async () => {
      const tokens = { access: 'access-token', refresh: 'refresh-token' };
      mockPost.mockResolvedValueOnce({ data: tokens });

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual(tokens);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(mockPost).toHaveBeenCalledWith(AUTH_ENDPOINTS.LOGIN, {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('400エラー時、AuthApiErrorをスロー', async () => {
      mockPost.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { non_field_errors: ['Unable to log in with provided credentials.'] },
        },
      });

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        AuthApiError
      );
    });

    it('ネットワークエラー時、AuthApiErrorをスロー', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network Error'));

      await expect(login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(
        AUTH_MESSAGES.NETWORK_ERROR
      );
    });
  });

  describe('register', () => {
    it('成功時、トークンを返しローカルストレージに保存する', async () => {
      const tokens = { access: 'access-token', refresh: 'refresh-token' };
      mockPost.mockResolvedValueOnce({ data: tokens });

      const result = await register({
        email: 'new@example.com',
        password1: 'password123',
        password2: 'password123',
      });

      expect(result).toEqual(tokens);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });

    it('メールアドレス重複時、EMAIL_EXISTSエラーをスロー', async () => {
      mockPost.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { email: ['A user with that email already exists.'] },
        },
      });

      await expect(
        register({
          email: 'existing@example.com',
          password1: 'password123',
          password2: 'password123',
        })
      ).rejects.toThrow(AUTH_MESSAGES.EMAIL_EXISTS);
    });
  });

  describe('logout', () => {
    it('トークンをローカルストレージから削除する', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('APIエラーでもトークンは削除する', async () => {
      mockPost.mockRejectedValueOnce(new Error('API Error'));

      await logout(); // エラーはスローされない

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('getCurrentUser', () => {
    it('成功時、変換されたユーザー情報を返す', async () => {
      const apiUser = {
        id: 1,
        email: 'test@example.com',
        display_name: 'テストユーザー',
        oauth_provider: null,
        date_joined: '2025-01-01T00:00:00Z',
      };
      mockGet.mockResolvedValueOnce({ data: apiUser });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        displayName: 'テストユーザー',
        oauthProvider: null,
        dateJoined: '2025-01-01T00:00:00Z',
      });
      expect(mockGet).toHaveBeenCalledWith(AUTH_ENDPOINTS.ME);
    });

    it('401エラー時、UNAUTHORIZEDエラーをスロー', async () => {
      mockGet.mockRejectedValueOnce({
        response: { status: 401 },
      });

      await expect(getCurrentUser()).rejects.toThrow(AUTH_MESSAGES.UNAUTHORIZED);
    });
  });

  describe('refreshToken', () => {
    it('成功時、新しいトークンを返し保存する', async () => {
      const tokens = { access: 'new-access-token', refresh: 'new-refresh-token' };
      mockPost.mockResolvedValueOnce({ data: tokens });

      const result = await refreshToken('old-refresh-token');

      expect(result).toEqual(tokens);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    });

    it('401エラー時、トークンを削除しSESSION_EXPIREDエラーをスロー', async () => {
      mockPost.mockRejectedValueOnce({
        response: { status: 401 },
      });

      await expect(refreshToken('invalid-token')).rejects.toThrow(AUTH_MESSAGES.SESSION_EXPIRED);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('googleLogin', () => {
    it('成功時、ユーザー情報とトークンを返す', async () => {
      const response = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {
          id: 1,
          email: 'test@gmail.com',
          display_name: 'Google User',
          oauth_provider: 'google',
          date_joined: '2025-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValueOnce({ data: response });

      const result = await googleLogin({ code: 'auth-code' });

      expect(result.user.displayName).toBe('Google User');
      expect(result.tokens.access).toBe('access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
    });

    it('400エラー時、OAUTH_FAILEDエラーをスロー', async () => {
      mockPost.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'Invalid code' } },
      });

      await expect(googleLogin({ code: 'invalid-code' })).rejects.toThrow(
        AUTH_MESSAGES.OAUTH_FAILED
      );
    });
  });

  describe('githubLogin', () => {
    it('成功時、ユーザー情報とトークンを返す', async () => {
      const response = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {
          id: 1,
          email: 'test@github.com',
          display_name: 'GitHub User',
          oauth_provider: 'github',
          date_joined: '2025-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValueOnce({ data: response });

      const result = await githubLogin({ code: 'auth-code' });

      expect(result.user.displayName).toBe('GitHub User');
      expect(result.tokens.access).toBe('access-token');
    });
  });
});
