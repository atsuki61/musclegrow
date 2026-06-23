# 週間ボリュームサマリー 設計仕様書

- 作成日: 2026-06-23
- 対象機能: ホーム画面の「今週のトレーニングサマリー」カード
- 実装順: 全4機能（週間ボリューム → ワークアウトテンプレート → AIおすすめ種目 → AI解説補填）のうちの **1本目**

---

## 1. 目的 / 背景

記録はできるが「今週どれだけ動いたか」を一目で把握できる場所がない。ホーム画面の `RecordButton` 周辺に余白があるため、ここに**今週のトレーニング量サマリー**を置き、継続モチベーションを高める。

新テーブルは作らず、既存の `workout_sessions` / `sets` / localStorage 記録の**集計のみ**で実現する（リスク最小）。

## 2. スコープ

### やること
- ホームに「今週（月〜日）のサマリー」カードを追加（モック Pattern C 採用）。
- 表示指標: **ジム回数（トレーニング日数）／ 総ボリューム（Σ weight×reps, kg）／ 総セット数 ／ 先週比較（総ボリュームの増減%）**。
- 月〜日の曜日ドット（日本語表記「月火水木金土日」）でその週のトレーニング日を可視化。
- ログインユーザー = DB集計、ゲスト = localStorage集計の二系統に対応。

### やらないこと（YAGNI）
- 部位別ボリューム内訳（将来の「週間ボリューム分析」拡張で検討）。
- 有酸素（cardio）の距離・カロリー集計（本カードは筋トレボリューム主体）。
- 期間切替UI（今週固定。詳細分析は stats ページの将来拡張で）。

## 3. 採用デザイン

モック `docs/mockups/weekly-volume.html` の **Pattern C（週カレンダー統合）** を採用。

- 上段: 月〜日の曜日ドット。トレーニング実施日は primary グラデで点灯、当日は outline 強調。
- 下段: 3指標（総ボリューム / 総セット / 先週比）を区切り線の下に横3分割。
- 既存デザイン言語に準拠: `bg-card border border-border/50 rounded-2xl p-4 shadow-sm`、uppercase 小見出し、`tabular-nums`、primary色グラデ。

---

## 4. 技術選定（比較・利点・採用理由）

各判断について、検討した選択肢とそれぞれの利点を整理した上で採用理由を示す。

### 4.1 集計をどこで行うか — **SQL集計（DB側）を採用**

| 案 | 内容 | 利点 | 欠点 |
|---|---|---|---|
| **案1: SQL集計（採用）** | Drizzle で Postgres 側に `COUNT(DISTINCT date)` / `SUM(weight*reps)` / `COUNT(*)` を投げる | ・DBへ送るのは集計済みの数件のみで**転送量が最小**<br>・集計はDBの最も得意な処理で**高速・スケーラブル**<br>・既存 `lib/actions/stats.ts` が全てDrizzleのSQL集計で書かれており**規約が完全に一致**<br>・インデックス（`workout_sessions_date_idx` 等）が効く | ・今週/先週の2集計が必要（条件付き集計で1クエリ化も可能）<br>・SQL式がやや複雑 |
| 案2: 生データをJSで集計 | 2週間分の sets を全件取得しクライアント/サーバーのJSで合計 | ・DB系とゲスト系で**集計関数を完全共通化**できる<br>・SQLを書かなくてよい | ・**不要な生データ転送**（セット数が多いほど劣化）<br>・DBが得意な集計をアプリ層で再実装する無駄<br>・既存のSQL集計規約から外れる |

**採用＝案1。** 既存 `stats.ts` の規約一致・転送量・速度の3点で案1が明確に優位。「集計はデータの近くで行う」という原則にも合致する。ゲストはデータがブラウザの localStorage にしか存在しないため、ゲスト側のみ必然的にJS集計（4.2 と独立した判断）。

### 4.2 ゲストデータの集計 — **localStorageキー走査（既存パターン踏襲）**

ゲストは `workout_YYYY-MM-DD_exerciseId` キーで記録を持つ（`local-storage-history.ts` 参照）。選択肢は実質1つだが、**既存の `getBodyPartsByDateRangeFromStorage` と同じキー走査パターン**を踏襲する。

