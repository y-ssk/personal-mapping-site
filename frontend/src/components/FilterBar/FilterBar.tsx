/**
 * フィルタバーコンポーネント。
 *
 * 共通コンポーネントとして、各機能で再利用可能。
 * SPEC.md § 2.2.1に準拠。
 */
import { useState, useCallback } from 'react';

// ============================================
// 型定義
// ============================================

/**
 * フィルタ項目の定義
 */
export interface FilterItem {
  /** フィルタのキー */
  key: string;
  /** 表示ラベル */
  label: string;
  /** フィルタの種類 */
  type: 'select' | 'text' | 'tags';
  /** 選択肢（selectの場合） */
  options?: { value: string | number; label: string }[];
  /** プレースホルダー */
  placeholder?: string;
}

/**
 * ソート項目の定義
 */
export interface SortItem {
  /** ソートのキー（APIパラメータ） */
  value: string;
  /** 表示ラベル */
  label: string;
}

/**
 * フィルタ値の型
 */
export type FilterValues = Record<string, string | number | undefined>;

interface FilterBarProps {
  /** フィルタ項目の定義 */
  filters: FilterItem[];
  /** ソート項目の定義 */
  sorts?: SortItem[];
  /** 現在のフィルタ値 */
  values: FilterValues;
  /** 現在のソート値 */
  sortValue?: string;
  /** フィルタ変更時のハンドラ */
  onFilterChange: (values: FilterValues) => void;
  /** ソート変更時のハンドラ */
  onSortChange?: (value: string) => void;
  /** 検索ボタンクリック時のハンドラ（省略時は即時反映） */
  onSearch?: () => void;
  /** クリアボタンクリック時のハンドラ */
  onClear?: () => void;
}

// ============================================
// サブコンポーネント
// ============================================

/**
 * セレクトフィルタ
 */
function SelectFilter({
  item,
  value,
  onChange,
}: {
  item: FilterItem;
  value: string | number | undefined;
  onChange: (key: string, value: string | number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`filter-${item.key}`}
        className="text-sm font-medium text-gray-700"
      >
        {item.label}
      </label>
      <select
        id={`filter-${item.key}`}
        value={value ?? ''}
        onChange={(e) => {
          const newValue = e.target.value === '' ? undefined : e.target.value;
          onChange(item.key, newValue);
        }}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        <option value="">{item.placeholder ?? '選択してください'}</option>
        {item.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * テキストフィルタ
 */
function TextFilter({
  item,
  value,
  onChange,
}: {
  item: FilterItem;
  value: string | number | undefined;
  onChange: (key: string, value: string | number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`filter-${item.key}`}
        className="text-sm font-medium text-gray-700"
      >
        {item.label}
      </label>
      <input
        id={`filter-${item.key}`}
        type="text"
        value={value ?? ''}
        onChange={(e) => {
          const newValue = e.target.value === '' ? undefined : e.target.value;
          onChange(item.key, newValue);
        }}
        placeholder={item.placeholder}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}

/**
 * タグ入力フィルタ
 */
function TagsFilter({
  item,
  value,
  onChange,
}: {
  item: FilterItem;
  value: string | number | undefined;
  onChange: (key: string, value: string | number | undefined) => void;
}) {
  const tagsString = typeof value === 'string' ? value : '';

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`filter-${item.key}`}
        className="text-sm font-medium text-gray-700"
      >
        {item.label}
      </label>
      <input
        id={`filter-${item.key}`}
        type="text"
        value={tagsString}
        onChange={(e) => {
          const newValue = e.target.value === '' ? undefined : e.target.value;
          onChange(item.key, newValue);
        }}
        placeholder={item.placeholder ?? 'カンマ区切りで入力'}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <span className="text-xs text-gray-500">
        複数のタグはカンマで区切ってください
      </span>
    </div>
  );
}

// ============================================
// メインコンポーネント
// ============================================

/**
 * フィルタバーコンポーネント。
 *
 * @example
 * ```tsx
 * const filters: FilterItem[] = [
 *   {
 *     key: 'category',
 *     label: 'カテゴリ',
 *     type: 'select',
 *     options: [
 *       { value: 1, label: 'カフェ' },
 *       { value: 2, label: 'レストラン' },
 *     ],
 *   },
 *   {
 *     key: 'search',
 *     label: '検索',
 *     type: 'text',
 *     placeholder: '名前や住所で検索',
 *   },
 * ];
 *
 * const sorts: SortItem[] = [
 *   { value: '-created_at', label: '作成日（新しい順）' },
 *   { value: 'name', label: '名前（A-Z）' },
 * ];
 *
 * <FilterBar
 *   filters={filters}
 *   sorts={sorts}
 *   values={filterValues}
 *   sortValue={sortValue}
 *   onFilterChange={setFilterValues}
 *   onSortChange={setSortValue}
 * />
 * ```
 */
export function FilterBar({
  filters,
  sorts,
  values,
  sortValue,
  onFilterChange,
  onSortChange,
  onSearch,
  onClear,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // フィルタ値の変更ハンドラ
  const handleFilterChange = useCallback(
    (key: string, value: string | number | undefined) => {
      onFilterChange({ ...values, [key]: value });
    },
    [values, onFilterChange]
  );

  // クリアハンドラ
  const handleClear = useCallback(() => {
    const clearedValues: FilterValues = {};
    filters.forEach((filter) => {
      clearedValues[filter.key] = undefined;
    });
    onFilterChange(clearedValues);
    onClear?.();
  }, [filters, onFilterChange, onClear]);

  // アクティブなフィルタ数をカウント
  const activeFilterCount = Object.values(values).filter(
    (v) => v !== undefined && v !== ''
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <span className="font-medium">フィルタ</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </button>

        {/* ソート（常に表示） */}
        {sorts && sorts.length > 0 && onSortChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600">
              並び替え:
            </label>
            <select
              id="sort"
              value={sortValue ?? ''}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {sorts.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* フィルタ項目（展開時のみ表示） */}
      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => {
              switch (filter.type) {
                case 'select':
                  return (
                    <SelectFilter
                      key={filter.key}
                      item={filter}
                      value={values[filter.key]}
                      onChange={handleFilterChange}
                    />
                  );
                case 'text':
                  return (
                    <TextFilter
                      key={filter.key}
                      item={filter}
                      value={values[filter.key]}
                      onChange={handleFilterChange}
                    />
                  );
                case 'tags':
                  return (
                    <TagsFilter
                      key={filter.key}
                      item={filter}
                      value={values[filter.key]}
                      onChange={handleFilterChange}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {onSearch && (
              <button
                onClick={onSearch}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                検索
              </button>
            )}
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
