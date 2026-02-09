# history.ts テスト観点表

## getSessionDetails

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: セッション詳細取得 | 有効なuserId, sessionId | `{ success: true, data: { id, date, workoutExercises: [...], cardioExercises: [...] } }` |
| 正常系: セットのみ | セットのみのセッション | cardioExercises: [] |
| 正常系: 有酸素のみ | 有酸素のみのセッション | workoutExercises: [] |
| 異常系: userIdが空 | userId="" | `{ success: false, error: "ユーザーIDが無効です" }` |
| 異常系: セッション不存在 | 存在しないsessionId | `{ success: false, error: "セッションが見つかりません" }` |
| 異常系: 権限なし | 他人のsessionId | `{ success: false, error: "アクセス権限がありません" }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "セッション詳細の取得に失敗しました" }` |

## getBodyPartsByDateRange

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 部位一覧取得 | userId, startDate, endDate | `{ success: true, data: { "2024-01-01": ["chest", "back"], ... } }` |
| 正常系: ゲストユーザー | userId="" | `{ success: true, data: {} }` |
| 正常系: データなし | 記録がない期間 | `{ success: true, data: {} }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "部位一覧の取得に失敗しました" }` |

## getExerciseHistory

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 履歴取得 | exerciseId, limit=10 | 日付ごとのセット配列 |
| 正常系: モックID | `mock-`で始まるexerciseId | 空配列 |
| 正常系: データなし | 記録がない | 空配列 |
| 境界値: limit=1 | limit=1 | 最新1件のみ |
