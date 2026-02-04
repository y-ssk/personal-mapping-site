/**
 * OAuthコールバック処理コンポーネント。
 *
 * OAuthプロバイダーからのコールバックを処理し、トークンを取得する。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';

import { googleLogin, githubLogin, AuthApiError } from '../api/authApi';
import { AUTH_MESSAGES, OAUTH_PROVIDERS, type OAuthProvider } from '../constants';

/**
 * OAuthコールバック処理コンポーネント。
 *
 * /auth/callback/:provider でマウントされる。
 *
 * @example
 * ```tsx
 * <Route path="/auth/callback/:provider" element={<OAuthCallback />} />
 * ```
 */
export function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // エラーパラメータがある場合
      if (errorParam) {
        setError(AUTH_MESSAGES.OAUTH_FAILED);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      // コードがない場合
      if (!code) {
        setError(AUTH_MESSAGES.OAUTH_FAILED);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      // プロバイダーが無効な場合
      if (
        provider !== OAUTH_PROVIDERS.GOOGLE &&
        provider !== OAUTH_PROVIDERS.GITHUB
      ) {
        setError(AUTH_MESSAGES.OAUTH_FAILED);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      try {
        // プロバイダーに応じてAPIを呼び出し
        const result =
          provider === OAUTH_PROVIDERS.GOOGLE
            ? await googleLogin({ code })
            : await githubLogin({ code });

        // ユーザー情報をストアに保存
        setUser(result.user);

        // ダッシュボードへリダイレクト
        navigate('/', { replace: true });
      } catch (err) {
        const message =
          err instanceof AuthApiError ? err.message : AUTH_MESSAGES.OAUTH_FAILED;
        setError(message);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <p className="text-sm text-gray-500">
              ログインページに戻ります...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
            <p className="text-sm text-gray-500">認証中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
