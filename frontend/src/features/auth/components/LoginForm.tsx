/**
 * ログインフォームコンポーネント。
 *
 * メールアドレスとパスワードによるログインを提供する。
 */
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { AUTH_CONSTANTS, AUTH_LABELS, AUTH_PLACEHOLDERS } from '../constants';
import { useLogin } from '../hooks';
import type { LoginRequest } from '../types/auth';

interface LoginFormProps {
  /** ログイン成功時のコールバック */
  onSuccess?: () => void;
}

/**
 * ログインフォームコンポーネント。
 *
 * @param props - コンポーネントプロパティ
 *
 * @example
 * ```tsx
 * <LoginForm onSuccess={() => navigate('/dashboard')} />
 * ```
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, error, reset } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    reset(); // 前回のエラーをクリア
    try {
      await login(data);
      onSuccess?.();
    } catch {
      // エラーはuseLoginで管理される
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* メールアドレス */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {AUTH_LABELS.EMAIL}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={AUTH_PLACEHOLDERS.EMAIL}
          {...register('email', {
            required: `${AUTH_LABELS.EMAIL}を入力してください`,
            maxLength: {
              value: AUTH_CONSTANTS.EMAIL_MAX_LENGTH,
              message: `${AUTH_LABELS.EMAIL}は${AUTH_CONSTANTS.EMAIL_MAX_LENGTH}文字以内で入力してください`,
            },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '有効なメールアドレスを入力してください',
            },
          })}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.email
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* パスワード */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {AUTH_LABELS.PASSWORD}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={AUTH_PLACEHOLDERS.PASSWORD}
          {...register('password', {
            required: `${AUTH_LABELS.PASSWORD}を入力してください`,
            minLength: {
              value: AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
              message: `${AUTH_LABELS.PASSWORD}は${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH}文字以上で入力してください`,
            },
          })}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.password
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ログインボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
            ログイン中...
          </span>
        ) : (
          AUTH_LABELS.LOGIN_BUTTON
        )}
      </button>

      {/* 登録リンク */}
      <div className="text-center text-sm text-gray-600">
        {AUTH_LABELS.NO_ACCOUNT}{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
          {AUTH_LABELS.REGISTER_LINK}
        </Link>
      </div>
    </form>
  );
}
