/**
 * Axios HTTPクライアント設定。
 *
 * API通信用に設定されたAxiosインスタンスを提供する。
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: エラーハンドリング
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラー時: ログインページへリダイレクトまたはトークンリフレッシュ
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);
