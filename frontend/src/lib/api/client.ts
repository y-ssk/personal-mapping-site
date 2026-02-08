/**
 * Axios HTTPクライアント設定。
 *
 * API通信用に設定されたAxiosインスタンスを提供する。
 * トークンリフレッシュ機能を含む。
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { HTTP_STATUS, STORAGE_KEYS } from '@/lib/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** トークンリフレッシュエンドポイント */
const REFRESH_ENDPOINT = '/api/v1/auth/refresh/';

/** リフレッシュ中フラグ（重複リフレッシュ防止） */
let isRefreshing = false;

/** リフレッシュ待ちのリクエストキュー */
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * リフレッシュ完了を待っているリクエストに新しいトークンを通知
 */
function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

/**
 * リフレッシュ待ちキューにコールバックを追加
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * APIリクエスト用に設定されたAxiosインスタンス。
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: 認証トークンを追加
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: エラーハンドリングとトークンリフレッシュ
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401エラーかつリトライでない場合
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      // リフレッシュエンドポイント自体の401は無視（無限ループ防止）
      if (originalRequest.url === REFRESH_ENDPOINT) {
        clearTokens();
        return Promise.reject(error);
      }

      // 既にリフレッシュ中の場合は完了を待つ
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // リフレッシュトークンで新しいアクセストークンを取得
        const response = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}${REFRESH_ENDPOINT}`,
          { refresh: refreshToken }
        );

        const { access: newAccessToken, refresh: newRefreshToken } = response.data;

        // 新しいトークンを保存
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        }

        // 待機中のリクエストに新しいトークンを通知
        onRefreshed(newAccessToken);

        isRefreshing = false;

        // 元のリクエストをリトライ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        // リフレッシュ失敗: トークンをクリア
        clearTokens();
        isRefreshing = false;
        refreshSubscribers = [];
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * トークンをクリア
 */
function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}
