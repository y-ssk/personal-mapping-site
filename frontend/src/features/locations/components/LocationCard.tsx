/**
 * 場所カードコンポーネント。
 *
 * 場所の概要情報を表示するカード。
 */
import type { Location } from '../types/location';
import { LOCATION_LABELS, LOCATION_UI } from '../constants';

interface LocationCardProps {
  /** 表示するLocation */
  location: Location;
  /** クリック時のハンドラ */
  onClick?: (location: Location) => void;
  /** 編集ボタンクリック時のハンドラ */
  onEdit?: (location: Location) => void;
  /** 削除ボタンクリック時のハンドラ */
  onDelete?: (location: Location) => void;
}

/**
 * ステータスのラベルを取得
 */
function getStatusLabel(status: Location['status']): string {
  switch (status) {
    case 'want_to_visit':
      return LOCATION_LABELS.STATUS_WANT_TO_VISIT;
    case 'not_interested':
      return LOCATION_LABELS.STATUS_NOT_INTERESTED;
    default:
      return LOCATION_LABELS.STATUS_NONE;
  }
}

/**
 * ステータスの色クラスを取得
 */
function getStatusColorClass(status: Location['status']): string {
  switch (status) {
    case 'want_to_visit':
      return 'bg-blue-100 text-blue-800';
    case 'not_interested':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-50 text-gray-400';
  }
}

/**
 * 星評価を表示
 */
function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-gray-400 text-sm">未評価</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * 場所カードコンポーネント。
 *
 * @example
 * ```tsx
 * <LocationCard
 *   location={location}
 *   onClick={(loc) => navigate(`/locations/${loc.id}`)}
 *   onEdit={(loc) => openEditModal(loc)}
 *   onDelete={(loc) => confirmDelete(loc)}
 * />
 * ```
 */
export function LocationCard({ location, onClick, onEdit, onDelete }: LocationCardProps) {
  const handleClick = () => {
    onClick?.(location);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(location);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(location);
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4
        hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {/* ヘッダー: 名前とステータス */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{location.name}</h3>
        <span
          className={`
            px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
            ${getStatusColorClass(location.status)}
          `}
        >
          {getStatusLabel(location.status)}
        </span>
      </div>

      {/* カテゴリ */}
      {location.category && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
          <span>{location.category.icon}</span>
          <span>{location.category.fullPath}</span>
        </div>
      )}

      {/* 住所 */}
      {location.address && (
        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{location.address}</p>
      )}

      {/* タグ */}
      {location.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {location.tags.slice(0, LOCATION_UI.MAX_VISIBLE_TAGS).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
          {location.tags.length > LOCATION_UI.MAX_VISIBLE_TAGS && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">
              +{location.tags.length - LOCATION_UI.MAX_VISIBLE_TAGS}
            </span>
          )}
        </div>
      )}

      {/* フッター: 評価と訪問回数 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <RatingStars rating={location.averageRating} />
        <span className="text-sm text-gray-500">
          {location.visitCount > 0 ? `${location.visitCount}回訪問` : '未訪問'}
        </span>
      </div>

      {/* アクションボタン */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="flex-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
