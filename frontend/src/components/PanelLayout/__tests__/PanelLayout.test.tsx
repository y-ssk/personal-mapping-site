/**
 * PanelLayoutコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { PanelLayout, PANEL_SIZES } from '../PanelLayout';

// react-resizable-panelsをモック（v4.6.5 API: Group, Panel, Separator）
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="panel" className={className}>
      {children}
    </div>
  ),
  Group: ({
    children,
    orientation,
    className,
  }: {
    children: React.ReactNode;
    orientation: string;
    className?: string;
  }) => (
    <div data-testid="panel-group" data-orientation={orientation} className={className}>
      {children}
    </div>
  ),
  Separator: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="resize-handle" className={className}>
      {children}
    </div>
  ),
}));

describe('PanelLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('サイドパネルとメインパネルをレンダリングする', () => {
    render(
      <PanelLayout
        sidePanel={<div data-testid="side-content">サイドコンテンツ</div>}
        mainPanel={<div data-testid="main-content">メインコンテンツ</div>}
      />
    );

    // デスクトップとモバイル両方でレンダリングされるため、getAllByTestIdを使用
    const sideContents = screen.getAllByTestId('side-content');
    const mainContents = screen.getAllByTestId('main-content');

    // デスクトップ用とモバイル用の両方がレンダリングされる
    expect(sideContents.length).toBe(2);
    expect(mainContents.length).toBe(2);
    expect(sideContents[0]).toBeInTheDocument();
    expect(mainContents[0]).toBeInTheDocument();
  });

  it('デスクトップ表示用のパネルグループをレンダリングする', () => {
    render(<PanelLayout sidePanel={<div>サイド</div>} mainPanel={<div>メイン</div>} />);

    const panelGroup = screen.getByTestId('panel-group');
    expect(panelGroup).toBeInTheDocument();
    expect(panelGroup).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('リサイズハンドルをレンダリングする', () => {
    render(<PanelLayout sidePanel={<div>サイド</div>} mainPanel={<div>メイン</div>} />);

    const resizeHandle = screen.getByTestId('resize-handle');
    expect(resizeHandle).toBeInTheDocument();
  });

  it('カスタムクラス名を適用できる', () => {
    const { container } = render(
      <PanelLayout
        sidePanel={<div>サイド</div>}
        mainPanel={<div>メイン</div>}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('モバイル用のレイアウトもレンダリングされる', () => {
    const { container } = render(
      <PanelLayout
        sidePanel={<div data-testid="side-mobile">サイド</div>}
        mainPanel={<div data-testid="main-mobile">メイン</div>}
      />
    );

    // モバイルレイアウトはlg:hiddenクラスを持つ
    const mobileLayout = container.querySelector('.lg\\:hidden');
    expect(mobileLayout).toBeInTheDocument();
  });

  it('デスクトップレイアウトがlg以上で表示される', () => {
    const { container } = render(
      <PanelLayout sidePanel={<div>サイド</div>} mainPanel={<div>メイン</div>} />
    );

    // デスクトップレイアウトはhidden lg:blockクラスを持つ
    const desktopLayout = container.querySelector('.lg\\:block');
    expect(desktopLayout).toBeInTheDocument();
  });

  it('PANEL_SIZESがデフォルト値を持つ', () => {
    expect(PANEL_SIZES.SIDE_DEFAULT).toBe(30);
    expect(PANEL_SIZES.SIDE_MIN).toBe(15);
    expect(PANEL_SIZES.SIDE_MAX).toBe(50);
  });
});
