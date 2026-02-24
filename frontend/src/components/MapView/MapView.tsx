/**
 * 地図表示コンポーネント。
 *
 * SPEC.md § 5.4 地図: Leaflet → Google Maps に準拠。
 * MapServiceインターフェースを使用し、将来のGoogle Maps移行に対応。
 * ホバー状態に応じてマーカーをハイライト表示する。
 *
 * @example
 * ```tsx
 * <MapView
 *   locations={locations}
 *   onMarkerClick={(location) => console.log(location.name)}
 * />
 * ```
 */
import { useCallback, useEffect, useRef } from 'react';

import { createMapService, DEFAULT_CENTER, MAP_CONTAINER_STYLE } from '@/lib/maps';
import type { LatLng, MarkerClickHandler } from '@/lib/maps';
import type { LeafletMapService } from '@/lib/maps/leaflet';
import type { Location } from '@/features/locations/types/location';
import { useMapStore } from '@/stores/mapStore';

/**
 * MapViewコンポーネントのProps。
 *
 * CLAUDE.md「共通コンポーネントの型定義は同一ファイルに配置」に準拠。
 */
export interface MapViewProps {
  /** 地図上に表示するLocation配列 */
  locations?: Location[];
  /** マーカークリック時のコールバック */
  onMarkerClick?: MarkerClickHandler;
  /** 初期中心座標（省略時はmapStoreまたはデフォルト） */
  initialCenter?: LatLng;
  /** コンテナの高さ（CSSの値、例: '400px', '100vh'） */
  height?: string;
  /** コンテナのクラス名 */
  className?: string;
}

/**
 * 地図を表示するコンポーネント。
 *
 * Leafletを使用して地図を表示し、Locationをマーカーとして描画する。
 * マーカーをクリックするとonMarkerClickコールバックが呼び出される。
 *
 * @param props - コンポーネントProps
 * @returns 地図コンポーネント
 *
 * @example
 * ```tsx
 * function LocationMap() {
 *   const { data: locations } = useLocations();
 *   const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
 *
 *   return (
 *     <MapView
 *       locations={locations}
 *       onMarkerClick={setSelectedLocation}
 *       height="100vh"
 *     />
 *   );
 * }
 * ```
 */
export function MapView({
  locations = [],
  onMarkerClick,
  initialCenter,
  height = MAP_CONTAINER_STYLE.DEFAULT_HEIGHT,
  className = '',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<LeafletMapService | null>(null);
  const { center: storeCenter, setCenter, hoveredLocationId } = useMapStore();

  // 初期中心座標を決定（props > store > デフォルト）
  const center = initialCenter ?? storeCenter ?? DEFAULT_CENTER;

  /**
   * マーカークリックハンドラ。
   * クリックされたLocationをコールバックに渡し、地図の中心を更新する。
   */
  const handleMarkerClick = useCallback<MarkerClickHandler>(
    (location) => {
      // storeの中心座標を更新
      const newCenter: LatLng = {
        lat: location.point.coordinates[1],
        lng: location.point.coordinates[0],
      };
      setCenter(newCenter);

      // 親コンポーネントにコールバック
      onMarkerClick?.(location);
    },
    [onMarkerClick, setCenter]
  );

  // 地図の初期化
  useEffect(() => {
    if (!containerRef.current) return;

    // 既存のMapServiceがあれば破棄
    if (mapServiceRef.current) {
      mapServiceRef.current.destroy();
    }

    // 新しいMapServiceを作成
    const mapService = createMapService();
    mapService.displayMap(containerRef.current, center);
    mapService.setMarkerClickHandler(handleMarkerClick);
    mapServiceRef.current = mapService;

    // クリーンアップ
    return () => {
      mapService.destroy();
      mapServiceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初期化は一度だけ
  }, []);

  // マーカーの更新
  useEffect(() => {
    const mapService = mapServiceRef.current;
    if (!mapService) return;

    // 既存のマーカーをクリア
    mapService.clearMarkers();

    // 新しいマーカーを追加
    locations.forEach((location) => {
      mapService.addMarker(location);
    });
  }, [locations]);

  // クリックハンドラの更新
  useEffect(() => {
    const mapService = mapServiceRef.current;
    if (mapService) {
      mapService.setMarkerClickHandler(handleMarkerClick);
    }
  }, [handleMarkerClick]);

  // ホバー状態に応じてマーカーをハイライト
  useEffect(() => {
    const mapService = mapServiceRef.current;
    if (mapService) {
      mapService.highlightMarker(hoveredLocationId);
    }
  }, [hoveredLocationId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: '100%' }}
      data-testid="map-view"
    />
  );
}
