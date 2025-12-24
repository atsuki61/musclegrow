# MuscleGrow - 筋トレ記録アプリ

**URL**: https://musclegrow.vercel.app/

## 概要

筋トレの記録と可視化ができる Web アプリです。日々のトレーニング内容（種目・重量・回数）を記録し、Big3（ベンチプレス・スクワット・デッドリフト）の目標達成率をプログレスバーで確認できます。カレンダー形式で過去の記録を振り返ったり、グラフで成長の推移を見ることで、継続のモチベーションを維持できる設計にしました。

### アピールポイント

- **ゲストモード対応**: ログインなしでも localStorage で記録可能。会員登録後は自動でデータ移行
- **直感的な UI**: スワイプ操作による削除・編集機能、前回記録の自動表示で入力の手間を削減
- **型安全な設計**: TypeScript 厳格モード、Drizzle ORM + Zod による完全な型安全性
- **パフォーマンス最適化**: Promise.all による並列クエリ実行、ハイブリッドデータ管理

## 使用技術

### フロントエンド

- **フレームワーク**: Next.js 15.5.7 (App Router)
- **言語**: TypeScript 5.9.3
- **UI フレームワーク**: React 19.1.0
- **スタイリング**: Tailwind CSS 4.1.16
- **UI コンポーネント**: shadcn/ui (Radix UI ベース)
- **アニメーション**: framer-motion 12.23.24
- **グラフ**: Recharts 3.4.1
- **日付処理**: date-fns 4.1.0

### バックエンド・インフラ

- **データベース**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM 0.44.7
- **認証**: Better Auth 1.3.34
- **バリデーション**: Zod 4.1.12
- **ホスティング**: Vercel
- **パッケージ管理**: pnpm

### 開発ツール

- **データベース管理**: Drizzle Kit 0.31.6
- **リンター**: ESLint 9.39.1
- **ビルドツール**: Turbopack (Next.js 内蔵)

## 構成図

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│   Vercel    │   │  Supabase   │
│  (Hosting)  │   │ (PostgreSQL)│
└─────────────┘   └─────────────┘
                         │
                   ┌─────▼─────┐
                   │ Better Auth│
                   │ (認証)     │
                   └────────────┘
