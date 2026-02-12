# タスク #010 Location CRUD API - ログ

## 基本情報
- **タスクID:** #010
- **ブランチ:** feature/location-crud
- **SPEC参照:** SPEC.md § 4.3
- **依存:** #009（Locationモデル）

---

## 設計レビュー（2026-02-11）

### レビュー依頼
Location CRUD API実装前の設計レビュー。SPEC.md § 4.3準拠確認。

### 設計レビュー（senior-architect-reviewer）
**総合評価:** 承認（Decision Required項目あり）

#### 確認済み事項（Info）
| # | 内容 | 対応 |
|---|------|------|
| 1 | N+1問題対策 | select_related, annotate使用 |
| 2 | 既存constants.py活用 | LocationConstants, LocationMessages使用 |
| 3 | Serializer分離 | 読み取り用/書き込み用を分離 |
| 4 | Service層パターン | CRUD操作をService層にカプセル化 |

#### Decision Required項目
| # | 項目 | 根拠 | 選択肢 | 決定 |
|---|------|------|--------|------|
| 1 | visited_atソート | SPEC.md 665行目に明記あり、Visitモデル未実装 | (a)今回対応 (b)#016後 (c)対応しない | **(b) #016後に追加** |
| 2 | タグフィルタ条件 | SPEC.md 661行目、AND/ORは未定義 | (a)OR (b)AND | **(a) OR** |
| 3 | テキスト検索対象 | SPEC.md 663行目、対象フィールド未定義 | (a)name,address (b)name,address,notes | **(a) name, address** |

#### 決定理由
1. **visited_atソート**: Visitモデルがないと意味のあるソートができない
2. **タグフィルタ**: 一般的なUX慣行（食べログ、Googleマップ等はOR検索）
3. **テキスト検索**: notesは個人メモでノイズになりやすい

### ユーザー判断
- **入力:** Y（推奨通りで実装開始）

---

## 実装チェックリスト

### Serializer
- [x] CategorySerializer（読み取り用）
- [x] LocationSerializer（読み取り用）
- [x] LocationCreateSerializer（書き込み用）
- [x] GeoPointField（GeoJSON座標変換）

### Service層
- [x] LocationService.get_base_queryset()
- [x] LocationService.get_location()
- [x] LocationService.create_location()
- [x] LocationService.update_location()
- [x] LocationService.delete_location()

### Filter
- [x] LocationFilter（category, tags, status, search, ordering）

### View
- [x] LocationViewSet（ModelViewSet継承、Thin Viewパターン）

### URL
- [x] /api/v1/locations/ ルーティング

### テスト
- [x] test_services.py（カバレッジ100%）
- [x] test_views.py（カバレッジ100%）
- [x] test_serializers.py（カバレッジ95%）

---

## 実装ログ

### 2026-02-11 実装完了

#### 作成ファイル
| ファイル | 内容 |
|----------|------|
| `serializers.py` | CategorySerializer, GeoPointField, LocationSerializer, LocationCreateSerializer |
| `services.py` | LocationService（CRUD操作） |
| `views.py` | LocationViewSet（Thin Viewパターン） |
| `filters.py` | LocationFilter（django-filter） |
| `urls.py` | DefaultRouter設定 |
| `tests/conftest.py` | テストフィクスチャ |
| `tests/test_services.py` | Service層テスト |
| `tests/test_views.py` | View層テスト |
| `tests/test_serializers.py` | シリアライザテスト |

#### カバレッジ
| モジュール | カバレッジ |
|-----------|-----------|
| services.py | 100% |
| views.py | 100% |
| serializers.py | 95% |
| filters.py | 89% |
| 全体 | 85% |

#### 暫定対応（Visitモデル未実装）
- `visit_count`, `average_rating`は`_visit_count`, `_average_rating`でannotate
- モデルのpropertyでこれらを参照（#016でVisitモデル実装後に本来の実装に変更）

#### 設計判断
1. **タグフィルタ**: OR条件（一般的UX慣行に準拠）
2. **テキスト検索**: name, addressのみ（notesは対象外）
3. **ページネーション**: DRF標準のPageNumberPagination使用

---

## 実装レビュー（2026-02-12）

### code-reviewer
**総合評価:** Blocker付き承認 → 承認（修正後）

#### 良い点
- Thin View + Service層パターン完全準拠
- 定数・メッセージ一元管理（LocationConstants, LocationMessages）
- N+1問題対策（select_related使用）
- 日本語Docstring完備
- 充実したテストカバレッジ（97テスト）

#### 指摘事項と対応
| 重要度 | 内容 | 対応 |
|--------|------|------|
| Blocker | ステータスエラーメッセージがハードコード | ✅ LocationMessages.INVALID_STATUS追加 |
| Should Fix | annotate処理の重複（DRY違反） | ✅ _annotate_visit_statsメソッドで共通化 |
| Nice to Have | ViewSetのDIパターン改善 | 次回検討 |
| Nice to Have | 座標範囲定数化 | 次回検討 |

### senior-architect-reviewer
**総合評価:** Blocker付き承認 → 承認（修正後）

#### 確認事項
| 観点 | 評価 |
|------|------|
| SPEC.md § 4.3整合性 | 適合 |
| CLAUDE.mdアーキテクチャ | 適合 |
| 責務分離 | 適切 |
| 拡張性・保守性 | 適切 |
| 暫定対応の妥当性 | 適切 |

#### Visitモデル実装時（#016）の変更箇所
1. `services.py:_annotate_visit_stats` - Count/Avg使用に変更
2. `models.py:visit_count/average_rating` - プロパティ本体を有効化
3. `filters.py` - visited_atソートフィールド追加
