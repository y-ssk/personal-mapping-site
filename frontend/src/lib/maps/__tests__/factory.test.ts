/**
 * 地図サービスファクトリのテスト。
 */
import { describe, it, expect, vi } from 'vitest';

import { createMapService, getMapServiceType } from '../factory';
import { LeafletMapService } from '../leaflet';

// Leafletのモック
vi.mock('leaflet', () => {
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    setZoom: vi.fn(),
    getZoom: vi.fn().mockReturnValue(13),
    remove: vi.fn(),
  };

  // Iconのモッククラス
  class MockIcon {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
    static Default = {
      mergeOptions: vi.fn(),
    };
  }

  return {
    default: {
      map: vi.fn().mockReturnValue(mockMap),
      marker: vi.fn().mockReturnValue({
        bindPopup: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        setIcon: vi.fn(),
      }),
      tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn(),
      }),
      Icon: MockIcon,
    },
  };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({
  default: 'marker-icon-2x.png',
}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({
  default: 'marker-icon.png',
}));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({
  default: 'marker-shadow.png',
}));

describe('getMapServiceType', () => {
  it('MVPではleafletを返す', () => {
    const type = getMapServiceType();

    expect(type).toBe('leaflet');
  });
});

describe('createMapService', () => {
  it('LeafletMapServiceインスタンスを返す', () => {
    const mapService = createMapService();

    expect(mapService).toBeInstanceOf(LeafletMapService);
  });

  it('MapServiceインターフェースを実装している', () => {
    const mapService = createMapService();

    // インターフェースのメソッドが存在することを確認
    expect(typeof mapService.displayMap).toBe('function');
    expect(typeof mapService.addMarker).toBe('function');
    expect(typeof mapService.removeMarker).toBe('function');
    expect(typeof mapService.clearMarkers).toBe('function');
    expect(typeof mapService.setCenter).toBe('function');
    expect(typeof mapService.setZoom).toBe('function');
    expect(typeof mapService.searchPlace).toBe('function');
    expect(typeof mapService.destroy).toBe('function');
  });
});
