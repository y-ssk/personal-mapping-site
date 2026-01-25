# Google Maps 移行ガイド（Leaflet → Google Maps）

**最終更新:** 2025-01-25

このドキュメントでは、地図ライブラリをLeafletからGoogle Mapsに移行する手順を説明します。

---

## 1. 概要

### 移行後のアーキテクチャ

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│  ┌─────────────────────────────────────────┐    │
│  │            lib/maps/                     │    │
│  │  ┌─────────────┐   ┌─────────────────┐  │    │
│  │  │ interface.ts│◄──┤ googleMaps.ts   │  │    │
│  │  │ MapService  │   │ GoogleMapsService│ │    │
│  │  └─────────────┘   └─────────────────┘  │    │
│  │         ▲                               │    │
│  │         │ (削除)                        │    │
│  │  ┌──────┴──────┐                        │    │
│  │  │ leaflet.ts  │                        │    │
│  │  │ (MVP用)     │                        │    │
│  │  └─────────────┘                        │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                      │
                      ▼ API呼び出し
┌─────────────────────────────────────────────────┐
│              Google Maps Platform                │
│  - Maps JavaScript API                          │
│  - Places API（場所検索）                        │
│  - Geocoding API（住所⇔座標）                    │
└─────────────────────────────────────────────────┘
```

### 機能比較

| 機能 | Leaflet (MVP) | Google Maps |
|------|---------------|-------------|
| 地図表示 | ✅ 基本 | ✅ 高品質 |
| マーカー表示 | ✅ | ✅ |
| 場所検索 | ⚠️ 外部API必要 | ✅ Places API |
| ルート表示 | ⚠️ 外部API必要 | ✅ Directions API |
| ストリートビュー | ❌ | ✅ |
| POIデータ | ❌ | ✅ 豊富 |
| オフライン | ✅ タイル保存可 | ❌ |
| コスト | 無料 | 従量課金 |

### コスト試算

| API | 無料枠/月 | 超過料金 |
|-----|----------|----------|
| Maps JavaScript API | $200相当 | $7/1000読込 |
| Places API | $200相当 | $17/1000リクエスト |
| Geocoding API | $200相当 | $5/1000リクエスト |

**月額$200の無料枠で可能な利用量:**
- 地図表示: 約28,000回
- 場所検索: 約11,000回
- ジオコーディング: 約40,000回

**個人利用（1,000-10,000ユーザー）なら無料枠内で収まる可能性が高い**

### 移行のタイミング

以下のいずれかに該当する場合、移行を検討してください:

- 場所検索機能が必要になった
- ルート案内機能が必要になった
- POI（店舗、施設）データを活用したい
- より高品質な地図体験を提供したい

---

## 2. 前提条件

- Google Cloud Platformアカウント
- 請求先アカウントの設定（無料枠のみでも必要）
- 既存のLeaflet実装が`lib/maps/interface.ts`で抽象化されていること

---

## 3. 移行手順

### 3.1 Google Cloud Platformの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. 新規プロジェクト作成または既存プロジェクト選択
3. **APIとサービス** → **ライブラリ** から以下を有効化:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 3.2 APIキーの作成

1. **APIとサービス** → **認証情報** → **認証情報を作成** → **APIキー**
2. APIキーの制限を設定:

| 制限項目 | 設定値 |
|---------|--------|
| アプリケーション制限 | HTTPリファラー |
| ウェブサイトの制限 | `https://personal-mapping-site.vercel.app/*` |
| API制限 | Maps JavaScript API, Places API, Geocoding API |

3. APIキーをコピー

### 3.3 予算アラートの設定

1. **お支払い** → **予算とアラート** → **予算を作成**
2. 以下を設定:

| 項目 | 値 |
|------|-----|
| 予算名 | Personal Mapping Site |
| 予算額 | $10（または任意） |
| アラート閾値 | 50%, 90%, 100% |
| 通知先 | メールアドレス |

### 3.4 環境変数の設定

#### ローカル開発

```bash
# frontend/.env.local
VITE_USE_GOOGLE_MAPS=true
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

#### Vercel本番環境

1. Vercel Dashboard → プロジェクト → Settings → Environment Variables
2. 以下を追加:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_USE_GOOGLE_MAPS` | `true` | Production |
| `VITE_GOOGLE_MAPS_API_KEY` | `your-api-key` | Production |

### 3.5 GoogleMapsServiceの実装

```typescript
// frontend/src/lib/maps/googleMaps.ts
import { MapService, LatLng, Marker, Place } from './interface';

export class GoogleMapsService implements MapService {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.Marker> = new Map();
  private placesService: google.maps.places.PlacesService | null = null;

  /**
   * Google Mapsを指定のコンテナに表示
   * @param container - 地図を表示するHTML要素
   * @param center - 中心座標
   */
  displayMap(container: HTMLElement, center: LatLng): void {
    this.map = new google.maps.Map(container, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    this.placesService = new google.maps.places.PlacesService(this.map);
  }

  /**
   * マーカーを追加
   * @param location - 場所情報
   * @returns マーカーオブジェクト
   */
  addMarker(location: Location): Marker {
    if (!this.map) throw new Error('Map not initialized');

    const marker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: this.map,
      title: location.name,
    });

    this.markers.set(location.id, marker);

    return {
      id: location.id,
      remove: () => {
        marker.setMap(null);
        this.markers.delete(location.id);
      },
    };
  }

  /**
   * 場所を検索（Places API使用）
   * @param query - 検索クエリ
   * @returns 検索結果の配列
   */
  async searchPlace(query: string): Promise<Place[]> {
    if (!this.placesService) throw new Error('PlacesService not initialized');

    return new Promise((resolve, reject) => {
      this.placesService!.textSearch(
        { query },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(
              results.map((place) => ({
                id: place.place_id || '',
                name: place.name || '',
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              }))
            );
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * 地図の中心を移動
   * @param center - 新しい中心座標
   */
  setCenter(center: LatLng): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.setCenter({ lat: center.lat, lng: center.lng });
  }

  /**
   * すべてのマーカーを削除
   */
  clearMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }
}
```

