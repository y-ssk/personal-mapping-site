/**
 * Location一覧取得フック。
 *
 * TanStack Queryを使用してLocation一覧APIを呼び出す。
 */
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { LOCATION_QUERY_KEYS, LOCATION_CACHE } from '../constants';
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  patchLocation,
  deleteLocation,
  LocationApiError,
} from '../api/locationApi';
import type {
  Location,
  LocationFilters,
  LocationCreateRequest,
  LocationPatchRequest,
  PaginatedResponse,
} from '../types/location';

// ============================================
// 一覧取得フック
// ============================================

interface UseLocationsResult {
  /** Location一覧（ページネーション付き） */
  data: PaginatedResponse<Location> | undefined;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
  /** 再取得関数 */
  refetch: () => void;
}

/**
 * Location一覧を取得するカスタムフック。
 *
 * @param filters - フィルタパラメータ
 * @returns Location一覧と状態
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useLocations({ category: 1 });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (data) return <LocationList locations={data.results} />;
 * ```
 */
export function useLocations(filters?: LocationFilters): UseLocationsResult {
  const query = useQuery({
    queryKey: LOCATION_QUERY_KEYS.list(filters as Record<string, unknown> | undefined),
    queryFn: () => listLocations(filters),
    staleTime: LOCATION_CACHE.STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as LocationApiError | null,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}

// ============================================
// 詳細取得フック
// ============================================

interface UseLocationResult {
  /** Location詳細 */
  data: Location | undefined;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
  /** 再取得関数 */
  refetch: () => void;
}

/**
 * Location詳細を取得するカスタムフック。
 *
 * @param id - LocationのID
 * @returns Location詳細と状態
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useLocation(1);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (data) return <LocationDetail location={data} />;
 * ```
 */
export function useLocation(id: number): UseLocationResult {
  const query = useQuery({
    queryKey: LOCATION_QUERY_KEYS.detail(id),
    queryFn: () => getLocation(id),
    staleTime: LOCATION_CACHE.STALE_TIME_MS,
    enabled: id > 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as LocationApiError | null,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}

// ============================================
// 作成フック
// ============================================

interface UseCreateLocationResult {
  /** 作成関数 */
  mutate: (data: LocationCreateRequest) => void;
  /** 非同期作成関数 */
  mutateAsync: (data: LocationCreateRequest) => Promise<Location>;
  /** ローディング中かどうか */
  isPending: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
  /** 作成されたLocation */
  data: Location | undefined;
}

/**
 * Locationを作成するカスタムフック。
 *
 * @returns 作成関数と状態
 *
 * @example
 * ```typescript
 * const { mutate, isPending, error } = useCreateLocation();
 *
 * const handleSubmit = (data: LocationCreateRequest) => {
 *   mutate(data, {
 *     onSuccess: (location) => {
 *       toast.success('場所を作成しました');
 *       navigate(`/locations/${location.id}`);
 *     },
 *   });
 * };
 * ```
 */
export function useCreateLocation(): UseCreateLocationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      // 一覧キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.lists() });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as LocationApiError | null,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}

// ============================================
// 更新フック
// ============================================

interface UseUpdateLocationResult {
  /** 更新関数 */
  mutate: (params: { id: number; data: LocationCreateRequest }) => void;
  /** 非同期更新関数 */
  mutateAsync: (params: { id: number; data: LocationCreateRequest }) => Promise<Location>;
  /** ローディング中かどうか */
  isPending: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
}

/**
 * Locationを更新するカスタムフック（完全更新）。
 *
 * @returns 更新関数と状態
 */
export function useUpdateLocation(): UseUpdateLocationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationCreateRequest }) =>
      updateLocation(id, data),
    onSuccess: (_, variables) => {
      // 一覧キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.lists() });
      // 詳細キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.detail(variables.id) });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as LocationApiError | null,
    isSuccess: mutation.isSuccess,
  };
}

// ============================================
// 部分更新フック
// ============================================

interface UsePatchLocationResult {
  /** 更新関数 */
  mutate: (params: { id: number; data: LocationPatchRequest }) => void;
  /** 非同期更新関数 */
  mutateAsync: (params: { id: number; data: LocationPatchRequest }) => Promise<Location>;
  /** ローディング中かどうか */
  isPending: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
}

/**
 * Locationを更新するカスタムフック（部分更新）。
 *
 * @returns 更新関数と状態
 */
export function usePatchLocation(): UsePatchLocationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationPatchRequest }) =>
      patchLocation(id, data),
    onSuccess: (_, variables) => {
      // 一覧キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.lists() });
      // 詳細キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.detail(variables.id) });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as LocationApiError | null,
    isSuccess: mutation.isSuccess,
  };
}

// ============================================
// 削除フック
// ============================================

interface UseDeleteLocationResult {
  /** 削除関数 */
  mutate: (id: number) => void;
  /** 非同期削除関数 */
  mutateAsync: (id: number) => Promise<void>;
  /** ローディング中かどうか */
  isPending: boolean;
  /** エラー */
  error: LocationApiError | null;
  /** 成功したかどうか */
  isSuccess: boolean;
}

/**
 * Locationを削除するカスタムフック。
 *
 * @returns 削除関数と状態
 *
 * @example
 * ```typescript
 * const { mutate, isPending, error } = useDeleteLocation();
 *
 * const handleDelete = (id: number) => {
 *   if (confirm('削除しますか？')) {
 *     mutate(id, {
 *       onSuccess: () => toast.success('削除しました'),
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteLocation(): UseDeleteLocationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      // 一覧キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.lists() });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as LocationApiError | null,
    isSuccess: mutation.isSuccess,
  };
}

// クエリキーをエクスポート（キャッシュ操作用）
export { LOCATION_QUERY_KEYS };
