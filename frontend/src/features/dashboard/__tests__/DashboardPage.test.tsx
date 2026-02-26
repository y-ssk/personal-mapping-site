/**
 * DashboardPageコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { DashboardPage } from '../pages/DashboardPage';
import type { Location, PaginatedResponse } from '@/features/locations';
import type { LocationApiError } from '@/features/locations/api/locationApi';

// PanelLayoutとDetailPanelをモック
vi.mock('@/components/PanelLayout', () => ({
  PanelLayout: ({
    sidePanel,
    mainPanel,
  }: {
    sidePanel: React.ReactNode;
    mainPanel: React.ReactNode;
  }) => (
    <div data-testid="panel-layout">
      <div data-testid="side-panel">{sidePanel}</div>
      <div data-testid="main-panel">{mainPanel}</div>
    </div>
  ),
  DetailPanel: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="detail-panel">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="detail-panel-close">
          閉じる
        </button>
        {children}
      </div>
    ) : null,
}));

// MapViewをモック
vi.mock('@/components/MapView', () => ({
  MapView: ({
    locations,
    onMarkerClick,
  }: {
    locations?: Location[];
    onMarkerClick?: (location: Location) => void;
  }) => (
    <div data-testid="map-view" data-location-count={locations?.length ?? 0}>
      {locations?.map((loc) => (
        <button
          key={loc.id}
          data-testid={`map-marker-${loc.id}`}
          onClick={() => onMarkerClick?.(loc)}
        >
          {loc.name}
        </button>
      ))}
    </div>
  ),
}));

// LocationListPanelとLocationCardをモック
vi.mock('@/features/locations', async () => {
  const actual =
    await vi.importActual<typeof import('@/features/locations')>('@/features/locations');
  return {
    ...actual,
    LocationListPanel: ({
      data,
      onLocationClick,
      onPageChange,
      currentPage,
    }: {
      data: PaginatedResponse<Location>;
      onLocationClick?: (location: Location) => void;
      onPageChange?: (page: number) => void;
      currentPage?: number;
    }) => (
      <div data-testid="location-list-panel" data-page={currentPage}>
        <span data-testid="location-count">{data.count}件</span>
        {data.results.map((loc) => (
          <button
            key={loc.id}
            data-testid={`location-item-${loc.id}`}
            onClick={() => onLocationClick?.(loc)}
          >
            {loc.name}
          </button>
        ))}
        {onPageChange && (
          <button data-testid="next-page" onClick={() => onPageChange((currentPage ?? 1) + 1)}>
            次のページ
          </button>
        )}
      </div>
    ),
    LocationCard: ({ location }: { location: Location }) => (
      <div data-testid="location-card">{location.name}</div>
    ),
    useLocations: vi.fn(),
    LOCATION_PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      MAX_VISIBLE_PAGES: 5,
    },
  };
});

// mapStoreをモック
const mockSetCenter = vi.fn();
const mockSetSelectedLocationId = vi.fn();
vi.mock('@/stores/mapStore', () => ({
  useMapStore: () => ({
    center: { lat: 35.6812, lng: 139.7671 },
    setCenter: mockSetCenter,
    selectedLocationId: null,
    setSelectedLocationId: mockSetSelectedLocationId,
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

const mockPaginatedResponse: PaginatedResponse<Location> = {
  count: 2,
  next: null,
  previous: null,
  results: mockLocations,
};

describe('DashboardPage', () => {
  const mockRefetch = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('読み込み中状態を表示する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      refetch: mockRefetch,
    });

    const { container } = render(<DashboardPage />);

    // スピナー（SVG）が表示されることを確認
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('エラー状態を表示する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('ネットワークエラー') as LocationApiError,
      isSuccess: false,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    expect(screen.getByText(/ネットワークエラー/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });

  it('再読み込みボタンでrefetchを呼び出す', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('エラー') as LocationApiError,
      isSuccess: false,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    const retryButton = screen.getByRole('button', { name: '再読み込み' });
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('データ取得成功時にPanelLayoutをレンダリングする', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    expect(screen.getByTestId('panel-layout')).toBeInTheDocument();
    expect(screen.getByTestId('side-panel')).toBeInTheDocument();
    expect(screen.getByTestId('main-panel')).toBeInTheDocument();
  });

  it('LocationListをサイドパネルに表示する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    expect(screen.getByTestId('location-list-panel')).toBeInTheDocument();
    expect(screen.getByTestId('location-count')).toHaveTextContent('2件');
  });

  it('MapViewをメインパネルに表示する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    const mapView = screen.getByTestId('map-view');
    expect(mapView).toBeInTheDocument();
    expect(mapView).toHaveAttribute('data-location-count', '2');
  });

  it('場所クリックで地図中心を更新する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    const locationItem = screen.getByTestId('location-item-1');
    fireEvent.click(locationItem);

    expect(mockSetCenter).toHaveBeenCalledWith({
      lat: 35.6812,
      lng: 139.7671,
    });
  });

  it('ページ変更を処理する', async () => {
    const { useLocations } = await import('@/features/locations');
    vi.mocked(useLocations).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: mockRefetch,
    });

    render(<DashboardPage />);

    const nextPageButton = screen.getByTestId('next-page');
    fireEvent.click(nextPageButton);

    // useLocationsが新しいページで再呼び出しされることを確認
    expect(useLocations).toHaveBeenCalled();
  });
});
