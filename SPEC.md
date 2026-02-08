# Personal Mapping Site - 技術仕様書

## ドキュメント情報
- **バージョン:** 1.0.0
- **最終更新:** 2025年1月23日
- **ステータス:** 実装準備完了
- **目的:** 仕様駆動開発（SDD）のための包括的技術仕様

---

## 重要原則

### 仕様駆動開発（SDD）の厳守

**すべての実装は本仕様書に厳密に従うこと。**

1. **実装前に仕様を確認** - コードを書く前に必ず該当セクションを読む
2. **仕様への疑問は実装前に解決** - 曖昧な点があれば実装せず質問する
3. **仕様の変更は文書更新が先** - コードを変更する前にSPEC.mdを更新
4. **勝手な改善や最適化は禁止** - 仕様にない機能や変更は追加しない

### 「余計なことはしない」原則

**意図しない破壊やインシデントを避けるため、以下を厳守：**

❌ **絶対にしてはいけないこと:**
- 仕様にない機能の追加
- 「こうした方が良い」という独自判断での変更
- ディレクトリ構造の勝手な変更
- データベーススキーマの勝手な変更
- API仕様からの逸脱
- 依存パッケージの勝手なアップグレード

✅ **すべきこと:**
- 仕様書に書かれた通りに実装
- 不明点があれば質問
- 問題を発見したら報告（勝手に修正しない）
- テストを書いて動作確認

### トラブル回避のためのチェックリスト

