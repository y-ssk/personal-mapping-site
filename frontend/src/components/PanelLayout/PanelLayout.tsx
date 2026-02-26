/**
 * パネルレイアウトコンポーネント。
 *
 * Google Maps風のリサイズ可能なパネル分割UIを提供する。
 * react-resizable-panelsを使用し、サイドパネル（リスト）とメインパネル（地図）を分割表示。
 *
 * CLAUDE.md「共通コンポーネントの型定義は同一ファイルに配置」に準拠。
 */
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

/** パネルサイズの定数 */
const PANEL_SIZES = {
  /** サイドパネルのデフォルトサイズ（%） */
  SIDE_DEFAULT: 30,
  /** サイドパネルの最小サイズ（%） */
  SIDE_MIN: 15,
  /** サイドパネルの最大サイズ（%） */
  SIDE_MAX: 50,
} as const;

/**
 * PanelLayoutコンポーネントのProps。
 */
export interface PanelLayoutProps {
  /** サイドパネルに表示するコンテンツ */
  sidePanel: React.ReactNode;
  /** メインパネルに表示するコンテンツ */
  mainPanel: React.ReactNode;
  /** サイドパネルのデフォルトサイズ（%、省略時は30%） */
  defaultSideSize?: number;
  /** サイドパネルの最小サイズ（%、省略時は15%） */
  minSideSize?: number;
  /** サイドパネルの最大サイズ（%、省略時は50%） */
  maxSideSize?: number;
  /** コンテナのクラス名 */
  className?: string;
}

/**
 * リサイズハンドルコンポーネント。
 *
 * パネル間のドラッグ可能な境界線を表示する。
 */
function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1 bg-gray-200 hover:bg-blue-400 transition-colors">
      {/* ドラッグ時のビジュアルフィードバック */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-0.5 h-8 bg-blue-500 rounded" />
      </div>
    </PanelResizeHandle>
  );
}

/**
 * パネルレイアウトコンポーネント。
 *
 * サイドパネルとメインパネルをリサイズ可能な境界で分割表示する。
 * レスポンシブ対応: モバイルでは縦並びに切り替わる。
 *
 * @example
 * ```tsx
 * <PanelLayout
 *   sidePanel={<LocationList locations={locations} />}
 *   mainPanel={<MapView locations={locations} />}
 * />
 * ```
 */
export function PanelLayout({
  sidePanel,
  mainPanel,
  defaultSideSize = PANEL_SIZES.SIDE_DEFAULT,
  minSideSize = PANEL_SIZES.SIDE_MIN,
  maxSideSize = PANEL_SIZES.SIDE_MAX,
  className = '',
}: PanelLayoutProps) {
  return (
    <div className={`h-full w-full ${className}`}>
      {/* デスクトップ: 横並びパネル（lg以上） */}
      <div className="hidden lg:block h-full">
        <PanelGroup direction="horizontal" className="h-full">
          {/* サイドパネル（リスト） */}
          <Panel
            defaultSize={defaultSideSize}
            minSize={minSideSize}
            maxSize={maxSideSize}
            className="overflow-auto"
          >
            <div className="h-full overflow-auto bg-white">{sidePanel}</div>
          </Panel>

          {/* リサイズハンドル */}
          <ResizeHandle />

          {/* メインパネル（地図） */}
          <Panel className="overflow-hidden">
            <div className="h-full">{mainPanel}</div>
          </Panel>
        </PanelGroup>
      </div>

      {/* モバイル/タブレット: 縦並び（lg未満） */}
      <div className="lg:hidden h-full flex flex-col">
        {/* 地図（上半分） */}
        <div className="h-1/2 min-h-[200px]">{mainPanel}</div>
        {/* リスト（下半分） */}
        <div className="h-1/2 overflow-auto bg-white border-t border-gray-200">{sidePanel}</div>
      </div>
    </div>
  );
}

export { PANEL_SIZES };
