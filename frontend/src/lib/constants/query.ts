/**
 * TanStack Query関連の定数。
 *
 * クエリ設定のデフォルト値を一元管理する。
 */

/** 時間の定数（ミリ秒） */
export const TIME_MS = {
  /** 1秒 */
  SECOND: 1000,
  /** 1分 */
  MINUTE: 60 * 1000,
  /** 5分 */
  FIVE_MINUTES: 5 * 60 * 1000,
  /** 1時間 */
  HOUR: 60 * 60 * 1000,
} as const;

/** TanStack Queryのデフォルト設定 */
export const QUERY_DEFAULTS = {
  /** データの鮮度期間（ミリ秒） */
  STALE_TIME: TIME_MS.FIVE_MINUTES,
  /** リトライ回数 */
  RETRY_COUNT: 1,
} as const;
