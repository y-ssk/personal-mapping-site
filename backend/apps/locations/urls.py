"""
locationsアプリのURLルーティング。

SPEC.md § 4.3で定義されたエンドポイントを登録。
"""

from rest_framework.routers import DefaultRouter

from apps.locations.views import LocationViewSet

router = DefaultRouter()
router.register(r"", LocationViewSet, basename="location")

urlpatterns = router.urls