- 利点: 既存実装と読み口が揃い、テスト構造（`src/__tests__/lib/local-storage-*`）もそのまま流用できる。タイムゾーン事故を避けるため**日付は `yyyy-MM-dd` 文字列比較**で範囲判定（既存と同方針）。

### 4.3 週境界の算出 — **date-fns の startOfWeek / endOfWeek を採用**

| 案 | 利点 | 欠点 |
|---|---|---|
| **案1: date-fns（採用）** | ・**既存依存**で追加コストゼロ<br>・`startOfWeek(now,{weekStartsOn:1})` で月曜起点を宣言的に表現<br>・`subWeeks` で先週範囲も簡潔 | 特になし |
| 案2: 自前計算（getDay で曜日補正） | 依存を増やさない | ・月曜起点の補正（日曜=0問題）を手書きするとバグの温床<br>・date-fns が既にあるので車輪の再発明 |
| 案3: Temporal API | 標準志向 | ・ブラウザ/ランタイム対応が未成熟で polyfill 必要<br>・既存コードベースと不整合 |

**採用＝案1。** 既存依存・宣言性・先週計算の簡潔さで優位。`weekStartsOn: 1`（月曜）で「今週=月〜日」を表現。

### 4.4 データ取得・受け渡し方式 — **サーバー初期値 prop + クライアントマージ（既存ホーム流儀）**

| 案 | 利点 | 欠点 |
|---|---|---|
| **案1: サーバーで初期集計→prop、クライアントで分岐（採用）** | ・**初期描画がサーバー値**でハイドレーション不一致を回避<br>・`home-page.tsx`/`big3-progress.tsx` の既存流儀と一致<br>・ログイン時は即表示、ゲスト時のみ effect 後に集計反映 | クライアント/サーバー両系統の実装が要る（=4.1/4.2で既に必要） |
| 案2: 全てクライアントで `useEffect` fetch | サーバー側変更が小さい | ・初期表示が空→チラつき<br>・ログインユーザーでも往復が増える |
| 案3: 全てサーバー計算（ゲストも含む） | 実装が1系統 | ・ゲストのデータはサーバーに無く**実現不可** |

**採用＝案1。** `shouldUseDbOnly(userId)` で「ログイン=DB初期値をそのまま採用 / ゲスト=localStorage集計」を分岐。既存 `big3-progress.tsx` と同じく、ゲスト集計は `requestIdleCallback`/effect で反映しチラつきを抑える。

### 4.5 集計アクションの配置 — **新規ファイル `lib/actions/weekly-summary.ts`**

- 既存 `stats.ts`（17シンボル）は成長グラフ用の集計に責務が集中している。週間サマリーは関心が異なるため**別ファイルに分離**し、各ユニットの責務を小さく保つ（変更時の見通し・テスト容易性が上がる）。
- 純粋ロジック（週範囲・%計算・ドット変換・共通型）は `lib/utils/weekly-summary.ts` に切り出し、**DB系・ゲスト系の両方から再利用**する。

### 4.6 既存 `weekly-streak.tsx` の扱い — **新カードへ統合し削除**

- `weekly-streak.tsx` は仮データの曜日ドット表示で、現在ホームに**未配置**（`home-page.tsx` から呼ばれていない）。
- 本カードがその役割（曜日ドット）を実データで内包するため、**新カードへ統合し `weekly-streak.tsx` と `weekly-streak.test.tsx` は削除**する（重複・デッドコード回避）。新カードに相当のコンポーネントテストを用意する。

---

## 5. アーキテクチャ / データフロー

```
(app)/page.tsx [Server Component]
   ├─ 既存: dbWeights / targets / totalDays
   └─ 追加: userId があれば getWeeklySummary(userId) でDB集計
        → initialSummary を HomePage に渡す
              ↓
HomePage [Client]
   └─ <WeeklySummaryCard initial={initialSummary} exercises={...} />
         ├─ shouldUseDbOnly(userId)=true（ログイン）: initial をそのまま表示
         └─ false（ゲスト）: getWeeklySummaryFromStorage() で集計し setState
```

