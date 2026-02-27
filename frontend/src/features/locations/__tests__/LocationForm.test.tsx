/**
 * LocationFormコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { LocationForm } from '../components/LocationForm';
import type { Location } from '../types/location';
import { LOCATION_FORM_MESSAGES } from '../constants';

// useCreateLocationとuseUpdateLocationをモック
const mockCreateAsync = vi.fn();
const mockUpdateAsync = vi.fn();
vi.mock('../hooks/useLocations', () => ({
  useCreateLocation: () => ({
    mutateAsync: mockCreateAsync,
    isPending: false,
    error: null,
  }),
  useUpdateLocation: () => ({
    mutateAsync: mockUpdateAsync,
    isPending: false,
    error: null,
  }),
}));

// useCategoriesをモック
vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      {
        id: 1,
        name: 'カフェ',
        slug: 'cafe',
        icon: '☕',
        fullPath: '飲食 / カフェ',
        parentId: null,
      },
      {
        id: 2,
        name: 'レストラン',
        slug: 'restaurant',
        icon: '🍽',
        fullPath: '飲食 / レストラン',
        parentId: null,
      },
    ],
    isLoading: false,
    error: null,
    isSuccess: true,
  }),
}));

/** テスト用Location */
const mockLocation: Location = {
  id: 1,
  name: 'テストカフェ',
  point: { type: 'Point', coordinates: [139.7671, 35.6812] },
  address: '東京都千代田区',
  category: {
    id: 1,
    name: 'カフェ',
    slug: 'cafe',
    icon: '☕',
    fullPath: '飲食 / カフェ',
    parentId: null,
  },
  tags: ['おしゃれ', 'WiFi'],
  status: 'want_to_visit',
  notes: 'テストメモ',
  website: 'https://example.com',
  phone: '03-1234-5678',
  visitCount: 3,
  averageRating: 4.5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/** TanStack Query用ラッパー */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('LocationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('新規作成モード', () => {
    it('フォームをレンダリングする', () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      expect(screen.getByTestId('location-form')).toBeInTheDocument();
      expect(screen.getByLabelText(/場所名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/住所/)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/ステータス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Webサイト/)).toBeInTheDocument();
      expect(screen.getByLabelText(/電話番号/)).toBeInTheDocument();
    });

    it('作成ボタンを表示する', () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      expect(screen.getByText(LOCATION_FORM_MESSAGES.CREATE_BUTTON)).toBeInTheDocument();
    });

    it('カテゴリ選択肢を表示する', () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      expect(screen.getByText('未選択')).toBeInTheDocument();
      expect(screen.getByText(/カフェ/)).toBeInTheDocument();
      expect(screen.getByText(/レストラン/)).toBeInTheDocument();
    });

    it('ステータス選択肢を表示する', () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      const statusSelect = screen.getByLabelText(/ステータス/);
      expect(statusSelect).toBeInTheDocument();
    });

    it('座標未設定時にヒントメッセージを表示する', () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      expect(screen.getByText(LOCATION_FORM_MESSAGES.POINT_HINT)).toBeInTheDocument();
    });

    it('座標が設定されたらの座標を表示する', () => {
      render(<LocationForm clickedPoint={{ lat: 35.6812, lng: 139.7671 }} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/35\.681200/)).toBeInTheDocument();
      expect(screen.getByText(/139\.767100/)).toBeInTheDocument();
    });

    it('場所名未入力でバリデーションエラーを表示する', async () => {
      render(<LocationForm clickedPoint={{ lat: 35.6812, lng: 139.7671 }} />, {
        wrapper: createWrapper(),
      });

      const submitButton = screen.getByText(LOCATION_FORM_MESSAGES.CREATE_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(LOCATION_FORM_MESSAGES.NAME_REQUIRED)).toBeInTheDocument();
      });
    });

    it('座標未設定でバリデーションエラーを表示する', async () => {
      render(<LocationForm />, { wrapper: createWrapper() });

      // 場所名を入力
      const nameInput = screen.getByLabelText(/場所名/);
      fireEvent.change(nameInput, { target: { value: 'テスト場所' } });

      const submitButton = screen.getByText(LOCATION_FORM_MESSAGES.CREATE_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(LOCATION_FORM_MESSAGES.POINT_REQUIRED)).toBeInTheDocument();
      });
    });

    it('正常に作成APIを呼び出す', async () => {
      const mockOnSuccess = vi.fn();
      const mockResult: Location = { ...mockLocation, id: 10 };
      mockCreateAsync.mockResolvedValue(mockResult);

      render(
        <LocationForm clickedPoint={{ lat: 35.6812, lng: 139.7671 }} onSuccess={mockOnSuccess} />,
        { wrapper: createWrapper() }
      );

      // 場所名を入力
      const nameInput = screen.getByLabelText(/場所名/);
      fireEvent.change(nameInput, { target: { value: '新しいカフェ' } });

      // 送信
      const submitButton = screen.getByText(LOCATION_FORM_MESSAGES.CREATE_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '新しいカフェ',
            point: { type: 'Point', coordinates: [139.7671, 35.6812] },
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });

    it('キャンセルボタンでonCancelを呼び出す', () => {
      const mockOnCancel = vi.fn();
      render(<LocationForm onCancel={mockOnCancel} />, { wrapper: createWrapper() });

      const cancelButton = screen.getByText(LOCATION_FORM_MESSAGES.CANCEL_BUTTON);
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('編集モード', () => {
    it('既存データでフォームを初期化する', () => {
      render(<LocationForm location={mockLocation} />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/場所名/) as HTMLInputElement;
      expect(nameInput.value).toBe('テストカフェ');

      const addressInput = screen.getByLabelText(/住所/) as HTMLInputElement;
      expect(addressInput.value).toBe('東京都千代田区');

      // 座標が表示されている
      expect(screen.getByText(/35\.681200/)).toBeInTheDocument();
    });

    it('更新ボタンを表示する', () => {
      render(<LocationForm location={mockLocation} />, { wrapper: createWrapper() });

      expect(screen.getByText(LOCATION_FORM_MESSAGES.UPDATE_BUTTON)).toBeInTheDocument();
    });

    it('既存タグを表示する', () => {
      render(<LocationForm location={mockLocation} />, { wrapper: createWrapper() });

      expect(screen.getByText('おしゃれ')).toBeInTheDocument();
      expect(screen.getByText('WiFi')).toBeInTheDocument();
    });

    it('正常に更新APIを呼び出す', async () => {
      const mockOnSuccess = vi.fn();
      const mockResult: Location = { ...mockLocation, name: '更新カフェ' };
      mockUpdateAsync.mockResolvedValue(mockResult);

      render(<LocationForm location={mockLocation} onSuccess={mockOnSuccess} />, {
        wrapper: createWrapper(),
      });

      // 場所名を変更
      const nameInput = screen.getByLabelText(/場所名/);
      fireEvent.change(nameInput, { target: { value: '更新カフェ' } });

      // 送信
      const submitButton = screen.getByText(LOCATION_FORM_MESSAGES.UPDATE_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            data: expect.objectContaining({
              name: '更新カフェ',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('バリデーション', () => {
    it('電話番号の文字数超過でエラーを表示する', async () => {
      render(<LocationForm clickedPoint={{ lat: 35.6812, lng: 139.7671 }} />, {
        wrapper: createWrapper(),
      });

      // 場所名を入力
      const nameInput = screen.getByLabelText(/場所名/);
      fireEvent.change(nameInput, { target: { value: 'テスト場所' } });

      // 21文字以上の電話番号を入力
      const phoneInput = screen.getByLabelText(/電話番号/);
      fireEvent.change(phoneInput, { target: { value: '123456789012345678901' } });

      // 送信
      const submitButton = screen.getByText(LOCATION_FORM_MESSAGES.CREATE_BUTTON);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(LOCATION_FORM_MESSAGES.PHONE_TOO_LONG)).toBeInTheDocument();
      });
    });
  });

  describe('タグ入力', () => {
    it('タグを追加できる', async () => {
      render(<LocationForm clickedPoint={{ lat: 35.6812, lng: 139.7671 }} />, {
        wrapper: createWrapper(),
      });

      // タグ入力欄を見つける（placeholderで特定）
      const tagInput = screen.getByPlaceholderText(LOCATION_FORM_MESSAGES.TAG_HINT);
      fireEvent.change(tagInput, { target: { value: '新タグ' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(screen.getByText('新タグ')).toBeInTheDocument();
    });

    it('タグを削除できる', async () => {
      render(<LocationForm location={mockLocation} />, { wrapper: createWrapper() });

      // 既存タグ「おしゃれ」の削除ボタンをクリック
      const deleteButton = screen.getByLabelText('タグ「おしゃれ」を削除');
      fireEvent.click(deleteButton);

      expect(screen.queryByText('おしゃれ')).not.toBeInTheDocument();
      // WiFiは残っている
      expect(screen.getByText('WiFi')).toBeInTheDocument();
    });
  });
});
