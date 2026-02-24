/**
 * 詳細表示用オーバーレイパネルコンポーネント。
 *
 * 地図上に詳細情報を表示するためのオーバーレイパネル。
 * Location、Visit、Trip等の詳細表示に再利用可能。
 *
 * CLAUDE.md「共通コンポーネントの型定義は同一ファイルに配置」に準拠。
 */
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/** DetailPanelのスタイル定数 */
const DETAIL_PANEL_STYLES = {
  /** パネル幅（デスクトップ） */
  WIDTH_DESKTOP: 'w-96',
  /** パネル幅（モバイル） */
  WIDTH_MOBILE: 'w-full',
  /** アニメーション時間 */
  ANIMATION_DURATION: 'duration-300',
} as const;

/**
 * DetailPanelコンポーネントのProps。
 */
export interface DetailPanelProps {
  /** パネルの表示状態 */
  isOpen: boolean;
  /** 閉じるボタンクリック時のハンドラ */
  onClose: () => void;
  /** パネルのタイトル */
  title?: string;
  /** パネルのコンテンツ */
  children: ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 詳細表示用オーバーレイパネル。
 *
 * 右側からスライドインするパネルで、詳細情報を表示する。
 * モバイルでは画面下部からスライドアップ。
 *
 * @example
 * ```tsx
 * <DetailPanel
 *   isOpen={selectedLocation !== null}
 *   onClose={() => setSelectedLocation(null)}
 *   title={selectedLocation?.name}
 * >
 *   <LocationDetail location={selectedLocation} />
 * </DetailPanel>
 * ```
 */
export function DetailPanel({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: DetailPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* オーバーレイ背景（モバイルのみ） */}
      <div
        className="lg:hidden fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        data-testid="detail-panel-overlay"
      />

      {/* パネル */}
      <div
        className={`
          fixed z-50 bg-white shadow-xl
          transform transition-transform ${DETAIL_PANEL_STYLES.ANIMATION_DURATION}

          /* デスクトップ: 右側からスライド */
          lg:right-0 lg:top-0 lg:h-full ${DETAIL_PANEL_STYLES.WIDTH_DESKTOP}
          lg:translate-x-0

          /* モバイル: 下からスライド */
          inset-x-0 bottom-0 ${DETAIL_PANEL_STYLES.WIDTH_MOBILE}
          lg:inset-auto
          max-h-[80vh] lg:max-h-full
          rounded-t-xl lg:rounded-none

          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title || '詳細パネル'}
        data-testid="detail-panel"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          {/* モバイル: ドラッグハンドル */}
          <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />

          {/* タイトル */}
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-8 pt-2 lg:pt-0">
            {title || '詳細'}
          </h2>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
            data-testid="detail-panel-close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto h-[calc(100%-60px)]" data-testid="detail-panel-content">
          {children}
        </div>
      </div>
    </>
  );
}
