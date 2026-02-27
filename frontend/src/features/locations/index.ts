/**
 * Locations機能の公開API。
 *
 * 他のfeatureから使用する場合は、このファイル経由でインポートする。
 */

// 型
export type {
  Location,
  LocationWithDistance,
  Category,
  GeoPoint,
  LocationStatus,
  LocationFilters,
  LocationOrdering,
  LocationCreateRequest,
  LocationPatchRequest,
  PaginatedResponse,
} from './types/location';

// 変換関数
export { toLocation, toCategory, toLocationWithDistance } from './types/location';

// API
export {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  patchLocation,
  deleteLocation,
  findNearbyLocations,
  LocationApiError,
} from './api/locationApi';

// Hooks
export {
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  usePatchLocation,
  useDeleteLocation,
  useCategories,
  LOCATION_QUERY_KEYS,
} from './hooks';

// Components
export { LocationCard, LocationForm, LocationList, LocationListPanel } from './components';

// Constants
export {
  LOCATION_ENDPOINTS,
  LOCATION_PAGINATION,
  LOCATION_UI,
  LOCATION_CACHE,
  LOCATION_MESSAGES,
  LOCATION_SUCCESS_MESSAGES,
  LOCATION_STATUS_LABELS,
  LOCATION_SORT_LABELS,
  LOCATION_EMPTY_STATE,
  CATEGORY_ENDPOINTS,
  CATEGORY_QUERY_KEYS,
  LOCATION_FORM_CONSTANTS,
  LOCATION_FORM_MESSAGES,
  CATEGORY_MESSAGES,
} from './constants';
