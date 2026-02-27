/**
 * Location作成・編集フォームコンポーネント。
 *
 * DetailPanel内に表示し、地図クリックで座標取得、カテゴリ選択、
 * タグ入力、バリデーション機能を提供する。
 * React Hook Formを使用（SPEC.md § 5 準拠）。
 */
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { X, MapPin } from 'lucide-react';

import type { LatLng } from '@/lib/maps';

import {
  LOCATION_FORM_CONSTANTS,
  LOCATION_FORM_MESSAGES,
  LOCATION_STATUS_LABELS,
} from '../constants';
import { useCreateLocation, useUpdateLocation } from '../hooks/useLocations';
import { useCategories } from '../hooks/useCategories';
import type { Location, LocationCreateRequest, LocationStatus, GeoPoint } from '../types/location';

/**
 * フォーム内部のデータ型。
 *
 * pointはLatLng形式で管理し、送信時にGeoJSON形式に変換する。
 */
interface LocationFormData {
  /** 場所名 */
  name: string;
  /** 住所 */
  address: string;
  /** カテゴリID */
  category_id: string;
  /** ステータス */
  status: string;
  /** メモ */
  notes: string;
  /** WebサイトURL */
  website: string;
  /** 電話番号 */
  phone: string;
}

/**
 * LocationFormコンポーネントのProps。
 */
interface LocationFormProps {
  /** 編集対象のLocation（新規作成時はundefined） */
  location?: Location;
  /** 地図クリックで取得した座標 */
  clickedPoint?: LatLng | null;
  /** 保存成功時のコールバック */
  onSuccess?: (location: Location) => void;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
}

/**
 * LatLngをGeoJSON Point形式に変換する。
 *
 * @param latlng - 緯度経度座標
 * @returns GeoJSON Point形式
 */
function toGeoPoint(latlng: LatLng): GeoPoint {
  return {
    type: 'Point',
    coordinates: [latlng.lng, latlng.lat],
  };
}

/**
 * GeoJSON PointをLatLng形式に変換する。
 *
 * @param point - GeoJSON Point
 * @returns 緯度経度座標
 */
function fromGeoPoint(point: GeoPoint): LatLng {
  return {
    lat: point.coordinates[1],
    lng: point.coordinates[0],
  };
}

/**
 * TagInputコンポーネントのProps。
 */
interface TagInputProps {
  /** 現在のタグ一覧 */
  tags: string[];
  /** タグ変更時のコールバック */
  onChange: (tags: string[]) => void;
}

/**
 * タグ入力コンポーネント。
 *
 * テキスト入力 + Enter/カンマでタグを追加。
 * タグはチップ表示 + ×ボタンで削除。
 *
 * @param props - TagInputコンポーネントのProps
 */
function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  /** タグを追加する */
  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue('');
    },
    [tags, onChange]
  );

  /** キー入力ハンドラ */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  /** タグを削除する */
  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-blue-600"
              aria-label={`タグ「${tag}」を削除`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addTag(inputValue);
        }}
        placeholder={LOCATION_FORM_MESSAGES.TAG_HINT}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
      />
    </div>
  );
}

/**
 * Location作成・編集フォームコンポーネント。
 *
 * @param props - コンポーネントProps
 *
 * @example
 * ```tsx
 * // 新規作成
 * <LocationForm
 *   clickedPoint={{ lat: 35.6812, lng: 139.7671 }}
 *   onSuccess={(loc) => console.log('作成:', loc)}
 *   onCancel={() => setPanelMode('view')}
 * />
 *
 * // 編集
 * <LocationForm
 *   location={selectedLocation}
 *   onSuccess={(loc) => console.log('更新:', loc)}
 *   onCancel={() => setPanelMode('view')}
 * />
 * ```
 */
