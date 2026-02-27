/**
 * カテゴリ一覧取得フック。
 *
 * TanStack Queryを使用してカテゴリ一覧APIを呼び出す。
 */
import { useQuery } from '@tanstack/react-query';

import { CATEGORY_QUERY_KEYS, LOCATION_CACHE } from '../constants';
import { listCategories, CategoryApiError } from '../api/categoryApi';
import type { Category } from '../types/location';

interface UseCategoriesResult {
  /** カテゴリ一覧 */
  data: Category[] | undefined;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: CategoryApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
}

/**
 * カテゴリ一覧を取得するカスタムフック。
 *
 * @returns カテゴリ一覧と状態
 *
 * @example
 * ```typescript
 * const { data: categories, isLoading } = useCategories();
 *
 * if (isLoading) return <Spinner />;
 * if (categories) {
 *   return (
 *     <select>
 *       {categories.map(cat => (
 *         <option key={cat.id} value={cat.id}>{cat.fullPath}</option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useCategories(): UseCategoriesResult {
  const query = useQuery({
    queryKey: CATEGORY_QUERY_KEYS.list(),
    queryFn: listCategories,
    staleTime: LOCATION_CACHE.STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as CategoryApiError | null,
    isSuccess: query.isSuccess,
  };
}
