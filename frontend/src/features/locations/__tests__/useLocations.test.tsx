/**
 * useLocationsフックのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 *
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import * as locationApi from '../api/locationApi';
import { useLocations, useLocation, useCreateLocation, useDeleteLocation } from '../hooks/useLocations';
import type { Location, PaginatedResponse } from '../types/location';

// locationApiをモック
vi.mock('../api/locationApi');

// テスト用のQueryClientラッパー
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// モックデータ
const mockLocation: Location = {
  id: 1,
  name: 'テストカフェ',
  point: { type: 'Point', coordinates: [139.7671, 35.6812] },
  address: '東京都渋谷区',
  category: {
    id: 1,
    name: 'カフェ',
    slug: 'cafe',
    icon: '☕',
    fullPath: '飲食 / カフェ',
    parentId: null,
  },
  tags: ['wifi', '静か'],
  status: 'want_to_visit',
  notes: 'おしゃれな雰囲気',
  website: 'https://example.com',
  phone: '03-1234-5678',
  visitCount: 3,
  averageRating: 4.5,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<Location> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockLocation],
};

describe('useLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所一覧を取得できる', async () => {
    vi.mocked(locationApi.listLocations).mockResolvedValueOnce(mockPaginatedResponse);

    const { result } = renderHook(() => useLocations(), {
      wrapper: createWrapper(),
    });

    // 初期状態はローディング
    expect(result.current.isLoading).toBe(true);

    // データ取得完了を待つ
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // データが正しく取得できている
    expect(result.current.data).toEqual(mockPaginatedResponse);
    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0].name).toBe('テストカフェ');
  });

  it('フィルタ付きで場所一覧を取得できる', async () => {
    vi.mocked(locationApi.listLocations).mockResolvedValueOnce(mockPaginatedResponse);

    const filters = { category: 1, status: 'want_to_visit' as const };
    const { result } = renderHook(() => useLocations(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // フィルタ付きでAPIが呼ばれている
    expect(locationApi.listLocations).toHaveBeenCalledWith(filters);
  });

  it('エラー時にエラー状態になる', async () => {
    const mockError = new locationApi.LocationApiError('取得失敗', 500);
    vi.mocked(locationApi.listLocations).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // TanStack Queryがエラーを保持している
    expect(result.current.error).toBeInstanceOf(locationApi.LocationApiError);
  });
});

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所詳細を取得できる', async () => {
    vi.mocked(locationApi.getLocation).mockResolvedValueOnce(mockLocation);

    const { result } = renderHook(() => useLocation(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLocation);
    expect(locationApi.getLocation).toHaveBeenCalledWith(1);
  });

  it('IDが0以下の場合はクエリを実行しない', async () => {
    const { result } = renderHook(() => useLocation(0), {
      wrapper: createWrapper(),
    });

    // ローディングにならない（enabledがfalse）
    expect(result.current.isLoading).toBe(false);
    expect(locationApi.getLocation).not.toHaveBeenCalled();
  });
});

describe('useCreateLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所を作成できる', async () => {
    vi.mocked(locationApi.createLocation).mockResolvedValueOnce(mockLocation);

    const { result } = renderHook(() => useCreateLocation(), {
      wrapper: createWrapper(),
    });

    // mutateを呼び出す
    result.current.mutate({
      name: 'テストカフェ',
      point: { type: 'Point', coordinates: [139.7671, 35.6812] },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLocation);
  });

  it('作成失敗時にエラー状態になる', async () => {
    const mockError = new locationApi.LocationApiError('作成失敗', 400, {
      name: ['名前は必須です'],
    });
    vi.mocked(locationApi.createLocation).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCreateLocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: '',
      point: { type: 'Point', coordinates: [0, 0] },
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // TanStack Queryがエラーを保持している
    expect(result.current.error).toBeInstanceOf(locationApi.LocationApiError);
  });
});

describe('useDeleteLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所を削除できる', async () => {
    vi.mocked(locationApi.deleteLocation).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteLocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // deleteLocationが呼ばれたことを確認（引数の最初の要素が1）
    expect(locationApi.deleteLocation).toHaveBeenCalled();
    expect(vi.mocked(locationApi.deleteLocation).mock.calls[0][0]).toBe(1);
  });
});