実装前に必ず確認：
- [ ] SPEC.mdの該当セクションを読んだ
- [ ] データモデルの変更がある場合、ER図と整合している
- [ ] API変更がある場合、OpenAPI仕様と整合している
- [ ] 新しいパッケージ追加がある場合、理由が明確
- [ ] 既存コードを変更する場合、影響範囲を理解している

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [データモデル詳細](#3-データモデル詳細)
4. [API仕様](#4-api仕様)
5. [技術スタックと選定根拠](#5-技術スタックと選定根拠)
6. [インフラ構成](#6-インフラ構成)
7. [開発ワークフロー](#7-開発ワークフロー)
8. [セキュリティ要件](#8-セキュリティ要件)
9. [テスト戦略](#9-テスト戦略)
10. [デプロイ戦略](#10-デプロイ戦略)

---

## 1. プロジェクト概要

### 1.1 プロダクトビジョン

Google Mapsのブックマーク機能を大幅に拡張した個人向けマッピングサービス。場所データベース構築、訪問履歴管理、旅行計画を統合。

### 1.2 核となる価値提案

**すべて等しく重要（優先順位なし）:**

- **A. 訪問した場所の記録** - 実際に行った場所を記録・管理
- **B. 行きたい場所の計画** - 将来訪問したい場所をリスト化
- **C. 個人的レビュー・記録** - 訪問ごとの感想・評価を保存
- **D. データベース構築** - 個人の場所データを体系的に蓄積（最優先基盤）
- **E. ルート計画** - 旅行時の効率的な移動経路を計画（Aと同等に重要）

### 1.3 ターゲットユーザー

- **主要:** 自分自身（個人ツール）
- **副次:** 旅行好きな人、場所管理を強化したい人

### 1.4 主要ユースケース

1. 訪問した場所を記録（日時、評価、レビュー）
2. 行きたい場所をブックマーク
3. 旅行計画の作成と管理
4. 過去の訪問履歴の参照
5. 場所リストの共有

### 1.5 MVPスコープ（すべて必須）

**機能A-M: すべてMVPに含める**

- A. Location CRUD（マップクリック + 検索での追加）
- B. マップ表示（Leaflet使用）
- C. 長文コメント/レビュー
- D. Visit記録（同一場所への複数回訪問、日時、5段階評価）
- E. 階層カテゴリ（システム提供）
- F. 自由形式タグ
- G. 検索/フィルタ（テキスト、カテゴリ、タグ、ステータス、日付範囲 - すべて組み合わせ可能）
- H. ソート（ユーザー選択: 追加日、訪問日、名前、評価）
- I. 旅行計画（PlannedTrip + ActualTrip + コピー機能）
- J. ダッシュボード（TOPページ、カスタマイズ可能ウィジェット）
- K. Location共有（読み取り専用URL）
- L. 認証（Email/Password + OAuth: Google, GitHub）
- M. 推奨機能の基礎（MLベースは将来、基本的な関連場所表示はMVP）

**明示的に延期（将来機能）:**
- 写真アップロード（将来: 複数画像、サムネイル表示）
- 一括操作（将来の利便性機能）
- 旅行計画の共有（将来の協働機能）
- データエクスポート（将来: KML/PDF、外部リンク）
- ユーザーカスタムカテゴリ（将来）
- 高度なAIおすすめ（将来）

---

## 2. システムアーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────┐
│         クライアント層                   │
│  React + Vite + TypeScript              │
│  - TanStack Query (サーバー状態)         │
│  - Zustand (UI状態)                     │
│  - Leaflet (地図 - MVP)                 │
└─────────────────┬───────────────────────┘
                  │ HTTPS / REST API
┌─────────────────▼───────────────────────┐
│       アプリケーション層                  │
│  Django + DRF + GeoDjango               │
│  - Service層 (ビジネスロジック)          │
│  - Gunicorn (WSGIサーバー)              │
│  - WhiteNoise (静的ファイル)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         データ層                         │
│  PostgreSQL 15 + PostGIS 3.3            │
└─────────────────────────────────────────┘
```

### 2.2 フロントエンドアーキテクチャ

#### 2.2.1 Feature-based構造

**採用理由:**
- Location、Visit、Trip、Auth、Dashboardは高度に独立
- 共通コンポーネント（MapView、FilterBar等）が複数機能で使用される
- 新機能追加が既存コードに影響しない
- テストが容易
- Claude Codeでのコード生成に明確な指針を提供

```
frontend/
├── src/
│   ├── features/              # 機能モジュール
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
│   │   ├── DateRangePicker/
│   │   ├── RatingStars/
│   │   └── ui/               # material-tailwindラッパー
│   ├── hooks/                # 共通フック
│   │   ├── useDebounce.ts
│   │   └── useIntersectionObserver.ts
│   ├── lib/                  # 設定・ユーティリティ
│   │   ├── api/
│   │   │   ├── client.ts     # Axiosインスタンス
│   │   │   └── generated/    # OpenAPI生成型（自動生成、編集禁止）
│   │   ├── maps/
│   │   │   ├── interface.ts  # MapServiceインターフェース
│   │   │   ├── leaflet.ts    # Leaflet実装
│   │   │   ├── googleMaps.ts # Google Maps実装（将来）
│   │   │   └── factory.ts    # マップサービスファクトリ
│   │   └── utils/
│   ├── stores/               # グローバル状態（Zustand）
│   │   ├── authStore.ts      # 認証状態のみ
│   │   └── mapStore.ts       # 地図中心座標のみ
│   ├── types/                # 共通型定義
│   ├── routes/
│   └── main.tsx
```

**重要なルール:**

1. **components/配下は共通コンポーネントのみ** - 2つ以上の機能で使用される場合のみ配置
2. **features内は完全に独立** - 他のfeatureを直接importしない
3. **グローバル状態は最小限** - 認証と地図中心のみ（他はTanStack Query）

### 2.3 バックエンドアーキテクチャ

#### 2.3.1 Service層パターン

**なぜService層が必要か:**

❌ **Service層なし（Fat View）:**
```python
class LocationViewSet(viewsets.ModelViewSet):
    def recommendations(self, request):
        # 1. パラメータ解析
        # 2. ユーザー履歴取得
        # 3. 嗜好分析
        # 4. PostGIS地理空間検索（複雑）
        # 5. 未訪問フィルタ
        # 6. スコア計算
        # 7. ソート・ページネーション
        # 8. シリアライズ
        # → 100行超、テスト困難、再利用不可
```

✅ **Service層あり（Thin View）:**
```python
# views.py - HTTP処理のみ（10-20行）
class LocationViewSet(viewsets.ModelViewSet):
    def recommendations(self, request):
        point = Point(request.data['lng'], request.data['lat'])
        service = RecommendationService()
        recommendations = service.get_recommendations(
            user=request.user,
            point=point,
            radius_km=request.data['radius']
        )
        return Response(LocationSerializer(recommendations, many=True).data)

# services.py - ビジネスロジック
class RecommendationService:
    def get_recommendations(self, user, point, radius_km):
        preferences = self._analyze_user_preferences(user)
        nearby = self._find_nearby_locations(point, radius_km)
        unvisited = self._filter_unvisited(nearby, user)
        scored = self._calculate_scores(unvisited, preferences)
        return self._top_results(scored, limit=10)

    # 各メソッドは単一責任
    # HTTP層なしでテスト可能
    # 管理コマンド、Celeryタスクで再利用可能
```

**メリット:**
1. **薄いView:** HTTP処理のみ（パース、シリアライズ）
2. **テスト容易性:** ビジネスロジックを単体テスト
3. **再利用性:** 管理コマンド、Celery等で同じロジック使用
4. **保守性:** 単一責任原則（SRP）

#### 2.3.2 ディレクトリ構造

```
backend/
├── apps/
│   ├── locations/
│   │   ├── models.py          # データモデル定義のみ
│   │   ├── serializers.py     # DRFシリアライザ
│   │   ├── views.py           # 薄い - HTTP処理のみ
│   │   ├── services.py        # ビジネスロジック（重要）
│   │   ├── filters.py         # django-filterクラス
│   │   ├── urls.py
│   │   └── tests/
│   │       ├── test_models.py
│   │       ├── test_serializers.py
│   │       ├── test_services.py  # 最も重要
│   │       └── test_views.py
│   ├── visits/
│   ├── trips/
│   └── users/
├── core/
│   ├── models.py             # AbstractBaseModel
│   ├── services.py           # 共通ビジネスロジック
│   ├── utils.py
│   └── permissions.py
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   ├── production.py
│   │   └── test.py
│   ├── urls.py
│   └── wsgi.py
```

**ファイル責務:**

- **models.py:** データモデル、プロパティ、`__str__`のみ。ビジネスロジック禁止。
- **serializers.py:** シリアライゼーション、簡単なバリデーション。複雑なロジック禁止。
- **views.py:** HTTP処理（パース、シリアライズ）のみ。ビジネスロジック禁止。
- **services.py:** すべてのビジネスロジック。ここが最も重要。
- **filters.py:** クエリフィルタリングロジック。

---

## 3. データモデル詳細

### 3.1 ER図

```
User
 │
 ├─1:N─→ Location ←─N:1─ Category（階層）
 │        │
 │        └─1:N─→ Visit
 │                 │
 │                 └─N:1(任意)─→ ActualTrip ←─1:1(コピー)─ PlannedTrip
 │                                    │                        │
 └────────────────────────────────────┴────────────────────────┘
                                       ↑
                                     N:M
                                   Location
```

### 3.2 主要な設計判断

#### 3.2.1 LocationとVisitの分離

**決定:** 場所（ブックマーク）と訪問記録は別モデル

**理由:**
- Location: 「この場所を知っている」
- Visit: 「この日にここに行った」
- 同じ場所に複数回訪問できる
- 各訪問ごとに異なる体験・評価を記録

**例:**
```
Location: スターバックス渋谷店
├─ Visit 1: 2024-01-15, 評価4, 「静かで作業しやすい」
├─ Visit 2: 2024-03-20, 評価3, 「混雑していた」
└─ Visit 3: 2025-01-10, 評価5, 「新メニューが美味しい」
```

#### 3.2.2 PlannedTripとActualTripの分離

**決定:** 計画と実績は別モデル

**理由:**
- 計画と現実は異なる
- 計画を保持したまま実績を記録
- 「計画を実績にコピー」ワークフロー
- 将来: 計画のバージョン管理

**ワークフロー:**
```
PlannedTrip作成 → 旅行実施 → ActualTripにコピー → Visit記録追加
                                      ↓
                          PlannedTripは保持（参照用）
```

#### 3.2.3 柔軟な旅行計画状態

**決定:** PlannedTripItemは日時・順序を任意に

**理由:**
- ユーザーは段階的に計画を詳細化
  1. 候補リスト:「これらの場所に行きたい」（日時なし）
  2. 順序付き:「この順で回る」（時刻なし）
  3. 詳細:「10:00にA、13:00にB」（完全スケジュール）
- データモデルはすべてサポート

### 3.3 モデル定義

#### 3.3.1 User

```python
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """カスタムユーザーモデル"""
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # OAuth
    oauth_provider = models.CharField(max_length=50, null=True, blank=True)
    oauth_id = models.CharField(max_length=255, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # email認証のためusernameは不要
```

#### 3.3.2 Category

```python
from mptt.models import MPTTModel, TreeForeignKey

class Category(MPTTModel):
    """階層カテゴリ（django-mptt使用）

    例:
    - 飲食 > レストラン > イタリアン
    - 観光 > 美術館 > 現代美術
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = TreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_full_path(self):
        """完全パス: '飲食 / レストラン / イタリアン'"""
        ancestors = self.get_ancestors(include_self=True)
        return ' / '.join([cat.name for cat in ancestors])
```

#### 3.3.3 Location

```python
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point

class Location(models.Model):
    """場所（ブックマーク）"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=255)

    # 地理空間（PostGIS）
    point = models.PointField(srid=4326)  # WGS84座標系
    address = models.TextField(blank=True)

    # 分類
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    tags = models.JSONField(default=list, blank=True)

    # ステータス
    STATUS_CHOICES = [
        ('want_to_visit', '行きたい'),
        ('not_interested', '興味なし'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)

    # メタデータ
    notes = models.TextField(blank=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'status']),
        ]

    @property
    def visit_count(self):
        """訪問回数"""
        return self.visits.count()

    @property
    def average_rating(self):
        """平均評価"""
        ratings = self.visits.exclude(rating__isnull=True).values_list('rating', flat=True)
        return sum(ratings) / len(ratings) if ratings else None
```

#### 3.3.4 Visit

```python
class Visit(models.Model):
    """訪問記録（1回の訪問）"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='visits')

    # 訪問詳細
    visited_at = models.DateTimeField()  # 日時精度は保持、UI側で柔軟に表示
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    review = models.TextField(blank=True)  # 長文レビュー

    # 旅行との紐付け（任意）
    actual_trip = models.ForeignKey(
        'ActualTrip',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-visited_at']
        indexes = [
            models.Index(fields=['user', 'visited_at']),
            models.Index(fields=['location', 'visited_at']),
        ]
```

#### 3.3.5 PlannedTrip

```python
class PlannedTrip(models.Model):
    """旅行計画

    柔軟な詳細度をサポート:
    - アイデア段階（日付未定）
    - 大まかな計画（日付範囲のみ）
    - 詳細スケジュール（PlannedTripItemで個別日時）
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='planned_trips')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # 日付範囲（任意）
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

#### 3.3.6 PlannedTripItem

```python
class PlannedTripItem(models.Model):
    """計画内の場所アイテム

    3つの状態をサポート:
    1. 候補: order=0, scheduled_datetime=null
    2. 順序付き: order>0, scheduled_datetime=null
    3. 詳細: scheduled_datetime設定
    """
    trip = models.ForeignKey(PlannedTrip, on_delete=models.CASCADE, related_name='items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

    # スケジューリング（すべて任意）
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'scheduled_datetime']
        indexes = [
            models.Index(fields=['trip', 'order']),
            models.Index(fields=['trip', 'scheduled_datetime']),
        ]
```

#### 3.3.7 ActualTrip

```python
class ActualTrip(models.Model):
    """実際の旅行記録"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='actual_trips')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # 実際の日付（必須）
    start_date = models.DateField()
    end_date = models.DateField()

    # 元の計画へのリンク（任意）
    planned_trip = models.OneToOneField(
        PlannedTrip,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actual_trip'
    )

    # 旅行全体のレビュー
    overall_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    overall_review = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
```

---

## 4. API仕様

### 4.1 API設計原則

- **RESTful:** 標準HTTPメソッド
- **OpenAPI 3.0:** `docs/api/openapi.yml`に完全仕様
- **バージョン管理:** `/api/v1/`プレフィックス
- **ページネーション:** リストエンドポイントは必須
- **フィルタリング:** django-filterによる柔軟なクエリ

### 4.2 認証エンドポイント

```
POST   /api/v1/auth/register/       # 新規登録
POST   /api/v1/auth/login/          # ログイン
POST   /api/v1/auth/logout/         # ログアウト
POST   /api/v1/auth/refresh/        # トークン更新
POST   /api/v1/auth/google/         # Google OAuth
POST   /api/v1/auth/github/         # GitHub OAuth
GET    /api/v1/auth/me/             # 現在のユーザー情報
```

### 4.3 場所（Locations）エンドポイント

```
GET    /api/v1/locations/                     # 一覧取得
POST   /api/v1/locations/                     # 作成
GET    /api/v1/locations/{id}/                # 詳細取得
PUT    /api/v1/locations/{id}/                # 更新（完全）
PATCH  /api/v1/locations/{id}/                # 更新（部分）
DELETE /api/v1/locations/{id}/                # 削除

# 地理空間クエリ
GET    /api/v1/locations/nearby/              # 近傍検索
  クエリパラメータ:
    lat: float（必須）
    lng: float（必須）
    radius: float（必須、km）
    category: int（任意）
    tags: string（任意、カンマ区切り）

# おすすめ
GET    /api/v1/locations/recommendations/     # おすすめ取得
  クエリパラメータ:
    lat: float（必須）
    lng: float（必須）
    radius: float（必須）
    limit: int（デフォルト10）

# フィルタリング（組み合わせ可能）
GET    /api/v1/locations/?category={id}       # カテゴリ
GET    /api/v1/locations/?tags={tag1,tag2}    # タグ
GET    /api/v1/locations/?status={status}     # ステータス
GET    /api/v1/locations/?search={query}      # テキスト検索
GET    /api/v1/locations/?ordering={field}    # ソート
  ソートフィールド: created_at, -created_at, name, -name, visited_at, -visited_at
```

### 4.4 訪問（Visits）エンドポイント

```
GET    /api/v1/visits/                        # 一覧取得
POST   /api/v1/visits/                        # 作成
GET    /api/v1/visits/{id}/                   # 詳細取得
PUT    /api/v1/visits/{id}/                   # 更新
DELETE /api/v1/visits/{id}/                   # 削除

# フィルタリング
GET    /api/v1/visits/?location={id}          # 特定場所の訪問
GET    /api/v1/visits/?trip={id}              # 特定旅行の訪問
GET    /api/v1/visits/?date_from={date}       # 日付範囲
GET    /api/v1/visits/?date_to={date}
GET    /api/v1/visits/?rating={1-5}           # 評価
```

### 4.5 旅行計画（Planned Trips）エンドポイント

```
GET    /api/v1/trips/planned/                 # 一覧取得
POST   /api/v1/trips/planned/                 # 作成
GET    /api/v1/trips/planned/{id}/            # 詳細取得
PUT    /api/v1/trips/planned/{id}/            # 更新
DELETE /api/v1/trips/planned/{id}/            # 削除

# アイテム管理
POST   /api/v1/trips/planned/{id}/items/      # 場所追加
PUT    /api/v1/trips/planned/{id}/items/{item_id}/  # アイテム更新
DELETE /api/v1/trips/planned/{id}/items/{item_id}/  # アイテム削除
PATCH  /api/v1/trips/planned/{id}/reorder/    # 順序変更

# 実績へのコピー
POST   /api/v1/trips/planned/{id}/copy-to-actual/
```

### 4.6 実際の旅行（Actual Trips）エンドポイント

```
GET    /api/v1/trips/actual/                  # 一覧取得
POST   /api/v1/trips/actual/                  # 作成
GET    /api/v1/trips/actual/{id}/             # 詳細取得
PUT    /api/v1/trips/actual/{id}/             # 更新
DELETE /api/v1/trips/actual/{id}/             # 削除
```

### 4.7 カテゴリエンドポイント

```
GET    /api/v1/categories/                    # ツリー構造取得
GET    /api/v1/categories/{id}/               # 詳細取得
GET    /api/v1/categories/{id}/children/      # 子カテゴリ取得
```

### 4.8 共有エンドポイント

```
POST   /api/v1/sharing/location-lists/        # 共有リスト作成
GET    /api/v1/sharing/location-lists/{uuid}/ # 共有リスト取得（公開）
```

### 4.9 ダッシュボードエンドポイント

```
GET    /api/v1/dashboard/stats/               # 統計情報
  レスポンス:
    total_locations: int
    total_visits: int
    total_trips: int
    top_categories: [{category, count}]
    recent_visits: [Visit]
    active_trips: [PlannedTrip]

GET    /api/v1/dashboard/recommendations/     # パーソナライズされたおすすめ
```

### 4.10 レスポンス形式

#### 成功レスポンス（単一オブジェクト）
```json
{
  "id": 123,
  "name": "スターバックス渋谷店",
  "point": {
    "type": "Point",
    "coordinates": [139.7016, 35.6595]
  },
  "category": {
    "id": 5,
    "name": "カフェ",
    "full_path": "飲食 / カフェ"
  },
  "tags": ["wifi", "静か", "作業向き"],
  "status": "want_to_visit",
  "created_at": "2025-01-23T10:00:00Z"
}
```

#### ページネーションレスポンス
```json
{
  "count": 150,
  "next": "http://api.example.com/api/v1/locations/?page=2",
  "previous": null,
  "results": [
    { /* オブジェクト1 */ },
    { /* オブジェクト2 */ }
  ]
}
```

#### エラーレスポンス
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "point": ["このフィールドは必須です。"],
      "name": ["255文字以内にしてください。"]
    }
  }
}
```

---

## 5. 技術スタックと選定根拠

### 5.1 フロントエンド: React + Vite

**決定:** React 18 + Vite 5 + TypeScript 5

**Next.jsを選ばない理由:**
- ❌ 最近のセキュリティ脆弱性（Server Actions、SSRF、Cache Poisoning）
- ❌ 認証アプリにSSR/SEO不要
- ❌ 複雑さが不要
- ✅ Viteの開発サーバーが高速
- ✅ シンプルなSPAで十分
- ✅ 静的ホスティング（Vercel）が無料

### 5.2 バックエンド: Django + DRF

**決定:** Django 5.0 + Django REST Framework 3.14 + GeoDjango

**Rails、Spring Bootを選ばない理由:**

**地理空間処理の比較:**

Django/GeoDjango:
```python
# 5km圏内のカフェ検索 - 3行
Location.objects.filter(
    category__name="カフェ",
    point__distance_lte=(point, D(km=5))
).order_by('point__distance')
```

Rails + RGeo:
```ruby
# 同じ機能 - 10行以上、手動設定必要
cafe_category = Category.find_by(name: "カフェ")
point = RGeo::Geographic.spherical_factory(srid: 4326).point(lng, lat)
Location.where(category: cafe_category)
  .where("ST_DWithin(point, ?, ?)", point, 5000)
  .order(Arel.sql("ST_Distance(point, '#{point}')"))
```

Spring Boot + Hibernate Spatial:
```java
// 同じ機能 - 20行以上、複雑な設定
Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
List<Location> locations = entityManager.createQuery(
  "SELECT l FROM Location l " +
  "WHERE l.category.name = :category " +
  "AND ST_DWithin(l.point, :point, :distance) = true " +
  "ORDER BY ST_Distance(l.point, :point)",
  Location.class)
  .setParameter("category", "カフェ")
  .setParameter("point", point)
  .setParameter("distance", 5000)
  .getResultList();
```

**その他の理由:**
- ✅ DRFでAPI開発が高速
- ✅ 将来のML統合（scikit-learn、pandas）
- ✅ PostGISの全機能を活用可能
- ✅ Claude Codeがpythonをよくサポート

### 5.3 状態管理: TanStack Query + Zustand

**決定:** ハイブリッドアプローチ

**TanStack Query（サーバー状態）:**
- 自動キャッシング、再フェッチ
- 楽観的更新
- ローディング/エラー状態

**Zustand（UI状態）:**
- 認証状態
- 地図中心座標
- 軽量（1KB）

**Reduxを選ばない理由:**
- ❌ このスケールには過剰
- ❌ ボイラープレートが多い
- ✅ TanStack Queryがサーバー状態を処理
- ✅ グローバル状態は最小限

### 5.4 地図: Leaflet → Google Maps

**決定:** LeafletでMVP、将来Google Mapsに移行

**段階的アプローチの理由:**
- **MVP:** Leaflet（無料） - コスト$0、基本機能は十分
- **将来:** Google Maps - Places API、豊富なPOIデータ
- **移行容易性:** `lib/maps/interface.ts`で抽象化済み

**実装:**
```typescript
// lib/maps/interface.ts
interface MapService {
  displayMap(container: HTMLElement, center: LatLng): void;
  addMarker(location: Location): Marker;
  searchPlace(query: string): Promise<Place[]>;
}

// 実装を切り替えるだけ
const mapService: MapService = USE_GOOGLE_MAPS
  ? new GoogleMapsService()
  : new LeafletMapService();
```

### 5.5 データベース: PostgreSQL + PostGIS

**決定:** PostgreSQL 15 + PostGIS 3.3

**理由:**
- ✅ PostGISは地理空間データの業界標準
- ✅ 空間インデックス、距離計算、ポリゴンクエリ
- ✅ GeoDjangoとの完璧な統合
- ✅ 強力なACID保証
- ✅ JSON型で柔軟なスキーマ（タグ等）

### 5.6 Webサーバー: Gunicorn + WhiteNoise（nginxなし）

**決定:** nginxを使用しない

**理由:**

| 要件 | Gunicorn + WhiteNoise | nginx |
|------|----------------------|-------|
| HTTPS | ✅ Render/Railwayが提供 | ✅ |
| 静的ファイル | ✅ WhiteNoise（十分） | ✅ より高速 |
| Gzip圧縮 | ✅ WhiteNoise | ✅ |
| リクエスト処理 | ✅ 10-50 req/sec | ✅ 500+ req/sec |
| 設定 | ✅ シンプル | ⚠️ 複雑 |

**1,000-10,000ユーザーなら:**
- Gunicornで十分（10-50 req/sec）
- WhiteNoiseで静的ファイル配信
- **ボトルネック順:** 1位DBクエリ、2位APIシリアライズ、3位Gunicorn
- nginxの効果は限定的

**スケールパス:**
1. MVP: Gunicorn + WhiteNoise
2. 1K-10K: Redisキャッシング追加
3. 10K+: nginx検討（それでも不要な可能性高い）

### 5.7 完全な技術スタック

```yaml
フロントエンド:
  言語: TypeScript 5
  フレームワーク: React 18
  ビルド: Vite 5
  スタイリング: Tailwind CSS 3 + material-tailwind
  状態管理:
    サーバー: TanStack Query v5
    UI: Zustand v4
  地図: Leaflet 1.9 (MVP) / Google Maps (将来)
  HTTP: Axios
  ルーティング: React Router v6
  フォーム: React Hook Form
  日時: date-fns
  テスト: Vitest + React Testing Library

バックエンド:
  言語: Python 3.11
  フレームワーク: Django 5.0
  API: Django REST Framework 3.14
  地理空間: GeoDjango + PostGIS
  認証: dj-rest-auth + django-allauth
  CORS: django-cors-headers
  レート制限: django-ratelimit
  API仕様: drf-spectacular (OpenAPI)
  WSGIサーバー: Gunicorn
  静的ファイル: WhiteNoise
  テスト: pytest + pytest-django

データベース:
  RDBMS: PostgreSQL 15
  拡張: PostGIS 3.3
  ORM: Django ORM + GIS

開発:
  コンテナ: Docker + Docker Compose
  コード生成: Claude Code (Opus)
  リンター/フォーマッター:
    - TypeScript: ESLint + Prettier (single quote)
    - Python: Black + flake8 + isort
  Pre-commit: pre-commit
  CI/CD: GitHub Actions
  VCS: Git + GitHub

インフラ:
  開発: Docker Compose (ローカル)
  MVP:
    - Frontend: Vercel (無料)
    - Backend: Render Web Service (無料)
    - Database: Render PostgreSQL (無料)
    - コスト: $0/月
  本番:
    - Frontend: Vercel (無料)
    - Backend: Railway Hobby ($5/月)
    - Database: Railway PostgreSQL (含む)
    - コスト: $5/月
```

---

## 6. インフラ構成

### 6.1 開発環境（Docker Compose）

```
┌─────────────────────────────────────────┐
│      Docker Compose (ローカル)          │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐│
│  │Frontend  │  │Backend   │  │   DB  ││
│  │Vite:5173 │◄─┤Django:   │◄─┤PostGIS││
│  │(ホット   │  │8000      │  │:5432  ││
│  │リロード) │  │(ホット   │  │       ││
│  │          │  │リロード) │  │       ││
│  └──────────┘  └──────────┘  └───────┘│
│                                          │
│  Volume Mount: ライブコード同期          │
└─────────────────────────────────────────┘
```

**特徴:**
- すべてのサービスがDockerコンテナ
- ボリュームマウントでホットリロード
- PostgreSQL + PostGIS事前設定済み
- チームメンバー間で環境一致

### 6.2 MVP本番環境（無料枠 - $0/月）

```
┌─────────────┐         ┌──────────────────┐
│   Vercel    │         │  Render Free     │
│(Frontend)   │◄────────┤  Web Service     │
│             │  HTTPS  │  - Django        │
│  - 静的配信 │         │  - Gunicorn      │
│  - CDN      │         │  - WhiteNoise    │
│  - 無料     │         │  - 15分スリープ  │
└─────────────┘         └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Render PostgreSQL│
                        │ - PostGIS有効    │
                        │ - 1GB            │
                        │ - 90日期限       │
                        └──────────────────┘

コスト: $0/月

制約:
- バックエンド: 15分非アクティブでスリープ（30秒起動）
- データベース: 90日後に期限切れ（再作成可能）
- 用途: ポートフォリオ、デモ、MVP検証
```

### 6.3 本番環境（Railway - $5/月）

```
┌─────────────┐         ┌──────────────────┐
│   Vercel    │         │    Railway       │
│(Frontend)   │◄────────┤  Hobby Plan      │
│             │  HTTPS  │  ($5/月)         │
│  - 静的配信 │         │  - Django        │
│  - CDN      │         │  - Gunicorn      │
│  - 無料     │         │  - WhiteNoise    │
│             │         │  - 常時稼働      │
└─────────────┘         └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Railway PostgreSQL│
                        │ - PostGIS有効    │
                        │ - プラン含む     │
                        │ - 自動バックアップ│
                        └──────────────────┘

コスト: $5/月

メリット:
- スリープなし
- 永続的DB
- 本番レベルのパフォーマンス
- $5上限設定（超過なし）
```

### 6.4 コスト試算

#### フェーズ1: MVP開発・検証（0-1,000ユーザー）
```
Render無料:
- Frontend: $0
- Backend: $0（制約あり）
- Database: $0（制約あり）
合計: $0/月

用途: ポートフォリオ、面接デモ、MVP検証
制約: 受け入れ可能
```

#### フェーズ2: 小規模本番（1,000-10,000ユーザー）
```
Railway + Vercel:
- Frontend: $0
- Backend: $5/月
- Database: $0（含む）
合計: $5/月

パフォーマンス: このスケールには十分
予算上限: $5（自動停止）
```

#### フェーズ3: スケール（10,000+ユーザー）
```
Railway + Redis:
- Frontend: $0
- Backend: $10/月（スケール）
- Database: $10/月（拡張）
- Redis: $5/月（キャッシング）
合計: $25/月

パフォーマンス: 50,000ユーザーまで対応可能
```

### 6.5 Render → Railway 移行戦略

**移行トリガー:**
- Render無料枠の制約が制限になった時
- 本番運用を開始する時

**移行手順:**
1. `./docs/scripts/migrate_to_railway.sh`実行
2. Railway設定（プロンプトに従う）
3. Renderデータベースバックアップ
4. Railwayにデータ復元
5. 環境変数更新
6. デプロイ検証
7. DNS切り替え

**推定ダウンタイム:** 10分以内

**ロールバック:**
- RenderとRailwayを並行稼働
- 問題発生時は即座にRenderに戻す

---

## 7. 開発ワークフロー

### 7.1 仕様駆動開発（SDD）の徹底

**原則: 実装は仕様に厳密に従う**

#### 開発プロセス

```
1. 設計フェーズ（完了）
   ├─ SPEC.md完成 ✓
   ├─ OpenAPI仕様完成
   ├─ データモデル定義完成 ✓
   └─ アーキテクチャ決定完成 ✓

2. 実装フェーズ
   ├─ SPEC.mdを読む（該当セクション）
   ├─ OpenAPIを確認（API変更の場合）
   ├─ Claude Codeで実装
   ├─ テスト作成
   └─ 動作確認

3. 検証フェーズ
   ├─ SPEC.mdとの整合性確認
   ├─ OpenAPIとの整合性確認
   ├─ テスト実行
   └─ コードレビュー
```

#### 実装ワークフロー例: 近傍検索機能

```
ステップ1: 仕様確認
→ SPEC.md「4.3 場所エンドポイント」読む
→ OpenAPI「/api/v1/locations/nearby/」確認

ステップ2: バックエンド実装
→ services.py: LocationService.find_nearby()
→ views.py: LocationViewSet.nearby()
→ tests/test_services.py: テスト作成

ステップ3: フロントエンド実装
→ api/locationApi.ts: nearby()メソッド
→ hooks/useNearbySearch.ts: React Queryフック
→ components/NearbyLocationList.tsx: UI
→ tests/: テスト作成

ステップ4: 統合確認
→ Dockerで動作確認
→ APIテスト（Postman/curl）
→ E2Eテスト（将来）

ステップ5: コミット
→ feat(locations): 近傍検索エンドポイントを追加
```

### 7.2 設計原則

#### SOLID原則

**単一責任原則（SRP） - 厳守:**
```python
# ✅ 良い例
class LocationService:
    def find_nearby(self, user, point, radius_km):
        # 近傍検索のみ

class RecommendationService:
    def get_recommendations(self, user, point, radius_km):
        # おすすめ生成のみ

# ❌ 悪い例
class LocationService:
    def find_nearby(...):
        # 近傍検索
    def get_recommendations(...):
        # おすすめ生成
    def send_email_notifications(...):
        # メール送信（責任が多すぎ）
```

**開放/閉鎖原則（OCP） - 適度に適用:**
```typescript
// ✅ 良い例: 拡張ポイントが明確
interface MapService {
  displayMap(container, center): void;
}

class LeafletMapService implements MapService { }
class GoogleMapsService implements MapService { }

// ❌ 悪い例: 過度な抽象化
interface LocationProcessor {
  process(location): ProcessedLocation;
}
// まだ実装が1つしかないのにインターフェース作成
```

**依存性逆転原則（DIP） - Service層で適用:**
```python
# ✅ 良い例
class TripService:
    def __init__(self, location_repo, visit_repo):
        self.location_repo = location_repo  # 抽象に依存
        self.visit_repo = visit_repo

# ❌ 悪い例
class TripService:
    def create_trip(self):
        location = Location.objects.get(...)  # 具象に直接依存
```

#### DRY（Don't Repeat Yourself） - 厳守

```typescript
// ❌ 悪い例: 重複
function LocationList() {
  const sorted = [...locations].sort((a, b) =>
    a.name < b.name ? -1 : 1
  );
}

function VisitList() {
  const sorted = [...visits].sort((a, b) =>
    a.location.name < b.location.name ? -1 : 1
  );
}

// ✅ 良い例: 共通化
// lib/utils/sorting.ts
export function sortByField<T>(items: T[], field: keyof T) {
  return [...items].sort((a, b) =>
    a[field] < b[field] ? -1 : 1
  );
}
```

#### YAGNI（You Aren't Gonna Need It） - 厳守

```python
# ❌ 悪い例: 将来のための実装
class LocationService:
    def find_all(self): pass
    def find_by_id(self): pass
    def find_by_name(self): pass
    def find_by_category(self): pass
    # ... 10個のメソッド（実際に使うのは2つだけ）

# ✅ 良い例: 必要な機能のみ
class LocationService:
    def find_nearby(self, user, point, radius_km):
        # 今必要な機能のみ実装
    # 他の機能は必要になったら追加
```

### 7.3 コード品質基準

#### TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### ESLint設定

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ]
  }
}
```

#### Prettier設定

```json
// .prettierrc
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

#### Python設定

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
exclude = '''
/(
    \.git
  | \.venv
  | migrations
)/
'''

[tool.isort]
profile = "black"
line_length = 100
skip_glob = ["*/migrations/*"]
```

```ini
# .flake8
[flake8]
max-line-length = 100
exclude = .git,__pycache__,*/migrations/*,venv
ignore = E203,W503
```

### 7.4 Gitワークフロー

#### ブランチ戦略

```
main          → 本番環境（自動デプロイ）
develop       → ステージング環境（自動デプロイ）
feature/*     → 機能開発
bugfix/*      → バグ修正
hotfix/*      → 緊急修正
```

#### コミットメッセージ規約

```
<type>(<scope>): <subject>

type:
  feat:     新機能
  fix:      バグ修正
  docs:     ドキュメント変更のみ
  style:    フォーマット変更（コード動作は不変）
  refactor: リファクタリング
  test:     テスト追加
  chore:    ビルド・ツール等の変更

例:
feat(locations): 近傍検索エンドポイントを追加
fix(visits): 日付バリデーションロジックを修正
docs(api): Trip用OpenAPIスキーマを更新
refactor(services): おすすめロジックを抽出
test(locations): 地理空間検索テストを追加
chore(deps): djangoを5.0.1に更新
```

### 7.5 ドキュメント要件

#### JSDoc（TypeScript）

```typescript
/**
 * 指定半径内の場所を検索する
 *
 * PostGISを使用した地理空間クエリを実行。
 * 結果は距離順にソートされる。
 *
 * @param point - 中心座標 (緯度, 経度)
 * @param radiusKm - 検索半径（km、最大100km）
 * @param filters - オプションのフィルタ（カテゴリ、タグ等）
 * @returns 距離情報付き場所の配列を返すPromise
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

#### Docstring（Python）

```python
def find_nearby_locations(
    point: Point,
    radius_km: float,
    category: Optional[str] = None
) -> QuerySet[Location]:
    """
    PostGISを使用して指定半径内の場所を検索。

    この関数はPostGISの距離演算子を使用して地理空間検索を実行する。
    結果は中心点からの距離順にソートされる。

    Args:
        point: 検索の中心点（PostGIS Point、SRID 4326）。
               例: Point(139.7671, 35.6812, srid=4326)
        radius_km: 検索半径（km）。最大は100km。
        category: 結果をフィルタするオプションのカテゴリslug。
                  例: 'cafe', 'restaurant', 'museum'

    Returns:
        'distance'フィールドが注釈されたLocationオブジェクトのQuerySet。
        中心点からの近い順にソート済み。

    Raises:
        ValueError: radius_kmが負数またはMAX_RADIUS_KMを超える場合。
        ValidationError: pointが無効またはSRIDが欠落している場合。

    Example:
        >>> from django.contrib.gis.geos import Point
        >>> center = Point(139.7671, 35.6812, srid=4326)
        >>> cafes = find_nearby_locations(center, 5.0, category='cafe')
        >>> for cafe in cafes[:5]:
        ...     print(f"{cafe.name}: {cafe.distance.km:.2f}km")
        スターバックス渋谷店: 0.35km
        ブルーボトルコーヒー: 1.20km
        ...

    Note:
        - PointはSRID 4326（WGS84座標系）を使用すること
        - 距離計算は球面幾何学を使用
        - 最大1000件の結果を返す（必要に応じてページネーション適用）
    """
```

---

## 8. セキュリティ要件

### 8.1 認証・認可

#### JWT設定

```python
# config/settings/base.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

#### パスワードポリシー

```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

**要件:**
- 最低8文字
- 大文字、小文字、数字を含む
- よくあるパスワードは拒否

#### OAuth統合

```python
# Google OAuth
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    },
    'github': {
        'SCOPE': [
            'user',
            'email',
        ],
    }
}
```

#### 認証APIエラーレスポンス設計

**設計方針:** ログインAPIの認証失敗は **400 Bad Request** を返す。

**採用理由:**

1. **dj-rest-authの設計思想に従う**
   - ログインは「保護されたリソースへのアクセス」ではなく「認証情報を生成するための入力処理」
   - 認証失敗は「入力値の検証エラー」として扱う
   - フレームワークのデフォルト動作に従うことで、メンテナンス性を維持

2. **フロントエンドUXの観点**
   - フォームバリデーションと一貫したエラーハンドリングが可能
   - `non_field_errors` でエラー内容を取得できる
   - SPAのフォーム主体UIとの親和性が高い

3. **セキュリティの観点**
   - 「ユーザーが存在しない」「パスワードが違う」を区別しない
   - 一律の汎用メッセージで情報漏洩を防ぐ

**レスポンス例:**
```json
// 認証失敗時 (400 Bad Request)
{
  "non_field_errors": [
    "Unable to log in with provided credentials."
  ]
}
```

**401を返すケース:**
- トークンなしで保護されたリソースにアクセス
- 期限切れトークンでアクセス
- 無効なトークンでアクセス

**将来の拡張時の注意:**
OAuth連携やMFA導入時は、認証フローが変わるため
エラーステータスの再検討が必要になる可能性がある。

### 8.2 データ保護

#### ユーザーデータ分離

```python
# すべてのQuerySetでユーザーフィルタ
class LocationViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

**原則:**
- すべてのクエリは`request.user`でフィルタ
- ユーザーは他のユーザーのデータにアクセス不可
- ORMレベルで強制

#### 機密データ

```python
# パスワード: bcryptハッシュ（Django標準）
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

# OAuthトークン: 暗号化して保存
# APIトークン: 短命、自動ローテーション
```

#### 入力検証

```python
# DRFシリアライザで自動検証
class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'point', 'category', 'tags']

    def validate_name(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("名前は255文字以内")
        return value
```

**保護:**
- SQLインジェクション: ORMで防止
- XSS: Reactの自動エスケープで防止
- CSRF: DRFのCSRFトークンで防止

### 8.3 APIセキュリティ

#### CORS設定

```python
# config/settings/local.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',      # Vite開発サーバー
]

# config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    'https://app.example.com',    # 本番フロントエンド
]

CORS_ALLOW_CREDENTIALS = True
```

#### レート制限

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='100/h', method='GET')
class LocationViewSet(viewsets.ModelViewSet):
    # ユーザーあたり1時間に100リクエスト
    pass

@ratelimit(key='user', rate='10/m', method='POST')
def create_location(request):
    # ユーザーあたり1分に10リクエスト（POST）
    pass
```

#### HTTPS強制

```python
# config/settings/production.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### 8.4 依存関係管理

#### 自動更新

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"

  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
```

#### 脆弱性チェック

```yaml
# .github/workflows/security.yml
- name: Check Python vulnerabilities
  run: pip-audit

- name: Check Node vulnerabilities
  run: npm audit

# 高リスクの脆弱性でビルド失敗
```

---

## 9. テスト戦略

### 9.1 カバレッジ目標

```
バックエンド:
├─ Service層:   ≥ 80%（最重要）
├─ Views:       ≥ 60%
├─ Models:      ≥ 70%（複雑なメソッドのみ）
└─ Utils:       ≥ 80%

フロントエンド:
├─ Services/Hooks: ≥ 70%
├─ Components:     ≥ 50%（重要なもののみ）
└─ Utils:          ≥ 80%
```

### 9.2 バックエンドテスト

#### テスト構造

```
backend/apps/locations/tests/
├── __init__.py
├── conftest.py              # pytest fixtures
├── test_models.py           # モデルメソッド、プロパティ
├── test_serializers.py      # シリアライゼーション
├── test_services.py         # ビジネスロジック（最重要）
├── test_views.py            # APIエンドポイント
└── test_filters.py          # フィルタリング
```

#### Fixture例

```python
# conftest.py
import pytest
from django.contrib.gis.geos import Point

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

#### Service層テスト例

```python
# test_services.py
@pytest.mark.django_db
class TestLocationService:
    def test_find_nearby_within_radius(
        self, user, tokyo_center, sample_locations
    ):
        """半径内の場所を正しく検索できる"""
        service = LocationService()

        results = service.find_nearby(user, tokyo_center, radius_km=5.0)

        assert results.count() == 3  # 5km圏内は3件
        assert all(loc.distance.km <= 5.0 for loc in results)
        assert results[0].distance < results[1].distance  # 距離順

    def test_find_nearby_with_category_filter(
        self, user, tokyo_center, sample_locations
    ):
        """カテゴリフィルタが正しく動作する"""
        service = LocationService()

        results = service.find_nearby(
            user,
            tokyo_center,
            radius_km=10.0,
            category='cafe'
        )

        assert all(loc.category.slug == 'cafe' for loc in results)

    def test_find_nearby_excludes_other_users(
        self, user, other_user, tokyo_center
    ):
        """他ユーザーの場所は検索結果に含まれない"""
        # other_userの場所を作成
        Location.objects.create(
            user=other_user,
            name='他ユーザーのカフェ',
            point=tokyo_center,
            category=Category.objects.first()
        )

        service = LocationService()
        results = service.find_nearby(user, tokyo_center, radius_km=5.0)

        assert all(loc.user == user for loc in results)
```

### 9.3 フロントエンドテスト

#### テスト構造

```
frontend/src/features/locations/
├── components/
│   └── __tests__/
│       ├── LocationCard.test.tsx
│       └── LocationForm.test.tsx
└── hooks/
    └── __tests__/
        └── useLocations.test.tsx
```

#### React Hookテスト例

```typescript
// useLocations.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { useLocations } from '../useLocations';
import * as locationApi from '../api/locationApi';

describe('useLocations', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('場所を正常に取得できる', async () => {
    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('エラーを適切に処理する', async () => {
    // APIエラーをモック
    vi.spyOn(locationApi, 'list').mockRejectedValue(
      new Error('ネットワークエラー')
    );

    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

#### コンポーネントテスト例

```typescript
// LocationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { LocationCard } from '../LocationCard';

describe('LocationCard', () => {
  const mockLocation = {
    id: 1,
    name: 'スターバックス渋谷店',
    category: { name: 'カフェ', full_path: '飲食 / カフェ' },
    tags: ['wifi', '静か'],
    visit_count: 3,
    average_rating: 4.5,
  };

  it('場所情報を正しく表示する', () => {
    render(<LocationCard location={mockLocation} />);

    expect(screen.getByText('スターバックス渋谷店')).toBeInTheDocument();
    expect(screen.getByText('カフェ')).toBeInTheDocument();
    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('3回訪問')).toBeInTheDocument();
  });
});
```

### 9.4 統合テスト

```python
# test_location_api.py
@pytest.mark.django_db
class TestLocationAPI:
    def test_create_location_via_api(self, auth_client):
        """APIを通じて場所を作成し、永続化を確認"""
        response = auth_client.post('/api/v1/locations/', {
            'name': 'テストカフェ',
            'point': {
                'type': 'Point',
                'coordinates': [139.7671, 35.6812]
            },
            'category': 1,
            'tags': ['wifi', '静か']
        })

        assert response.status_code == 201
        assert response.data['name'] == 'テストカフェ'

        # データベースで確認
        location = Location.objects.get(id=response.data['id'])
        assert location.point.x == 139.7671
        assert 'wifi' in location.tags
