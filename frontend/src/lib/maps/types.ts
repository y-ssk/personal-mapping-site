/**
 * 地図関連の型定義。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 * 将来のGoogle Maps移行を考慮した抽象型を定義。
 */

import type { Location } from '@/features/locations/types/location';

/**
 * 緯度経度座標。
 *
 * @example
 * ```typescript
 * const tokyo: LatLng = { lat: 35.6812, lng: 139.7671 };
 * ```
 */
export interface LatLng {
  /** 緯度（-90〜90） */
  lat: number;
  /** 経度（-180〜180） */
  lng: number;
}

/**
 * 地図上のマーカー情報。
 */
export interface MapMarker {
  /** マーカーID（LocationのIDと同一） */
  id: number;
  /** マーカーの位置 */
  position: LatLng;
  /** マーカーに関連付けられたLocation */
  location: Location;
}

/**
 * 場所検索結果（将来のGoogle Maps Places API用）。
 *
 * MVP Leafletでは未使用。
 */
export interface Place {
  /** 場所名 */
  name: string;
  /** 座標 */
  position: LatLng;
  /** 住所 */
  address: string;
  /** PlaceID（Google Maps用） */
  placeId?: string;
}

/**
 * 地図の表示オプション。
 */
export interface MapOptions {
  /** 初期中心座標 */
  center: LatLng;
  /** 初期ズームレベル */
  zoom?: number;
  /** 最小ズームレベル */
  minZoom?: number;
  /** 最大ズームレベル */
  maxZoom?: number;
}

/**
 * マーカークリック時のコールバック型。
 */
export type MarkerClickHandler = (location: Location) => void;
