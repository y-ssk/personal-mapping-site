/**
 * DetailPanelコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { DetailPanel } from '../DetailPanel';

describe('DetailPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('isOpen=trueでパネルを表示する', () => {
    render(
      <DetailPanel isOpen={true} onClose={vi.fn()} title="テスト">
        <div>コンテンツ</div>
      </DetailPanel>
    );

    expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('コンテンツ')).toBeInTheDocument();
  });

  it('isOpen=falseで何も表示しない', () => {
    render(
      <DetailPanel isOpen={false} onClose={vi.fn()} title="テスト">
        <div>コンテンツ</div>
      </DetailPanel>
    );

    expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
  });

  it('閉じるボタンでonCloseを呼び出す', () => {
    const handleClose = vi.fn();
    render(
      <DetailPanel isOpen={true} onClose={handleClose} title="テスト">
        <div>コンテンツ</div>
      </DetailPanel>
    );

    fireEvent.click(screen.getByTestId('detail-panel-close'));

    expect(handleClose).toHaveBeenCalled();
  });

  it('オーバーレイクリックでonCloseを呼び出す', () => {
    const handleClose = vi.fn();
    render(
      <DetailPanel isOpen={true} onClose={handleClose} title="テスト">
        <div>コンテンツ</div>
      </DetailPanel>
    );

    fireEvent.click(screen.getByTestId('detail-panel-overlay'));

    expect(handleClose).toHaveBeenCalled();
  });

  it('タイトルがない場合はデフォルトタイトルを表示する', () => {
    render(
      <DetailPanel isOpen={true} onClose={vi.fn()}>
        <div>コンテンツ</div>
      </DetailPanel>
    );

    expect(screen.getByText('詳細')).toBeInTheDocument();
  });

  it('dialog roleとaria-modal属性を持つ', () => {
    render(
      <DetailPanel isOpen={true} onClose={vi.fn()} title="テスト">
        <div>コンテンツ</div>
      </DetailPanel>
    );

    const panel = screen.getByTestId('detail-panel');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
  });

  it('childrenを正しくレンダリングする', () => {
    render(
      <DetailPanel isOpen={true} onClose={vi.fn()}>
        <button>アクションボタン</button>
        <p>説明テキスト</p>
      </DetailPanel>
    );

    expect(screen.getByRole('button', { name: 'アクションボタン' })).toBeInTheDocument();
    expect(screen.getByText('説明テキスト')).toBeInTheDocument();
  });
});
