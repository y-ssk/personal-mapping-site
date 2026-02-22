/**
 * 場所一覧コンポーネント。
 *
 * 場所カードをグリッド表示し、ページネーションを提供する。
 */
import { LocationCard } from './LocationCard';
import { LOCATION_PAGINATION } from '../constants';
import type { Location, PaginatedResponse } from '../types/location';

interface LocationListProps {
  /** Location一覧（ページネーション付き） */
  data: PaginatedResponse<Location>;
  /** カードクリック時のハンドラ */
  onLocationClick?: (location: Location) => void;
  /** 編集ボタンクリック時のハンドラ */
  onLocationEdit?: (location: Location) => void;
  /** 削除ボタンクリック時のハンドラ */
  onLocationDelete?: (location: Location) => void;
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
      <div className="text-gray-400 text-5xl mb-4">📍</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        場所がありません
      </h3>
      <p className="text-gray-500">
        まだ場所が登録されていません。地図から場所を追加してみましょう。
      </p>
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
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="ページネーション">
      {/* 前へ */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 py-2 rounded-md text-sm font-medium
          ${currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'}
        `}
        aria-label="前のページ"
      >
        ←
      </button>

      {/* 最初のページ */}
      {visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="px-2 text-gray-400">...</span>
          )}
        </>
      )}

      {/* ページ番号 */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-3 py-2 rounded-md text-sm font-medium
            ${page === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'}
          `}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* 最後のページ */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-400">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 次へ */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-3 py-2 rounded-md text-sm font-medium
          ${currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'}
        `}
        aria-label="次のページ"
      >
        →
      </button>
    </nav>
  );
}

/**
 * 場所一覧コンポーネント。
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useLocations(filters);
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <LocationList
 *     data={data}
 *     onLocationClick={(loc) => navigate(`/locations/${loc.id}`)}
 *     onPageChange={(page) => setFilters({ ...filters, page })}
 *     currentPage={filters.page ?? 1}
 *   />
 * );
 * ```
 */
export function LocationList({
  data,
  onLocationClick,
  onLocationEdit,
  onLocationDelete,
  onPageChange,
  currentPage = 1,
  pageSize = LOCATION_PAGINATION.DEFAULT_PAGE_SIZE,
}: LocationListProps) {
  // 空状態
  if (data.results.length === 0) {
    return <EmptyState />;
  }

  // 総ページ数を計算
  const totalPages = Math.ceil(data.count / pageSize);

  return (
    <div>
      {/* 件数表示 */}
      <div className="text-sm text-gray-500 mb-4">
        {data.count}件中 {(currentPage - 1) * pageSize + 1}-
        {Math.min(currentPage * pageSize, data.count)}件を表示
      </div>

      {/* カードグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.results.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            onClick={onLocationClick}
            onEdit={onLocationEdit}
            onDelete={onLocationDelete}
          />
        ))}
      </div>

      {/* ページネーション */}
      {onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
