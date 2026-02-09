# big3-progress.ts テスト観点表

## getBig3MaxWeights

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: Big3最大重量取得 | 有効なuserId | `{ success: true, data: { benchPress: { exerciseId, maxWeight }, squat: {...}, deadlift: {...} } }` |
| 正常系: ゲストユーザー | userId=null | 空データ（maxWeight=0） |
| 正常系: 記録なし | 記録がないuserId | 空データ（maxWeight=0） |
| 正常系: Big3種目が見つからない | Big3種目が存在しない | 空データ（maxWeight=0） |
| 異常系: DB接続エラー | ECONNREFUSED | 空データ（フォールバック） |
| 異常系: テーブル不存在 | "does not exist" エラー | 空データ（フォールバック） |
| 異常系: その他DBエラー | 一般的なDB エラー | 空データ（フォールバック） |
| 境界値: ウォームアップのみ | isWarmup=true のみ | maxWeight=0 |

## createEmptyBig3Data

| 観点 | 入力 | 期待される出力 |
|------|------|---------------|
| 正常系: デフォルト | 引数なし | exerciseId="", maxWeight=0 |
| 正常系: ID指定 | benchPressId, squatId, deadliftId | 指定されたID, maxWeight=0 |
