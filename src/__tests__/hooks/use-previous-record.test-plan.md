# use-previous-record.test.ts テスト観点表

## テスト対象
`src/hooks/use-previous-record.ts` - 前回のトレーニング記録を取得するカスタムフック

## 機能概要
- 筋トレ（workout）と有酸素運動（cardio）の両方に対応
- ローカルストレージとDBから取得し、新しい方を採用
- exercise が null の場合は null を返す

## テスト観点（30テスト）

### 1. 初期状態 (2)
- [ ] 正常系: exercise が null の場合、record は null
- [ ] 正常系: isLoading は初期状態で false

### 2. 筋トレ（workout）の記録取得 (8)
- [ ] 正常系: ローカルストレージから筋トレ記録を取得
- [ ] 正常系: DBから筋トレ記録を取得（userIdがある場合）
- [ ] 正常系: ローカルのみがある場合、ローカルの記録を返す
- [ ] 正常系: DBのみがある場合、DBの記録を返す
- [ ] 正常系: 両方ある場合、DBの日付が新しければDBを返す
- [ ] 正常系: 両方ある場合、ローカルの日付が新しければローカルを返す
- [ ] 正常系: 両方ある場合、日付が同じならDBを返す
- [ ] 異常系: userIdがnullの場合、DBからの取得はスキップされる

### 3. 有酸素運動（cardio）の記録取得 (8)
- [ ] 正常系: ローカルストレージから有酸素記録を取得
- [ ] 正常系: DBから有酸素記録を取得（userIdがある場合）
- [ ] 正常系: ローカルのみがある場合、ローカルの記録を返す
- [ ] 正常系: DBのみがある場合、DBの記録を返す
- [ ] 正常系: 両方ある場合、DBの日付が新しければDBを返す
- [ ] 正常系: 両方ある場合、ローカルの日付が新しければローカルを返す
- [ ] 正常系: 両方ある場合、日付が同じならDBを返す
- [ ] 異常系: userIdがnullの場合、DBからの取得はスキップされる

### 4. エラーハンドリング (4)
- [ ] 異常系: ローカルストレージの取得が失敗した場合、エラーをログに出力
- [ ] 異常系: DBからの取得が失敗した場合、エラーをログに出力
- [ ] 異常系: 筋トレのDB取得が失敗した場合、ローカルのみ使用
- [ ] 異常系: 有酸素のDB取得が失敗した場合、ローカルのみ使用

### 5. ローディング状態 (4)
- [ ] 正常系: データ取得中は isLoading が true
- [ ] 正常系: データ取得完了後は isLoading が false
- [ ] 正常系: エラー発生時も isLoading が false になる
- [ ] 正常系: アンマウント時も isLoading が false になる

### 6. useEffect の依存配列 (4)
- [ ] 正常系: currentDate が変更されると再取得される
- [ ] 正常系: exercise が変更されると再取得される
- [ ] 正常系: userId が変更されると再取得される
- [ ] 正常系: exercise が null に変更されると record が null になる

## 依存関係のモック
- `@/lib/previous-record`: `getPreviousWorkoutRecord`, `getPreviousCardioRecord`
- `@/lib/actions/sets`: `getLatestSetRecord`
- `@/lib/actions/cardio-records`: `getLatestCardioRecord`
- `@/lib/auth-session-context`: `useAuthSession`
- `@/lib/utils`: `isCardioExercise`

## カバレッジ目標
- 分岐網羅率: 100%
- 行カバレッジ: 100%
