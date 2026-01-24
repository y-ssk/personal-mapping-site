# CLAUDE.md - Claude Code 開発ガイド

## ドキュメント情報
- **対象:** Claude Code (Opus)
- **目的:** 実装時の明確な指針提供
- **最終更新:** 2025-01-23

---

## ⚠️ 重要な原則

### 絶対に守ること

**1. SPEC.mdに厳密に従う**
- 実装前に必ず該当セクションを読む
- 仕様と異なる実装は**すべて却下される**
- 疑問があれば実装せず質問する

**2. 余計なことはしない**
- 仕様にない機能追加は禁止
- 「こうした方が良い」という独自判断での変更禁止
- ディレクトリ構造を勝手に変更しない
- データベーススキーマを勝手に変更しない

**3. テストは必須**
- Service層: カバレッジ≥80%
- Views: カバレッジ≥60%
- Hooks: カバレッジ≥70%

**4. ドキュメントは必須**
- JSDoc/Docstringを必ず書く
- 複雑なロジックにはコメント
- APIが変われば必ずOpenAPI更新

---

## 📁 プロジェクト構造

### フロントエンド

```
frontend/
├── src/
│   ├── features/              # 機能モジュール（独立性重視）
│   │   ├── locations/
│   │   │   ├── components/    # Location専用コンポーネント
│   │   │   ├── hooks/         # Location専用フック
│   │   │   ├── api/           # Location APIクライアント
│   │   │   ├── types/         # Location型定義
│   │   │   └── index.ts       # 公開API
│   │   ├── visits/
│   │   ├── trips/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── components/            # 共通コンポーネントのみ
│   │   ├── MapView/
│   │   ├── FilterBar/
│   │   └── ui/
│   ├── hooks/                # 共通フック
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts     # Axiosインスタンス
│   │   │   └── generated/    # OpenAPI自動生成（編集禁止）
│   │   ├── maps/
│   │   │   ├── interface.ts
│   │   │   ├── leaflet.ts
│   │   │   └── factory.ts
│   │   └── utils/
│   ├── stores/               # Zustand（最小限）
│   │   ├── authStore.ts
│   │   └── mapStore.ts
│   └── types/
```

**ルール:**
- `features/`内のモジュールは互いに直接importしない
- `components/`は2つ以上の機能で使う場合のみ配置
- グローバル状態は認証と地図中心のみ

### バックエンド

```
backend/
├── apps/
│   ├── locations/
│   │   ├── models.py          # データモデルのみ
│   │   ├── serializers.py     # DRFシリアライザ
│   │   ├── views.py           # 薄い（HTTP処理のみ）
│   │   ├── services.py        # ビジネスロジック（重要）
│   │   ├── filters.py
│   │   ├── urls.py
│   │   └── tests/
│   │       ├── test_models.py
│   │       ├── test_services.py   # 最重要
│   │       └── test_views.py
│   ├── visits/
│   ├── trips/
│   └── users/
├── core/
│   ├── models.py             # AbstractBaseModel
│   ├── services.py
│   └── permissions.py
└── config/
    └── settings/
```

**ルール:**
- `models.py`: データモデル定義のみ、ビジネスロジック禁止
- `views.py`: HTTP処理のみ、ビジネスロジック禁止
- `services.py`: すべてのビジネスロジックはここ

---

## 💻 コーディング規約

### TypeScript

#### 命名規則

```typescript
// コンポーネント: PascalCase
LocationCard.tsx
MapView.tsx

// ファイル: camelCase
locationApi.ts
useLocations.ts

// 関数/変数: camelCase
const fetchLocations = () => {};
const isLoading = false;

// 定数: UPPER_SNAKE_CASE
const MAX_RADIUS_KM = 50;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 型/インターフェース: PascalCase
interface Location {}
type LocationStatus = 'want_to_visit' | 'not_interested';
```

#### JSDoc（必須）

```typescript
/**
 * 指定半径内の場所を検索する
 * 
 * PostGISを使用した地理空間クエリ。結果は距離順。
 * 
 * @param point - 中心座標 (緯度, 経度)
 * @param radiusKm - 検索半径（km、最大100km）
 * @param filters - オプションのフィルタ
 * @returns 距離情報付き場所の配列
 * @throws {Error} radiusKmが最大値を超える場合
 * 
 * @example
 * ```typescript
 * const locations = await findNearbyLocations(
 *   { lat: 35.6812, lng: 139.7671 },
 *   5,
 *   { category: 'cafe' }
 * );
 * ```
 */
export async function findNearbyLocations(
  point: Point,
  radiusKm: number,
  filters?: LocationFilters
): Promise<LocationWithDistance[]> {
  // 実装
}
```

#### React パターン

