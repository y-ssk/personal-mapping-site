# タスク #008 実行ログ

## 基本情報
- **タスクID:** #008
- **タスク名:** フロントエンド認証UI
- **ブランチ:** feature/auth-frontend
- **開始日:** 2026-02-04
- **担当:** Claude Code

---

## 実行履歴

### 2026-02-04 設計レビュー

#### 実装前設計レビュー（senior-architect-reviewer）

**総合評価:** 条件付き承認

**指摘事項:**
| # | 重要度 | 内容 | 対応 |
|---|--------|------|------|
| 1 | 高 | User型フィールド名がAPIと不一致（displayName vs display_name） | 変換関数`toUser`で対応 |
| 2 | 高 | トークンリフレッシュ処理が未実装 | client.tsに実装 |
| 3 | 中 | User型にoauth_provider, date_joined未定義 | 型定義に追加 |
| 4 | 中 | ログアウト時にREFRESH_TOKENも削除すべき | authStore.logoutで対応 |

**未定義事項への決定:**
1. **フィールド命名規則:** API（snake_case）→フロントエンド（camelCase）変換を採用
2. **OAuthフロー:** リダイレクト方式を採用
3. **ログイン後リダイレクト先:** `/`（ホーム）
4. **未認証時リダイレクト:** `/login`へリダイレクト

### 2026-02-04 実装

#### 作成ファイル一覧

