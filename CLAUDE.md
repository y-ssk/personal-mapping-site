# CLAUDE.md - Claude Code 開発ガイド

## ドキュメント情報
- **対象:** Claude Code (Opus)
- **目的:** 実装時の明確な指針提供
- **最終更新:** 2025-01-29

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

**5. コメント・ドキュメントは日本語**
- コードコメントは日本語で記述
- JSDoc/Docstringは日本語で記述
- CLIヘルプメッセージは日本語で記述
- エラーメッセージは日本語で記述
- 英語を使用するのはi18n対応時のみ

**6. マジックナンバー禁止**
- 数値リテラルは必ず定数として定義
- 定数名は意味がわかる名前にする
- フロントエンド・バックエンド共通ルール

```typescript
// ❌ 悪い例
if (radius > 100) { ... }
const timeout = 5 * 60 * 1000;

// ✅ 良い例
const MAX_RADIUS_KM = 100;
const STALE_TIME_MS = 5 * 60 * 1000;  // 5分

if (radius > MAX_RADIUS_KM) { ... }
const timeout = STALE_TIME_MS;
```

```python
# ❌ 悪い例
if radius_km > 100:
    raise ValueError("半径が大きすぎます")

# ✅ 良い例
MAX_RADIUS_KM = 100

if radius_km > MAX_RADIUS_KM:
    raise ValueError(f"半径は{MAX_RADIUS_KM}km以下にしてください")
```

**7. エラーメッセージの一元管理**
- エラーメッセージはべた書きせず、まとまった単位で管理
- 機能ごとに定数ファイルを作成
- フロントエンド・バックエンド共通ルール

```typescript
// ❌ 悪い例
throw new Error('認証に失敗しました');
toast.error('場所の保存に失敗しました');

// ✅ 良い例: features/auth/constants/messages.ts
export const AUTH_MESSAGES = {
  LOGIN_FAILED: '認証に失敗しました',
  SESSION_EXPIRED: 'セッションが切れました。再ログインしてください',
  UNAUTHORIZED: 'この操作を行う権限がありません',
} as const;

// 使用側
throw new Error(AUTH_MESSAGES.LOGIN_FAILED);
```

```python
# ❌ 悪い例
raise ValidationError("半径が大きすぎます")
raise PermissionDenied("この場所を編集する権限がありません")

# ✅ 良い例: apps/locations/constants.py
class LocationMessages:
    """場所関連のエラーメッセージ"""
    RADIUS_TOO_LARGE = "半径は{max_km}km以下にしてください"
    NOT_FOUND = "指定された場所が見つかりません"
    PERMISSION_DENIED = "この場所を編集する権限がありません"

# 使用側
raise ValidationError(
    LocationMessages.RADIUS_TOO_LARGE.format(max_km=MAX_RADIUS_KM)
)
```

**ファイル配置:**
- フロントエンド: `features/<機能>/constants/messages.ts`
- バックエンド: `apps/<機能>/constants.py`

**8. タスクログへの追記**
- タスク完了後に追加修正を行った場合は `tasks/<id>/LOG.md` に必ず追記する
- 対話の形跡を残し、意思決定の経緯を追跡可能にする
- 日付を明記し、時系列で記録する

**追記すべき内容:**
- 修正のきっかけ（ユーザーからの指摘、レビュー結果など）
- 対話の要約（質問→回答→決定の流れ）
- 実施した変更内容
- コミットハッシュ

**9. PRへの追記**
- タスク完了後に追加修正を行った場合は PRの説明も更新する
- LOG.mdとPRの内容がちぐはぐにならないようにする
- `gh pr edit <number> --body` で説明を更新

**追記すべき内容:**
- 追加修正セクションを設ける
- 何を追加・変更したかを箇条書きで明記
- 関連するコミットハッシュ

**例:**
```markdown
## Summary
- 初期実装の内容...

## 追加修正（2026-01-31）
- JSONフィクスチャをシードスクリプトに移行
- NOTES.md作成ルールを追加
- コミット: d669b75, 462791d
```