### 3.6 ファクトリーの更新

```typescript
// frontend/src/lib/maps/factory.ts
import { MapService } from './interface';
import { LeafletMapService } from './leaflet';
import { GoogleMapsService } from './googleMaps';

const USE_GOOGLE_MAPS = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';

/**
 * 環境変数に基づいてMapServiceインスタンスを生成
 * @returns MapServiceの実装
 */
export function createMapService(): MapService {
  if (USE_GOOGLE_MAPS) {
    return new GoogleMapsService();
  }
  return new LeafletMapService();
}
```

### 3.7 Google Maps SDKの読み込み

```html
<!-- frontend/index.html -->
<script>
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]);for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once."):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    v: "weekly",
  });
</script>
```

### 3.8 型定義のインストール

```bash
npm install --save-dev @types/google.maps
```

### 3.9 既存コンポーネントの確認

`lib/maps/interface.ts`で抽象化されているため、以下のコンポーネントは変更不要:

- `components/MapView/`
- 地図を使用するすべてのフック

変更が必要な場合は、`interface.ts`のメソッドが不足している可能性があるため、インターフェースを拡張してください。

---

## 4. ロールバック手順

問題が発生した場合、即座にLeafletに戻せます。

### 4.1 環境変数を変更

```bash
# Vercel Dashboard または .env.local
VITE_USE_GOOGLE_MAPS=false
```

### 4.2 再デプロイ

Vercel Dashboardから **Redeploy** を実行

**推定ダウンタイム:** 数分以内

---

## 5. コスト管理

### 5.1 使用量モニタリング

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIとサービス** → **ダッシュボード**
2. 各APIの使用量を確認

### 5.2 コスト削減のベストプラクティス

| 対策 | 効果 |
|------|------|
| 地図の遅延読み込み | 初期表示を必要な場合のみ |
| マーカークラスタリング | API呼び出し削減 |
| 検索結果のキャッシュ | Places API呼び出し削減 |
| セッションベースのautocomplete | 課金の最適化 |

### 5.3 予算超過時の対応

予算アラートを受け取った場合:

1. 即座にLeafletにロールバック（§4参照）
2. 使用パターンを分析
3. 最適化を実施
4. 必要に応じて予算を調整

---

## 6. トラブルシューティング

### Q1: 地図が表示されない

**症状:** 地図コンテナが空白

**解決策:**
1. APIキーが正しく設定されているか確認
2. ブラウザのコンソールでエラーを確認
3. APIキーの制限（HTTPリファラー）が正しいか確認

```javascript
// デバッグ用
console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
```

### Q2: Places APIエラー

**症状:** `ZERO_RESULTS` または `REQUEST_DENIED`

**解決策:**
1. Places APIが有効化されているか確認
2. APIキーにPlaces APIの権限があるか確認
3. リクエストクォータを確認

### Q3: 請求関連のエラー

**症状:** `BillingNotEnabledMapError`

**解決策:**
1. Google Cloud Consoleで請求先アカウントを確認
2. プロジェクトに請求先が紐付けられているか確認

### Q4: 本番環境でのみ動作しない

**症状:** ローカルは動くが本番では動かない

**解決策:**
1. Vercelの環境変数が設定されているか確認
2. APIキーのHTTPリファラー制限を確認
3. 本番URLが許可リストに含まれているか確認

```
許可リスト例:
https://personal-mapping-site.vercel.app/*
https://*.vercel.app/*  (プレビュー用)
```

### Q5: TypeScriptの型エラー

**症状:** `google is not defined`

**解決策:**
1. `@types/google.maps`がインストールされているか確認
2. `tsconfig.json`に以下を追加:

```json
{
  "compilerOptions": {
    "types": ["google.maps"]
  }
}
```

---

## 7. 移行チェックリスト

移行完了時に以下を確認:

- [ ] Google Cloud Platformプロジェクト作成
- [ ] 必要なAPIを有効化
- [ ] APIキー作成と制限設定
- [ ] 予算アラート設定
- [ ] 環境変数設定（ローカル）
- [ ] 環境変数設定（Vercel）
- [ ] GoogleMapsService実装
- [ ] ファクトリー更新
- [ ] SDK読み込み設定
- [ ] 型定義インストール
- [ ] ローカルでの動作確認
- [ ] 本番環境での動作確認
- [ ] ロールバック手順の確認

---

## 関連ドキュメント

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - ローカル開発環境
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Renderデプロイガイド
- [RAILWAY_MIGRATION.md](./RAILWAY_MIGRATION.md) - Railway移行ガイド
- [SPEC.md](../../SPEC.md) § 5.4 - 地図ライブラリ選定
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
