# sets.ts テスト観点表

## isValidSet

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 有効なセット | `{ setOrder: 1, weight: 60, reps: 10, isWarmup: false }` | `true` |
| 正常系: オプション項目なし | `{ setOrder: 1, weight: 60, reps: 10 }` | `true` |
| 異常系: 必須項目なし | `{ weight: 60 }` | `false` |
| 異常系: 無効な型 | `{ setOrder: "a", weight: 60, reps: 10 }` | `false` |

## saveSets

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 新規保存 | 有効なセット配列 | `{ success: true, data: { count: N } }` |
| 正常系: 既存削除→新規挿入 | 既存あり、新規セット配列 | `{ success: true, data: { count: N } }` |
| 正常系: 空配列（既存削除のみ） | 空配列 | `{ success: true, data: { count: 0 } }` |
| 異常系: 種目IDバリデーション失敗 | mock-で始まるID | `{ success: false, error: "..." }` |
| 異常系: セッションが存在しない | 存在しないsessionId | `{ success: false, error: "セッションが見つかりません" }` |
| 異常系: 権限なし | 他人のsessionId | `{ success: false, error: "このセッションにアクセスする権限がありません" }` |
| 異常系: トランザクションエラー | DB エラー | `{ success: false, error: "セット記録の保存に失敗しました" }` |
| 境界値: セット数0 | 無効なセットのみ | `{ success: true, data: { count: 0 } }` |

## getSets

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: セット取得 | 有効なsessionId, exerciseId | `{ success: true, data: [...]  }` |
| 正常系: モックID | `mock-`で始まるexerciseId | `{ success: true, data: [] }` |
| 正常系: データなし | セットが存在しない | `{ success: true, data: [] }` |
| 異常系: セッション不存在 | 存在しないsessionId | `{ success: false, error: "セッションが見つかりません" }` |
| 異常系: 権限なし | 他人のsessionId | `{ success: false, error: "このセッションにアクセスする権限がありません" }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "セット記録の取得に失敗しました" }` |

## getUserMaxWeights

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 最大重量取得 | 有効なuserId | `{ success: true, data: { exerciseId: maxWeight, ... } }` |
| 正常系: 記録なし | 記録がないuserId | `{ success: true, data: {} }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "最大重量の取得に失敗しました" }` |
| 境界値: 重量0 | weight=0のみ | `data: {}` (0は除外される) |

## getLatestSetRecord

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 最新記録取得 | 有効なuserId, exerciseId | `{ success: true, data: { sets: [...], date: Date } }` |
| 正常系: beforeDate指定 | beforeDate指定 | 指定日以前の最新記録 |
| 正常系: 記録なし | 記録がない | `{ success: true, data: null }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "記録の取得に失敗しました" }` |
