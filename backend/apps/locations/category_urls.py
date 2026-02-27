"""
カテゴリのURLルーティング。

OpenAPI仕様のカテゴリエンドポイントを登録。
"""

from rest_framework.routers import DefaultRouter

from apps.locations.views import CategoryViewSet

router = DefaultRouter()
router.register(r"", CategoryViewSet, basename="category")

urlpatterns = router.urls
