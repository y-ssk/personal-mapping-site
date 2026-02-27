/**
 * 地図関連モジュールの公開API。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 */

// 型
export type {
  LatLng,
  MapMarker,
  Place,
  MapOptions,
  MarkerClickHandler,
  MapClickHandler,
} from './types';

// インターフェース
export type { MapService } from './interface';

// 定数
export {
  DEFAULT_CENTER,
  MAP_ATTRIBUTION,
  MAP_CONTAINER_STYLE,
  TILE_URLS,
  ZOOM_LEVELS,
} from './constants';

// ファクトリ
export { createMapService, getMapServiceType } from './factory';
export type { MapServiceType } from './factory';

// Leaflet実装（直接使用する場合）
export { LeafletMapService, geoPointToLatLng, toLeafletLatLng } from './leaflet';
