# タスク #010 Location CRUD API - 実装解説

## 概要

Location CRUD APIは、ユーザーが保存した場所（ブックマーク）を管理するRESTful APIです。
Django REST Framework (DRF) を使用し、CLAUDE.mdで定義されたThin View + Service層パターンに従っています。

---

## アーキテクチャ

### 全体構成

```
リクエスト
    ↓
[views.py] LocationViewSet（HTTP処理のみ）
    ↓
[services.py] LocationService（ビジネスロジック）
    ↓
[models.py] Location（データアクセス）
    ↓
PostgreSQL + PostGIS
```

### 各層の責務

| 層 | ファイル | 責務 |
|----|----------|------|
| View | views.py | HTTP処理、認証、シリアライザ呼び出し |
| Serializer | serializers.py | リクエスト/レスポンス変換、バリデーション |
| Service | services.py | CRUD操作、QuerySet構築、N+1対策 |
| Filter | filters.py | django-filterによるフィルタリング |
| Model | models.py | データモデル定義、プロパティ |
| Constants | constants.py | 定数・メッセージ一元管理 |

---

## 処理フロー

### 1. 一覧取得 (GET /api/v1/locations/)

```
1. LocationViewSet.list() が呼ばれる
2. get_queryset() で LocationService.get_base_queryset(user) を呼び出し
3. Service層で:
   - Location.objects.filter(user=user) でユーザー絞り込み
   - select_related("category") でN+1対策
   - _annotate_visit_stats() で訪問統計をannotate
4. DjangoFilterBackend が LocationFilter を適用
5. ページネーション適用
6. LocationSerializer でレスポンス変換
```

### 2. 作成 (POST /api/v1/locations/)

```
1. LocationViewSet.create() が呼ばれる
2. LocationCreateSerializer でバリデーション
   - GeoPointField: 座標のGeoJSON形式チェック
   - validate_status: ステータス値チェック
3. LocationService.create_location(user, validated_data)
4. Location.objects.create() でDB保存
5. get_location() でannotate付きオブジェクト再取得
6. LocationSerializer でレスポンス変換（201 Created）
```

### 3. 更新 (PUT/PATCH /api/v1/locations/{id}/)

```
1. LocationViewSet.update/partial_update() が呼ばれる
2. get_object() で対象取得（ユーザー認可も暗黙的に実行）
3. LocationCreateSerializer でバリデーション
4. LocationService.update_location(location, validated_data)
5. setattr() で各フィールド更新 → save()
6. get_location() でannotate付きオブジェクト再取得
7. LocationSerializer でレスポンス変換
```

---

## 設計判断

### 1. GeoPointFieldの実装

**課題:** DRFはPostGISのPointFieldを直接扱えない

**解決策:** カスタムシリアライザフィールド `GeoPointField` を作成

```python
class GeoPointField(serializers.Field):
    def to_representation(self, value: Point) -> dict:
        """Point → GeoJSON"""
        return {"type": "Point", "coordinates": [value.x, value.y]}

    def to_internal_value(self, data: dict) -> Point:
        """GeoJSON → Point"""
        # バリデーション: type, coordinates, 座標範囲
        return Point(lng, lat, srid=4326)
```

**なぜこの方式か:**
- SPEC.md § 4.10でGeoJSON形式が要求されている
- `rest_framework_gis`は使用しない方針（依存を最小化）
- バリデーションを一箇所に集約できる

### 2. Serializer分離（読み取り/書き込み）

**課題:** 入力と出力で形式が異なる

| 項目 | 入力 | 出力 |
|------|------|------|
| category | `category_id: int` | `category: {id, name, ...}` |
| visit_count | なし | `visit_count: int` |

**解決策:**
- `LocationSerializer` - 読み取り用（categoryネスト、visit_count含む）
- `LocationCreateSerializer` - 書き込み用（category_idで受け取り）

```python
def get_serializer_class(self):
    if self.action in ["create", "update", "partial_update"]:
        return LocationCreateSerializer
    return LocationSerializer
```

### 3. visit_count/average_rating の暫定対応

**課題:** Visitモデルが未実装（#016で実装予定）

**解決策:** 3層での対応

```
[models.py]
@property
def visit_count(self):
    if hasattr(self, "_visit_count"):
        return self._visit_count  # annotateされた値
    return 0  # デフォルト値

[services.py]
def _annotate_visit_stats(self, queryset):
    return queryset.annotate(
        _visit_count=Value(0),  # Visitモデル実装後は Count("visits")
        _average_rating=Value(None),
    )
```

