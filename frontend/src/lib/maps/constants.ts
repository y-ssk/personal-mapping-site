/**
 * 地図関連の定数。
 *
 * CLAUDE.md § 7 マジックナンバー禁止に準拠。
 */

import type { LatLng } from './types';

/**
 * OpenStreetMapタイルサーバーURL
 */
export const TILE_URLS = {
  /** 標準タイル */
  STANDARD: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const;

/**
 * OpenStreetMap著作権表記
 */
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * デフォルト中心座標（東京駅）
 */
export const DEFAULT_CENTER: LatLng = {
  lat: 35.6812,
  lng: 139.7671,
};

/**
 * ズームレベル設定
 */
export const ZOOM_LEVELS = {
  /** デフォルトズーム */
  DEFAULT: 13,
  /** 最小ズーム */
  MIN: 3,
  /** 最大ズーム */
  MAX: 19,
  /** マーカークリック時のズーム */
  MARKER_FOCUS: 16,
} as const;

/**
 * 地図コンテナのスタイル
 */
export const MAP_CONTAINER_STYLE = {
  /** デフォルト高さ */
  DEFAULT_HEIGHT: '400px',
  /** フル高さ */
  FULL_HEIGHT: '100%',
} as const;
