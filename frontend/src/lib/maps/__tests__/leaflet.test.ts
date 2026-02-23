/**
 * LeafletMapServiceのテスト。
 *
 * Leafletをモックしてユニットテストを実行。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { Location } from '@/features/locations/types/location';

import { LeafletMapService, geoPointToLatLng, toLeafletLatLng } from '../leaflet';
import { DEFAULT_CENTER } from '../constants';
import type { LatLng } from '../types';

// Leafletのモック - vi.mockはホイスティングされるため、変数参照を避ける
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      setZoom: vi.fn(),
      getZoom: vi.fn().mockReturnValue(13),
      remove: vi.fn(),
    })),
    marker: vi.fn(() => ({
      bindPopup: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    Icon: {
      Default: {
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Leaflet CSSのモック
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Leafletアイコン画像のモック
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({
  default: 'marker-icon-2x.png',
}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({
  default: 'marker-icon.png',
}));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({
  default: 'marker-shadow.png',
}));

describe('geoPointToLatLng', () => {
  it('GeoPointをLatLngに変換する', () => {
    const geoPoint = {
      type: 'Point' as const,
      coordinates: [139.7671, 35.6812] as [number, number], // [lng, lat]
    };

    const result = geoPointToLatLng(geoPoint);

    expect(result).toEqual({
      lat: 35.6812,
      lng: 139.7671,
    });
  });
});

describe('toLeafletLatLng', () => {
  it('LatLngをLeaflet用タプルに変換する', () => {
    const latLng: LatLng = { lat: 35.6812, lng: 139.7671 };

    const result = toLeafletLatLng(latLng);

    expect(result).toEqual([35.6812, 139.7671]);
  });
});

describe('LeafletMapService', () => {
  let mapService: LeafletMapService;
  let container: HTMLDivElement;

  beforeEach(() => {
    mapService = new LeafletMapService();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    mapService.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('displayMap', () => {
    it('地図を初期化して表示する', async () => {
      const L = (await import('leaflet')).default;

      mapService.displayMap(container, DEFAULT_CENTER);

      expect(L.map).toHaveBeenCalledWith(container);
      expect(L.tileLayer).toHaveBeenCalled();
    });

    it('2回呼び出すと前の地図を破棄する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);
      const firstMap = mapService.getMap();

      mapService.displayMap(container, DEFAULT_CENTER);

      expect(firstMap?.remove).toHaveBeenCalled();
    });
  });

  describe('addMarker', () => {
    const mockLocation: Location = {
      id: 1,
      name: 'テスト場所',
      point: {
        type: 'Point',
        coordinates: [139.7671, 35.6812],
      },
      address: '東京都千代田区',
      category: null,
      tags: [],
      status: null,
      notes: '',
      website: '',
      phone: '',
      visitCount: 0,
      averageRating: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('地図未初期化時にエラーをスローする', () => {
      expect(() => mapService.addMarker(mockLocation)).toThrow('地図が初期化されていません');
    });

    it('マーカーを追加する', async () => {
      const L = (await import('leaflet')).default;
      mapService.displayMap(container, DEFAULT_CENTER);

      const marker = mapService.addMarker(mockLocation);

      expect(marker.id).toBe(mockLocation.id);
      expect(marker.position).toEqual({
        lat: 35.6812,
        lng: 139.7671,
      });
      expect(marker.location).toBe(mockLocation);
      expect(L.marker).toHaveBeenCalled();
    });

    it('同じIDのマーカーを追加すると前のマーカーを削除する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);

      mapService.addMarker(mockLocation);
      const secondMarker = mapService.addMarker(mockLocation);

      expect(secondMarker.id).toBe(mockLocation.id);
    });
  });

  describe('removeMarker', () => {
    const mockLocation: Location = {
      id: 1,
      name: 'テスト場所',
      point: {
        type: 'Point',
        coordinates: [139.7671, 35.6812],
      },
      address: '東京都千代田区',
      category: null,
      tags: [],
      status: null,
      notes: '',
      website: '',
      phone: '',
      visitCount: 0,
      averageRating: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('マーカーを削除する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);
      mapService.addMarker(mockLocation);

      mapService.removeMarker(mockLocation.id);

      // マーカーが削除されたことを確認（再度削除しても何も起きない）
      expect(() => mapService.removeMarker(mockLocation.id)).not.toThrow();
    });

    it('存在しないマーカーIDでも何も起きない', () => {
      mapService.displayMap(container, DEFAULT_CENTER);

      expect(() => mapService.removeMarker(999)).not.toThrow();
    });
  });

  describe('clearMarkers', () => {
    it('すべてのマーカーを削除する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);

      const locations: Location[] = [
        {
          id: 1,
          name: 'テスト場所1',
          point: { type: 'Point', coordinates: [139.7671, 35.6812] },
          address: '',
          category: null,
          tags: [],
          status: null,
          notes: '',
          website: '',
          phone: '',
          visitCount: 0,
          averageRating: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'テスト場所2',
          point: { type: 'Point', coordinates: [139.768, 35.682] },
          address: '',
          category: null,
          tags: [],
          status: null,
          notes: '',
          website: '',
          phone: '',
          visitCount: 0,
          averageRating: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      locations.forEach((loc) => mapService.addMarker(loc));
      mapService.clearMarkers();

      // クリア後にマーカーを追加しても問題ない
      expect(() => mapService.addMarker(locations[0])).not.toThrow();
    });
  });

  describe('setCenter', () => {
    it('地図の中心座標を設定する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);
      const newCenter: LatLng = { lat: 34.6937, lng: 135.5023 }; // 大阪

      mapService.setCenter(newCenter);

      const map = mapService.getMap();
      expect(map?.setView).toHaveBeenCalledWith([newCenter.lat, newCenter.lng]);
    });

    it('地図未初期化時は何も起きない', () => {
      const newCenter: LatLng = { lat: 34.6937, lng: 135.5023 };

      expect(() => mapService.setCenter(newCenter)).not.toThrow();
    });
  });

  describe('setZoom', () => {
    it('ズームレベルを設定する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);

      mapService.setZoom(15);

      const map = mapService.getMap();
      expect(map?.setZoom).toHaveBeenCalledWith(15);
    });

    it('地図未初期化時は何も起きない', () => {
      expect(() => mapService.setZoom(15)).not.toThrow();
    });
  });

  describe('searchPlace', () => {
    it('MVP Leafletでは未実装エラーをスローする', async () => {
      await expect(mapService.searchPlace('東京駅')).rejects.toThrow('場所検索はMVPでは未実装です');
    });
  });

  describe('destroy', () => {
    it('地図リソースを解放する', () => {
      mapService.displayMap(container, DEFAULT_CENTER);
      const map = mapService.getMap();

      mapService.destroy();

      expect(map?.remove).toHaveBeenCalled();
      expect(mapService.getMap()).toBeNull();
    });

    it('未初期化でも何も起きない', () => {
      expect(() => mapService.destroy()).not.toThrow();
    });
  });

  describe('setMarkerClickHandler', () => {
    it('マーカークリックハンドラを設定する', () => {
      const handler = vi.fn();
      mapService.setMarkerClickHandler(handler);

      // ハンドラが設定されていることを確認（直接テスト困難なため、エラーが起きないことを確認）
      expect(() => mapService.displayMap(container, DEFAULT_CENTER)).not.toThrow();
    });
  });
});
