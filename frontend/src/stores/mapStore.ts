/**
 * Zustandを使用した地図状態ストア。
 *
 * SPEC.md § 5.3「グローバル状態は認証と地図中心のみ」に準拠。
 * 地図の表示状態（中心座標、選択状態、ホバー状態）を管理する。
 */
import { create } from 'zustand';

import { DEFAULT_CENTER } from '@/lib/maps/constants';
import type { LatLng } from '@/lib/maps/types';

interface MapState {
  /** 地図の中心座標 */
  center: LatLng;
  /** 選択中のLocationID */
  selectedLocationId: number | null;
  /** ホバー中のLocationID */
  hoveredLocationId: number | null;
  /** 中心座標をセット */
  setCenter: (center: LatLng) => void;
  /** 選択中のLocationIDをセット */
  setSelectedLocationId: (id: number | null) => void;
  /** ホバー中のLocationIDをセット */
  setHoveredLocationId: (id: number | null) => void;
}

/**
 * 地図状態を管理するストア。
 *
 * @example
 * ```typescript
 * const { center, setCenter, selectedLocationId, setSelectedLocationId } = useMapStore();
 *
 * // 中心座標を取得
 * console.log(`現在の中心: ${center.lat}, ${center.lng}`);
 *
 * // 中心座標を更新
 * setCenter({ lat: 35.6812, lng: 139.7671 });
 *
 * // Location選択
 * setSelectedLocationId(123);
 * ```
 */
export const useMapStore = create<MapState>((set) => ({
  center: DEFAULT_CENTER,
  selectedLocationId: null,
  hoveredLocationId: null,
  setCenter: (center) => set({ center }),
  setSelectedLocationId: (selectedLocationId) => set({ selectedLocationId }),
  setHoveredLocationId: (hoveredLocationId) => set({ hoveredLocationId }),
}));
