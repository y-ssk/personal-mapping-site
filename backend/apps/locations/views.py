"""
locationsアプリのビュー。

CLAUDE.md Thin Viewパターンに従い、HTTP処理のみを行う。
ビジネスロジックはLocationServiceに委譲。
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.locations.filters import LocationFilter
from apps.locations.serializers import LocationCreateSerializer, LocationSerializer
from apps.locations.services import LocationService


class LocationViewSet(viewsets.ModelViewSet):
    """
    場所のCRUDエンドポイント。

    SPEC.md § 4.3で定義されたエンドポイントを実装。
    ビジネスロジックはLocationServiceに委譲。

    Endpoints:
        GET /api/v1/locations/ - 一覧取得
        POST /api/v1/locations/ - 作成
        GET /api/v1/locations/{id}/ - 詳細取得
        PUT /api/v1/locations/{id}/ - 更新（完全）
        PATCH /api/v1/locations/{id}/ - 更新（部分）
        DELETE /api/v1/locations/{id}/ - 削除

    Filters:
        category: カテゴリID
        tags: タグ（カンマ区切り）
        status: ステータス
        search: テキスト検索
        ordering: ソート順
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LocationFilter

    def __init__(self, *args, **kwargs):
        """ServiceをDIで注入可能にする。"""
        super().__init__(*args, **kwargs)
        self.service = LocationService()

    def get_queryset(self):
        """
        ユーザーの場所のみを返す。

        N+1問題対策のため、Serviceのget_base_querysetを使用。
        """
        return self.service.get_base_queryset(self.request.user)

    def get_serializer_class(self):
        """
        アクションに応じたシリアライザを返す。

        作成・更新: LocationCreateSerializer
        それ以外: LocationSerializer
        """
        if self.action in ["create", "update", "partial_update"]:
            return LocationCreateSerializer
        return LocationSerializer

    def create(self, request, *args, **kwargs):
        """
        場所を作成。

        POST /api/v1/locations/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        location = self.service.create_location(
            user=request.user,
            data=serializer.validated_data,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        場所を更新（完全）。

        PUT /api/v1/locations/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)

        location = self.service.update_location(
            location=instance,
            data=serializer.validated_data,
            partial=False,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """
        場所を更新（部分）。

        PATCH /api/v1/locations/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        location = self.service.update_location(
            location=instance,
            data=serializer.validated_data,
            partial=True,
        )

        output_serializer = LocationSerializer(location)
        return Response(output_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        場所を削除。

        DELETE /api/v1/locations/{id}/
        """
        instance = self.get_object()
        self.service.delete_location(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
