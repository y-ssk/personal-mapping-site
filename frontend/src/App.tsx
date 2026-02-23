/**
 * メインアプリケーションコンポーネント。
 *
 * Personal Mapping Siteのルーティングとレイアウト構造を提供する。
 * React Router v6のネストルート + Outletパターンを使用。
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import { PrivateRoute } from '@/components/PrivateRoute';
import { MainLayout } from '@/components/MainLayout';
import { LoginPage, RegisterPage, OAuthCallback, useAuth } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { UI_MESSAGES } from '@/lib/constants';

/**
 * メインアプリケーションコンポーネント。
 */
function App() {
  const { isLoading } = useAuth();

  // 認証状態の初期化中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">{UI_MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 認証ページ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback/:provider" element={<OAuthCallback />} />

      {/* 認証必須ページ（ネストルート + Outletパターン） */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* ダッシュボード（TOPページ） */}
        <Route path="/" element={<DashboardPage />} />
      </Route>

      {/* 未定義パスはホームにリダイレクト */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
