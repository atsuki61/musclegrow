/**
 * プロフィールグラフコンポーネント
 *
 * 体重・体脂肪率・筋肉量・BMIの履歴をRechartsの折れ線グラフで表示します。
 *
 * 主な機能:
 * - 横スクロール対応（スマホで10件分を表示、それ以降はスクロール）
 * - データポイントのクリック/タップで詳細表示
 * - 年の区切りを自動検出して表示
 * - レスポンシブ対応（画面幅に応じて動的にセル幅を調整）
 * - ダークモード対応（CSS変数でテーマカラーを使用）
 *
 * Rechartsライブラリを使用する理由:
 * - React向けの宣言的なAPI
 * - shadcn/uiとの高い親和性（CSS変数対応）
 * - 軽量（96.4 kB）でモバイルでも高速
 * - カスタマイズ性と学習コストのバランスが良い
 */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  LineChart, // Rechartsの折れ線グラフコンポーネント
  Line, // グラフの線とドット
  XAxis, // X軸（日付）
  YAxis, // Y軸（値）
  CartesianGrid, // グリッド線
  Customized, // カスタムコンポーネント（垂直線）
} from "recharts";
import type { ProfileHistoryData, ProfileChartType } from "@/types/stats";
import { format } from "date-fns";
import {
  CHART_LABELS,
  CHART_UNITS,
  CHART_ICONS,
} from "./profile-chart.constants";
import {
  transformChartData,
  calculateXAxisDomain,
  calculateYAxisDomain,
  calculateVisibleXAxisTicks,
} from "./profile-chart.utils";
import { useDataPointCoordinates } from "./profile-chart.hooks";
import {
  VerticalReferenceLineComponent,
  SelectionLabel,
  createChartEventHandlers,
} from "./shared-chart-components";

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
 * ProfileChartコンポーネントのProps
 * @param data - プロフィール履歴データ
 * @param chartType - グラフの種類（weight, bodyFat, muscleMass, bmi）
 * @param dataCount - データ件数（ヘッダーに表示）
 */
interface ProfileChartProps {
  data: ProfileHistoryData[];
  chartType: ProfileChartType;
  dataCount?: number;
}

