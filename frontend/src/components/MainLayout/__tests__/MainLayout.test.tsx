/**
 * MainLayoutコンポーネントのテスト。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MainLayout } from '../MainLayout';

// authフックをモック
const mockLogout = vi.fn();
const mockUseAuth = vi.fn().mockReturnValue({
  user: {
    id: 1,
    email: 'test@example.com',
    displayName: 'テストユーザー',
  },
});
const mockUseLogout = vi.fn().mockReturnValue({
  logout: mockLogout,
  isLoading: false,
});

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
  useLogout: () => mockUseLogout(),
}));

// Outletをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-content">Outlet Content</div>,
  };
});

describe('MainLayout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('ヘッダーをレンダリングする', () => {
    renderWithRouter(<MainLayout />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('アプリケーション名を表示する', () => {
    renderWithRouter(<MainLayout />);

    expect(screen.getByText('Personal Mapping Site')).toBeInTheDocument();
  });

  it('ユーザー名を表示する', () => {
    renderWithRouter(<MainLayout />);

    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
  });

  it('ユーザー名がない場合はメールアドレスを表示する', () => {
    mockUseAuth.mockReturnValueOnce({
      user: {
        id: 1,
        email: 'test@example.com',
        displayName: null,
      },
    });

    renderWithRouter(<MainLayout />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('ログアウトボタンを表示する', () => {
    renderWithRouter(<MainLayout />);

    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });

  it('ログアウトボタンクリックでlogout関数を呼び出す', async () => {
    renderWithRouter(<MainLayout />);

    const logoutButton = screen.getByRole('button', { name: 'ログアウト' });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('ログアウト中はボタンを無効化する', () => {
    mockUseLogout.mockReturnValueOnce({
      logout: mockLogout,
      isLoading: true,
    });

    renderWithRouter(<MainLayout />);

    const logoutButton = screen.getByRole('button', { name: 'ログアウト中...' });
    expect(logoutButton).toBeDisabled();
  });

  it('Outletをレンダリングする', () => {
    renderWithRouter(<MainLayout />);

    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('カスタムクラス名を適用できる', () => {
    const { container } = renderWithRouter(<MainLayout className="custom-layout" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-layout');
  });

  it('h-screenクラスでフルスクリーン高さを持つ', () => {
    const { container } = renderWithRouter(<MainLayout />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-screen');
  });

  it('overflow-hiddenでスクロール制御する', () => {
    const { container } = renderWithRouter(<MainLayout />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('overflow-hidden');
  });
});
