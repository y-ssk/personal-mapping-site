/**
 * ダッシュボードページコンポーネント。
 *
 * SPEC.md § 1.2 J: ダッシュボード（TOPページ）に準拠。
 * Google Maps風のパネル分割UIを提供し、場所一覧と地図を同時表示する。
 * 地図-リスト連動機能（選択・ホバーでハイライト）を提供。
 * Location作成・編集フォームをDetailPanel内に表示。
 */
import { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';

import { PanelLayout, DetailPanel } from '@/components/PanelLayout';
import { MapView } from '@/components/MapView';
import type { LatLng } from '@/lib/maps';
import {
  useLocations,
  LocationListPanel,
  LocationCard,
  LocationForm,
  type Location,
  LOCATION_PAGINATION,
  LOCATION_SUCCESS_MESSAGES,
  LOCATION_FORM_MESSAGES,
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
  /** 新規追加ボタンのテキスト */
  ADD_BUTTON_TEXT: '新規追加',
  /** 成功トースト表示時間（ms） */
  TOAST_DISPLAY_MS: 3000,
} as const;

/** DetailPanelの表示モード */
type PanelMode = 'view' | 'create' | 'edit';

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
 * 成功トースト表示コンポーネント
 */
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-green-50 p-4 shadow-lg border border-green-200">
      <div className="flex items-center gap-2">
        <p className="text-sm text-green-700">{message}</p>
        <button
          onClick={onClose}
          className="text-green-500 hover:text-green-700"
          aria-label="閉じる"
        >
          ×
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
 * - DetailPanelで選択場所の詳細表示 / 作成・編集フォーム表示
 * - 地図クリックで新規作成フォーム表示 or 座標更新
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

  // パネルモード管理
  const [panelMode, setPanelMode] = useState<PanelMode>('view');
  // 地図クリック座標（フォームに渡す）
  const [clickedPoint, setClickedPoint] = useState<LatLng | null>(null);
  // 編集対象のLocation
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Location一覧を取得
  const { data, isLoading, error, refetch } = useLocations({
    page: currentPage,
    page_size: LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
  });

  // 選択中のLocationを取得（viewモード時のみ）
  const selectedLocation = useMemo(() => {
    if (!data || selectedLocationId === null || panelMode !== 'view') return null;
    return data.results.find((loc) => loc.id === selectedLocationId) || null;
  }, [data, selectedLocationId, panelMode]);

  /**
   * Location一覧でのクリックハンドラ。
   * クリックされた場所の座標を地図の中心に設定し、選択状態を更新する。
   */
  const handleLocationClick = useCallback(
    (location: Location) => {
      const [lng, lat] = location.point.coordinates;
      setCenter({ lat, lng });
      setSelectedLocationId(location.id);
      setPanelMode('view');
      setEditingLocation(null);
    },
    [setCenter, setSelectedLocationId]
  );

  /**
   * マーカークリックハンドラ。
   */
  const handleMarkerClick = useCallback(
    (location: Location) => {
      handleLocationClick(location);
    },
    [handleLocationClick]
  );

  /**
   * 地図クリックハンドラ。
   * フォームが開いている場合は座標を更新、閉じている場合は新規作成モードを開く。
   */
  const handleMapClick = useCallback(
    (latlng: LatLng) => {
      setClickedPoint(latlng);
      if (panelMode !== 'create' && panelMode !== 'edit') {
        setPanelMode('create');
        setSelectedLocationId(null);
        setEditingLocation(null);
      }
    },
    [panelMode, setSelectedLocationId]
  );

  /**
   * 新規追加ボタンハンドラ。
   */
  const handleAddClick = useCallback(() => {
    setPanelMode('create');
    setSelectedLocationId(null);
    setEditingLocation(null);
    setClickedPoint(null);
  }, [setSelectedLocationId]);

  /**
   * 編集ボタンハンドラ。
   */
  const handleEditClick = useCallback((location: Location) => {
    setPanelMode('edit');
    setEditingLocation(location);
    setClickedPoint(null);
  }, []);

  /**
   * DetailPanelを閉じるハンドラ。
   */
  const handleDetailClose = useCallback(() => {
    setPanelMode('view');
    setSelectedLocationId(null);
    setEditingLocation(null);
    setClickedPoint(null);
  }, [setSelectedLocationId]);

  /**
   * フォーム保存成功ハンドラ。
   */
  const handleFormSuccess = useCallback(
    (location: Location) => {
      setPanelMode('view');
      setEditingLocation(null);
      setClickedPoint(null);
      setSelectedLocationId(location.id);
      const [lng, lat] = location.point.coordinates;
      setCenter({ lat, lng });

      // 成功メッセージ表示
      const message = editingLocation
        ? LOCATION_SUCCESS_MESSAGES.UPDATED
        : LOCATION_SUCCESS_MESSAGES.CREATED;
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), DASHBOARD_CONSTANTS.TOAST_DISPLAY_MS);
    },
    [setCenter, setSelectedLocationId, editingLocation]
  );

  /**
   * フォームキャンセルハンドラ。
   */
  const handleFormCancel = useCallback(() => {
    setPanelMode('view');
    setEditingLocation(null);
    setClickedPoint(null);
  }, []);

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

  /** DetailPanelの表示判定 */
  const isPanelOpen = panelMode === 'create' || panelMode === 'edit' || selectedLocation !== null;

  /** DetailPanelのタイトル */
  const panelTitle =
    panelMode === 'create'
      ? LOCATION_FORM_MESSAGES.CREATE_TITLE
      : panelMode === 'edit'
        ? LOCATION_FORM_MESSAGES.EDIT_TITLE
        : selectedLocation?.name || DASHBOARD_CONSTANTS.DETAIL_PANEL_DEFAULT_TITLE;

  // サイドパネル: 場所一覧（縦並びリスト）+ 新規追加ボタン
  const sidePanel = (
    <div className="h-full flex flex-col">
      {/* 新規追加ボタン */}
      <div className="flex-shrink-0 px-4 py-2 border-b bg-white">
        <button
          onClick={handleAddClick}
          className="flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          data-testid="add-location-button"
        >
          <Plus size={16} />
          {DASHBOARD_CONSTANTS.ADD_BUTTON_TEXT}
        </button>
      </div>

      {/* 場所一覧 */}
      <div className="flex-1 overflow-hidden">
        <LocationListPanel
          data={data}
          onLocationClick={handleLocationClick}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          pageSize={LOCATION_PAGINATION.DEFAULT_PAGE_SIZE}
        />
      </div>
    </div>
  );

  // メインパネル: 地図
  const mainPanel = (
    <div className="relative h-full">
      <MapView
        locations={data.results}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        height="100%"
      />

      {/* DetailPanel: モードに応じたコンテンツ */}
      <DetailPanel isOpen={isPanelOpen} onClose={handleDetailClose} title={panelTitle}>
        {panelMode === 'create' && (
          <LocationForm
            clickedPoint={clickedPoint}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
        {panelMode === 'edit' && editingLocation && (
          <LocationForm
            location={editingLocation}
            clickedPoint={clickedPoint}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
        {panelMode === 'view' && selectedLocation && (
          <div className="p-4">
            <LocationCard location={selectedLocation} onEdit={handleEditClick} />
          </div>
        )}
      </DetailPanel>
    </div>
  );

  return (
    <>
      <PanelLayout sidePanel={sidePanel} mainPanel={mainPanel} />

      {/* 成功メッセージトースト */}
      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </>
  );
}