```

## ディレクトリ構成

```
musclegrow/
├── src/                          # ソースコード
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 認証関連ページ
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (protected)/         # 認証必須ページ
│   │   │   ├── goals/           # 目標設定
│   │   │   ├── history/         # 履歴画面
│   │   │   ├── profile/         # プロフィール
│   │   │   ├── record/          # 記録画面
│   │   │   └── stats/           # 統計・グラフ
│   │   ├── (static)/            # 静的ページ
│   │   │   ├── contact/
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   ├── api/                 # API ルート
│   │   │   ├── auth/
│   │   │   ├── check-env/
│   │   │   └── profile/
│   │   ├── layout.tsx
│   │   └── page.tsx             # ホーム画面
│   ├── components/              # React コンポーネント
│   │   ├── features/            # 機能別コンポーネント
│   │   │   ├── goals/           # 目標設定関連
│   │   │   ├── history/         # 履歴関連
│   │   │   ├── home/            # ホーム画面関連
│   │   │   ├── profile/         # プロフィール関連
│   │   │   ├── record/          # 記録関連
│   │   │   ├── stats/           # 統計・グラフ関連
│   │   │   └── timer/           # タイマー機能
│   │   ├── layout/              # レイアウトコンポーネント
│   │   │   ├── header.tsx
│   │   │   └── footer-nav.tsx
│   │   ├── ui/                  # shadcn/ui コンポーネント
│   │   └── theme-provider.tsx
│   ├── lib/                     # ユーティリティ・ロジック
│   │   ├── actions/             # サーバーアクション
│   │   │   ├── big3-progress.ts
│   │   │   ├── exercises.ts
│   │   │   ├── history.ts
│   │   │   ├── profile.ts
│   │   │   ├── stats.ts
│   │   │   └── workout-sessions.ts
│   │   ├── utils/               # ユーティリティ関数
│   │   │   ├── bmi.ts
│   │   │   ├── body-composition.ts
│   │   │   └── stats.ts
│   │   ├── auth.ts              # 認証設定
│   │   ├── auth-client.ts       # クライアント認証
│   │   ├── auth-session-server.ts
│   │   ├── data-source.ts       # データソース管理
│   │   ├── local-storage-*.ts   # localStorage 管理
│   │   └── validations.ts       # バリデーション
│   ├── hooks/                   # カスタムフック
│   │   ├── use-cardio-session.ts
│   │   ├── use-last-trained.ts
│   │   ├── use-max-weights.ts
│   │   └── use-workout-session.ts
│   ├── types/                   # TypeScript 型定義
│   │   ├── profile.ts
│   │   ├── stats.ts
│   │   ├── user.ts
│   │   └── workout.ts
│   └── supabase/                # Supabase 設定
│       ├── browser-client.ts
│       └── server-client.ts
├── db/                          # データベース関連
│   ├── schemas/                 # Drizzle スキーマ
│   │   ├── app.ts               # アプリケーションスキーマ
│   │   └── auth.ts              # 認証スキーマ
│   ├── index.ts                 # DB 接続
│   ├── schema.ts                # スキーマエクスポート
│   └── seed.ts                  # シードデータ
├── drizzle/                     # Drizzle マイグレーション
│   ├── *.sql                    # SQL マイグレーションファイル
│   └── meta/                    # マイグレーションメタデータ
├── scripts/                     # スクリプト
│   ├── add-big3-targets-migration.ts
│   └── run-migration.ts
├── supabase/                    # Supabase 設定
│   ├── config.toml
│   └── docker/
├── public/                      # 静的ファイル
│   ├── favicon.ico
│   └── *.png                    # アイコン・画像
├── .github/                     # GitHub 設定
│   └── workflows/
│       └── migrate.yml          # CI/CD ワークフロー
├── drizzle.config.ts            # Drizzle 設定
├── next.config.ts               # Next.js 設定
├── package.json                 # 依存関係
├── tsconfig.json                # TypeScript 設定
└── README.md                    # このファイル
```

## 機能一覧

### コア機能

- **ホーム画面**

  - Big3（ベンチプレス・スクワット・デッドリフト）の進捗バー表示
  - 目標達成率の可視化
  - 総トレーニング日数の表示

- **記録機能**

  - トレーニング記録の追加（日付・部位・種目・重量・回数・メモ）
  - 前回記録の自動表示（同じ種目の場合）
  - リアルタイム保存（Supabase / localStorage）

- **履歴画面**

  - 過去の記録一覧表示（日別・週別）
  - 削除・編集機能
  - フィルタリング機能（部位別、期間別）
  - 種目ごとの履歴表示

- **グラフ・統計画面**

  - 種目ごとの重量・回数と体組成の推移グラフ
  - 成長の推移を時系列で確認

- **プロフィール設定**

  - 身長・体重・体脂肪率・筋肉量の記録
  - Big3 の目標値設定
  - アカウント設定

- **認証機能**
  - メール/パスワード認証
  - Google OAuth 認証
  - ゲストモード（localStorage 使用）
  - ゲストデータの自動移行

### 付随機能

- **データ管理**

  - ローカルストレージと DB のハイブリッド管理
  - データの自動同期
  - トランザクション処理による整合性担保

- **UX 機能**
  - ダークモード対応
  - レスポンシブデザイン（モバイルファースト）
  - スムーズなアニメーション
  - ローディング状態の表示

## 工夫した点

成長を直感的に実感し、モチベーションを維持できる UI/UX を設計しました。Big3 の目標達成度を示す進捗バーや重量・体組成の推移グラフを実装し、記録を可視化できるようにしました。また、トレーニング部位に応じたカレンダーの色分けや、好みに合わせたテーマカラー変更機能を実装し、記録したくなる体験を追求しました。

## 開発環境セットアップ

```bash
pnpm install
pnpm dev
```
