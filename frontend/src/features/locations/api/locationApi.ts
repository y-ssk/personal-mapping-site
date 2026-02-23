/**
 * Location APIクライアント。
 *
 * SPEC.md § 4.3 場所エンドポイントに準拠。
 */

import axios from 'axios';

import { apiClient } from '@/lib/api/client';
import { HTTP_STATUS } from '@/lib/constants';

import { LOCATION_ENDPOINTS, LOCATION_MESSAGES } from '../constants';
import type {
  ApiLocation,
  ApiLocationWithDistance,
  ApiPaginatedResponse,
  Location,
  LocationCreateRequest,
  LocationFilters,
  LocationPatchRequest,
  LocationWithDistance,
  PaginatedResponse,
} from '../types/location';
import { toLocation, toLocationWithDistance, toPaginatedLocations } from '../types/location';

// 型のre-export（テストで使用）
export type { Location, LocationFilters, PaginatedResponse } from '../types/location';

/**
 * Location APIエラークラス
 */
export class LocationApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'LocationApiError';
  }
}

/**
 * Location一覧を取得
 *
 * @param filters - フィルタパラメータ
 * @returns ページネーション付きLocation一覧
 * @throws {LocationApiError} 取得失敗時
 */
export async function listLocations(
  filters?: LocationFilters
): Promise<PaginatedResponse<Location>> {
  try {
    // undefinedのパラメータを除外
    const params = filters
      ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
      : undefined;

    const response = await apiClient.get<ApiPaginatedResponse<ApiLocation>>(
      LOCATION_ENDPOINTS.LIST,
      { params }
    );

    return toPaginatedLocations(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.FETCH_FAILED);
  }
}

/**
 * Location詳細を取得
 *
 * @param id - LocationのID
 * @returns Location詳細
 * @throws {LocationApiError} 取得失敗時
 */
export async function getLocation(id: number): Promise<Location> {
  try {
    const response = await apiClient.get<ApiLocation>(LOCATION_ENDPOINTS.DETAIL(id));
    return toLocation(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new LocationApiError(LOCATION_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.FETCH_FAILED);
  }
}

/**
 * Locationを作成
 *
 * @param data - 作成データ
 * @returns 作成されたLocation
 * @throws {LocationApiError} 作成失敗時
 */
export async function createLocation(data: LocationCreateRequest): Promise<Location> {
  try {
    const response = await apiClient.post<ApiLocation>(LOCATION_ENDPOINTS.LIST, data);
    return toLocation(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.BAD_REQUEST) {
        throw new LocationApiError(
          LOCATION_MESSAGES.CREATE_FAILED,
          HTTP_STATUS.BAD_REQUEST,
          error.response.data as Record<string, string[]>
        );
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Locationを更新（完全）
 *
 * @param id - LocationのID
 * @param data - 更新データ
 * @returns 更新されたLocation
 * @throws {LocationApiError} 更新失敗時
 */
export async function updateLocation(id: number, data: LocationCreateRequest): Promise<Location> {
  try {
    const response = await apiClient.put<ApiLocation>(LOCATION_ENDPOINTS.DETAIL(id), data);
    return toLocation(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.BAD_REQUEST) {
        throw new LocationApiError(
          LOCATION_MESSAGES.UPDATE_FAILED,
          HTTP_STATUS.BAD_REQUEST,
          error.response.data as Record<string, string[]>
        );
      }
      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new LocationApiError(LOCATION_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Locationを更新（部分）
 *
 * @param id - LocationのID
 * @param data - 更新データ
 * @returns 更新されたLocation
 * @throws {LocationApiError} 更新失敗時
 */
export async function patchLocation(id: number, data: LocationPatchRequest): Promise<Location> {
  try {
    const response = await apiClient.patch<ApiLocation>(LOCATION_ENDPOINTS.DETAIL(id), data);
    return toLocation(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.BAD_REQUEST) {
        throw new LocationApiError(
          LOCATION_MESSAGES.UPDATE_FAILED,
          HTTP_STATUS.BAD_REQUEST,
          error.response.data as Record<string, string[]>
        );
      }
      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new LocationApiError(LOCATION_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Locationを削除
 *
 * @param id - LocationのID
 * @throws {LocationApiError} 削除失敗時
 */
export async function deleteLocation(id: number): Promise<void> {
  try {
    await apiClient.delete(LOCATION_ENDPOINTS.DETAIL(id));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new LocationApiError(LOCATION_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.DELETE_FAILED);
  }
}

/**
 * 近傍のLocationを検索
 *
 * @param params - 検索パラメータ
 * @returns 距離付きLocation一覧
 * @throws {LocationApiError} 取得失敗時
 */
export async function findNearbyLocations(params: {
  lat: number;
  lng: number;
  radius: number;
  category?: number;
  tags?: string;
}): Promise<LocationWithDistance[]> {
  try {
    const response = await apiClient.get<ApiLocationWithDistance[]>(LOCATION_ENDPOINTS.NEARBY, {
      params,
    });
    return response.data.map(toLocationWithDistance);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.BAD_REQUEST) {
        throw new LocationApiError(
          LOCATION_MESSAGES.FETCH_FAILED,
          HTTP_STATUS.BAD_REQUEST,
          error.response.data as Record<string, string[]>
        );
      }
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new LocationApiError(LOCATION_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new LocationApiError(LOCATION_MESSAGES.NETWORK_ERROR);
  }
}
