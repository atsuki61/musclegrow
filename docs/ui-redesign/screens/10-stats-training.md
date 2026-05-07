# 10 Stats Training

## 参照画像

`../../image/image_if/グラフ_トレーニング_if.png`

## 目的

種目ごとの成長推移を部位、期間、種目の順で絞り込めるようにする。

## 構成

- ヘッダー: `グラフ`
- タブ: プロフィール、トレーニング
- 期間チップ
- 部位チップ
- 種目チップ
- チャートカード
- 下部ナビ: グラフ active

## 表示テキスト

`トレーニング`, `ベンチプレスの推移`, `最新`

## 状態差分

種目未選択、データなし、ローディング。

## 実装対象

`StatsPage`, `ExerciseChart`, `DateRangeSelector`, `BodyPartSelector`, `ExerciseSelector`

## 未対応許容範囲

フィルター構成は既存状態管理を維持する。
