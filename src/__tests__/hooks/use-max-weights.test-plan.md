# use-max-weights.test.ts テスト観点表

## テスト対象
`src/hooks/use-max-weights.ts` - 最大重量を取得・管理するカスタムフック

## 機能概要
- ローカルストレージとDBから最大重量を取得
- 両者を比較し、大きい方を採用
- requestIdleCallbackを使ってアイドル時に計算

## テスト観点（25テスト）

### 1. 初期値の読み込み (2)
- [ ] 正常系: キャッシュから初期値を読み込む
- [ ] 正常系: キャッシュが空の場合、空オブジェクトが返る

### 2. runHeavyRecalc の動作 (10)
- [ ] 正常系: ローカルストレージから計算される
- [ ] 正常系: DBから取得される（userIdがある場合）
- [ ] 正常系: ローカルとDBの値をマージ
- [ ] 正常系: DBの値がローカルより大きい場合、DBの値が採用される
- [ ] 正常系: ローカルの値がDBより大きい場合、ローカルの値が採用される
- [ ] 正常系: ローカルにない種目がDBにある場合、DBの値が採用される
- [ ] 正常系: DBにない種目がローカルにある場合、ローカルの値が採用される
- [ ] 正常系: 計算結果がキャッシュに保存される
- [ ] 異常系: userIdがnullの場合、DBからの取得はスキップされる
- [ ] 異常系: DBからの取得が失敗した場合、エラーをログに出力しローカルのみ使用

### 3. recalculateMaxWeights の動作 (3)
- [ ] 正常系: recalculateMaxWeightsを呼ぶと再計算が実行される
- [ ] 正常系: runOnIdleを使って実行される
- [ ] 異常系: 再計算中にエラーが発生した場合、エラーをログに出力する

### 4. useEffect の動作 (4)
- [ ] 正常系: 初回レンダリング時に再計算が実行される
- [ ] 正常系: userId変更時に再計算が実行される
- [ ] 正常系: クリーンアップ時にcancelIdleが呼ばれる
- [ ] 正常系: useEffectでもrunOnIdleを使って実行される

### 5. runOnIdle / cancelIdle のフォールバック (6)
- [ ] 正常系: requestIdleCallbackが使用可能な場合、使用される
- [ ] 正常系: requestIdleCallbackが使用不可の場合、setTimeoutが使用される
- [ ] 正常系: cancelIdleCallbackが使用可能な場合、使用される
- [ ] 正常系: cancelIdleCallbackが使用不可の場合、clearTimeoutが使用される
- [ ] 異常系: windowが未定義の場合（SSR）、runOnIdleはnullを返す
- [ ] 異常系: windowが未定義の場合（SSR）、cancelIdleは何もしない

## 依存関係のモック
- `@/lib/max-weight`: `loadMaxWeightsCache`, `saveMaxWeightsCache`, `calculateMaxWeightsFromStorage`
- `@/lib/actions/sets`: `getUserMaxWeights`
- `@/lib/auth-session-context`: `useAuthSession`
- DOM API: `requestIdleCallback`, `cancelIdleCallback`, `setTimeout`, `clearTimeout`

## カバレッジ目標
- 分岐網羅率: 100%
- 行カバレッジ: 100%