```

---

## 10. デプロイ戦略

### 10.1 環境変数

#### フロントエンド（.env）

```bash
# 開発環境
VITE_API_BASE_URL=http://localhost:8000/api/v1

# 本番環境
VITE_API_BASE_URL=https://api.example.com/api/v1
```

#### バックエンド（.env）

```bash
# Django
SECRET_KEY=<生成されたシークレットキー>
DEBUG=False
ALLOWED_HOSTS=api.example.com,*.railway.app

# データベース
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# CORS
CORS_ALLOWED_ORIGINS=https://app.example.com

# OAuth（任意）
GOOGLE_OAUTH_CLIENT_ID=<client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<client-secret>
GITHUB_OAUTH_CLIENT_ID=<client-id>
GITHUB_OAUTH_CLIENT_SECRET=<client-secret>
```

### 10.2 Renderデプロイ（MVP）

#### render.yaml

```yaml
services:
  - type: web
    name: mapsite-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: mapsite-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: false
      - key: ALLOWED_HOSTS
        value: .onrender.com

databases:
  - name: mapsite-db
    databaseName: mapsite
    user: mapsite
    plan: free
    postgresMajorVersion: 15
```

**手順:**
1. GitHubにプッシュ
2. Render.comでリポジトリ接続
3. `render.yaml`が自動検出される
4. 「Apply」をクリック
5. 自動デプロイ開始

### 10.3 Railwayデプロイ（本番）

#### railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "gunicorn config.wsgi:application"
healthcheckPath = "/api/v1/health/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

#### 移行手順

```bash
# 1. 移行スクリプト実行
./docs/scripts/migrate_to_railway.sh

