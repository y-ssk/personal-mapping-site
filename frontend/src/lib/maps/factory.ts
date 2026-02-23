/**
 * 地図サービスファクトリ。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 * 環境変数でLeaflet/Google Mapsを切り替え可能。
 *
 * @example
 * ```typescript
 * const mapService = createMapService();
 * mapService.displayMap(container, center);
 * ```
 */

import type { MapService } from './interface';
import { LeafletMapService } from './leaflet';
import { MAP_MESSAGES } from './constants/messages';

/**
 * 使用する地図サービスの種類。
 */
export type MapServiceType = 'leaflet' | 'google';

/**
 * 現在使用中の地図サービス種類を取得する。
 *
 * @returns 地図サービス種類
 */
export function getMapServiceType(): MapServiceType {
  // 将来: 環境変数で切り替え
  // const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
  // return useGoogleMaps ? 'google' : 'leaflet';

  // MVP: Leaflet固定
  return 'leaflet';
}

/**
 * 地図サービスを作成する。
 *
 * MVPではLeafletMapServiceを返す。
 * 将来Google Mapsに移行する際は、環境変数で切り替え可能。
 *
 * @returns 地図サービスインスタンス
 *
 * @example
 * ```typescript
 * const mapService = createMapService();
 * mapService.displayMap(containerElement, { lat: 35.6812, lng: 139.7671 });
 *
 * // マーカー追加
 * const marker = mapService.addMarker(location);
 *
 * // 終了時にリソース解放
 * mapService.destroy();
 * ```
 */
export function createMapService(): MapService & LeafletMapService {
  const type = getMapServiceType();

  switch (type) {
    case 'leaflet':
      return new LeafletMapService();
    case 'google':
      // 将来実装: GoogleMapsService
      throw new Error(MAP_MESSAGES.GOOGLE_MAPS_NOT_IMPLEMENTED);
    default:
      throw new Error(MAP_MESSAGES.unknownServiceType(type));
  }
}
