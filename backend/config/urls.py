"""
Personal Mapping SiteのURL設定。
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # APIドキュメント
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # 認証（SPEC.md § 4.2 準拠）
    path("api/v1/auth/", include("apps.users.urls")),
    # 場所（SPEC.md § 4.3 準拠）
    path("api/v1/locations/", include("apps.locations.urls")),
    # カテゴリ（OpenAPI仕様準拠）
    path("api/v1/categories/", include("apps.locations.category_urls")),
]

# デバッグツールバー（デバッグモード時のみ）
if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