**10. 実装ノートの作成**
- 複雑な処理や設計判断がある場合は `tasks/<id>/NOTES.md` に解説を残す
- ソースコード上のコメントだけでは伝わりにくい内容を記録
- 後から見返したときに「なぜこうなっているか」がわかるように

**記載すべき内容:**
- 処理フロー（図やステップバイステップ）
- 設計判断の理由（なぜこの方式を選んだか）
- 代替案との比較
- 使用しているライブラリ/フレームワークの挙動解説
- 拡張方法

**例:**
```
tasks/003/NOTES.md
├── シードスクリプト解説
│   ├── データ構造と設計意図
│   ├── 処理フロー
│   ├── なぜJSONフィクスチャではないか
│   ├── django-mpttの自動計算の説明
│   └── 拡張方法
```

**11. Dockerコンテナ上で実行**
- Lint、テスト、フォーマット等の動作確認は必ずDockerコンテナ上で行う
- ホスト環境のツールバージョンとの差異を防ぐため
- `docker compose exec backend <command>` または `docker compose exec frontend <command>` を使用

```bash
# ✅ 良い例: Dockerコンテナ上で実行
docker compose exec backend black --check .
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm test

# ❌ 悪い例: ホスト環境で実行
black --check backend/
pytest backend/
npm run lint
```

**12. PR作成は必ず`/pr`スキルを使用**
- PR作成時は必ず`/pr`スキルを使用する
- `gh pr create`を直接実行しない（再現性のため）
- `/pr`スキルは自動的に`--base develop`を指定する

```
# ✅ 良い例
/pr 006

# ❌ 悪い例
gh pr create --draft --base develop --title "..."  # 直接実行は禁止
gh pr create --draft --title "..."  # ベースブランチ指定漏れのリスク
```

**理由:**
- 再現性の確保（スキル経由で統一）
- ベースブランチ指定漏れの防止
- 自動化時の一貫性

**13. コミット前チェック**
- コミット前に `git status` で未コミットファイルを確認する
- 特に `.claude/settings.local.json` は変更があれば別コミットでpush
- 意図しないファイルの取り残しを防ぐ

**チェック対象:**
| ファイル | 対応 |
|----------|------|
| `.claude/settings.local.json` | 変更あれば別コミット |
| `.claude/agents/*.md` | 新規・変更あればコミット |
| `tasks/<id>/LOG.md` | タスク完了時に必ずコミット |

**14. エージェントレビューの実施と記録**
- タスク完了後、専門エージェントによるレビューを実施する
- レビュー依頼と結果は必ず `tasks/<id>/LOG.md` に記録する
- 重要な指摘事項は対応方針を明記する

### 実装前設計レビュー

実装タスク（3桁数字ID）の実行開始時、**実装前**にsenior-architect-reviewerによる設計レビューを実施する。

**目的:**
- SPEC.md/CLAUDE.md準拠の事前確認
- 設計判断の明確化
- 未定義事項の早期検出
- 手戻りの削減

**実行タイミング:**
- `/task <id>` 実行後、Sub Agent呼び出し前

**確認観点:**
| 観点 | 確認内容 |
|------|----------|
| SPEC整合性 | タスク要件がSPEC.mdと矛盾していないか |
| アーキテクチャ準拠 | ディレクトリ構造、Service層パターン等 |
| 責務分離 | ビジネスロジックがservices.py、View層が薄くなる設計か |
| 影響範囲 | 既存コードへの影響、依存関係 |
| テスト可能性 | テストカバレッジ要件を満たせる設計か |
| 未定義事項 | SPEC/CLAUDEで未定義の判断が必要か |

**選択肢:**
| 入力 | 意味 |
|------|------|
| Y | 指摘事項をすべてタスクに盛り込む |
| P 1,3 | 番号指定で一部のみ盛り込む |
| S | レビューをスキップして実装開始 |
| Q <質問> | 追加の質問をする |
| A | タスク実行を中止 |