export function LocationForm({ location, clickedPoint, onSuccess, onCancel }: LocationFormProps) {
  const isEditMode = !!location;
  const {
    mutateAsync: createLocation,
    isPending: isCreating,
    error: createError,
  } = useCreateLocation();
  const {
    mutateAsync: updateLocation,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateLocation();
  const { data: categories } = useCategories();

  const isPending = isCreating || isUpdating;
  const apiError = createError || updateError;

  // 座標の状態管理（react-hook-formの外で管理）
  const [point, setPoint] = useState<LatLng | null>(
    location ? fromGeoPoint(location.point) : (clickedPoint ?? null)
  );
  const [pointError, setPointError] = useState<string | null>(null);

  // タグの状態管理
  const [tags, setTags] = useState<string[]>(location?.tags ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormData>({
    defaultValues: {
      name: location?.name ?? '',
      address: location?.address ?? '',
      category_id: location?.category?.id?.toString() ?? '',
      status: location?.status ?? '',
      notes: location?.notes ?? '',
      website: location?.website ?? '',
      phone: location?.phone ?? '',
    },
  });

  // 地図クリック座標が変更されたらフォームに反映
  useEffect(() => {
    if (clickedPoint) {
      setPoint(clickedPoint);
      setPointError(null);
    }
  }, [clickedPoint]);

  /**
   * フォーム送信ハンドラ。
   *
   * フォームデータをLocationCreateRequest形式に変換してAPI呼び出し。
   */
  const onSubmit = async (data: LocationFormData) => {
    // 座標バリデーション
    if (!point) {
      setPointError(LOCATION_FORM_MESSAGES.POINT_REQUIRED);
      return;
    }

    const requestData: LocationCreateRequest = {
      name: data.name,
      point: toGeoPoint(point),
      address: data.address || undefined,
      category_id: data.category_id
        ? Number.isNaN(parseInt(data.category_id, 10))
          ? null
          : parseInt(data.category_id, 10)
        : null,
      tags: tags.length > 0 ? tags : undefined,
      status: (data.status || null) as LocationStatus | null,
      notes: data.notes || undefined,
      website: data.website || undefined,
      phone: data.phone || undefined,
    };

    try {
      let result: Location;
      if (isEditMode && location) {
        result = await updateLocation({ id: location.id, data: requestData });
      } else {
        result = await createLocation(requestData);
      }
      onSuccess?.(result);
    } catch {
      // エラーはhookで管理される
    }
  };

  /** 入力フィールドのスタイルクラス生成 */
  const inputClassName = (hasError: boolean) =>
    `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4" data-testid="location-form">
      {/* APIエラーメッセージ */}
      {apiError && (
        <div className="rounded-md bg-red-50 p-3" role="alert" aria-live="polite">
          <p className="text-sm text-red-700">{apiError.message}</p>
        </div>
      )}

      {/* 場所名（必須） */}
      <div>
        <label htmlFor="location-name" className="block text-sm font-medium text-gray-700">
          場所名 <span className="text-red-500">*</span>
        </label>
        <input
          id="location-name"
          type="text"
          {...register('name', {
            required: LOCATION_FORM_MESSAGES.NAME_REQUIRED,
            maxLength: {
              value: LOCATION_FORM_CONSTANTS.NAME_MAX_LENGTH,
              message: LOCATION_FORM_MESSAGES.NAME_TOO_LONG,
            },
          })}
          className={inputClassName(!!errors.name)}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* 座標（必須、地図クリックで設定） */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          座標 <span className="text-red-500">*</span>
        </label>
        {point ? (
          <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
            <MapPin size={16} className="text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">
              {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
            </span>
          </div>
        ) : (
          <div
            className={`mt-1 rounded-md border px-3 py-2 text-sm ${
              pointError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <p className={pointError ? 'text-red-600' : 'text-gray-500'}>
              {LOCATION_FORM_MESSAGES.POINT_HINT}
            </p>
          </div>
        )}
        {pointError && <p className="mt-1 text-sm text-red-600">{pointError}</p>}
      </div>

      {/* 住所 */}
      <div>
        <label htmlFor="location-address" className="block text-sm font-medium text-gray-700">
          住所
        </label>
        <input
          id="location-address"
          type="text"
          {...register('address')}
          className={inputClassName(false)}
        />
      </div>

      {/* カテゴリ */}
      <div>
        <label htmlFor="location-category" className="block text-sm font-medium text-gray-700">
          カテゴリ
        </label>
        <select
          id="location-category"
          {...register('category_id')}
          className={inputClassName(false)}
        >
          <option value="">未選択</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.fullPath}
            </option>
          ))}
        </select>
      </div>

      {/* ステータス */}
      <div>
        <label htmlFor="location-status" className="block text-sm font-medium text-gray-700">
          ステータス
        </label>
        <select id="location-status" {...register('status')} className={inputClassName(false)}>
          <option value="">{LOCATION_STATUS_LABELS.NONE}</option>
          <option value="want_to_visit">{LOCATION_STATUS_LABELS.WANT_TO_VISIT}</option>
          <option value="not_interested">{LOCATION_STATUS_LABELS.NOT_INTERESTED}</option>
        </select>
      </div>

      {/* タグ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タグ</label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* メモ */}
      <div>
        <label htmlFor="location-notes" className="block text-sm font-medium text-gray-700">
          メモ
        </label>
        <textarea
          id="location-notes"
          rows={3}
          {...register('notes')}
          className={inputClassName(false)}
        />
      </div>

      {/* Webサイト */}
      <div>
        <label htmlFor="location-website" className="block text-sm font-medium text-gray-700">
          Webサイト
        </label>
        <input
          id="location-website"
          type="url"
          {...register('website', {
            pattern: {
              value: /^https?:\/\/.+/,
              message: LOCATION_FORM_MESSAGES.WEBSITE_INVALID,
            },
          })}
          placeholder="https://..."
          className={inputClassName(!!errors.website)}
          aria-invalid={errors.website ? 'true' : 'false'}
          aria-describedby={errors.website ? 'website-error' : undefined}
        />
        {errors.website && (
          <p id="website-error" className="mt-1 text-sm text-red-600">
            {errors.website.message}
          </p>
        )}
      </div>

      {/* 電話番号 */}
      <div>
        <label htmlFor="location-phone" className="block text-sm font-medium text-gray-700">
          電話番号
        </label>
        <input
          id="location-phone"
          type="tel"
          {...register('phone', {
            maxLength: {
              value: LOCATION_FORM_CONSTANTS.PHONE_MAX_LENGTH,
              message: LOCATION_FORM_MESSAGES.PHONE_TOO_LONG,
            },
          })}
          className={inputClassName(!!errors.phone)}
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-600">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* 成功メッセージ（送信成功後に外部で処理するが、念のため） */}

      {/* アクションボタン */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? LOCATION_FORM_MESSAGES.SUBMITTING
            : isEditMode
              ? LOCATION_FORM_MESSAGES.UPDATE_BUTTON
              : LOCATION_FORM_MESSAGES.CREATE_BUTTON}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {LOCATION_FORM_MESSAGES.CANCEL_BUTTON}
          </button>
        )}
      </div>
    </form>
  );
}
