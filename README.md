# MuscleGrow

筋トレの記録、成長の可視化、継続モチベーションの維持を目的にした Web アプリケーションです。

既存の筋トレ記録アプリに対して「記録はできるが、自分の成長が直感的に見えにくい」という課題を感じたことから開発しました。Big3 の目標達成率、部位別のトレーニング履歴、種目ごとの成長推移をスマートフォンで確認しやすい UI にまとめています。

- デモ: [https://musclegrow.vercel.app/](https://musclegrow.vercel.app/)
- 対象ユーザー: 筋トレを継続したい個人、記録から成長を実感したい人
- 開発方針: モバイルファースト、型安全、ゲストでも使い始められる導線

MuscleGrow OGP

---

## 主な機能


| 機能        | 概要                                            |
| --------- | --------------------------------------------- |
| Big3 進捗管理 | ベンチプレス、スクワット、デッドリフトの目標重量と現在の最大重量を比較し、達成率を表示   |
| トレーニング記録  | 種目、重量、回数、セット、メモを記録。前回記録を表示して入力の手間を削減          |
| カレンダー履歴   | 部位ごとに色分けしたカレンダーで、過去のトレーニング日を確認                |
| 成長グラフ     | 種目ごとの重量、回数、体重、体脂肪率などの推移をグラフ化                  |
| 体組成管理     | 身長、体重、体脂肪率、筋肉量、BMI を記録                        |
| ゲストモード    | ログイン不要で localStorage に記録し、ログイン後に Supabase へ移行 |
| テーマ設定     | ダークモードとテーマカラーの切り替えに対応                         |
| データ出力     | 記録データを CSV としてエクスポート                          |


### 細かいこだわり

- 履歴カレンダーでは、トレーニング内容を円形グリッドで表示し、どの部位のトレーニングを行ったかを一目で分かるようにしました。
- 記録ページでは、画面上部の部位ボタンに指が届きづらい場面を考慮し、左右スワイプで次の部位へ移動できるようにしました
- 記録入力では、数値を入力すると次の入力欄が自動で表示され、テンポよくセットを追加できるようにしました

---

## 技術スタック


| 領域      | 技術                                             |
| ------- | ---------------------------------------------- |
| フレームワーク | Next.js 15 App Router                          |
| 言語      | TypeScript 5.9                                 |
| UI      | Tailwind CSS 4、shadcn/ui、Radix UI、lucide-react |
| 認証      | Better Auth、Google OAuth、メール/パスワード認証           |
| DB      | Supabase PostgreSQL                            |
| ORM     | Drizzle ORM、Drizzle Kit                        |
| バリデーション | Zod                                            |
| グラフ     | Recharts                                       |
| アニメーション | framer-motion                                  |
| テスト     | Vitest、Testing Library                         |
| ホスティング  | Vercel                                         |
| パッケージ管理 | pnpm                                           |


### 技術選定の理由


| 技術           | 採用理由                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Next.js      | 学習中の技術を実プロダクトで深めたかったため。スマホ利用を想定し、SSR などで初回表示や操作体験を意識しやすい点も重視                                            |
| TypeScript   | ユーザー、プロフィール、種目、セット記録など複数のデータ構造を型で管理し、値やプロパティのミスに早く気づけるようにするため                                           |
| Supabase     | PostgreSQL を手軽に使え、個人開発でも本番に近い DB 環境を用意しやすいため。認証や RLS を学ぶきっかけにもなった                                       |
| Better Auth  | 当初は Supabase Auth に強く依存せず、DB 変更の余地を残すために採用。開発後半で Supabase Auth + RLS の方が適切な場面もあると学んだ                    |
| Drizzle ORM  | TypeScript で DB スキーマとクエリを管理しやすく、AI 開発時にもデータ構造を明確に伝えやすいため。Prisma 以外の ORM を学ぶ目的もあった                       |
| Tailwind CSS | スマホ UI を素早く作りながら、画面サイズごとの細かい調整もしやすいため                                                                   |
| Recharts     | React コンポーネントとして宣言的に扱いやすく、体重推移や記録変化など一般的な折れ線・棒グラフには十分だと判断したため。Nivo も候補に挙げたが、今回は表現力より実装のシンプルさと学習コストを優先した |


---

## アーキテクチャ

```text
Browser
  |
  | Next.js App Router
  |
  +-- Server Actions ---- Drizzle ORM ---- Supabase PostgreSQL
  |                                            |
  |                                      Better Auth
  |                              email/password + Google OAuth
  |
  +-- localStorage
        |
        +-- GuestDataMigrator
             ログイン後にゲストデータを DB へ移行
```

### 設計上の工夫

- 認証済みユーザーのデータは Supabase に保存し、ゲストユーザーのデータは localStorage に保存
- `GuestDataMigrator` を認証レイアウト配下に配置し、ログイン後のデータ移行を共通化
- Server Actions に DB 操作を集約し、ページやコンポーネントから永続化処理を分離
- Drizzle のスキーマ定義を中心に、テーブル構造と TypeScript の型を揃える構成
- セッション取得をサーバーサイドの共通関数に寄せ、クライアント側の不要な認証リクエストを削減

---

## DB 設計

主なテーブルは以下です。

```text
users
  +-- profiles
  +-- profile_history
  +-- workout_sessions
        +-- sets
        +-- cardio_records

exercises
  +-- sets
  +-- cardio_records

users
  +-- user_exercise_settings
```

### テーブルの役割


| テーブル                     | 役割                       |
| ------------------------ | ------------------------ |
| `profiles`               | 身長、体重、体脂肪率、筋肉量、Big3 目標値  |
| `profile_history`        | 体組成の履歴。体重や BMI のグラフ表示に使用 |
| `exercises`              | 共通種目とユーザー独自種目のマスタ        |
| `workout_sessions`       | 1 日単位のトレーニングセッション        |
| `sets`                   | 筋トレ種目のセット単位の記録           |
| `cardio_records`         | 有酸素運動の記録                 |
| `user_exercise_settings` | ユーザーごとの種目表示設定            |


---

## ディレクトリ構成

```text
src/
  app/
    (auth)/          ログイン、サインアップ
    (protected)/     ホーム、記録、履歴、統計、目標、プロフィール
    (static)/        利用規約、プライバシーポリシー、お問い合わせ
    api/             Better Auth API
  components/
    features/        機能別コンポーネント
    layout/          ヘッダー、フッターナビゲーション
    ui/              shadcn/ui コンポーネント
  hooks/             カスタムフック
  lib/
    actions/         Server Actions
    utils/           計算、整形などのユーティリティ
  supabase/          Supabase クライアント
  types/             型定義

db/
  schemas/           Drizzle スキーマ
  seed.ts            初期種目データ投入

scripts/             マイグレーション補助スクリプト
```

---

## 開発で工夫したこと

### 1. ゲストから会員登録への移行体験

筋トレ記録アプリは最初の入力ハードルが高いと使われにくいため、ログインしなくても記録できるゲストモードを実装しました。ゲスト中は localStorage に保存し、会員登録またはログイン後に Supabase へ移行することで、試用中のデータを失わない設計にしています。

### 2. 認証処理の見直し

初期実装ではクライアント側でセッションを取得していましたが、ページ遷移時やプリフェッチ時に不要なリクエストが増える問題がありました。現在はサーバーサイドの共通関数でセッションを取得し、必要な情報だけを Context に渡す構成にしています。

### 3. 入力負荷を下げる記録画面

筋トレ記録では同じ種目を繰り返し入力することが多いため、前回記録や最大重量を表示し、ユーザーが重量や回数を決めやすいようにしました。継続利用を重視し、記録フォームはスマートフォンでの操作を前提に設計しています。

### 4. DB マイグレーションの自動化

Drizzle Kit によるマイグレーションを GitHub Actions から実行するワークフローを用意しています。本番 DB への変更を手作業に寄せすぎず、再現性のある形で管理できるようにしました。

### 5. 実機で発生したカレンダー UI の崩れ対応

履歴画面のカレンダーは、開発環境や PC のレスポンシブ表示では問題なく見えていても、スマートフォン実機では日付が枠からはみ出したり、下のコンテンツと重なる不具合がありました。月ごとの行数変動が原因の一つだと考え、常に 6 週表示に固定し、CSS 変数でグリッド全体のサイズが変動しないよう調整しました。この経験から、スマホ利用が中心のサービスでは実機検証まで含めて品質を確認する重要性を学びました。

---

## ローカル起動

### 1. 依存関係をインストール

```bash
pnpm install
```

### 2. 環境変数を設定

`.env.example` を参考に `.env.local` を作成します。

```bash
cp .env.example .env.local
```

必要な環境変数:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_GOOGLE_CLIENT_ID=
BETTER_AUTH_GOOGLE_CLIENT_SECRET=
```

### 3. 開発サーバーを起動

```bash
pnpm dev
```

開発サーバーは `http://localhost:4000` で起動します。

---

## よく使うコマンド

```bash
# 開発サーバー
pnpm dev

# 本番ビルド
pnpm build

# lint
pnpm lint

# テスト
pnpm test:run

# Drizzle マイグレーション生成
pnpm drizzle:generate

# Drizzle マイグレーション適用
pnpm drizzle:migrate

# 種目マスタ投入
pnpm seed:exercises
```

---

## 今後の改善

- コンポーネントテストと統合テストの拡充
- 記録フォーム周辺の重複ロジック整理
- トレーニングメニューのテンプレート保存
- 種目ごとの PR 更新履歴や達成通知
- Supabase 無料枠の停止対策と運用監視