**スキップ条件:**
- ドキュメント系タスク（D001-D017）は設計レビュー不要
- 軽微なバグ修正（F001等）は任意
- 技術的負債タスク（TECH-XXX）は任意

### 実装後レビュー

**レビュー種別と対応エージェント:**
| レビュー種別 | エージェント | 観点 |
|-------------|-------------|------|
| 設計レビュー | senior-architect-reviewer | SPEC.md/CLAUDE.md準拠、アーキテクチャ整合性、拡張性 |
| 実装レビュー | code-reviewer | コード品質、テストカバレッジ、セキュリティ |
| 地理計算レビュー | geo-domain-specialist | PostGIS、座標系、距離計算の正確性 |
| UXレビュー | ux-designer-reviewer | 画面遷移、操作性、ユーザー体験 |
| テストレビュー | qa-test-engineer | 境界値、異常系、仕様準拠 |

**実装エージェント:**
| エージェント | 用途 |
|-------------|------|
| implementation-engineer | 設計決定後のコード実装、SPEC/CLAUDE準拠の実装 |

**LOG.mdへの記録形式:**
```markdown
## エージェントレビュー（YYYY-MM-DD）

### レビュー依頼
<依頼内容の概要>

### 設計レビュー（senior-architect-reviewer）
**総合評価:** 承認 / 条件付き承認 / 要修正

#### 良い点
- ...

#### 改善提案
| 重要度 | 内容 | 対応方針 |
|--------|------|----------|
| 高/中/低 | ... | ... |

### 実装レビュー（code-reviewer）
**総合評価:** 承認 / 条件付き承認 / 要修正

#### 指摘事項
| 重要度 | 内容 | 場所 | 対応方針 |
|--------|------|------|----------|
| Blocker/Should Fix/Nice to Have | ... | ... | ... |

### レビュー結果への対応
#### 即時対応
- ...

#### 次回タスクで対応
- ...
```

**評価基準:**
- **承認**: 問題なし、そのままマージ可能
- **条件付き承認**: 軽微な修正後にマージ可能
- **要修正**: 重大な問題あり、修正必須

**レビュー範囲の判断:**
| タスク種別 | 必須レビュー | 備考 |
|-----------|-------------|------|
| 実装タスク | 設計 + 実装 + 該当専門領域 | フルレビュー |
| ドキュメント更新のみ | 設計レビューのみ | 修正箇所が明確かつ軽微なら修正不要 |
| 軽微な修正 | 設計レビューのみ | typo修正、コメント追加など |

**レビューループの制限:**
- レビュー→修正のループは**最大2回まで**
- 2回のループで解決しない場合は、仕様自体に問題がある可能性
- その場合は人が仕様を見直すことを検討する
- 無限ループを避け、根本原因に対処する

**レビュー後の対応フロー:**

```
レビュー完了
    │
    ├─ Blocker あり → 即時修正 → PR更新
    │
    ├─ Should Fix あり
    │      │
    │      ├─ 今回対応すべき → 即時修正 → PR更新
    │      │
    │      └─ 次回対応でOK → TASKS.mdにタスク追加（必須）
    │
    └─ Nice to Have → 任意（タスク化推奨）
```

**Should Fixの対応判断基準:**

| 判断 | 条件 |
|------|------|
| 今回対応すべき | 未対応だとクリティカルな問題に寄与する場合 |
| 次回対応でOK | 動作する＆タスク成立要件を満たしている場合 |

**具体例:**
- **今回対応すべき**: セキュリティ脆弱性、データ不整合の可能性、テスト失敗
- **次回対応でOK**: 定数化、Docstring追加、コードスタイル改善

**「次回対応」のタスク化ルール:**
- 「次回対応」「次回タスクで対応」と判断した項目は、**必ずTASKS.mdにタスクとして追加**する
- タスクIDは `#TECH-XXX`（技術的負債）形式で採番
- 関連タスクIDをLOG.mdにも記載
- タスク化しないと対応するタイミングがなくなるため、必須ルールとする

