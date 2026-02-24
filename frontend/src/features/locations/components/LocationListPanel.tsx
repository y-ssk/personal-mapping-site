/**
 * 縦並びリスト表示用の場所一覧パネルコンポーネント。
 *
 * 地図と連動し、選択・ホバー状態を視覚的に表示する。
 * マーカークリック時に該当アイテムまで自動スクロールする。
 */
import { useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

import { useMapStore } from '@/stores/mapStore';
import { LOCATION_PAGINATION, LOCATION_EMPTY_STATE } from '../constants';
import type { Location, PaginatedResponse } from '../types/location';

/** LocationListPanelのスクロール設定 */
const SCROLL_OPTIONS = {
  /** スクロール動作 */
  BEHAVIOR: 'smooth' as const,
  /** スクロール位置（画面中央） */
  BLOCK: 'center' as const,
} as const;

/** LocationListPanelのスタイル定数 */
const LIST_PANEL_STYLES = {
  /** 選択状態のスタイル */
  SELECTED: 'ring-2 ring-blue-500 bg-blue-50',
  /** ホバー状態のスタイル */
  HOVERED: 'ring-2 ring-blue-300 bg-blue-25',
  /** 通常状態のスタイル */
  NORMAL: 'hover:bg-gray-50',
} as const;

/**
 * LocationListPanelコンポーネントのProps。
 */
export interface LocationListPanelProps {
  /** Location一覧（ページネーション付き） */
  data: PaginatedResponse<Location>;
  /** カードクリック時のハンドラ */
  onLocationClick?: (location: Location) => void;
  /** ページ変更時のハンドラ */
  onPageChange?: (page: number) => void;
  /** 現在のページ番号 */
  currentPage?: number;
  /** 1ページあたりの件数 */
  pageSize?: number;
}

/**
 * 空状態の表示
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{LOCATION_EMPTY_STATE.TITLE}</h3>
      <p className="text-gray-500">{LOCATION_EMPTY_STATE.DESCRIPTION}</p>
    </div>
  );
}

/**
 * 縦並びリストアイテムコンポーネント
 */
function LocationListItem({
  location,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  itemRef,
}: {
  location: Location;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  // 選択・ホバー状態に応じたスタイル
  const stateStyle = isSelected
    ? LIST_PANEL_STYLES.SELECTED
    : isHovered
      ? LIST_PANEL_STYLES.HOVERED
      : LIST_PANEL_STYLES.NORMAL;

  return (
    <div
      ref={itemRef}
      className={`
        p-3 border-b border-gray-200 cursor-pointer transition-all
        ${stateStyle}
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      data-testid={`location-item-${location.id}`}
      data-location-id={location.id}
    >
      <div className="flex items-start gap-3">
        {/* カテゴリアイコン */}
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
          {location.category?.icon || <MapPin size={16} className="text-gray-400" />}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{location.name}</h4>
          {location.address && <p className="text-sm text-gray-500 truncate">{location.address}</p>}
          {location.category && (
            <p className="text-xs text-gray-400 mt-1">{location.category.fullPath}</p>
          )}
        </div>

        {/* 訪問回数 */}
        {location.visitCount > 0 && (
          <span className="flex-shrink-0 text-xs text-gray-400">{location.visitCount}回</span>
        )}
      </div>
    </div>
  );
}

/**
 * ページネーションコンポーネント
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  // 表示するページ番号を計算
  const getVisiblePages = (): number[] => {
    const pages: number[] = [];
    const maxVisible = LOCATION_PAGINATION.MAX_VISIBLE_PAGES;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    // 終端に寄せて調整
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className="flex items-center justify-center gap-1 p-3 border-t"
      aria-label="ページネーション"
    >
      {/* 前へ */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-2 py-1 rounded text-sm
          ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        aria-label="前のページ"
      >
        ←
      </button>

      {/* ページ番号 */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-2 py-1 rounded text-sm
            ${page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}
          `}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* 次へ */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-2 py-1 rounded text-sm
          ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        aria-label="次のページ"
      >
        →
      </button>
    </nav>
  );
}

/**
 * 縦並びリスト表示用の場所一覧パネル。
 *
 * @example
 * ```tsx
 * <LocationListPanel
 *   data={paginatedLocations}
 *   onLocationClick={(loc) => handleLocationSelect(loc)}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   currentPage={currentPage}
 * />
 * ```
 */
export function LocationListPanel({
  data,
  onLocationClick,
  onPageChange,
  currentPage = 1,
  pageSize = LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
}: LocationListPanelProps) {
  const { selectedLocationId, hoveredLocationId, setHoveredLocationId } = useMapStore();
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 選択されたLocationが変更されたらスクロール
  useEffect(() => {
    if (selectedLocationId !== null) {
      const element = itemRefs.current.get(selectedLocationId);
      if (element) {
        element.scrollIntoView({
          behavior: SCROLL_OPTIONS.BEHAVIOR,
          block: SCROLL_OPTIONS.BLOCK,
        });
      }
    }
  }, [selectedLocationId]);

  // refを設定するコールバック
  const setItemRef = useCallback(
    (id: number) => (el: HTMLDivElement | null) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );

  // クリックハンドラ
  const handleClick = useCallback(
    (location: Location) => {
      onLocationClick?.(location);
    },
    [onLocationClick]
  );

  // ホバーハンドラ
  const handleMouseEnter = useCallback(
    (locationId: number) => {
      setHoveredLocationId(locationId);
    },
    [setHoveredLocationId]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredLocationId(null);
  }, [setHoveredLocationId]);

  // 空状態
  if (data.results.length === 0) {
    return <EmptyState />;
  }

  // 総ページ数を計算
  const totalPages = Math.ceil(data.count / pageSize);

  return (
    <div className="h-full flex flex-col" data-testid="location-list-panel">
      {/* ヘッダー */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-white">
        <span className="text-sm text-gray-600">
          {data.count}件中 {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, data.count)}件を表示
        </span>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto" data-testid="location-list-scroll">
        {data.results.map((location) => (
          <LocationListItem
            key={location.id}
            location={location}
            isSelected={selectedLocationId === location.id}
            isHovered={hoveredLocationId === location.id}
            onClick={() => handleClick(location)}
            onMouseEnter={() => handleMouseEnter(location.id)}
            onMouseLeave={handleMouseLeave}
            itemRef={setItemRef(location.id)}
          />
        ))}
      </div>

      {/* ページネーション */}
      {onPageChange && (
        <div className="flex-shrink-0">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
