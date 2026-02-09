# Phase 4: サーバーアクションのテスト戦略

## 概要

Phase 4では`src/lib/actions/`配下のサーバーアクションのテストを実装します。サーバーアクションはデータベース操作、認証、キャッシュ無効化などの複雑な依存関係を持つため、適切なモック戦略が必要です。

## 対象ファイル一覧（13ファイル）

1. `big3-progress.ts` - Big3進捗データの取得
2. `cardio-records.ts` - 有酸素記録の操作
3. `data-export.ts` - データエクスポート機能
4. `delete-exercise.ts` - 種目の削除
5. `exercises.ts` - 種目の取得・操作
6. `history.ts` - トレーニング履歴の取得
7. `profile.ts` - プロフィール操作
8. `sets.ts` - セット記録の操作
9. `settings.ts` - 設定・アカウント削除
10. `stats.ts` - 統計データの取得
11. `system.ts` - システム情報（環境変数チェック）
12. `user-exercises.ts` - ユーザー種目の操作
13. `workout-sessions.ts` - ワークアウトセッションの操作

## 優先度と複雑度の評価

| ファイル | 優先度 | 複雑度 | 理由 |
|---------|--------|--------|------|
| `system.ts` | 低 | ★☆☆ | 環境変数チェックのみ、DB操作なし |
| `exercises.ts` | 高 | ★★☆ | 基本的なCRUD、よく使われる |
| `stats.ts` | 高 | ★★★ | 統計計算、複雑なクエリ |
| `sets.ts` | 高 | ★★★ | セット記録、複雑なロジック |
| `delete-exercise.ts` | 中 | ★★☆ | 削除ロジック、カスケード処理 |
| `profile.ts` | 中 | ★★☆ | プロフィール更新 |
| `history.ts` | 中 | ★★★ | 履歴取得、複雑なクエリ |
| `workout-sessions.ts` | 中 | ★★☆ | セッション管理 |
| `user-exercises.ts` | 中 | ★★☆ | ユーザー種目CRUD |
| `big3-progress.ts` | 中 | ★★☆ | Big3進捗取得 |
| `cardio-records.ts` | 中 | ★★☆ | 有酸素記録CRUD |
| `settings.ts` | 低 | ★★★ | アカウント削除、複雑だが使用頻度低 |
| `data-export.ts` | 低 | ★★☆ | エクスポート機能、使用頻度低 |

## テスト戦略

### 1. テストの種類

#### ユニットテスト
- **対象**: 純粋な関数ロジック（データベース操作を含まない部分）
- **方法**: 入力と期待される出力のテスト
- **例**: バリデーション、データ変換処理

#### 統合テスト
- **対象**: データベース操作を含むサーバーアクション
- **方法**: データベースをモックして実行
- **例**: CRUD操作、複雑なクエリ

### 2. モック戦略

#### データベース（Drizzle ORM）のモック

```typescript
// vitest.setup.ts または各テストファイルで
import { vi } from 'vitest';

// dbモジュール全体をモック
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      exercises: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      // 他のテーブルも同様に...
    },
  },
}));
```

#### 認証のモック

```typescript
// @/lib/auth-session-server のモック
vi.mock('@/lib/auth-session-server', () => ({
  getAuthUserId: vi.fn(),
  getAuthSession: vi.fn(),
}));

// テスト内で
import { getAuthUserId } from '@/lib/auth-session-server';
(getAuthUserId as ReturnType<typeof vi.fn>).mockResolvedValue('test-user-id');
```

#### Next.jsのキャッシュ無効化のモック