```typescript
// ✅ 良い例: 関数コンポーネント + hooks
interface LocationCardProps {
  location: Location;
  onEdit?: (location: Location) => void;
}

export function LocationCard({ location, onEdit }: LocationCardProps) {
  const handleClick = () => {
    onEdit?.(location);
  };
  
  return (
    <div onClick={handleClick}>
      <h3>{location.name}</h3>
      <p>{location.category.name}</p>
    </div>
  );
}

// ❌ 悪い例: クラスコンポーネント
class LocationCard extends React.Component { }
```

#### TanStack Query パターン

```typescript
// hooks/useLocations.ts
export function useLocations(filters?: LocationFilters) {
  return useQuery({
    queryKey: ['locations', filters],
    queryFn: () => locationApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5分
  });
}

// hooks/useCreateLocation.ts
export function useCreateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LocationCreate) => locationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
```

### Python

#### 命名規則

```python
# ファイル: snake_case
location_service.py
nearby_search.py

# クラス: PascalCase
class LocationService:
class RecommendationEngine:

# 関数/変数: snake_case
def find_nearby_locations():
user_count = 10

# 定数: UPPER_SNAKE_CASE
MAX_RADIUS_KM = 100
DEFAULT_PAGE_SIZE = 20

# プライベートメソッド: _先頭アンダースコア
def _calculate_score(self):
```

#### Docstring（必須）

```python
def find_nearby_locations(
    point: Point,
    radius_km: float,
    category: Optional[str] = None
) -> QuerySet[Location]:
    """
    PostGISを使用して指定半径内の場所を検索。
    
    この関数はPostGISの距離演算子を使用して地理空間検索を実行。
    結果は中心点からの距離順にソート。
    
    Args:
        point: 検索の中心点（PostGIS Point、SRID 4326）。
               例: Point(139.7671, 35.6812, srid=4326)
        radius_km: 検索半径（km）。最大は100km。
        category: 結果をフィルタするカテゴリslug。
                  例: 'cafe', 'restaurant'
    
    Returns:
        'distance'フィールドが注釈されたLocationのQuerySet。
        中心点からの近い順にソート済み。
    
    Raises:
        ValueError: radius_kmが負数またはMAX_RADIUS_KMを超える場合。
    
    Example:
        >>> center = Point(139.7671, 35.6812, srid=4326)
        >>> cafes = find_nearby_locations(center, 5.0, category='cafe')
        >>> for cafe in cafes[:5]:
        ...     print(f"{cafe.name}: {cafe.distance.km:.2f}km")
    """
    if radius_km <= 0 or radius_km > MAX_RADIUS_KM:
        raise ValueError(f"半径は0から{MAX_RADIUS_KM}kmの間")
    
    # 実装
```

#### Service層パターン（重要）

```python
# views.py - 薄い（10-20行）
class LocationViewSet(viewsets.ModelViewSet):
    """
    場所のCRUDエンドポイント。
    ビジネスロジックはLocationServiceに委譲。
    """
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """近傍検索エンドポイント"""
        # 1. パラメータ解析
        lat = float(request.query_params['lat'])
        lng = float(request.query_params['lng'])
        radius = float(request.query_params['radius'])
        category = request.query_params.get('category')
        
        # 2. サービス呼び出し
        point = Point(lng, lat, srid=4326)
        service = LocationService()
        locations = service.find_nearby(
            user=request.user,
            point=point,
            radius_km=radius,
            category=category
        )
        
        # 3. シリアライズして返す
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)

# services.py - ビジネスロジック
class LocationService:
    """場所関連のビジネスロジック"""
    
    def find_nearby(
        self,
        user: User,
        point: Point,
        radius_km: float,
        category: Optional[str] = None
    ) -> QuerySet[Location]:
        """近傍検索のビジネスロジック"""
        # バリデーション
        if radius_km > MAX_RADIUS_KM:
            raise ValidationError(f"半径は{MAX_RADIUS_KM}km以下")
        
        # PostGISクエリ
        locations = Location.objects.filter(
            user=user,
            point__distance_lte=(point, D(km=radius_km))
        ).annotate(
            distance=Distance('point', point)
        ).order_by('distance')
        
        # カテゴリフィルタ
        if category:
            locations = locations.filter(category__slug=category)
        
        return locations
```

---

## 🧪 テスト戦略

### バックエンドテスト

#### Fixture

```python
# conftest.py
@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='testpass123'
    )

@pytest.fixture
def tokyo_center():
    return Point(139.7671, 35.6812, srid=4326)

@pytest.fixture
def sample_locations(user, tokyo_center):
    category = Category.objects.create(name='カフェ', slug='cafe')
    locations = []
    for i in range(5):
        loc = Location.objects.create(
            user=user,
            name=f'カフェ{i+1}',
            point=Point(
                tokyo_center.x + (i * 0.01),
                tokyo_center.y + (i * 0.01),
                srid=4326
            ),
            category=category
        )
        locations.append(loc)
    return locations
```

