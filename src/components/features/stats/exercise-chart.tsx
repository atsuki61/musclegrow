/**
 * 種目別グラフコンポーネント
 *
 * 特定の種目の最大重量の推移をRechartsの折れ線グラフで表示します。
 *
 * 主な機能:
 * - レスポンシブ対応（ResponsiveContainerを使用）
 * - データポイントのクリック/タップで詳細表示
 * - 最大重量が更新された日のみを表示
 * - ダークモード対応（CSS変数でテーマカラーを使用）
 *
 * profile-chart.tsxとの違い:
 * - 横スクロール機能なし（ResponsiveContainerで自動調整）
 * - X軸の日付は全て表示（年の区切り機能なし）
 * - より シンプルな実装
 */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  LineChart, // Rechartsの折れ線グラフコンポーネント
  Line, // グラフの線とドット
  XAxis, // X軸（日付）
  YAxis, // Y軸（重量）
  CartesianGrid, // グリッド線
  ResponsiveContainer, // レスポンシブ対応のコンテナ
  Customized, // カスタムコンポーネント（垂直線）
} from "recharts";
import type { ExerciseProgressData } from "@/types/stats";
import { format } from "date-fns";
import type { Exercise } from "@/types/workout";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
  createChartEventHandlers,
} from "./shared-chart-components";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import { calculateYAxisDomain } from "./profile-chart.utils";
import { TrendingUp } from "lucide-react";
import { WEIGHT_UNIT } from "@/constants/units";

/**
 * Rechartsの<Customized>コンポーネントに渡されるProps
 * グラフのサイズとマージン情報を含む
 */
interface CustomizedProps {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * ExerciseChartコンポーネントのProps
 * @param data - 種目の進捗データ（最大重量の履歴）
 * @param exercise - 表示する種目の情報
 * @param dataCount - データ件数（ヘッダーに表示）
 */
interface ExerciseChartProps {
  data: ExerciseProgressData[];
  exercise: Exercise | null;
  dataCount?: number;
}

export function ExerciseChart({
  data,
  exercise,
  dataCount,
}: ExerciseChartProps) {
  // ==================== State管理 ====================
  /**
   * 選択されているデータポイントのインデックス
   * nullの場合は最新データを表示
   */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /** グラフ全体のコンテナ参照（幅の取得に使用） */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * グラフのアニメーションを有効化するフラグ
   * 初回レンダリング時は100ms待ってからアニメーションを開始
   */
  const [enableAnimation, setEnableAnimation] = useState(false);

  // ==================== テーマカラー（CSS変数） ====================
  /**
   * shadcn/uiのCSS変数を使用してテーマカラーを取得
   * ダークモード切り替え時に自動的に色が変わる
   */
  const primaryColor = "var(--primary)"; // メインカラー（線・ドット）
  const gridColor = "var(--border)"; // グリッド線・軸線
  const textMutedColor = "var(--muted-foreground)"; // 補助テキスト
  const textColor = "var(--foreground)"; // メインテキスト
  const referenceLineColor = "var(--muted-foreground)"; // 選択時の縦線
  const bgColor = "var(--card)"; // ドットの背景色

  // ==================== 初期化処理 ====================
  /**
   * グラフのアニメーションを遅延起動
   * 初回レンダリング時にアニメーションが走ると描画がカクつくため、
   * 100ms待ってから有効化する
   */
  useEffect(() => {
    const timer = setTimeout(() => setEnableAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== データ変換 ====================
  /**
   * APIから取得した生データをRecharts用の形式に変換
   * - date: "M/d" 形式（X軸に表示）
   * - fullDate: ISO形式（詳細表示用）
   * - value: 最大重量（Y軸の値）
   */
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "M/d"),
    fullDate: item.date,
    value: item.maxWeight,
  }));

