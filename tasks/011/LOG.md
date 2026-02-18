# タスク #011 近傍検索API 実行ログ

## ステータス

| 項目 | 状態 |
|------|------|
| **PR** | #24 https://github.com/y-ssk/personal-mapping-site/pull/24 |
| **状態** | 🔄 レビュー待ち |

> **レビューコメント対応時:**
> ```
> /pr-feedback 24
> ```

---

## 実行日時
- **開始:** 2026-02-18
- **完了:** 2026-02-18

## タスク概要
GET /api/v1/locations/nearby/ エンドポイントの実装

## 設計レビュー（2026-02-18）

### 判断した項目
| 項目 | 選択 | 理由 |
|------|------|------|
| タグフィルタ条件 | OR条件 | 既存LocationFilterと一貫性を保つ |

### 判断不要で進めた項目
| 項目 | 選択 | 理由（他選択肢が不可な理由） |
|------|------|------------------------------|
| POST vs GET | GET | SPEC.md § 4.3.1で明示 |
| 半径上限 | 100km | LocationConstants.MAX_RADIUS_KM準拠 |

### Info（実装時の注意事項）
- PostGIS Distance関数を使用し、メートル精度で距離計算
- 距離順ソートで返却
- visit_count/average_ratingのannotateを含める

## 実装内容

### 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `backend/apps/locations/constants.py` | MAX_RADIUS_KM=100, MIN_RADIUS_KM=0.1, エラーメッセージ追加 |
| `backend/apps/locations/serializers.py` | LocationWithDistanceSerializer追加 |
| `backend/apps/locations/services.py` | find_nearby()メソッド実装、_annotate_visit_stats更新 |
| `backend/apps/locations/views.py` | @action nearby追加 |
| `backend/apps/locations/tests/conftest.py` | tokyo_center, nearby_locationsフィクスチャ追加 |
| `backend/apps/locations/tests/test_services.py` | TestLocationServiceFindNearby（13テスト） |
| `backend/apps/locations/tests/test_views.py` | TestLocationViewSetNearby（13テスト） |

### API仕様

**エンドポイント:** `GET /api/v1/locations/nearby/`

**クエリパラメータ:**
| パラメータ | 必須 | 説明 |
|-----------|------|------|
| lat | ✅ | 緯度 (-90〜90) |
| lng | ✅ | 経度 (-180〜180) |
| radius | ✅ | 検索半径 (km、0.1〜100) |
| category | - | カテゴリID |
| tags | - | タグ（カンマ区切り、OR条件） |

**レスポンス:**
```json
[
  {
    "id": 1,
    "name": "カフェA",
    "point": {"type": "Point", "coordinates": [139.7, 35.6]},
    "distance": 0.523,
    "visit_count": 5,
    "average_rating": 4.2,
    ...
  }
]
```

## テスト結果

```
123 tests passed (100%)
- TestLocationServiceFindNearby: 13 tests
- TestLocationViewSetNearby: 13 tests
```

## コミット

| コミット | 内容 |
|----------|------|
| b4f28d2 | feat(locations): 近傍検索API実装 (#011) |

## PRレビュー対応（2026-02-18）

### コメント1: OpenAPI更新の曖昧な記載

> 別タスクとは具体的にどこ？
> あいまいにしてはいけないと思うんだけど。

**判断者:** agent（senior-architect-reviewer）
**根拠:**
- CLAUDE.md §5「APIが変われば必ずOpenAPI更新」と明記されているが、「どのタスクで」かは未定義
- #011だけが「別タスクで対応」で、他タスクはすべて「同一タスク内で更新」前提
- 一貫性がない

**原因:**
- openapi.ymlを確認したところ、`/locations/nearby/`は#D008で既に定義済みだった
- 「別タスクで対応」ではなく「#D008で定義済み」と書くべきだった

**対応:**
1. TASKS.md: `[x] OpenAPI更新（#D008で定義済み）` に修正
2. CLAUDE.md §5: OpenAPI更新ルールを明文化
   - 「別タスクで対応」禁止
   - 具体的タスクIDを必須化

## 備考

- PRレビュー対応スキル（/pr-feedback）も同PR（#24）に含む
- #016 Visitモデル実装は別PR（#23、マージ済み）
