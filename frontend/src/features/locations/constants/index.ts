/**
 * Location関連の定数。
 *
 * CLAUDE.md § 7 マジックナンバー禁止に準拠。
 */

export * from './messages';

/**
 * APIエンドポイント
 */
export const LOCATION_ENDPOINTS = {
  /** 一覧取得・作成 */
  LIST: '/api/v1/locations/',
  /** 詳細取得・更新・削除 */
  DETAIL: (id: number) => `/api/v1/locations/${id}/`,
  /** 近傍検索 */
  NEARBY: '/api/v1/locations/nearby/',
  /** おすすめ */
  RECOMMENDATIONS: '/api/v1/locations/recommendations/',
} as const;

/**
 * ページネーション設定
 */
export const LOCATION_PAGINATION = {
  /** デフォルトページサイズ */
  DEFAULT_PAGE_SIZE: 20,
  /** 最大ページサイズ */
  MAX_PAGE_SIZE: 100,
  /** ページネーションに表示する最大ページ数 */
  MAX_VISIBLE_PAGES: 5,
} as const;

/**
 * UI表示設定
 */
export const LOCATION_UI = {
  /** タグの最大表示件数 */
  MAX_VISIBLE_TAGS: 5,
} as const;

/**
 * TanStack Queryキー
 */
export const LOCATION_QUERY_KEYS = {
  /** すべてのLocationクエリのベースキー */
  all: ['locations'] as const,
  /** 一覧クエリキー */
  lists: () => [...LOCATION_QUERY_KEYS.all, 'list'] as const,
  /** フィルタ付き一覧クエリキー */
  list: (filters?: Record<string, unknown>) => [...LOCATION_QUERY_KEYS.lists(), filters] as const,
  /** 詳細クエリキー */
  details: () => [...LOCATION_QUERY_KEYS.all, 'detail'] as const,
  /** 特定IDの詳細クエリキー */
  detail: (id: number) => [...LOCATION_QUERY_KEYS.details(), id] as const,
  /** 近傍検索クエリキー */
  nearby: (params: { lat: number; lng: number; radius: number }) =>
    [...LOCATION_QUERY_KEYS.all, 'nearby', params] as const,
} as const;

/**
 * キャッシュ設定
 */
export const LOCATION_CACHE = {
  /** データの鮮度期間（5分） */
  STALE_TIME_MS: 5 * 60 * 1000,
} as const;

/**
 * カテゴリAPIエンドポイント
 */
export const CATEGORY_ENDPOINTS = {
  /** 一覧取得 */
  LIST: '/api/v1/categories/',
  /** 詳細取得 */
  DETAIL: (id: number) => `/api/v1/categories/${id}/`,
} as const;

/**
 * カテゴリTanStack Queryキー
 */
export const CATEGORY_QUERY_KEYS = {
  /** すべてのカテゴリクエリのベースキー */
  all: ['categories'] as const,
  /** 一覧クエリキー */
  list: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
} as const;

/**
 * フォームバリデーション定数
 */
export const LOCATION_FORM_CONSTANTS = {
  /** 場所名の最大文字数 */
  NAME_MAX_LENGTH: 255,
  /** 電話番号の最大文字数 */
  PHONE_MAX_LENGTH: 20,
} as const;