export function ProfileChart({
  data,
  chartType,
  dataCount,
}: ProfileChartProps) {
  // ==================== State管理 ====================
  /**
   * 選択されているデータポイントのインデックス
   * nullの場合は最新データを表示
   */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /** グラフ全体のコンテナ参照（幅の取得に使用） */
  const containerRef = useRef<HTMLDivElement>(null);

  /** スクロール可能なコンテナ参照（スクロール位置の制御に使用） */
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /**
   * グラフのアニメーションを有効化するフラグ
   * 初回レンダリング時は100ms待ってからアニメーションを開始
   */
  const [enableAnimation, setEnableAnimation] = useState(false);

  /**
   * コンテナの幅（レスポンシブ対応）
   * この値を元にセル幅を動的に計算し、スマホで10件表示できるようにする
   */
  const [containerWidth, setContainerWidth] = useState(0);

  /**
   * 現在のスクロール位置
   * この値を元にX軸の表示する日付を動的に計算
   */
  const [scrollLeft, setScrollLeft] = useState(0);

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

  /**
   * コンテナの幅を取得してレスポンシブ対応
   * - 初回マウント時に幅を取得
   * - ウィンドウリサイズ時に再計算
   * - この幅を元にセル幅を計算し、スマホで10件表示できるようにする
   */
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  /**
   * 初期スクロール位置を右端（最新データ）に設定
   * データが変更されるたびに最新データが見えるようにスクロール
   */
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  }, [data]);

  /**
   * スクロールイベントハンドラ
   * スクロール位置に応じてX軸の表示する日付を動的に更新
   */
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  // ==================== データ変換 ====================
  /**
   * APIから取得した生データをRecharts用の形式に変換
   * - date: "M/d" 形式（X軸に表示）
   * - fullDate: ISO形式（詳細表示用）
   * - value: 数値（Y軸の値）
   */
  const chartData = transformChartData(data, chartType);

  /**
   * 各データポイントの座標を収集するカスタムフック
   * クリック/タップ時に最も近いデータポイントを特定するために使用
   */
  const [dataPointCoordinates, collectCoordinate] = useDataPointCoordinates(
    chartData.length
  );

  // ==================== グラフの幅計算（レスポンシブ対応） ====================
  /**
   * スマホで10件分のデータを表示できるようにセル幅を動的に計算
   *
   * 計算式:
   * CELL_WIDTH = (コンテナ幅 - パディング) / 10件
   *
   * 例: コンテナ幅360px の場合
   * CELL_WIDTH = (360 - 40) / 10 = 32px
   *
   * グラフ全体の幅 = データ数 * CELL_WIDTH
   * 10件以上のデータがある場合は横スクロールが発生
   */
  const MIN_VISIBLE_POINTS = 10; // スマホで表示するデータ数
  const PADDING = 40; // グラフの左右のマージン合計
  const CELL_WIDTH =
    containerWidth > 0
      ? Math.max(38, (containerWidth - PADDING) / MIN_VISIBLE_POINTS)
      : 60; // コンテナ幅に基づいて計算、最小38px
  const chartWidth = chartData.length * CELL_WIDTH;

  const Icon = CHART_ICONS[chartType];

  // ==================== データが空の場合の表示 ====================
  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card shadow-sm border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {CHART_LABELS[chartType]}
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[280px]"
          style={{ color: textMutedColor }}
        >
          <p className="text-sm">データがありません</p>
          <p className="text-xs mt-1">プロフィール更新時に自動記録されます</p>
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
   * X軸の表示範囲（データが1点の場合のみ使用）
   * データが1点しかない場合は前後2日分のタイムラインを表示
   */
  const xAxisDomain = calculateXAxisDomain(chartData);

  /**
   * Y軸の表示範囲
   * 最小値 - 5 ～ 最大値 + 5 の範囲で表示
   */
  const yAxisDomain = calculateYAxisDomain(chartData);

  /**
   * X軸に表示する日付のインデックスと年の区切り位置を計算
   * スクロール位置に応じて動的に変化する
   * - 表示範囲の最初と最後の日付
   * - 年が変わるポイント（2025 などの年を表示）
   */
  const { indices: visibleXAxisIndices, yearChangeIndices } =
    calculateVisibleXAxisTicks(
      chartData,
      scrollLeft,
      containerWidth,
      chartWidth,
      CELL_WIDTH
    );

  /** インデックスから実際の日付値（"M/d"形式）に変換 */
  const visibleXAxisTicks = visibleXAxisIndices.map((i) => chartData[i].date);

  // ==================== カスタムTickコンポーネント ====================
  /**
   * X軸のカスタムtickコンポーネント
   *
   * 年の区切りと通常の日付で表示を切り替える:
   * - 年の区切り: "2025" のように年を太字で表示
   * - 通常の日付: "1/15" のような日付を表示
   *
   * Rechartsのデフォルトtickではこの切り替えができないため、
   * カスタムコンポーネントを使用している
   */
  const CustomTick = (props: {
    x?: number;
    y?: number;
    payload?: { value: string };
  }) => {
    const { x, y, payload } = props;

    if (!payload || x === undefined || y === undefined) return null;

    const index = chartData.findIndex((d) => d.date === payload.value);

    // 年の区切りの場合は年を太字で表示
    if (index !== -1 && yearChangeIndices.has(index)) {
      const year = new Date(chartData[index].fullDate).getFullYear();
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={16}
            textAnchor="middle"
            fill={textMutedColor}
            fontSize={10}
            fontWeight="bold"
          >
            {year}
          </text>
        </g>
      );
    }

    // 通常の日付表示（"M/d" 形式）
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={textMutedColor}
          fontSize={10}
        >
          {payload.value}
        </text>
      </g>
    );
  };

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
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {CHART_LABELS[chartType]}
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

      {/* ==================== グラフコンテナ（横スクロール対応） ==================== */}
      <div ref={containerRef} className="relative w-full">
        {/* 横スクロール可能なコンテナ */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          onScroll={handleScroll}
          style={{
            minHeight: "280px",
            width: "100%",
            maxWidth: "100%",
            WebkitOverflowScrolling: "touch", // iOSでスムーズなスクロール
          }}
        >
          {/* ==================== Recharts LineChart ==================== */}
          {/**
           * Rechartsのメインコンポーネント
           * - width: データ数に応じて動的に計算（横スクロールを実現）
           * - height: 固定280px
           * - data: グラフデータ配列
           * - margin: グラフの余白
           * - chartEventHandlers: クリック/タップイベント
           */}
          <LineChart
            width={chartWidth}
            height={280}
            data={chartData}
            margin={{ top: 8, right: 20, left: 20, bottom: 10 }}
            {...chartEventHandlers}
          >
            {/* SVGフィルター定義: 選択時のドロップシャドウ */}
            <defs>
              <filter
                id="shadowProfile"
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
             * - tick: データが1点の場合はデフォルト、それ以外はCustomTick
             * - ticks: 表示する日付を動的に制御（スクロール位置に応じて変化）
             * - tickLine: 目盛り線を非表示
             */}
            <XAxis
              dataKey="date"
              stroke={gridColor}
              tick={xAxisDomain ? { fill: textMutedColor, fontSize: 10 } : CustomTick}
              tickLine={false}
              axisLine={{ stroke: gridColor, strokeWidth: 1 }}
              domain={xAxisDomain}
              ticks={xAxisDomain || visibleXAxisTicks}
            />

            {/* ==================== Y軸（値） ==================== */}
            {/**
             * YAxis: 縦軸（体重・体脂肪率などの値を表示）
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
             * 3. スムーズなトランジション
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
                      transition: "r 0.3s ease, fill 0.3s ease",
                    }}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? "url(#shadowProfile)" : undefined}
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
        </div>

        {/* ==================== 選択データのラベル ==================== */}
        {/**
         * SelectionLabel: 選択されたデータポイントの詳細を表示
         * - グラフの上部に浮かぶラベル
         * - 日付と値を表示
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
              unit={CHART_UNITS[chartType]}
              containerWidth={containerRef.current?.offsetWidth || 0}
              color={primaryColor}
            />
          )}
      </div>

      {/* ==================== 最新値の表示 ==================== */}
      {/**
       * グラフの下部に最新の値と日付を表示
       * ユーザーが一目で最新の状態を確認できる
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
            {latestData.value.toFixed(1)}
            {CHART_UNITS[chartType]}
          </span>
          <span className="text-xs" style={{ color: textMutedColor }}>
            {format(new Date(latestData.fullDate), "M月d日")}
          </span>
        </div>
      </div>
    </div>
  );
}
