# stats.ts テスト観点表

## getProfileHistory

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 履歴取得（月） | userId, preset="month" | `{ success: true, data: [...] }` |
| 正常系: 履歴取得（年） | userId, preset="year" | `{ success: true, data: [...] }` |
| 正常系: データなし | 履歴がないuserId | `{ success: true, data: [] }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "プロフィール履歴の取得に失敗しました" }` |

## getBig3ProgressData

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: Big3進捗取得 | userId, preset="month" | `{ success: true, data: { benchPress: [...], squat: [...], deadlift: [...] } }` |
| 正常系: Big3種目なし | Big3種目が存在しない | `{ success: true, data: { benchPress: [], squat: [], deadlift: [] } }` |
| 正常系: データなし | 記録がない | `{ success: true, data: { benchPress: [], squat: [], deadlift: [] } }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "Big3推移データの取得に失敗しました" }` |

## getExerciseProgressData

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 種目進捗取得 | userId, exerciseId, preset="month" | `{ success: true, data: [...] }` |
| 正常系: データなし | 記録がない | `{ success: true, data: [] }` |
| 異常系: DBエラー | DB エラー | `{ success: false, error: "種目推移データの取得に失敗しました" }` |

## getTotalWorkoutDays

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 日数取得 | 有効なuserId | 数値（日数） |
| 正常系: 記録なし | 記録がないuserId | 0 |

## getRecordedExerciseIds

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: 種目ID取得 | 有効なuserId | 種目ID配列 |
| 正常系: 記録なし | 記録がないuserId | 空配列 |
| 異常系: DBエラー | DB エラー | 空配列 |
