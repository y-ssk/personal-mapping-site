/**
 * ダッシュボードページコンポーネント。
 *
 * SPEC.md § 1.2 J: ダッシュボード（TOPページ）に準拠。
 * Google Maps風のパネル分割UIを提供し、場所一覧と地図を同時表示する。
 */
import { useState } from 'react';

import { PanelLayout } from '@/components/PanelLayout';
import { MapView } from '@/components/MapView';
import {
  useLocations,
  LocationList,
  type Location,
  LOCATION_PAGINATION,
} from '@/features/locations';
import { useMapStore } from '@/stores/mapStore';

/** ダッシュボードの定数 */
const DASHBOARD_CONSTANTS = {
  /** 読み込み中メッセージ */
  LOADING_MESSAGE: '場所を読み込み中...',
  /** エラーメッセージの接頭辞 */
  ERROR_PREFIX: 'エラーが発生しました: ',
  /** 再読み込みボタンのテキスト */
  RETRY_BUTTON_TEXT: '再読み込み',
} as const;

/**
 * 読み込み中状態の表示
 */
function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
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
        <p className="mt-2 text-sm text-gray-500">{DASHBOARD_CONSTANTS.LOADING_MESSAGE}</p>
      </div>
    </div>
  );
}

/**
 * エラー状態の表示
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-red-600">
          {DASHBOARD_CONSTANTS.ERROR_PREFIX}
          {message}
        </p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {DASHBOARD_CONSTANTS.RETRY_BUTTON_TEXT}
        </button>
      </div>
    </div>
  );
}

/**
 * ダッシュボードページコンポーネント。
 *
 * - 左パネル: 場所一覧（LocationList）
 * - 右パネル: 地図（MapView）
 * - 場所クリックで地図の中心を移動
 * - レスポンシブ対応（モバイルは縦並び）
 *
 * @example
 * ```tsx
 * // App.tsx内でルートとして使用
 * <Route path="/" element={<DashboardPage />} />
 * ```
 */
export function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { setCenter } = useMapStore();

  // Location一覧を取得
  const { data, isLoading, error, refetch } = useLocations({
    page: currentPage,
    page_size: LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
  });

  /**
   * Location一覧でのクリックハンドラ。
   * クリックされた場所の座標を地図の中心に設定する。
   */
  const handleLocationClick = (location: Location) => {
    // GeoPointの座標を取得して地図の中心を更新
    const [lng, lat] = location.point.coordinates;
    setCenter({ lat, lng });
  };

  /**
   * ページ変更ハンドラ。
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 読み込み中
  if (isLoading) {
    return <LoadingState />;
  }

  // エラー
  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  // データがない場合（通常は発生しないが念のため）
  if (!data) {
    return <LoadingState />;
  }

  // サイドパネル: 場所一覧
  const sidePanel = (
    <div className="p-4">
      <LocationList
        data={data}
        onLocationClick={handleLocationClick}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        pageSize={LOCATION_PAGINATION.DEFAULT_PAGE_SIZE}
      />
    </div>
  );

  // メインパネル: 地図
  const mainPanel = (
    <MapView locations={data.results} onMarkerClick={handleLocationClick} height="100%" />
  );

  return <PanelLayout sidePanel={sidePanel} mainPanel={mainPanel} />;
}
