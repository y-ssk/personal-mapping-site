/**
 * Leafletを使用した地図サービス実装。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 * MVPではLeafletを使用し、将来Google Mapsに移行可能。
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Location, GeoPoint } from '@/features/locations/types/location';

import { MAP_ATTRIBUTION, TILE_URLS, ZOOM_LEVELS, MARKER_ICON_SIZE } from './constants';
import { MAP_MESSAGES } from './constants/messages';
import type { MapService } from './interface';
import type { LatLng, MapClickHandler, MapMarker, MarkerClickHandler, Place } from './types';

// Leafletのデフォルトアイコンパス修正（Vite/Webpack対応）
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// デフォルトアイコンを設定
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * GeoPoint（[lng, lat]）をLatLng（{ lat, lng }）に変換。
 *
 * @param point - GeoJSON形式の座標
 * @returns Leaflet/内部形式の座標
 */
export function geoPointToLatLng(point: GeoPoint): LatLng {
  return {
    lat: point.coordinates[1],
    lng: point.coordinates[0],
  };
}

/**
 * LatLng（{ lat, lng }）をLeaflet用のLatLngTupleに変換。
 *
 * @param latLng - 内部形式の座標
 * @returns Leaflet用の座標タプル [lat, lng]
 */
export function toLeafletLatLng(latLng: LatLng): L.LatLngTuple {
  return [latLng.lat, latLng.lng];
}

/**
 * Leafletを使用した地図サービス。
 *
 * @example
 * ```typescript
 * const mapService = new LeafletMapService();
 * mapService.displayMap(containerElement, { lat: 35.6812, lng: 139.7671 });
 * mapService.addMarker(location);
 * ```
 */
export class LeafletMapService implements MapService {
  private map: L.Map | null = null;
  private markers: Map<number, L.Marker> = new Map();
  private markerClickHandler: MarkerClickHandler | null = null;
  private mapClickHandler: MapClickHandler | null = null;
  private highlightedMarkerId: number | null = null;
  private normalIcon: L.Icon;
  private highlightedIcon: L.Icon;

  constructor() {
    // 通常アイコン
    this.normalIcon = new L.Icon({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
      ...MARKER_ICON_SIZE.NORMAL,
    });

    // ハイライトアイコン（拡大版）
    this.highlightedIcon = new L.Icon({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
      ...MARKER_ICON_SIZE.HIGHLIGHTED,
    });
  }

  /**
   * マーカークリック時のハンドラを設定。
   *
   * @param handler - クリック時に呼び出される関数
   */
  setMarkerClickHandler(handler: MarkerClickHandler): void {
    this.markerClickHandler = handler;
  }

  /**
   * 地図クリック時のハンドラを設定。
   *
   * マーカーではなく地図の空白部分をクリックした際に呼び出される。
   *
   * @param handler - クリック時に呼び出される関数
   */
  setMapClickHandler(handler: MapClickHandler): void {
    this.mapClickHandler = handler;
  }

  /**
   * 地図を初期化して表示する。
   *
   * @param container - 地図を表示するHTML要素
   * @param center - 初期中心座標
   */
  displayMap(container: HTMLElement, center: LatLng): void {
    if (this.map) {
      this.destroy();
    }

    this.map = L.map(container).setView(toLeafletLatLng(center), ZOOM_LEVELS.DEFAULT);

    L.tileLayer(TILE_URLS.STANDARD, {
      attribution: MAP_ATTRIBUTION,
      maxZoom: ZOOM_LEVELS.MAX,
      minZoom: ZOOM_LEVELS.MIN,
    }).addTo(this.map);

    // 地図クリックイベントを設定
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.mapClickHandler) {
        this.mapClickHandler({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
  }

  /**
   * Locationに対応するマーカーを追加する。
   *
   * @param location - マーカーを追加するLocation
   * @returns 作成されたマーカー情報
   */
  addMarker(location: Location): MapMarker {
    if (!this.map) {
      throw new Error(MAP_MESSAGES.NOT_INITIALIZED);
    }

    // 既存のマーカーがあれば削除
    this.removeMarker(location.id);

    const position = geoPointToLatLng(location.point);
    const marker = L.marker(toLeafletLatLng(position), { icon: this.normalIcon });

    // ポップアップを追加
    marker.bindPopup(`<b>${location.name}</b><br>${location.address || ''}`);

    // クリックイベントを設定
    marker.on('click', () => {
      if (this.markerClickHandler) {
        this.markerClickHandler(location);
      }
    });

    marker.addTo(this.map);
    this.markers.set(location.id, marker);

    return {
      id: location.id,
      position,
      location,
    };
  }

  /**
   * マーカーを削除する。
   *
   * @param markerId - 削除するマーカーのID
   */
  removeMarker(markerId: number): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }

  /**
   * すべてのマーカーを削除する。
   */
  clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
  }

  /**
   * 地図の中心座標を設定する。
   *
   * @param center - 新しい中心座標
   */
  setCenter(center: LatLng): void {
    if (this.map) {
      this.map.setView(toLeafletLatLng(center));
    }
  }

  /**
   * 地図のズームレベルを設定する。
   *
   * @param zoom - ズームレベル
   */
  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * 地図の中心座標とズームを同時に設定する。
   *
   * @param center - 新しい中心座標
   * @param zoom - ズームレベル
   */
  setView(center: LatLng, zoom?: number): void {
    if (this.map) {
      this.map.setView(toLeafletLatLng(center), zoom ?? this.map.getZoom());
    }
  }

  /**
   * 現在の地図インスタンスを取得する。
   *
   * @returns Leaflet地図インスタンス、または初期化前はnull
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * 場所を検索する（将来のGoogle Maps Places API用）。
   *
   * @param _query - 検索クエリ（未使用）
   * @returns 空の配列（MVP Leafletでは未実装）
   * @throws {Error} MVP Leafletでは未実装
   */
  searchPlace(_query: string): Promise<Place[]> {
    // MVP Leafletでは未実装（将来Google Maps移行時に実装）
    return Promise.reject(new Error(MAP_MESSAGES.SEARCH_NOT_IMPLEMENTED));
  }

  /**
   * 指定したマーカーをハイライト表示する。
   *
   * ハイライトされたマーカーは通常より大きく表示される。
   * 前回ハイライトされていたマーカーは自動的に通常サイズに戻る。
   *
   * @param locationId - ハイライトするLocationのID、nullで解除
   */
  highlightMarker(locationId: number | null): void {
    // 前回のハイライトを解除
    if (this.highlightedMarkerId !== null) {
      const prevMarker = this.markers.get(this.highlightedMarkerId);
      if (prevMarker) {
        prevMarker.setIcon(this.normalIcon);
      }
    }

    // 新しいマーカーをハイライト
    if (locationId !== null) {
      const marker = this.markers.get(locationId);
      if (marker) {
        marker.setIcon(this.highlightedIcon);
      }
    }

    this.highlightedMarkerId = locationId;
  }

  /**
   * 地図リソースを解放する。
   */
  destroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markerClickHandler = null;
    this.mapClickHandler = null;
    this.highlightedMarkerId = null;
  }
}
