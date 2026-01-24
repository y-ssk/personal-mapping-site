# タスクログ: #D008 OpenAPI完全版作成

## 基本情報
- **タスク名:** OpenAPI完全版作成
- **実行日:** 2025-01-25
- **ブランチ:** feature/openapi-complete
- **PR:** https://github.com/y-ssk/personal-mapping-site/pull/3

## 実行内容

### 1. タスク準備
```bash
./scripts/claude/setup_task.sh D008
./scripts/claude/run_task.sh D008
```

### 2. SPEC.md確認
- § 4 API仕様（認証、Locations、Visits、Trips、Categories、Sharing、Dashboard）
- § 3 データモデル（User、Category、Location、Visit、PlannedTrip、ActualTrip）

### 3. 作成したファイル

| ファイル | 内容 |
|----------|------|
| `docs/api/openapi.yml` | OpenAPI 3.0完全仕様（約1,600行） |

### 4. エンドポイント一覧

| カテゴリ | エンドポイント数 | 内容 |
|----------|------------------|------|
| Auth | 7 | register, login, logout, refresh, google, github, me |
| Locations | 8 | CRUD + nearby + recommendations |
| Visits | 5 | CRUD + フィルタリング |
| PlannedTrips | 8 | CRUD + items管理 + reorder + copy-to-actual |
| ActualTrips | 5 | CRUD |
| Categories | 3 | list, read, children |
| Sharing | 2 | create, read(public) |
| Dashboard | 2 | stats, recommendations |

### 5. スキーマ一覧

**認証:**
- UserRegister, UserLogin, AuthTokens, User

**カテゴリ:**
- Category, CategoryTree

**場所:**
- LocationCreate, LocationPatch, Location, LocationWithDistance, LocationListResponse

**訪問:**
- VisitCreate, Visit, VisitListResponse

**旅行計画:**
- PlannedTripCreate, PlannedTrip, PlannedTripDetail
- PlannedTripItemCreate, PlannedTripItemUpdate, PlannedTripItem
- PlannedTripListResponse

**実際の旅行:**
- ActualTripCreate, ActualTrip, ActualTripDetail, ActualTripListResponse

**共有:**
- SharedLocationListCreate, SharedLocationList, SharedLocationListPublic

**ダッシュボード:**
- DashboardStats

**共通:**
- Error, GeoPoint, PaginationMeta

### 6. バリデーション
```bash
npx @apidevtools/swagger-cli validate docs/api/openapi.yml
# → docs/api/openapi.yml is valid
```

---

## 成果物
- `docs/api/openapi.yml` - OpenAPI 3.0完全仕様

## 次のステップ
- バックエンド実装時にこの仕様に従う
- フロントエンドのAPI型生成に使用