**例:**
```markdown
## 技術的負債 [0/N]

### ⬜ #TECH-001 認証API定数化
- **発生元:** #D006
- **優先度:** 低
- **内容:**
  - JWT設定のマジックナンバー定数化
  - テストパスワードの定数化
  - display_name max_length定数化
```

---

## 🔍 検証ルール

### 検証手段と用途

| 検証手段 | 用途 | 実行タイミング |
|----------|------|----------------|
| pre-commit | フォーマット、lint | コミット前（自動） |
| TypeScript型チェック | 型安全性の検証 | CI/ローカル |
| GitHub Actions | lint, test, build, coverage | Push時（自動） |
| OpenAPI検証 | API仕様の構文・整合性チェック | Push時（自動） |
| テストコード | ロジック検証（pytest, vitest） | CI/ローカル |
| 実装前設計レビュー | SPEC準拠・アーキテクチャ確認 | 実装タスク開始時 |
| 実装後コードレビュー | 品質・テストカバレッジ検証 | タスク完了時 |
| Test Plan手動確認 | Docker動作、UI確認等 | PR作成前 |

### 使い分けフロー

```
[コード品質] → pre-commit（自動） + GitHub Actions（lint/format）
[型安全性]   → TypeScript型チェック（CI + ローカル）
[ロジック]   → テストコード + GitHub Actions（pytest/vitest）
[API仕様]    → OpenAPI検証（CI）
[設計準拠]   → 実装前: senior-architect-reviewer
              実装後: code-reviewer + qa-test-engineer
[手動確認]   → Test Plan実行 + qa-test-engineer
```

### カバレッジ要件（再掲）

- Service層: ≥80%
- Views: ≥60%
- Hooks: ≥70%

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

## 🎯 Claude Code Skills

### 利用可能なスキル

| コマンド | 説明 | 使用例 |
|----------|------|--------|
| `/task <id>` | タスク実行 | `/task D007` |
| `/workflow` | ワークフロー確認 | `/workflow` |
| `/log <id>` | ログ記録 | `/log D007` |
| `/spec <section>` | SPEC.md参照 | `/spec 4.3.1` |
| `/guide [keyword]` | コーディング規約参照 | `/guide constants` |
| `/progress` | 進捗サマリー表示 | `/progress` |
| `/setup <env>` | 環境構築ガイド | `/setup local` |
| `/checklist <id>` | チェックリスト管理 | `/checklist D007` |
| `/review` | 変更レビュー | `/review` |
| `/pr <id>` | PR作成 | `/pr D007` |
| `/design-review <id>` | 設計レビュー詳細解説 | `/design-review 008` |

### スキル追加ルール

**8. 頻出処理のスキル化**

タスク実行中に以下の条件を満たす処理を検出した場合、スキル追加を提案する：

1. **検出条件**
   - 同じ処理が3回以上繰り返されている
   - 複数のタスクで共通して使用される可能性が高い
   - コマンド化することで効率が上がる

2. **確認フロー**
   ```
   この処理をスキルとして追加しますか？
   処理内容: <処理の説明>
   コマンド案: /<command-name>

   追加する場合は 'y' と回答してください (y/N):
   ```

3. **追加時のルール**
   - 既存スキルと重複しないこと（重複チェック必須）
   - `.claude/commands/<command>.md` に作成
   - CLAUDE.mdのスキル一覧に追加
   - docs/TASKS.mdにタスクとして記録

4. **重複チェック**
   - 既存スキルの機能と重複する場合は追加しない
   - 類似機能がある場合は既存スキルの拡張を検討

5. **詳細ルール**
   - スキル管理の詳細は [docs/SKILL.md](docs/SKILL.md) を参照

---

**このガイドに従えば、SPEC.mdに準拠した高品質な実装が可能です。**

**疑問があれば実装前に必ず質問してください。**
