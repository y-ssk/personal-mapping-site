"""
Visitモデルのテスト。
"""

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.locations.models import Location
from apps.visits.constants import VisitConstants
from apps.visits.models import Visit


@pytest.mark.django_db
class TestVisitModel:
    """Visitモデルのテスト。"""

    def test_create_visit(self, visit, user, location):
        """Visitを作成できる。"""
        assert visit.pk is not None
        assert visit.user == user
        assert visit.location == location
        assert visit.rating == 4
        assert visit.review == "良い雰囲気でした"

    def test_visit_timestamps(self, visit):
        """created_atとupdated_atが設定される。"""
        assert visit.created_at is not None
        assert visit.updated_at is not None

    def test_str_returns_description(self, visit):
        """__str__が説明的な文字列を返す。"""
        result = str(visit)
        assert visit.user.email in result
        assert visit.location.name in result

    def test_visit_without_rating(self, visit_without_rating):
        """評価なしでVisitを作成できる。"""
        assert visit_without_rating.pk is not None
        assert visit_without_rating.rating is None
        assert visit_without_rating.review == ""

    def test_visit_without_review(self, user, location):
        """レビューなしでVisitを作成できる。"""
        visit = Visit.objects.create(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=5,
        )
        assert visit.pk is not None
        assert visit.review == ""

    def test_visit_ordering(self, multiple_visits):
        """Visitがvisited_atの降順でソートされる。"""
        visits = list(Visit.objects.all())
        # 新しい順（降順）
        assert visits[0].rating == 5  # 最新
        assert visits[1].rating == 4
        assert visits[2].rating == 3  # 最古

    def test_visit_cascade_delete_user(self, visit, user):
        """ユーザー削除時にVisitも削除される。"""
        visit_id = visit.id
        user.delete()
        assert not Visit.objects.filter(id=visit_id).exists()

    def test_visit_cascade_delete_location(self, visit, location):
        """Location削除時にVisitも削除される。"""
        visit_id = visit.id
        location.delete()
        assert not Visit.objects.filter(id=visit_id).exists()

    def test_location_visits_related_name(self, multiple_visits, location):
        """Locationからvisitsを逆参照できる。"""
        assert location.visits.count() == 3

    def test_user_visits_related_name(self, multiple_visits, user):
        """Userからvisitsを逆参照できる。"""
        assert user.visits.count() == 3

    # === 評価バリデーションテスト ===

    def test_rating_min_value(self, user, location):
        """評価の最小値（1）で正常保存できる。"""
        visit = Visit.objects.create(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=VisitConstants.RATING_MIN,
        )
        assert visit.rating == 1

    def test_rating_max_value(self, user, location):
        """評価の最大値（5）で正常保存できる。"""
        visit = Visit.objects.create(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=VisitConstants.RATING_MAX,
        )
        assert visit.rating == 5

    def test_rating_below_min_validation_error(self, user, location):
        """評価が最小値未満の場合バリデーションエラー。"""
        visit = Visit(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=VisitConstants.RATING_MIN - 1,  # 0
        )
        with pytest.raises(ValidationError) as exc_info:
            visit.full_clean()
        assert "rating" in str(exc_info.value)

    def test_rating_above_max_validation_error(self, user, location):
        """評価が最大値超過の場合バリデーションエラー。"""
        visit = Visit(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=VisitConstants.RATING_MAX + 1,  # 6
        )
        with pytest.raises(ValidationError) as exc_info:
            visit.full_clean()
        assert "rating" in str(exc_info.value)

    def test_rating_null_allowed(self, user, location):
        """評価がnullで正常保存できる。"""
        visit = Visit.objects.create(
            user=user,
            location=location,
            visited_at=timezone.now(),
            rating=None,
        )
        assert visit.rating is None

    # === インデックステスト ===

    def test_user_visited_at_index_usage(self, multiple_visits, user):
        """user + visited_atでのクエリが正常動作する。"""
        # インデックスが定義されていることを間接的に確認
        result = Visit.objects.filter(
            user=user,
            visited_at__gte=timezone.now() - timezone.timedelta(days=20),
        )
        assert result.count() == 2

    def test_location_visited_at_index_usage(self, multiple_visits, location):
        """location + visited_atでのクエリが正常動作する。"""
        result = Visit.objects.filter(
            location=location,
            visited_at__gte=timezone.now() - timezone.timedelta(days=20),
        )
        assert result.count() == 2

    # === 複数訪問テスト ===

    def test_multiple_visits_same_location(self, user, location):
        """同一場所への複数回訪問を記録できる。"""
        now = timezone.now()
        Visit.objects.create(
            user=user,
            location=location,
            visited_at=now - timezone.timedelta(days=7),
            rating=3,
        )
        Visit.objects.create(
            user=user,
            location=location,
            visited_at=now,
            rating=5,
        )
        assert location.visits.count() == 2

    def test_visit_other_user_location(self, user, other_user_location):
        """他ユーザーの場所にも訪問を記録できる。"""
        visit = Visit.objects.create(
            user=user,
            location=other_user_location,
            visited_at=timezone.now(),
            rating=4,
        )
        assert visit.pk is not None
        assert visit.location.user != user

    # === actual_tripテスト ===

    def test_actual_trip_null_allowed(self, visit):
        """actual_tripがnullで正常動作する。"""
        assert visit.actual_trip is None

    # NOTE: actual_tripの本格的なテストは#020で実装


@pytest.mark.django_db
class TestVisitQuerySet:
    """VisitのQuerySetテスト。"""

    def test_filter_by_rating(self, multiple_visits):
        """評価でフィルタリングできる。"""
        high_rated = Visit.objects.filter(rating__gte=4)
        assert high_rated.count() == 2

    def test_filter_by_date_range(self, multiple_visits):
        """日付範囲でフィルタリングできる。"""
        now = timezone.now()
        recent = Visit.objects.filter(visited_at__gte=now - timezone.timedelta(days=20))
        assert recent.count() == 2

    def test_aggregate_average_rating(self, multiple_visits):
        """平均評価を集計できる。"""
        from django.db.models import Avg

        avg = Visit.objects.aggregate(avg_rating=Avg("rating"))["avg_rating"]
        assert avg == 4.0  # (3 + 4 + 5) / 3

    def test_count_by_location(self, multiple_visits, location):
        """場所ごとの訪問数を集計できる。"""
        from django.db.models import Count

        result = (
            Location.objects.filter(id=location.id).annotate(_visit_count=Count("visits")).first()
        )
        assert result._visit_count == 3
