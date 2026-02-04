/**
 * メインアプリケーションコンポーネント。
 *
 * Personal Mapping Siteのルーティングとレイアウト構造を提供する。
 */
import { Routes, Route, Navigate, Link } from 'react-router-dom';

import { PrivateRoute } from '@/components/PrivateRoute';
import {
  LoginPage,
  RegisterPage,
  OAuthCallback,
  useAuth,
  useLogout,
} from '@/features/auth';

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
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
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

      {/* 認証必須ページ */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* 未定義パスはホームにリダイレクト */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * メインレイアウトコンポーネント。
 */
function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            <Link to="/">Personal Mapping Site</Link>
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.displayName || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

/**
 * ホームページコンポーネント。
 */
function HomePage() {
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg border-4 border-dashed border-gray-200 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">
            ようこそ{user?.displayName ? `、${user.displayName}さん` : ''}
          </h2>
          <p className="mt-2 text-gray-500">
            あなたの場所管理と旅行計画アプリケーションです。
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
