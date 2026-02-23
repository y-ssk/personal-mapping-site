/**
 * 地図関連のエラーメッセージ定数。
 *
 * CLAUDE.md § 8「エラーメッセージの一元管理」に準拠。
 */
export const MAP_MESSAGES = {
  /** 地図が初期化されていない場合のエラー */
  NOT_INITIALIZED: '地図が初期化されていません',
  /** 場所検索が未実装の場合のエラー */
  SEARCH_NOT_IMPLEMENTED: '場所検索はMVPでは未実装です。将来Google Mapsに移行予定。',
  /** Google Mapsが未実装の場合のエラー */
  GOOGLE_MAPS_NOT_IMPLEMENTED: 'Google Maps はまだ実装されていません',
  /** 不明な地図サービス種類のエラー */
  unknownServiceType: (type: string) => `不明な地図サービス種類: ${type}`,
} as const;