```typescript
// next/cache のモック
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

#### safe-action のモック

```typescript
// @/lib/safe-action のモック
vi.mock('@/lib/safe-action', () => ({
  authActionClient: {
    schema: (schema: any) => ({
      action: (handler: any) => handler,
    }),
  },
}));
```

### 3. テスト実装の推奨順序

#### フェーズ1: シンプルなアクション（1-2ファイル）
1. `system.ts` - 環境変数チェック（最もシンプル）
2. `exercises.ts` - 基本的なCRUD（重要度高）

#### フェーズ2: 中程度のアクション（3-4ファイル）
3. `delete-exercise.ts` - 削除ロジック
4. `profile.ts` - プロフィール更新
5. `user-exercises.ts` - ユーザー種目
6. `workout-sessions.ts` - セッション管理

#### フェーズ3: 複雑なアクション（3-4ファイル）
7. `sets.ts` - セット記録
8. `stats.ts` - 統計データ
9. `history.ts` - 履歴取得
10. `big3-progress.ts` - Big3進捗

#### フェーズ4: 低優先度アクション（残り）
11. `cardio-records.ts` - 有酸素記録
12. `settings.ts` - アカウント削除
13. `data-export.ts` - エクスポート

## テスト実装のテンプレート

### 基本構造

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { actionName } from './file-name';

// モックの設定
vi.mock('../../../db');
vi.mock('@/lib/auth-session-server');
vi.mock('next/cache');

describe('actionName', () => {
  beforeEach(() => {
    // モックのリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('正常系', () => {
    it('成功時の動作', async () => {
      // Given: テストデータとモックの設定

      // When: アクションを実行

      // Then: 期待される結果
    });
  });

  describe('異常系', () => {
    it('エラー時の動作', async () => {
      // Given: エラーを発生させるモック

      // When: アクションを実行

      // Then: エラーハンドリング
    });
  });
});
```

## 技術的な課題と解決策

### 課題1: Drizzle ORMの複雑なクエリビルダー

**問題**: Drizzle ORMはメソッドチェーンでクエリを構築するため、モックが複雑

**解決策**:
```typescript
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockResolvedValue([{ id: '1', name: 'test' }]);

vi.mock('../../../db', () => ({
  db: {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
  },
}));
```

### 課題2: safe-actionのスキーマバリデーション

**問題**: `authActionClient.schema()` の動作をモックする必要がある

**解決策**:
```typescript
// safe-actionをバイパスして、アクションハンドラを直接テスト
// または、safe-actionのモックを実装
```

### 課題3: トランザクション処理

**問題**: 複数のDB操作をトランザクションで実行する場合のモック

**解決策**:
```typescript
const mockTransaction = vi.fn(async (callback) => {
  return await callback({
    insert: vi.fn(),
    update: vi.fn(),
    // ...
  });
});

vi.mock('../../../db', () => ({
  db: {
    transaction: mockTransaction,
  },
}));
```

## テスト観点

### 共通テスト観点

1. **認証チェック**
   - 未認証ユーザーのアクセス
   - 権限のないユーザーのアクセス

2. **バリデーション**
   - 無効な入力データ
   - 必須フィールドの欠落
   - 型の不一致

3. **データベース操作**
   - 正常な作成・読み取り・更新・削除
   - データが存在しない場合
   - 重複データの処理

4. **エラーハンドリング**
   - データベースエラー
   - ネットワークエラー
   - 予期しない例外

5. **キャッシュ無効化**
   - 適切なパスやタグが無効化されているか

## 次のステップ

1. **環境構築**
   - モック用のヘルパー関数を作成
   - テスト用のユーティリティを準備

2. **最初のテスト実装**
   - `system.ts` から開始（最もシンプル）
   - モック戦略を検証・改善

3. **段階的な実装**
   - 推奨順序に従ってテストを追加
   - 各ファイル完了時にコミット

4. **カバレッジ目標**
   - 主要な処理パス: 100%
   - エラーハンドリング: 80%以上
   - エッジケース: 可能な限り

## 参考情報

- **Vitest公式ドキュメント**: https://vitest.dev/
- **Drizzle ORM公式**: https://orm.drizzle.team/
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **Zod公式ドキュメント**: https://zod.dev/

---

**作成日**: 2026-02-09
**Phase**: 4 (準備フェーズ)
**ステータス**: 戦略策定完了、実装待ち
