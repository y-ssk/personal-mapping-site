/**
 * LocationListPanelコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { LocationListPanel } from '../components/LocationListPanel';
import type { Location, PaginatedResponse } from '../types/location';

// mapStoreをモック
const mockSetHoveredLocationId = vi.fn();
vi.mock('@/stores/mapStore', () => ({
  useMapStore: () => ({
    selectedLocationId: null,
    hoveredLocationId: null,
    setHoveredLocationId: mockSetHoveredLocationId,
  }),
}));

const mockLocations: Location[] = [
  {
    id: 1,
    name: 'テスト場所1',
    point: { type: 'Point', coordinates: [139.7671, 35.6812] },
    address: '東京都千代田区',
    category: null,
    tags: [],
    status: null,
    notes: '',
    website: '',
    phone: '',
    visitCount: 3,
    averageRating: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'テスト場所2',
    point: { type: 'Point', coordinates: [139.768, 35.682] },
    address: '東京都中央区',
    category: { id: 1, name: 'カフェ', slug: 'cafe', icon: '☕', fullPath: '飲食/カフェ' },
    tags: ['タグ1'],
    status: 'want_to_visit',
    notes: '',
    website: '',
    phone: '',
    visitCount: 0,
    averageRating: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<Location> = {
  count: 2,
  next: null,
  previous: null,
  results: mockLocations,
};

describe('LocationListPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('リストをレンダリングする', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    expect(screen.getByTestId('location-list-panel')).toBeInTheDocument();
    expect(screen.getByText('テスト場所1')).toBeInTheDocument();
    expect(screen.getByText('テスト場所2')).toBeInTheDocument();
  });

  it('件数を表示する', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    expect(screen.getByText(/2件中/)).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    const emptyData: PaginatedResponse<Location> = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };

    render(<LocationListPanel data={emptyData} />);

    expect(screen.getByText('場所がありません')).toBeInTheDocument();
  });

  it('クリック時にonLocationClickを呼び出す', () => {
    const handleClick = vi.fn();
    render(<LocationListPanel data={mockPaginatedResponse} onLocationClick={handleClick} />);

    fireEvent.click(screen.getByTestId('location-item-1'));

    expect(handleClick).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('ホバー時にsetHoveredLocationIdを呼び出す', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    fireEvent.mouseEnter(screen.getByTestId('location-item-1'));

    expect(mockSetHoveredLocationId).toHaveBeenCalledWith(1);
  });

  it('ホバー解除時にsetHoveredLocationIdをnullで呼び出す', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    fireEvent.mouseLeave(screen.getByTestId('location-item-1'));

    expect(mockSetHoveredLocationId).toHaveBeenCalledWith(null);
  });

  it('訪問回数を表示する', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    expect(screen.getByText('3回')).toBeInTheDocument();
  });

  it('カテゴリアイコンを表示する', () => {
    render(<LocationListPanel data={mockPaginatedResponse} />);

    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('ページネーションを表示する', () => {
    const largeData: PaginatedResponse<Location> = {
      count: 25,
      next: 'next',
      previous: null,
      results: mockLocations,
    };

    const handlePageChange = vi.fn();
    render(
      <LocationListPanel
        data={largeData}
        onPageChange={handlePageChange}
        currentPage={1}
        pageSize={10}
      />
    );

    // ページネーションが表示されることを確認
    expect(screen.getByLabelText('次のページ')).toBeInTheDocument();
  });
});
