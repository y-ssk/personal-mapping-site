/**
 * locationApiのテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 *
 * @vitest-environment jsdom
 */
import { AxiosError, AxiosHeaders } from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api/client';

/**
 * AxiosErrorを生成するヘルパー
 */
function createAxiosError(status: number, data: unknown = {}): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  };
  return error;
}

import {
  listLocations,
  getLocation,
  createLocation,
  deleteLocation,
  findNearbyLocations,
  LocationApiError,
} from '../api/locationApi';
import { LOCATION_ENDPOINTS, LOCATION_MESSAGES } from '../constants';
import type { ApiLocation, ApiPaginatedResponse } from '../types/location';

// apiClientをモック
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// モックデータ
const mockApiLocation: ApiLocation = {
  id: 1,
  name: 'テストカフェ',
  point: { type: 'Point', coordinates: [139.7671, 35.6812] },
  address: '東京都渋谷区',
  category: {
    id: 1,
    name: 'カフェ',
    slug: 'cafe',
    icon: '☕',
    full_path: '飲食 / カフェ',
    parent_id: null,
  },
  tags: ['wifi', '静か'],
  status: 'want_to_visit',
  notes: 'おしゃれな雰囲気',
  website: 'https://example.com',
  phone: '03-1234-5678',
  visit_count: 3,
  average_rating: 4.5,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockApiPaginatedResponse: ApiPaginatedResponse<ApiLocation> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockApiLocation],
};

describe('listLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所一覧を取得してフロントエンド型に変換する', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockApiPaginatedResponse });

    const result = await listLocations();

    expect(apiClient.get).toHaveBeenCalledWith(LOCATION_ENDPOINTS.LIST, {
      params: undefined,
    });

    // snake_case → camelCase変換を確認
    expect(result.results[0].visitCount).toBe(3);
    expect(result.results[0].averageRating).toBe(4.5);
    expect(result.results[0].createdAt).toBe('2025-01-01T00:00:00Z');
    expect(result.results[0].category?.fullPath).toBe('飲食 / カフェ');
  });

  it('フィルタパラメータを正しく渡す', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockApiPaginatedResponse });

    const filters = { category: 1, tags: 'wifi,静か', status: 'want_to_visit' as const };
    await listLocations(filters);

    expect(apiClient.get).toHaveBeenCalledWith(LOCATION_ENDPOINTS.LIST, {
      params: filters,
    });
  });

  it('undefinedのパラメータを除外する', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockApiPaginatedResponse });

    const filters = { category: 1, tags: undefined, status: undefined };
    await listLocations(filters);

    expect(apiClient.get).toHaveBeenCalledWith(LOCATION_ENDPOINTS.LIST, {
      params: { category: 1 },
    });
  });

  it('401エラー時にLocationApiErrorをスローする', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(createAxiosError(401));

    await expect(listLocations()).rejects.toThrow(LocationApiError);

    try {
      await listLocations();
    } catch (error) {
      expect(error).toBeInstanceOf(LocationApiError);
      expect((error as LocationApiError).message).toBe(LOCATION_MESSAGES.UNAUTHORIZED);
      expect((error as LocationApiError).statusCode).toBe(401);
    }
  });
});

describe('getLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所詳細を取得してフロントエンド型に変換する', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockApiLocation });

    const result = await getLocation(1);

    expect(apiClient.get).toHaveBeenCalledWith(LOCATION_ENDPOINTS.DETAIL(1));
    expect(result.visitCount).toBe(3);
    expect(result.averageRating).toBe(4.5);
  });

  it('404エラー時にNOT_FOUNDメッセージをスローする', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(createAxiosError(404));

    await expect(getLocation(999)).rejects.toThrow(LocationApiError);

    try {
      await getLocation(999);
    } catch (error) {
      expect(error).toBeInstanceOf(LocationApiError);
      expect((error as LocationApiError).message).toBe(LOCATION_MESSAGES.NOT_FOUND);
      expect((error as LocationApiError).statusCode).toBe(404);
    }
  });
});

describe('createLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所を作成してフロントエンド型に変換する', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockApiLocation });

    const data = {
      name: 'テストカフェ',
      point: { type: 'Point' as const, coordinates: [139.7671, 35.6812] as [number, number] },
    };

    const result = await createLocation(data);

    expect(apiClient.post).toHaveBeenCalledWith(LOCATION_ENDPOINTS.LIST, data);
    expect(result.id).toBe(1);
    expect(result.name).toBe('テストカフェ');
  });

  it('400エラー時にバリデーションエラーを含める', async () => {
    const validationErrors = { name: ['名前は必須です'] };
    vi.mocked(apiClient.post).mockRejectedValueOnce(createAxiosError(400, validationErrors));

    try {
      await createLocation({
        name: '',
        point: { type: 'Point', coordinates: [0, 0] },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LocationApiError);
      expect((error as LocationApiError).errors).toEqual(validationErrors);
    }
  });
});

describe('deleteLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('場所を削除できる', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({});

    await deleteLocation(1);

    expect(apiClient.delete).toHaveBeenCalledWith(LOCATION_ENDPOINTS.DETAIL(1));
  });

  it('404エラー時にNOT_FOUNDメッセージをスローする', async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(createAxiosError(404));

    await expect(deleteLocation(999)).rejects.toThrow(LocationApiError);

    try {
      await deleteLocation(999);
    } catch (error) {
      expect(error).toBeInstanceOf(LocationApiError);
      expect((error as LocationApiError).message).toBe(LOCATION_MESSAGES.NOT_FOUND);
      expect((error as LocationApiError).statusCode).toBe(404);
    }
  });
});

describe('findNearbyLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('近傍の場所を取得してフロントエンド型に変換する', async () => {
    const mockNearbyLocations = [{ ...mockApiLocation, distance: 1.5 }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockNearbyLocations });

    const params = { lat: 35.6812, lng: 139.7671, radius: 5 };
    const result = await findNearbyLocations(params);

    expect(apiClient.get).toHaveBeenCalledWith(LOCATION_ENDPOINTS.NEARBY, { params });
    expect(result).toHaveLength(1);
    expect(result[0].distance).toBe(1.5);
    expect(result[0].visitCount).toBe(3); // snake_case変換確認
  });
});
