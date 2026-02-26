/**
 * ダッシュボードページコンポーネント。
 *
 * SPEC.md § 1.2 J: ダッシュボード（TOPページ）に準拠。
 * Google Maps風のパネル分割UIを提供し、場所一覧と地図を同時表示する。
 * 地図-リスト連動機能（選択・ホバーでハイライト）を提供。
 */
import { useState, useCallback, useMemo } from 'react';

import { PanelLayout, DetailPanel } from '@/components/PanelLayout';
import { MapView } from '@/components/MapView';
import {
  useLocations,
  LocationListPanel,
  LocationCard,
  type Location,
  LOCATION_PAGINATION,
} from '@/features/locations';
import { useMapStore } from '@/stores/mapStore';

/** ダッシュボードの定数 */
const DASHBOARD_CONSTANTS = {
  /** エラーメッセージの接頭辞 */
  ERROR_PREFIX: 'エラーが発生しました: ',
  /** 再読み込みボタンのテキスト */
  RETRY_BUTTON_TEXT: '再読み込み',
  /** 詳細パネルタイトルのデフォルト */
  DETAIL_PANEL_DEFAULT_TITLE: '場所の詳細',
} as const;

/**
 * 読み込み中状態の表示（スピナーのみ）
 */
function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
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
 * - 左パネル: 場所一覧（LocationListPanel）- 縦並びリスト
 * - 右パネル: 地図（MapView）
 * - 場所クリックで地図の中心を移動 + 選択状態管理
 * - リストホバー → マーカーハイライト
 * - マーカークリック → リストスクロール連動
 * - レスポンシブ対応（モバイルは縦並び）
 * - DetailPanelで選択場所の詳細表示
 *
 * @example
 * ```tsx
 * // App.tsx内でルートとして使用
 * <Route path="/" element={<DashboardPage />} />
 * ```
 */
export function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { setCenter, selectedLocationId, setSelectedLocationId } = useMapStore();

  // Location一覧を取得
  const { data, isLoading, error, refetch } = useLocations({
    page: currentPage,
    page_size: LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
  });

  // 選択中のLocationを取得
  const selectedLocation = useMemo(() => {
    if (!data || selectedLocationId === null) return null;
    return data.results.find((loc) => loc.id === selectedLocationId) || null;
  }, [data, selectedLocationId]);

  /**
   * Location一覧でのクリックハンドラ。
   * クリックされた場所の座標を地図の中心に設定し、選択状態を更新する。
   */
  const handleLocationClick = useCallback(
    (location: Location) => {
      // GeoPointの座標を取得して地図の中心を更新
      const [lng, lat] = location.point.coordinates;
      setCenter({ lat, lng });
      // 選択状態を更新
      setSelectedLocationId(location.id);
    },
    [setCenter, setSelectedLocationId]
  );

  /**
   * マーカークリックハンドラ。
   * handleLocationClickと同じ処理だが、地図からの呼び出しであることを明示。
   */
  const handleMarkerClick = useCallback(
    (location: Location) => {
      handleLocationClick(location);
    },
    [handleLocationClick]
  );

  /**
   * DetailPanelを閉じるハンドラ。
   */
  const handleDetailClose = useCallback(() => {
    setSelectedLocationId(null);
  }, [setSelectedLocationId]);

  /**
   * ページ変更ハンドラ。
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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

  // サイドパネル: 場所一覧（縦並びリスト）
  const sidePanel = (
    <LocationListPanel
      data={data}
      onLocationClick={handleLocationClick}
      onPageChange={handlePageChange}
      currentPage={currentPage}
      pageSize={LOCATION_PAGINATION.DEFAULT_PAGE_SIZE}
    />
  );

  // メインパネル: 地図
  const mainPanel = (
    <div className="relative h-full">
      <MapView locations={data.results} onMarkerClick={handleMarkerClick} height="100%" />

      {/* DetailPanel: 選択中の場所の詳細 */}
      <DetailPanel
        isOpen={selectedLocation !== null}
        onClose={handleDetailClose}
        title={selectedLocation?.name || DASHBOARD_CONSTANTS.DETAIL_PANEL_DEFAULT_TITLE}
      >
        {selectedLocation && (
          <div className="p-4">
            <LocationCard location={selectedLocation} />
          </div>
        )}
      </DetailPanel>
    </div>
  );

  return <PanelLayout sidePanel={sidePanel} mainPanel={mainPanel} />;
}
