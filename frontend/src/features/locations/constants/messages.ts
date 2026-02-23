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
 * ステータス表示用ラベル
 */
export const LOCATION_STATUS_LABELS = {
  /** 行きたい */
  WANT_TO_VISIT: '行きたい',
  /** 興味なし */
  NOT_INTERESTED: '興味なし',
  /** 未設定 */
  NONE: '未設定',
} as const;

/**
 * ソート表示用ラベル
 */
export const LOCATION_SORT_LABELS = {
  /** 作成日（新しい順） */
  CREATED_DESC: '作成日（新しい順）',
  /** 作成日（古い順） */
  CREATED_ASC: '作成日（古い順）',
  /** 名前（昇順） */
  NAME_ASC: '名前（A-Z）',
  /** 名前（降順） */
  NAME_DESC: '名前（Z-A）',
  /** 訪問日（新しい順） */
  VISITED_DESC: '訪問日（新しい順）',
  /** 訪問日（古い順） */
  VISITED_ASC: '訪問日（古い順）',
} as const;

/**
 * 空状態の表示テキスト
 */
export const LOCATION_EMPTY_STATE = {
  /** タイトル */
  TITLE: '場所がありません',
  /** 説明 */
  DESCRIPTION: 'まだ場所が登録されていません。地図から場所を追加してみましょう。',
} as const;