**なぜこの方式か:**
- APIレスポンス形式を維持（visit_count, average_ratingフィールドを含む）
- 将来の変更箇所が明確（_annotate_visit_statsのみ変更）
- プロパティで柔軟に対応（annotateあり/なし両対応）

### 4. タグフィルタのOR条件

**課題:** SPEC.mdにAND/ORの指定なし

**決定:** OR条件を採用

**理由:**
- 一般的UX慣行（食べログ、Googleマップ等はOR検索）
- AND条件は絞り込みすぎて結果0件になりやすい

```python
def filter_tags(self, queryset, name, value):
    tag_list = value.split(",")
    tag_query = Q()
    for tag in tag_list:
        tag_query |= Q(tags__contains=[tag])  # OR
    return queryset.filter(tag_query)
```

---

## N+1問題対策

### 問題

```python
# N+1が発生するコード
locations = Location.objects.filter(user=user)
for loc in locations:
    print(loc.category.name)  # 毎回クエリ発行
    print(loc.visit_count)     # 毎回クエリ発行
```

### 対策

```python
def _annotate_visit_stats(self, queryset):
    return queryset.annotate(
        _visit_count=Value(0),
        _average_rating=Value(None),
    )

def get_base_queryset(self, user):
    queryset = (
        Location.objects.filter(user=user)
        .select_related("category")  # カテゴリを事前取得
    )
    return self._annotate_visit_stats(queryset)  # 訪問統計をannotate
```

- `select_related("category")`: ForeignKeyを1クエリで取得
- `annotate()`: 集計値をクエリに含める

---

## セキュリティ

### 認証

```python
class LocationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
```

### 認可（ユーザー分離）

```python
def get_queryset(self):
    return self.service.get_base_queryset(self.request.user)
    # ↑ 自分のLocationのみ返す
```

他ユーザーのLocationにアクセスしようとしても、QuerySetに含まれないため404になる。

---

## テスト構成

### test_services.py（16テスト）

| クラス | テスト内容 |
|--------|----------|
| TestLocationServiceGetBaseQueryset | ユーザー分離、annotate確認 |
| TestLocationServiceGetLocation | 取得、存在しないID、他ユーザー |
| TestLocationServiceCreateLocation | 全フィールド、最小フィールド |
| TestLocationServiceUpdateLocation | 単一/複数フィールド、座標更新 |
| TestLocationServiceDeleteLocation | 削除、他への影響なし |

### test_views.py（21テスト）

| クラス | テスト内容 |
|--------|----------|
| TestLocationViewSetList | 認証、一覧、他ユーザー除外 |
| TestLocationViewSetRetrieve | 詳細取得、他ユーザー404 |
| TestLocationViewSetCreate | 作成、バリデーションエラー |
| TestLocationViewSetUpdate | 更新、他ユーザー404 |
| TestLocationViewSetPartialUpdate | 部分更新 |
| TestLocationViewSetDestroy | 削除、他ユーザー404 |
| TestLocationViewSetFilters | category, tags, status, search, ordering |

### test_serializers.py（18テスト）

| クラス | テスト内容 |
|--------|----------|
| TestGeoPointField | 変換、バリデーション、座標範囲 |
| TestCategorySerializer | シリアライズ |
| TestLocationSerializer | シリアライズ、annotate |
| TestLocationCreateSerializer | バリデーション |

---

## 拡張方法

### Visitモデル実装時（#016）

1. **services.py** の `_annotate_visit_stats` を修正:

```python
def _annotate_visit_stats(self, queryset):
    return queryset.annotate(
        _visit_count=Count("visits"),
        _average_rating=Avg("visits__rating"),
    )
```

2. **models.py** のプロパティを有効化:

```python
@property
def visit_count(self):
    if hasattr(self, "_visit_count"):
        return self._visit_count
    return self.visits.count()  # ← この行を有効化
```

3. **filters.py** に visited_at ソート追加:

```python
ordering = django_filters.OrderingFilter(
    fields=(
        ("created_at", "created_at"),
        ("name", "name"),
        ("visits__visited_at", "visited_at"),  # 追加
    ),
)
```

### 新しいフィルタ追加

`filters.py` に追加:

```python
class LocationFilter(django_filters.FilterSet):
    # 既存フィルタ...

    # 例: 評価フィルタ
    min_rating = django_filters.NumberFilter(
        field_name="average_rating",
        lookup_expr="gte",
    )
```
