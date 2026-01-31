/**
 * メインアプリケーションコンポーネント。
 *
 * Personal Mapping Siteのルーティングとレイアウト構造を提供する。
 */
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Personal Mapping Site</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/**
 * ホームページコンポーネント。
 */
function HomePage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg border-4 border-dashed border-gray-200 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Personal Mapping Siteへようこそ</h2>
          <p className="mt-2 text-gray-500">あなたの場所管理と旅行計画アプリケーションです。</p>
        </div>
      </div>
    </div>
  );
}

export default App;
