/**
 * 地図サービスインターフェース。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 * 将来のGoogle Maps移行を考慮し、地図ライブラリを抽象化。
 *
 * @example
 * ```typescript
 * const mapService: MapService = createMapService();
 * mapService.displayMap(container, { lat: 35.6812, lng: 139.7671 });
 * ```
 */

import type { Location } from '@/features/locations/types/location';

import type { LatLng, MapMarker, Place } from './types';

/**
 * 地図サービスの抽象インターフェース。
 *
 * LeafletMapServiceとGoogleMapsService（将来）で共通のAPIを提供。
 */
export interface MapService {
  /**
   * 地図を初期化して表示する。
   *
   * @param container - 地図を表示するHTML要素
   * @param center - 初期中心座標
   */
  displayMap(container: HTMLElement, center: LatLng): void;

  /**
   * Locationに対応するマーカーを追加する。
   *
   * @param location - マーカーを追加するLocation
   * @returns 作成されたマーカー情報
   */
  addMarker(location: Location): MapMarker;

  /**
   * マーカーを削除する。
   *
   * @param markerId - 削除するマーカーのID
   */
  removeMarker(markerId: number): void;

  /**
   * すべてのマーカーを削除する。
   */
  clearMarkers(): void;

  /**
   * 地図の中心座標を設定する。
   *
   * @param center - 新しい中心座標
   */
  setCenter(center: LatLng): void;

  /**
   * 地図のズームレベルを設定する。
   *
   * @param zoom - ズームレベル
   */
  setZoom(zoom: number): void;

  /**
   * 場所を検索する（将来のGoogle Maps Places API用）。
   *
   * @param query - 検索クエリ
   * @returns 検索結果の場所リスト
   * @throws {Error} MVP Leafletでは未実装
   */
  searchPlace(query: string): Promise<Place[]>;

  /**
   * 指定したマーカーをハイライト表示する。
   *
   * @param locationId - ハイライトするLocationのID、nullで解除
   */
  highlightMarker(locationId: number | null): void;

  /**
   * 地図リソースを解放する。
   */
  destroy(): void;
}