# プロンプトに従って設定:
# - Railwayアカウント認証
# - プロジェクト名入力
# - 環境変数設定

# 2. データバックアップ（自動）
# 3. Railway デプロイ（自動）
# 4. データ復元（自動）
# 5. 動作確認（手動）
```

### 10.4 データベースマイグレーション

#### 開発環境

```bash
# マイグレーション作成
docker-compose exec backend python manage.py makemigrations

# マイグレーション適用
docker-compose exec backend python manage.py migrate

# マイグレーション確認
docker-compose exec backend python manage.py showmigrations
```

#### 本番環境

```bash
# Dockerfile内で自動実行
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application"]
```

#### ロールバック

```bash
# 履歴確認
python manage.py showmigrations

# 特定バージョンへロールバック
python manage.py migrate locations 0003_previous_migration
```

### 10.5 監視・アラート

#### MVP段階

```
- Render/Railwayの標準ログ
- 手動でログ確認
```

#### 将来（必要に応じて）

```python
# Sentry統合
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="<sentry-dsn>",
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False
)
```

#### コストアラート

```
Railway:
- $4到達時にメール通知（80%）
- $5上限で自動停止

Google Cloud（Maps API使用時）:
- 予算アラート設定
- $10到達時に通知
```

---

## 11. 付録

### 11.1 用語集

- **Location:** 場所（ブックマーク）。複数回訪問可能。
- **Visit:** 訪問記録。1回の訪問を表す。
- **PlannedTrip:** 旅行計画。まだ実施していない。
- **ActualTrip:** 実際の旅行。実施後の記録。
- **PostGIS:** PostgreSQLの地理空間拡張。
- **GeoDjango:** Djangoの地理空間フレームワーク。
- **SRID 4326:** GPSデータの座標系（WGS84）。
- **SDD:** Specification-Driven Development（仕様駆動開発）。

### 11.2 参考資料

- [Djangoドキュメント（日本語）](https://docs.djangoproject.com/ja/)
- [DRFドキュメント](https://www.django-rest-framework.org/)
- [GeoDjangoチュートリアル](https://docs.djangoproject.com/ja/5.0/ref/contrib/gis/tutorial/)
- [PostGISドキュメント](https://postgis.net/documentation/)
- [Reactドキュメント（日本語）](https://ja.react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Leaflet](https://leafletjs.com/reference.html)

### 11.3 変更履歴

| バージョン | 日付 | 変更内容 |
|---------|------|---------|
| 1.0.0 | 2025-01-23 | 初版作成 |

---

**作成者:** Yu（ソフトウェア開発者）
**目的:** 仕様駆動開発（SDD）の実践
**ステータス:** 実装準備完了

---

**重要な注意事項:**

このドキュメントはPersonal Mapping Siteプロジェクトの**唯一の信頼できる情報源**です。

✅ **すべきこと:**
- 実装前にこのSPEC.mdを読む
- 仕様に厳密に従う
- 不明点があれば質問する
- 問題を発見したら報告する

❌ **してはいけないこと:**
- 仕様にない機能の追加
- 勝手な改善や最適化
- アーキテクチャの変更
- 仕様を読まずに実装

**仕様の変更が必要な場合:**
1. まずSPEC.mdを更新
2. レビューと承認
3. その後実装

これにより、意図しない破壊やインシデントを防止します。
