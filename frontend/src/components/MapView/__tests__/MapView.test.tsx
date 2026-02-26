/**
 * MapViewコンポーネントのテスト。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import type { Location } from '@/features/locations/types/location';

import { MapView } from '../MapView';

// vi.mockはホイスティングされるため、変数参照を避けてファクトリ内で直接定義
vi.mock('@/lib/maps', () => ({
  createMapService: vi.fn(() => ({
    displayMap: vi.fn(),
    addMarker: vi.fn().mockReturnValue({
      id: 1,
      position: { lat: 35.6812, lng: 139.7671 },
      location: {},
    }),
    removeMarker: vi.fn(),
    clearMarkers: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setMarkerClickHandler: vi.fn(),
    highlightMarker: vi.fn(),
    destroy: vi.fn(),
    searchPlace: vi.fn(),
  })),
  DEFAULT_CENTER: { lat: 35.6812, lng: 139.7671 },
  MAP_CONTAINER_STYLE: { DEFAULT_HEIGHT: '400px' },
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: vi.fn().mockReturnValue({
    center: { lat: 35.6812, lng: 139.7671 },
    setCenter: vi.fn(),
    hoveredLocationId: null,
  }),
}));

describe('MapView', () => {
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
      visitCount: 0,
      averageRating: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'テスト場所2',
      point: { type: 'Point', coordinates: [139.768, 35.682] },
      address: '東京都中央区',
      category: null,
      tags: [],
      status: null,
      notes: '',
      website: '',
      phone: '',
      visitCount: 0,
      averageRating: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('地図コンテナをレンダリングする', () => {
    render(<MapView />);

    const container = screen.getByTestId('map-view');
    expect(container).toBeInTheDocument();
  });

  it('デフォルトの高さでレンダリングされる', () => {
    render(<MapView />);

    const container = screen.getByTestId('map-view');
    expect(container).toHaveStyle({ height: '400px' });
  });

  it('カスタム高さを適用できる', () => {
    render(<MapView height="600px" />);

    const container = screen.getByTestId('map-view');
    expect(container).toHaveStyle({ height: '600px' });
  });

  it('クラス名を適用できる', () => {
    render(<MapView className="custom-map" />);

    const container = screen.getByTestId('map-view');
    expect(container).toHaveClass('custom-map');
  });

  it('マウント時に地図を初期化する', async () => {
    const { createMapService } = await import('@/lib/maps');
    render(<MapView />);

    expect(createMapService).toHaveBeenCalled();
  });

  it('locationsが渡されるとマーカーを処理する', async () => {
    const { createMapService } = await import('@/lib/maps');
    render(<MapView locations={mockLocations} />);

    // createMapServiceが呼ばれていることを確認
    expect(createMapService).toHaveBeenCalled();
  });

  it('幅が100%でレンダリングされる', () => {
    render(<MapView />);

    const container = screen.getByTestId('map-view');
    expect(container).toHaveStyle({ width: '100%' });
  });
});
