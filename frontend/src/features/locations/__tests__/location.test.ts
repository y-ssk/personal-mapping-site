/**
 * Location型変換関数のテスト。
 *
 * CLAUDE.md § テスト戦略に準拠。
 */
import { describe, it, expect } from 'vitest';

import {
  toCategory,
  toLocation,
  toLocationWithDistance,
  toPaginatedLocations,
} from '../types/location';
import type {
  ApiCategory,
  ApiLocation,
  ApiLocationWithDistance,
  ApiPaginatedResponse,
} from '../types/location';

// モックデータ
const mockApiCategory: ApiCategory = {
  id: 1,
  name: 'カフェ',
  slug: 'cafe',
  icon: '☕',
  full_path: '飲食 / カフェ',
  parent_id: null,
};

const mockApiLocation: ApiLocation = {
  id: 1,
  name: 'テストカフェ',
  point: { type: 'Point', coordinates: [139.7671, 35.6812] },
  address: '東京都渋谷区',
  category: mockApiCategory,
  tags: ['wifi', '静か'],
  status: 'want_to_visit',
  notes: 'おしゃれな雰囲気',
  website: 'https://example.com',
  phone: '03-1234-5678',
  visit_count: 3,
  average_rating: 4.5,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

describe('toCategory', () => {
  it('APIカテゴリをフロントエンド型に変換する', () => {
    const result = toCategory(mockApiCategory);

    expect(result.id).toBe(1);
    expect(result.name).toBe('カフェ');
    expect(result.slug).toBe('cafe');
    expect(result.icon).toBe('☕');
    // snake_case → camelCase
    expect(result.fullPath).toBe('飲食 / カフェ');
    expect(result.parentId).toBeNull();
  });

  it('parentIdがある場合も正しく変換する', () => {
    const categoryWithParent: ApiCategory = {
      ...mockApiCategory,
      parent_id: 10,
    };

    const result = toCategory(categoryWithParent);

    expect(result.parentId).toBe(10);
  });
});

describe('toLocation', () => {
  it('APILocationをフロントエンド型に変換する', () => {
    const result = toLocation(mockApiLocation);

    // 基本フィールド
    expect(result.id).toBe(1);
    expect(result.name).toBe('テストカフェ');
    expect(result.address).toBe('東京都渋谷区');
    expect(result.tags).toEqual(['wifi', '静か']);
    expect(result.status).toBe('want_to_visit');
    expect(result.notes).toBe('おしゃれな雰囲気');
    expect(result.website).toBe('https://example.com');
    expect(result.phone).toBe('03-1234-5678');

    // snake_case → camelCase
    expect(result.visitCount).toBe(3);
    expect(result.averageRating).toBe(4.5);
    expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(result.updatedAt).toBe('2025-01-02T00:00:00Z');

    // ネストしたカテゴリも変換
    expect(result.category?.fullPath).toBe('飲食 / カフェ');
    expect(result.category?.parentId).toBeNull();

    // GeoPointはそのまま
    expect(result.point.type).toBe('Point');
    expect(result.point.coordinates).toEqual([139.7671, 35.6812]);
  });

  it('categoryがnullの場合も正しく処理する', () => {
    const locationWithoutCategory: ApiLocation = {
      ...mockApiLocation,
      category: null,
    };

    const result = toLocation(locationWithoutCategory);

    expect(result.category).toBeNull();
  });

  it('average_ratingがnullの場合も正しく処理する', () => {
    const locationWithoutRating: ApiLocation = {
      ...mockApiLocation,
      average_rating: null,
    };

    const result = toLocation(locationWithoutRating);

    expect(result.averageRating).toBeNull();
  });

  it('statusがnullの場合も正しく処理する', () => {
    const locationWithoutStatus: ApiLocation = {
      ...mockApiLocation,
      status: null,
    };

    const result = toLocation(locationWithoutStatus);

    expect(result.status).toBeNull();
  });
});

describe('toLocationWithDistance', () => {
  it('距離付きAPILocationをフロントエンド型に変換する', () => {
    const apiLocationWithDistance: ApiLocationWithDistance = {
      ...mockApiLocation,
      distance: 1.5,
    };

    const result = toLocationWithDistance(apiLocationWithDistance);

    // 通常のLocationフィールド
    expect(result.id).toBe(1);
    expect(result.visitCount).toBe(3);
    expect(result.category?.fullPath).toBe('飲食 / カフェ');

    // 距離フィールド
    expect(result.distance).toBe(1.5);
  });
});

describe('toPaginatedLocations', () => {
  it('ページネーション付きレスポンスを変換する', () => {
    const apiResponse: ApiPaginatedResponse<ApiLocation> = {
      count: 100,
      next: 'http://api/locations/?page=2',
      previous: null,
      results: [mockApiLocation],
    };

    const result = toPaginatedLocations(apiResponse);

    // ページネーション情報
    expect(result.count).toBe(100);
    expect(result.next).toBe('http://api/locations/?page=2');
    expect(result.previous).toBeNull();

    // 結果の変換
    expect(result.results).toHaveLength(1);
    expect(result.results[0].visitCount).toBe(3);
    expect(result.results[0].category?.fullPath).toBe('飲食 / カフェ');
  });

  it('空の結果も正しく処理する', () => {
    const emptyResponse: ApiPaginatedResponse<ApiLocation> = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };

    const result = toPaginatedLocations(emptyResponse);

    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it('複数のLocationを正しく変換する', () => {
    const multipleLocations: ApiPaginatedResponse<ApiLocation> = {
      count: 2,
      next: null,
      previous: null,
      results: [
        mockApiLocation,
        { ...mockApiLocation, id: 2, name: '別のカフェ', visit_count: 10 },
      ],
    };

    const result = toPaginatedLocations(multipleLocations);

    expect(result.results).toHaveLength(2);
    expect(result.results[0].id).toBe(1);
    expect(result.results[0].visitCount).toBe(3);
    expect(result.results[1].id).toBe(2);
    expect(result.results[1].visitCount).toBe(10);
  });
});
