# body-part-filter.test.tsx テスト観点表

## テスト対象
`src/components/features/history/body-part-filter.tsx` - 部位別フィルターコンポーネント

## 機能概要
- 8つの部位タブ（all, chest, back, legs, shoulders, arms, core, other）
- 選択された部位を表示
- onPartChange コールバック
- 部位ごとに色分け表示

## テスト観点（11テスト）

### 1. 基本表示 (3)
- [ ] 正常系: 8つの部位タブが表示される
- [ ] 正常系: 選択された部位が強調表示される
- [ ] 正常系: 各部位のラベルが正しく表示される

### 2. タブ選択 (4)
- [ ] 正常系: タブをクリックするとonPartChangeが呼ばれる
- [ ] 正常系: "all"を選択できる
- [ ] 正常系: "chest"を選択できる
- [ ] 正常系: 他の部位も選択できる

### 3. スタイル (4)
- [ ] 正常系: 選択された部位は白文字になる
- [ ] 正常系: 未選択の部位は部位色の文字になる
- [ ] 正常系: "all"の場合は特別なスタイルが適用される
- [ ] 正常系: Tabsコンポーネントが使用されている

## 依存関係
- shadcn/ui: Tabs, TabsList, TabsTrigger
- @/lib/utils: BODY_PART_LABELS, BODY_PART_COLOR_HEX

## カバレッジ目標
- 分岐網羅率: 100%
- 行カバレッジ: 100%