**features/auth/**
```
features/auth/
├── api/
│   └── authApi.ts           # 認証APIクライアント
├── components/
│   ├── LoginForm.tsx        # ログインフォーム
│   ├── RegisterForm.tsx     # 登録フォーム
│   ├── OAuthButtons.tsx     # OAuth認証ボタン
│   ├── OAuthCallback.tsx    # OAuthコールバック処理
│   └── index.ts
├── hooks/
│   ├── useAuth.ts           # 認証状態統合フック
│   ├── useLogin.ts          # ログインフック
│   ├── useLogout.ts         # ログアウトフック
│   ├── useRegister.ts       # 登録フック
│   ├── useCurrentUser.ts    # 現在ユーザー取得フック
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx        # ログインページ
│   ├── RegisterPage.tsx     # 登録ページ
│   └── index.ts
├── types/
│   └── auth.ts              # 認証関連型定義
├── constants/
│   ├── messages.ts          # エラーメッセージ
│   └── index.ts             # 定数集約
├── __tests__/
│   ├── authApi.test.ts      # APIテスト
│   ├── useAuth.test.ts      # useAuthテスト
│   ├── useLogin.test.ts     # useLoginテスト
│   ├── useLogout.test.ts    # useLogoutテスト
│   └── useRegister.test.ts  # useRegisterテスト
└── index.ts                 # 公開API
```

**components/**
```
components/
└── PrivateRoute/
    ├── PrivateRoute.tsx     # 認証必須ルート
    └── index.ts
```

**更新ファイル:**
- `frontend/src/App.tsx` - ルーティング追加
- `frontend/src/stores/authStore.ts` - User型更新、REFRESH_TOKEN削除対応
- `frontend/src/lib/api/client.ts` - トークンリフレッシュ処理追加
- `CLAUDE.md` - `/design-review`スキル追加

#### 実装ポイント

1. **SPEC.md § 2.2準拠**
   - Feature-based構造でauth機能を実装
   - グローバル状態はZustand（authStore）
   - サーバー状態はTanStack Query

2. **CLAUDE.md準拠**
   - マジックナンバー定数化（AUTH_CONSTANTS）
   - エラーメッセージ一元管理（AUTH_MESSAGES）
   - JSDoc日本語コメント
   - Thin View + Service パターン相当（hooks + api分離）

3. **設計レビュー指摘対応**
   - API snake_case → フロントエンド camelCase 変換
   - トークンリフレッシュ実装（重複リフレッシュ防止付き）
   - ログアウト時の両トークン削除

---

## スキル追加

### /design-review

設計レビュー結果を詳細解説付きでドキュメント化するスキルを追加。

**使用例:**
```
/design-review 008
```

**出力先:** `docs/local/<id>_design_review.md`

---

## CI失敗調査（2026-02-08）

### 失敗概要

PR #19 の Frontend CI が失敗。lint と test の両方が失敗。

### テスト失敗（5件）

| ファイル | 行 | エラー | 根本原因 |
|----------|-----|--------|----------|
| authApi.test.ts | 46 | `window is not defined` | jsdom環境未設定 |
| useAuth.test.ts | 33 | `window is not defined` | jsdom環境未設定 |
| useLogin.test.ts | 32 | `Expected ">" but found "client"` | .tsでJSX使用 |
| useLogout.test.ts | 34 | `Expected ">" but found "client"` | .tsでJSX使用 |
| useRegister.test.ts | 32 | `Expected ">" but found "client"` | .tsでJSX使用 |

### 根本原因分析

**1. `window is not defined`**
- テストがNode.js環境で実行されている
- vite.config.tsに`test.environment: 'jsdom'`を追加済みだがCIで反映されていない可能性
- 各テストファイルに`// @vitest-environment jsdom`を追加するか、vitest.config.tsを分離する必要

**2. `Expected ">" but found "client"`**
- `.ts`ファイルでJSX構文（`<QueryClientProvider>`等）を使用
- esbuildが`.ts`をJSXなしでトランスパイル
- **解決策**: `.ts` → `.tsx` にリネーム

### 修正方針

1. **テストファイル拡張子変更**: `.ts` → `.tsx`
   - `authApi.test.ts` → `authApi.test.tsx`
   - `useAuth.test.ts` → `useAuth.test.tsx`
   - `useLogin.test.tsx`（既にリネーム済み）
   - `useLogout.test.tsx`（既にリネーム済み）
   - `useRegister.test.tsx`（既にリネーム済み）

2. **Vitest環境設定**: 各テストファイルにjsdom環境指定
   ```typescript
   // @vitest-environment jsdom
   ```

3. **ESLintエラー対応**（9件）:
   | エラー | ファイル（推定） | 対応 |
   |--------|------------------|------|
   | `afterEach` is defined but never used | テストファイル | 削除または使用 |
   | `act` is defined but never used | テストファイル | 削除または使用 |
   | `STORAGE_KEYS` is defined but never used | authApi.test.ts? | 削除または使用 |
   | Parsing error: '>' expected（3件） | .tsファイル | .tsxにリネーム |
   | `toUser` is defined but never used | authApi.ts? | 削除または使用 |
   | `AUTH_MESSAGES` is defined but never used | useLogin.ts? | 削除または使用 |
   | `OAuthProvider` is defined but never used | types/auth.ts? | 削除または使用 |

### CI再失敗（2026-02-08 2回目）

前回の修正後もCIが失敗。

**1. Prettierエラー（10ファイル）**
- src/App.tsx
- src/features/auth/__tests__/useAuth.test.ts
- src/features/auth/__tests__/useLogin.test.tsx
- src/features/auth/__tests__/useRegister.test.tsx
- src/features/auth/components/LoginForm.tsx
- src/features/auth/components/OAuthButtons.tsx
- src/features/auth/components/OAuthCallback.tsx
- src/features/auth/components/RegisterForm.tsx
- src/features/auth/pages/LoginPage.tsx
- src/features/auth/pages/RegisterPage.tsx

**対応:** `npm run format` で自動修正

**2. テストエラー（13件）**
- `setUser is not a function` - authStoreモックが不完全
- `storeLogout is not a function` - authStoreモックが不完全
- エラーメッセージの期待値と実際が不一致

**根本原因:**
authStoreのモックが関数を返していない。
```typescript
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setUser: vi.fn(),  // ← これが関数として認識されていない
  })),
}));
```

**対応方針:**
1. Prettierでフォーマット修正
2. authStoreモックを修正

### 実施した修正（2026-02-08 2回目）

**1. Prettier修正**
- `npx prettier --write` で10ファイルをフォーマット

**2. authStoreモック修正**
Zustandのセレクターパターンに対応したモックに修正:
```typescript
// Before（動作しない）
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ setUser: vi.fn() })),
}));

// After（セレクターパターン対応）
const mockSetUser = vi.fn();
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { setUser: mockSetUser, ... };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));
```

修正ファイル:
- `useLogin.test.tsx`
- `useLogout.test.tsx`
- `useRegister.test.tsx`

### CI再失敗（2026-02-08 3回目）

**1. TypeScriptエラー（4件）**
- `useAuth.test.ts(39)`: `authApi`から`User`がexportされていない
- `useLogin.test.tsx(152,153,157)`: `authApi`から`AuthTokens`がexportされていない

**根本原因:**
- `User`と`AuthTokens`は`types/auth.ts`で定義されている
- テストでは`import * as authApi`経由でアクセスしようとしている
- `authApi.ts`はこれらの型をre-exportしていない

**対応:**
- `authApi.ts`でUserとAuthTokensをre-exportする
- または、テストで直接`types/auth`からインポートする

**2. テストエラー（6件）**
- エラーメッセージが空文字列になっている
- TanStack Queryのエラー処理の問題

**根本原因:**
- モックされた`AuthApiError`が正しくスローされていない
- または、エラーがスローされる前にテストが終了している

---

### 実施した修正（2026-02-08）

**1. テストファイルにjsdom環境設定を追加**
- `authApi.test.ts` - `@vitest-environment jsdom` 追加
- `useAuth.test.ts` - `@vitest-environment jsdom` 追加
- `useLogin.test.tsx` - `@vitest-environment jsdom` 追加
- `useLogout.test.tsx` - `@vitest-environment jsdom` 追加
- `useRegister.test.tsx` - `@vitest-environment jsdom` 追加

**2. 未使用インポート削除**
- `authApi.test.ts` - `afterEach` 削除
- `useAuth.test.ts` - `act`, `STORAGE_KEYS`, `afterEach` 削除
- `authApi.ts` - `toUser`（type import）削除
- `OAuthCallback.tsx` - `OAuthProvider` 削除
- `LoginForm.tsx` - `AUTH_MESSAGES` 削除

---

### ワークフロー改善点

**問題**: Sub Agentでの調査結果を記録せずに修正に入った結果、VSCode強制終了で調査結果が消失

**対策**:
- 調査・レビュー結果は**即座にLOG.mdに記録**してから修正に入る
- 記録→修正の順序を徹底
- CLAUDE.mdやワークフローにこのルールを明文化

---

## 次のステップ

- [ ] Dockerでの動作確認
- [ ] TypeScript型チェック
- [ ] テスト実行・カバレッジ確認
- [ ] PR更新

---

## 参考資料

- SPEC.md § 2.2 フロントエンドアーキテクチャ
- SPEC.md § 4.2 認証エンドポイント
- CLAUDE.md § プロジェクト構造
- docs/local/008_design_review.md
