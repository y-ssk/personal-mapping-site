/**
 * Location関連の型定義。
 *
 * OpenAPI仕様（docs/api/openapi.yml）に準拠。
 * APIレスポンスはsnake_case、フロントエンド内部はcamelCaseで統一。
 */

// ============================================
// 共通型
// ============================================

/**
 * GeoJSON Point型
 *
 * 座標は[経度, 緯度]の順序（GeoJSON仕様）
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

/**
 * Locationステータス
 */
export type LocationStatus = 'want_to_visit' | 'not_interested';

// ============================================
// API レスポンス型（snake_case）
// ============================================

/**
 * APIから返されるカテゴリ情報
 */
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  full_path: string;
  parent_id: number | null;
}

/**
 * APIから返されるLocation情報
 */
export interface ApiLocation {
  id: number;
  name: string;
  point: GeoPoint;
  address: string;
  category: ApiCategory | null;
  tags: string[];
  status: LocationStatus | null;
  notes: string;
  website: string;
  phone: string;
  visit_count: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 距離付きLocation（nearby検索用）
 */
export interface ApiLocationWithDistance extends ApiLocation {
  distance: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface ApiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================
// フロントエンド内部型（camelCase）
// ============================================

/**
 * フロントエンドで使用するカテゴリ情報
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  fullPath: string;
  parentId: number | null;
}

/**
 * フロントエンドで使用するLocation情報
 */
export interface Location {
  id: number;
  name: string;
  point: GeoPoint;
  address: string;
  category: Category | null;
  tags: string[];
  status: LocationStatus | null;
  notes: string;
  website: string;
  phone: string;
  visitCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 距離付きLocation（nearby検索用）
 */
export interface LocationWithDistance extends Location {
  distance: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================
// フィルタ・リクエスト型
// ============================================

/**
 * Location一覧取得時のフィルタパラメータ
 */
export interface LocationFilters {
  /** カテゴリID */
  category?: number;
  /** タグ（カンマ区切り） */
  tags?: string;
  /** ステータス */
  status?: LocationStatus;
  /** テキスト検索 */
  search?: string;
  /** ソート順 */
  ordering?: LocationOrdering;
  /** ページ番号 */
  page?: number;
  /** 1ページあたりの件数 */
  page_size?: number;
}

/**
 * ソート順の選択肢
 */
export type LocationOrdering =
  | 'created_at'
  | '-created_at'
  | 'name'
  | '-name'
  | 'visited_at'
  | '-visited_at';

/**
 * Location作成リクエスト
 */
export interface LocationCreateRequest {
  name: string;
  point: GeoPoint;
  address?: string;
  category_id?: number | null;
  tags?: string[];
  status?: LocationStatus | null;
  notes?: string;
  website?: string;
  phone?: string;
}

/**
 * Location更新リクエスト（部分更新）
 */
export interface LocationPatchRequest {
  name?: string;
  point?: GeoPoint;
  address?: string;
  category_id?: number | null;
  tags?: string[];
  status?: LocationStatus | null;
  notes?: string;
  website?: string;
  phone?: string;
}

// ============================================
// 変換関数
// ============================================

/**
 * APIカテゴリをフロントエンドCategory型に変換
 *
 * @param api - APIから返されたカテゴリ情報
 * @returns フロントエンド用のCategory
 */
export function toCategory(api: ApiCategory): Category {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    icon: api.icon,
    fullPath: api.full_path,
    parentId: api.parent_id,
  };
}

/**
 * APILocationをフロントエンドLocation型に変換
 *
 * @param api - APIから返されたLocation情報
 * @returns フロントエンド用のLocation
 */
export function toLocation(api: ApiLocation): Location {
  return {
    id: api.id,
    name: api.name,
    point: api.point,
    address: api.address,
    category: api.category ? toCategory(api.category) : null,
    tags: api.tags,
    status: api.status,
    notes: api.notes,
    website: api.website,
    phone: api.phone,
    visitCount: api.visit_count,
    averageRating: api.average_rating,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * 距離付きAPILocationをフロントエンド型に変換
 *
 * @param api - APIから返された距離付きLocation情報
 * @returns フロントエンド用のLocationWithDistance
 */
export function toLocationWithDistance(api: ApiLocationWithDistance): LocationWithDistance {
  return {
    ...toLocation(api),
    distance: api.distance,
  };
}

/**
 * ページネーション付きレスポンスを変換
 *
 * @param api - APIから返されたページネーション付きレスポンス
 * @returns フロントエンド用のPaginatedResponse
 */
export function toPaginatedLocations(
  api: ApiPaginatedResponse<ApiLocation>
): PaginatedResponse<Location> {
  return {
    count: api.count,
    next: api.next,
    previous: api.previous,
    results: api.results.map(toLocation),
  };
}