### 配置
`home-page.tsx` で `Big3Progress` の下・`RecordButton` の上に `WeeklySummaryCard` を挿入（モックの「ホーム配置イメージ」に準拠）。

## 6. データ構造

```ts
// lib/utils/weekly-summary.ts
export interface WeeklySummary {
  weekStart: string;        // yyyy-MM-dd（月曜）
  weekEnd: string;          // yyyy-MM-dd（日曜）
  trainedDays: boolean[];   // 月→日の7要素。true=トレーニング実施日
  gymCount: number;         // = trainedDays の true 数
  totalVolume: number;      // Σ(weight*reps), ウォームアップ除外, kg
  totalSets: number;        // 有効セット数, ウォームアップ除外
  prevWeekVolume: number;   // 先週の総ボリューム（比較用）
}

// 先週比: prevWeekVolume が 0 のとき null（=「NEW」表示）
export function calcVolumeDelta(current: number, prev: number): number | null;
export function getWeekRange(now: Date): { weekStart: Date; weekEnd: Date; prevWeekStart: Date; prevWeekEnd: Date };
```

## 7. 集計の定義（厳密化）

- **総ボリューム** = `Σ(weight × reps)`。`isWarmup = true` のセットは除外。`weight <= 0` または `reps <= 0` は除外。
- **総セット数** = ウォームアップを除く有効セットの件数（`weight>0` かつ `reps>0`）。
- **ジム回数** = 週内で有効な記録が1件以上ある distinct な日付数。
- **trainedDays** = 月〜日の各曜日にトレーニング日があるか。
- **先週比** = `(totalVolume - prevWeekVolume) / prevWeekVolume * 100`。`prevWeekVolume = 0` のとき `null`（UIは「NEW」）。

## 8. エッジケース / エラー処理

- 今週記録ゼロ: 数値0・ドット全消灯・控えめに「今週はまだ記録なし」を表示。
- 先週ゼロ: %を出さず「NEW」バッジ（ゼロ除算回避）。
- 数値表示: `toLocaleString()` で桁区切り（例 `12,500kg`）。
- localStorage 破損データ: 既存同様 try/catch でスキップし `console.warn`。
- ハイドレーション: 初期描画はサーバー値（ログイン）/0（ゲスト）で確定し、ゲスト集計は effect 後に反映。

## 9. テスト方針（`src/__tests__` 構成に準拠）

- `__tests__/lib/utils/weekly-summary.test.ts`: `getWeekRange`（月曜起点・先週範囲）、総ボリューム（ウォームアップ/無効値除外）、総セット、ジム日数distinct、`calcVolumeDelta`（通常・ゼロ除算）。
- `__tests__/lib/weekly-summary-storage.test.ts`: localStorage集計（範囲判定・破損データskip）。
- `__tests__/lib/actions/weekly-summary.test.ts`: DBアクション（`stats.test.ts` を踏襲）。
- `__tests__/components/home/weekly-summary-card.test.tsx`: カード描画（`weekly-streak.test.tsx` を踏襲）。

## 10. 受け入れ条件

1. ログインユーザーのホームに今週のジム回数・総ボリューム・総セット・先週比が正しく表示される。
2. ゲストでも localStorage の記録から同じ指標が表示される。
3. 月〜日のドットが実施日に点灯し、当日が強調される。
4. 先週データが無いとき「NEW」表示になり、エラーや NaN が出ない。
5. ライト/ダーク両テーマ・テーマカラー変更に追従する。
6. `pnpm test:run` / `pnpm lint` / `pnpm build` が通る。

## 11. 段階的実装の見取り図（詳細は writing-plans で）

1. 純粋関数 `lib/utils/weekly-summary.ts` + テスト（TDD）。
2. ゲスト集計 `local-storage` 系 + テスト。
3. DBアクション `lib/actions/weekly-summary.ts` + テスト。
4. UI `weekly-summary-card.tsx` + テスト。
5. `page.tsx` / `home-page.tsx` 配線、`weekly-streak.tsx` 削除。
6. 通し確認（lint / test / build / 手動）。
