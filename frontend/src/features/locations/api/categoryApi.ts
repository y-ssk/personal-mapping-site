/**
 * カテゴリAPIクライアント。
 *
 * OpenAPI仕様のカテゴリエンドポイントに準拠。
 */

import axios from 'axios';

import { apiClient } from '@/lib/api/client';
import { HTTP_STATUS } from '@/lib/constants';

import { CATEGORY_ENDPOINTS, CATEGORY_MESSAGES } from '../constants';
import type { ApiCategory, Category } from '../types/location';
import { toCategory } from '../types/location';

/**
 * カテゴリAPIエラークラス
 */
export class CategoryApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'CategoryApiError';
  }
}

/**
 * カテゴリ一覧を取得
 *
 * @returns カテゴリ一覧
 * @throws {CategoryApiError} 取得失敗時
 */
export async function listCategories(): Promise<Category[]> {
  try {
    const response = await apiClient.get<ApiCategory[]>(CATEGORY_ENDPOINTS.LIST);
    return response.data.map(toCategory);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new CategoryApiError(CATEGORY_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
    }
    throw new CategoryApiError(CATEGORY_MESSAGES.FETCH_FAILED);
  }
}
