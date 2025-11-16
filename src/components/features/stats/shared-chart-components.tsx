/**
 * グラフ共通コンポーネント
 * ProfileChart、Big3Chart、ExerciseChartで共通使用
 */

import { format } from "date-fns";
import { findClosestDataPointIndex } from "./profile-chart.utils";

/**
 * グラフのマウス移動/クリックイベントハンドラを作成
 * 最も近いデータポイントを選択する共通ロジック
 */
export function createChartEventHandlers(
  dataPointCoordinates: Array<{ cx: number }>,
  setSelectedIndex: (index: number | null) => void
) {
  const handleInteraction = (x: number | undefined) => {
    if (x === undefined || dataPointCoordinates.length === 0) {
      return;
    }

    const closestIndex = findClosestDataPointIndex(x, dataPointCoordinates);
    setSelectedIndex(closestIndex);
  };

  return {
    onMouseMove: (data: { activeCoordinate?: { x: number } }) => {
      handleInteraction(data?.activeCoordinate?.x);
    },
    onMouseLeave: () => {
      setSelectedIndex(null);
    },
    onClick: (data: { activeCoordinate?: { x: number } }) => {
      handleInteraction(data?.activeCoordinate?.x);
    },
  };
}

/**
 * 垂直線コンポーネント（Customized用）
 * RechartsのCustomizedコンポーネントから呼び出される
 */
export function VerticalReferenceLineComponent(props: {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  selectedIndex?: number | null;
  dataPointCoordinates?: Array<{ cx: number; cy: number; value: number }>;
  referenceLineColor?: string;
}) {
  // propsの検証
  if (!props.width || !props.height || !props.margin) {
    return null;
  }

  // 選択状態の検証
  if (
    props.selectedIndex === null ||
    props.selectedIndex === undefined ||
    !props.dataPointCoordinates ||
    props.selectedIndex >= props.dataPointCoordinates.length
  ) {
    return null;
  }

  const selectedPoint = props.dataPointCoordinates[props.selectedIndex];
  if (!selectedPoint || selectedPoint.cx === undefined) {
    return null;
  }

  // グラフの上端からX軸まで垂直線を描画
  const startY = props.margin.top;
  const endY = props.height - props.margin.bottom;
  const strokeColor = props.referenceLineColor || "#D3DCE5";

  return (
    <line
      x1={selectedPoint.cx}
      y1={startY}
      x2={selectedPoint.cx}
      y2={endY}
      stroke={strokeColor}
      strokeWidth={1}
      strokeDasharray="5 5"
      opacity={0.6}
      style={{ pointerEvents: "none" }}
    />
  );
}

/**
 * 選択ラベルコンポーネント（InBody風 - 控えめで上品なデザイン）
 */
export function SelectionLabel({
  x,
  date,
  value,
  unit,
  containerWidth,
  color = "#FF6B35", // デフォルトはオレンジ
}: {
  x: number;
  date: string;
  value: number;
  unit: string;
  containerWidth: number;
  color?: string;
}) {
  // ラベルの幅を推定（日付 + 値 + パディング + ギャップ）
  // text-[10px] + text-[10px] + px-2 (8px*2) + gap-1 (4px) = 約80-90px
  const labelWidth = 90;
  const padding = 24; // カードの左右パディング（p-6 = 24px）

  // ラベルの位置をclamp（カード内に制限）
  const minX = padding + labelWidth / 2;
  const maxX =
    containerWidth > 0 ? containerWidth - padding - labelWidth / 2 : x; // containerWidthが0の場合は元の位置を使用

  const clampedX = Math.min(Math.max(x, minX), maxX);

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: "8px", // グラフの上端に配置
        left: `${clampedX}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* InBody風：小さく控えめで上品なラベル */}
      <div className="flex items-center gap-1 whitespace-nowrap bg-orange-50 px-2 py-[2px] rounded-md shadow-xs border border-gray-100/50">
        <span className="text-[10px] font-medium text-gray-500">
          {format(new Date(date), "yy.MM.dd")}
        </span>
        <span
          className="text-[10px] font-semibold"
          style={{ color }}
        >
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