#### Service層テスト（最重要）

```python
@pytest.mark.django_db
class TestLocationService:
    def test_find_nearby_within_radius(
        self, user, tokyo_center, sample_locations
    ):
        """半径内の場所を正しく検索できる"""
        service = LocationService()
        
        results = service.find_nearby(user, tokyo_center, radius_km=5.0)
        
        assert results.count() == 3
        assert all(loc.distance.km <= 5.0 for loc in results)
        assert results[0].distance < results[1].distance
    
    def test_find_nearby_excludes_other_users(
        self, user, other_user, tokyo_center
    ):
        """他ユーザーの場所は含まれない"""
        # other_userの場所作成
        Location.objects.create(
            user=other_user,
            name='他ユーザーのカフェ',
            point=tokyo_center,
            category=Category.objects.first()
        )
        
        service = LocationService()
        results = service.find_nearby(user, tokyo_center, radius_km=5.0)
        
        # userの場所のみ
        assert all(loc.user == user for loc in results)
```

### フロントエンドテスト

#### Hookテスト

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocations } from '../useLocations';

describe('useLocations', () => {
  const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('場所を正常に取得', async () => {
    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
```

---

## 📝 実装ワークフロー

### ステップ1: 仕様確認

```bash
# SPEC.md該当セクション確認
# OpenAPI仕様確認
# データモデル確認
```

### ステップ2: バックエンド実装

```
1. models.py（必要なら）
2. serializers.py
3. services.py（ビジネスロジック）
4. views.py（薄く）
5. tests/test_services.py（最重要）
6. tests/test_views.py
```

### ステップ3: フロントエンド実装

```
1. types/
2. api/
3. hooks/
4. components/
5. tests/
```

### ステップ4: 統合確認

```bash
# Docker起動
docker-compose up -d

# バックエンドテスト
docker-compose exec backend pytest

# フロントエンドテスト
docker-compose exec frontend npm test

# 手動確認
# http://localhost:5173
```

### ステップ5: OpenAPI更新

```yaml
# 新しいエンドポイントを追加した場合
docs/api/openapi.yml を更新
```

---

## 🚫 やってはいけないこと

### ❌ 悪い例: Fat View

```python
# ❌ viewsにビジネスロジック
class LocationViewSet(viewsets.ModelViewSet):
    def nearby(self, request):
        # 50行のビジネスロジック...
        # PostGISクエリ...
        # フィルタリング...
        # スコア計算...
        # → これは全部servicesに移動すべき
```

### ❌ 悪い例: グローバル状態の乱用

```typescript
// ❌ Zustandに何でも入れる
const useAppStore = create((set) => ({
  locations: [],
  visits: [],
  trips: [],
  // → これらはTanStack Queryで管理すべき
}));
```

### ❌ 悪い例: feature間の直接import

```typescript
// ❌ features間で直接import
import { LocationCard } from '@/features/locations/components/LocationCard';

// ✅ 共通化が必要なら components/ へ移動
import { LocationCard } from '@/components/LocationCard';
```

---

## ✅ 良い例集

### ✅ Thin View + Service

```python
# ✅ views.py
class LocationViewSet(viewsets.ModelViewSet):
    def nearby(self, request):
        point = Point(request.data['lng'], request.data['lat'])
        service = LocationService()
        locations = service.find_nearby(
            user=request.user,
            point=point,
            radius_km=request.data['radius']
        )
        return Response(LocationSerializer(locations, many=True).data)

# ✅ services.py
class LocationService:
    def find_nearby(self, user, point, radius_km):
        # ビジネスロジック
```

### ✅ Feature-based構造

```typescript
// ✅ features/locations/index.ts
export { LocationList } from './components/LocationList';
export { useLocations } from './hooks/useLocations';
export type { Location, LocationFilters } from './types/location';

// 他のfeatureから使用
import { useLocations, type Location } from '@/features/locations';
```

---

## 🔧 開発ツール

### VSCode拡張（推奨）

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### コマンド

```bash
# Lint
docker-compose exec backend black .
docker-compose exec backend flake8 .
docker-compose exec frontend npm run lint

# テスト
docker-compose exec backend pytest
docker-compose exec frontend npm test

# 型チェック
docker-compose exec frontend npm run type-check
```

---

## 📚 参考資料

- SPEC.md - 技術仕様（必読）
- docs/api/openapi.yml - API仕様
- [Django](https://docs.djangoproject.com/ja/)
- [DRF](https://www.django-rest-framework.org/)
- [React](https://ja.react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

---

**このガイドに従えば、SPEC.mdに準拠した高品質な実装が可能です。**

**疑問があれば実装前に必ず質問してください。**