  /**
   * 各データポイントの座標を収集するカスタムフック
   * クリック/タップ時に最も近いデータポイントを特定するために使用
   */
  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  // ==================== データが空の場合の表示 ====================
  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {exercise?.name || "種目別"} の推移
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: textMutedColor }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">最大重量が更新された日のみ表示されます</p>
        </div>
      </div>
    );
  }

  // ==================== データの準備 ====================
  /**
   * 最新データ（配列の最後の要素）
   * 選択がない場合はこれを表示する
   */
  const latestData = chartData[chartData.length - 1];

  /**
   * 現在選択されているデータ
   * 選択がない場合は最新データを使用
   */
  const selectedData =
    selectedIndex !== null && selectedIndex < chartData.length
      ? chartData[selectedIndex]
      : latestData;

  /**
   * Y軸の表示範囲
   * 最小値 - 5 ～ 最大値 + 5 の範囲で表示
   */
  const yAxisDomain = calculateYAxisDomain(chartData);

  /**
   * グラフのクリック/タップイベントハンドラ
   * クリック位置から最も近いデータポイントを特定して選択状態にする
   */
  const chartEventHandlers = createChartEventHandlers(
    dataPointCoordinates,
    setSelectedIndex
  );

  return (
    <div
      className="rounded-2xl bg-card shadow-sm border border-border p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {exercise?.name || "種目別"} の推移
          </h3>
        </div>
        {dataCount !== undefined && (
          <span
            className="text-xs font-medium"
            style={{ color: textMutedColor }}
          >
            {dataCount}件
          </span>
        )}
      </div>

      {/* ==================== グラフコンテナ（レスポンシブ） ==================== */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: "280px" }}
      >
        {/**
         * ResponsiveContainer: コンテナの幅に応じて自動的にサイズ調整
         * profile-chart.tsxとの違い:
         * - 横スクロールなし
         * - コンテナ幅に合わせて自動的にグラフ幅が調整される
         */}
        <ResponsiveContainer width="100%" height={280}>
          {/* ==================== Recharts LineChart ==================== */}
          {/**
           * Rechartsのメインコンポーネント
           * - data: グラフデータ配列
           * - margin: グラフの余白
           * - chartEventHandlers: クリック/タップイベント
           */}
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 20, left: 0, bottom: 10 }}
            {...chartEventHandlers}
          >
            {/* SVGフィルター定義: 選択時のドロップシャドウ */}
            <defs>
              <filter
                id="shadowPrimary"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={primaryColor}
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            {/* ==================== グリッド線 ==================== */}
            {/**
             * CartesianGrid: 背景のグリッド線を表示
             * - strokeDasharray: 点線のパターン（3px実線, 3px空白）
             * - vertical: 縦線も表示
             */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              opacity={0.4}
              vertical={true}
            />

            {/* ==================== X軸（日付） ==================== */}
            {/**
             * XAxis: 横軸（日付を表示）
             * - dataKey: データの"date"フィールドを使用
             * - tickLine: 目盛り線を非表示
             *
             * profile-chart.tsxとの違い:
             * - カスタムTickなし（全ての日付をそのまま表示）
             * - 年の区切り機能なし
             */}
            <XAxis
              dataKey="date"
              stroke={gridColor}
              tick={{ fill: textMutedColor, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            />

            {/* ==================== Y軸（重量） ==================== */}
            {/**
             * YAxis: 縦軸（重量を表示）
             * - domain: 表示範囲（最小値-5 ～ 最大値+5）
             * - tickCount: 目盛りの数（3つ）
             * - axisLine: 軸線を非表示
             */}
            <YAxis
              stroke={gridColor}
              tick={{ fill: textMutedColor, fontSize: 11, opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              domain={yAxisDomain}
              tickCount={3}
              width={35}
            />

            {/* ==================== 折れ線グラフ（データが2点以上の場合） ==================== */}
            {/**
             * Line: 折れ線グラフの線
             * - type="monotone": 滑らかな曲線
             * - dataKey="value": データの"value"フィールドを使用
             * - dot={false}: ドットは別のLineで描画するため非表示
             * - isAnimationActive: 初回レンダリング後にアニメーション開始
             *
             * データが1点の場合は線を表示しない（ドットのみ）
             */}
            {chartData.length > 1 && (
              <Line
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={3}
                dot={false}
                activeDot={false}
                isAnimationActive={enableAnimation}
                animationDuration={500}
              />
            )}

            {/* ==================== カスタムドット（データポイント） ==================== */}
            {/**
             * Line: ドットのみを描画する透明な線
             * - stroke="transparent": 線は非表示
             * - dot: カスタムドットコンポーネント
             * - label: 座標を収集するためのコンポーネント
             *
             * カスタムドットの機能:
             * 1. クリック/タップでデータポイントを選択
             * 2. 選択状態に応じて見た目を変化（サイズ・色・影）
             * 3. スムーズなトランジション（CSSで制御）
             */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
              isAnimationActive={enableAnimation}
              animationDuration={500}
              dot={(props) => {
                const isSelected = selectedIndex === props.index;
                const { cx, cy, index } = props;

                if (cx === undefined || cy === undefined) return <></>;

                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : 5} // 選択時は大きく
                    style={{
                      fill: isSelected ? primaryColor : bgColor,
                      stroke: primaryColor,
                      // CSSトランジションでスムーズにアニメーション
                      transition: "r 0.3s ease, fill 0.3s ease",
                    }}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? "url(#shadowPrimary)" : undefined}
                    className="cursor-pointer outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index !== undefined) {
                        setSelectedIndex(index);
                      }
                    }}
                  />
                );
              }}
              activeDot={false}
              label={(props) => {
                // 各データポイントの座標を収集
                collectCoordinate(props);
                return null;
              }}
            />

            {/* ==================== 選択時の縦線 ==================== */}
            {/**
             * Customized: カスタムコンポーネントを描画
             * データポイントが選択されている場合に縦線を表示
             */}
            {selectedIndex !== null &&
              selectedIndex < dataPointCoordinates.length &&
              dataPointCoordinates[selectedIndex] && (
                <Customized
                  component={(props: CustomizedProps) => (
                    <VerticalReferenceLineComponent
                      width={props.width}
                      height={props.height}
                      margin={props.margin}
                      selectedIndex={selectedIndex}
                      dataPointCoordinates={dataPointCoordinates}
                      referenceLineColor={referenceLineColor}
                    />
                  )}
                />
              )}
          </LineChart>
        </ResponsiveContainer>

        {/* ==================== 選択データのラベル ==================== */}
        {/**
         * SelectionLabel: 選択されたデータポイントの詳細を表示
         * - グラフの上部に浮かぶラベル
         * - 日付と重量を表示
         * - 画面端に行かないように自動調整
         */}
        {selectedIndex !== null &&
          selectedIndex < dataPointCoordinates.length &&
          dataPointCoordinates[selectedIndex] &&
          selectedData && (
            <SelectionLabel
              x={dataPointCoordinates[selectedIndex].cx}
              date={selectedData.fullDate}
              value={selectedData.value}
              unit={WEIGHT_UNIT}
              containerWidth={containerRef.current?.offsetWidth || 0}
              color={primaryColor}
            />
          )}
      </div>

      {/* ==================== 最新値の表示 ==================== */}
      {/**
       * グラフの下部に最新の重量と日付を表示
       * ユーザーが一目で最新の記録を確認できる
       */}
      <div
        className="mt-4 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: gridColor }}
      >
        <span className="text-xs" style={{ color: textMutedColor }}>
          最新
        </span>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {latestData.value.toFixed(1)}{WEIGHT_UNIT}
          </span>
          <span className="text-xs" style={{ color: textMutedColor }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
