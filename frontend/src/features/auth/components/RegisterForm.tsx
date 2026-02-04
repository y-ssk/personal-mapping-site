/**
 * 登録フォームコンポーネント。
 *
 * メールアドレス、パスワード、表示名による新規登録を提供する。
 */
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { AUTH_CONSTANTS, AUTH_LABELS, AUTH_MESSAGES, AUTH_PLACEHOLDERS } from '../constants';
import { useRegister } from '../hooks';
import type { RegisterRequest } from '../types/auth';

interface RegisterFormData {
  email: string;
  password1: string;
  password2: string;
  display_name: string;
}

interface RegisterFormProps {
  /** 登録成功時のコールバック */
  onSuccess?: () => void;
}

/**
 * 登録フォームコンポーネント。
 *
 * @param props - コンポーネントプロパティ
 *
 * @example
 * ```tsx
 * <RegisterForm onSuccess={() => navigate('/dashboard')} />
 * ```
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser, isLoading, error, reset } = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password1: '',
      password2: '',
      display_name: '',
    },
  });

  const password1 = watch('password1');

  const onSubmit = async (data: RegisterFormData) => {
    reset(); // 前回のエラーをクリア
    try {
      const registerData: RegisterRequest = {
        email: data.email,
        password1: data.password1,
        password2: data.password2,
        display_name: data.display_name || undefined,
      };
      await registerUser(registerData);
      onSuccess?.();
    } catch {
      // エラーはuseRegisterで管理される
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* エラーメッセージ */}
      {error && (
        <div
          className="rounded-md bg-red-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* メールアドレス */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
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

      {/* 表示名 */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700"
        >
          {AUTH_LABELS.DISPLAY_NAME}
          <span className="ml-1 text-gray-400">（任意）</span>
        </label>
        <input
          id="display_name"
          type="text"
          autoComplete="name"
          placeholder={AUTH_PLACEHOLDERS.DISPLAY_NAME}
          {...register('display_name', {
            maxLength: {
              value: AUTH_CONSTANTS.DISPLAY_NAME_MAX_LENGTH,
              message: `${AUTH_LABELS.DISPLAY_NAME}は${AUTH_CONSTANTS.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`,
            },
          })}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.display_name
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          aria-invalid={errors.display_name ? 'true' : 'false'}
          aria-describedby={errors.display_name ? 'display-name-error' : undefined}
        />
        {errors.display_name && (
          <p id="display-name-error" className="mt-1 text-sm text-red-600">
            {errors.display_name.message}
          </p>
        )}
      </div>

      {/* パスワード */}
      <div>
        <label
          htmlFor="password1"
          className="block text-sm font-medium text-gray-700"
        >
          {AUTH_LABELS.PASSWORD}
        </label>
        <input
          id="password1"
          type="password"
          autoComplete="new-password"
          placeholder={AUTH_PLACEHOLDERS.PASSWORD}
          {...register('password1', {
            required: `${AUTH_LABELS.PASSWORD}を入力してください`,
            minLength: {
              value: AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
              message: `${AUTH_LABELS.PASSWORD}は${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH}文字以上で入力してください`,
            },
          })}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.password1
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          aria-invalid={errors.password1 ? 'true' : 'false'}
          aria-describedby={errors.password1 ? 'password1-error' : undefined}
        />
        {errors.password1 && (
          <p id="password1-error" className="mt-1 text-sm text-red-600">
            {errors.password1.message}
          </p>
        )}
      </div>

      {/* パスワード確認 */}
      <div>
        <label
          htmlFor="password2"
          className="block text-sm font-medium text-gray-700"
        >
          {AUTH_LABELS.PASSWORD_CONFIRM}
        </label>
        <input
          id="password2"
          type="password"
          autoComplete="new-password"
          placeholder={AUTH_PLACEHOLDERS.PASSWORD}
          {...register('password2', {
            required: `${AUTH_LABELS.PASSWORD_CONFIRM}を入力してください`,
            validate: (value) =>
              value === password1 || AUTH_MESSAGES.PASSWORD_MISMATCH,
          })}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.password2
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          aria-invalid={errors.password2 ? 'true' : 'false'}
          aria-describedby={errors.password2 ? 'password2-error' : undefined}
        />
        {errors.password2 && (
          <p id="password2-error" className="mt-1 text-sm text-red-600">
            {errors.password2.message}
          </p>
        )}
      </div>

      {/* 登録ボタン */}
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
            登録中...
          </span>
        ) : (
          AUTH_LABELS.REGISTER_BUTTON
        )}
      </button>

      {/* ログインリンク */}
      <div className="text-center text-sm text-gray-600">
        {AUTH_LABELS.HAVE_ACCOUNT}{' '}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          {AUTH_LABELS.LOGIN_LINK}
        </Link>
      </div>
    </form>
  );
}
