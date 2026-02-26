/**
 * メインレイアウトコンポーネント。
 *
 * ヘッダー（ナビゲーション）とコンテンツ領域を提供する。
 * React Router v6のOutletパターンを使用し、ネストルートに対応。
 *
 * CLAUDE.md「共通コンポーネントの型定義は同一ファイルに配置」に準拠。
 */
import { Outlet, Link } from 'react-router-dom';

import { useAuth, useLogout } from '@/features/auth';

/** ヘッダーの高さ定数（Tailwind CSSのpy-4 + テキストの高さに相当） */
const HEADER_HEIGHT_CLASS = 'h-14';

/**
 * MainLayoutコンポーネントのProps。
 */
export interface MainLayoutProps {
  /** レイアウト全体のクラス名（オプション） */
  className?: string;
}

/**
 * メインレイアウトコンポーネント。
 *
 * - 固定ヘッダー（ロゴ、ユーザー情報、ログアウト）
 * - フルスクリーンコンテンツ領域（Outlet）
 * - h-screen構造でPanelLayoutに対応
 *
 * @example
 * ```tsx
 * // App.tsx内でネストルートとして使用
 * <Route element={<MainLayout />}>
 *   <Route path="/" element={<DashboardPage />} />
 * </Route>
 * ```
 */
export function MainLayout({ className = '' }: MainLayoutProps) {
  const { user } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`flex h-screen flex-col overflow-hidden bg-gray-50 ${className}`}>
      {/* ヘッダー */}
      <header className={`flex-none bg-white shadow ${HEADER_HEIGHT_CLASS}`}>
        <div className="flex h-full items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            <Link to="/">Personal Mapping Site</Link>
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">{user.displayName || user.email}</span>
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

      {/* コンテンツ領域 */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
