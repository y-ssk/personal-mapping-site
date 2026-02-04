/**
 * 登録ページコンポーネント。
 *
 * 登録フォームとOAuthボタンを表示する。
 */
import { useNavigate } from 'react-router-dom';

import { RegisterForm, OAuthButtons } from '../components';

/**
 * 登録ページコンポーネント。
 *
 * @example
 * ```tsx
 * <Route path="/register" element={<RegisterPage />} />
 * ```
 */
export function RegisterPage() {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          アカウント作成
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Personal Mapping Site
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <RegisterForm onSuccess={handleRegisterSuccess} />

          <div className="mt-6">
            <OAuthButtons />
          </div>
        </div>
      </div>
    </div>
  );
}
