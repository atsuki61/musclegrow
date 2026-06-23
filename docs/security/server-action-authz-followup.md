# セキュリティ・フォローアップ: Server Action の userId 認可

- 起票日: 2026-06-23
- 重要度: 中（自動レビューは HIGH 判定。露出データの機微度を踏まえ中に調整）
- 分類: Broken Access Control / IDOR

## 背景

Next.js App Router の `"use server"` アクションは、UI 経由だけでなくクライアントから直接 POST 到達し得るエントリポイント。本リポジトリの多くのサーバーアクションは `userId` を**引数で受け取り**、それを信頼して DB を読み書きしている。クライアントが他人の `userId` を渡すと、その人のデータにアクセスできる IDOR が成立する。

参考: https://nextjs.org/docs/app/guides/data-security#built-in-server-actions-security-features

## 対象（同一パターンの既存アクション）

`src/lib/actions/` 配下で `userId` を引数に取る `"use server"` 関数群。確認済みの例:

- `stats.ts`: `getTotalWorkoutDays(userId)` ほか
- `profile.ts`: `getBig3TargetValues(userId)` ほか
- `exercises.ts`: `getExercises(userId)`
- `sets.ts`: `getUserMaxWeights(userId)`
- `user-exercises.ts`: `getExercisesWithUserPreferences(userId)`
- `big3-progress.ts`, `history.ts`, `cardio-records.ts`, `workout-sessions.ts`, `settings.ts`, `delete-exercise.ts`, `data-export.ts` など
- `weekly-summary.ts`: `getWeeklySummary(userId)` ← 2026-06-23 追加。既存慣習に合わせた

## 今回の判断（週間ボリュームサマリー PR）

- `getWeeklySummary` は既存パターンに整合させ、**現状維持**。
- 正規呼び出し（`src/app/(app)/page.tsx`）では `userId` はサーバーセッション `getAuthSession()` 由来で安全。
- 露出データ（週間トレーニング量）は低機微度。
- 1ファイルだけ直すと他アクションと不整合になり「直した感」だけ残るため、横断課題として分離。
- 自動レビューと Codex のセカンドオピニオン双方が「既存パターン維持＋横断対応の別課題化」を推奨。

## 推奨する横断ハードニング（別タスク）

各サーバーアクションで `userId` を外部から受け取らず、アクション内でセッションから導出する:

```ts
const session = await getAuthSession();
const userId = session?.user?.id;
if (!userId) throw new Error("UNAUTHENTICATED");
```

互換のため引数を残す場合は `userId === session.user.id` を検証し、不一致なら拒否する。共有集計ロジックは `server-only` な DAL/helper に分離して各アクションから呼ぶ。ゲスト対応で `null` userId を許容する箇所（`getExercises` 等）は分岐を維持。

## 進め方の注意

- 読み取り系・書き込み系・ゲスト（`null` userId 許容）が混在するため、一括置換ではなくアクション単位で移行する。
- 各アクションのテスト（`src/__tests__/lib/actions/*`）はセッションモックの追加が必要。
