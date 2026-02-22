/**
 * Location関連のメッセージ定数。
 *
 * CLAUDE.md § 8 エラーメッセージの一元管理に準拠。
 */

/**
 * エラーメッセージ
 */
export const LOCATION_MESSAGES = {
  /** 取得失敗 */
  FETCH_FAILED: '場所の取得に失敗しました',
  /** 作成失敗 */
  CREATE_FAILED: '場所の作成に失敗しました',
  /** 更新失敗 */
  UPDATE_FAILED: '場所の更新に失敗しました',
  /** 削除失敗 */
  DELETE_FAILED: '場所の削除に失敗しました',
  /** 見つからない */
  NOT_FOUND: '指定された場所が見つかりません',
  /** ネットワークエラー */
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
  /** 認証エラー */
  UNAUTHORIZED: 'ログインが必要です',
} as const;

/**
 * 成功メッセージ
 */
export const LOCATION_SUCCESS_MESSAGES = {
  /** 作成成功 */
  CREATED: '場所を作成しました',
  /** 更新成功 */
  UPDATED: '場所を更新しました',
  /** 削除成功 */
  DELETED: '場所を削除しました',
} as const;

/**
 * UI表示用ラベル
 */
export const LOCATION_LABELS = {
  /** ステータス: 行きたい */
  STATUS_WANT_TO_VISIT: '行きたい',
  /** ステータス: 興味なし */
  STATUS_NOT_INTERESTED: '興味なし',
  /** ステータス: 未設定 */
  STATUS_NONE: '未設定',
  /** ソート: 作成日（新しい順） */
  SORT_CREATED_DESC: '作成日（新しい順）',
  /** ソート: 作成日（古い順） */
  SORT_CREATED_ASC: '作成日（古い順）',
  /** ソート: 名前（昇順） */
  SORT_NAME_ASC: '名前（A-Z）',
  /** ソート: 名前（降順） */
  SORT_NAME_DESC: '名前（Z-A）',
  /** ソート: 訪問日（新しい順） */
  SORT_VISITED_DESC: '訪問日（新しい順）',
  /** ソート: 訪問日（古い順） */
  SORT_VISITED_ASC: '訪問日（古い順）',
} as const;
