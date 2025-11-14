/**
 * プロフィールグラフ用のカスタムフック
 */

import { useState, useEffect, useRef } from "react";
import { toNumber } from "@/lib/utils/stats";

type DataPointCoordinate = {
  cx: number;
  cy: number;
  value: number;
};

/**
 * データポイントの座標を収集するフック
 */
export function useDataPointCoordinates(
  chartDataLength: number
): [
  DataPointCoordinate[],
  (props: {
    x?: unknown;
    y?: unknown;
    value?: unknown;
    index?: number;
  }) => null
] {
  const [dataPointCoordinates, setDataPointCoordinates] = useState<
    DataPointCoordinate[]
  >([]);
  const coordinatesRef = useRef<Array<DataPointCoordinate | undefined>>([]);
  const updateScheduledRef = useRef(false);

  // データが変更されたら座標をリセット
  useEffect(() => {
    coordinatesRef.current = [];
    setDataPointCoordinates([]);
    updateScheduledRef.current = false;
  }, [chartDataLength]);

  // 座標収集関数
  const collectCoordinate = (props: {
    x?: unknown;
    y?: unknown;
    value?: unknown;
    index?: number;
  }): null => {
    const xPos = toNumber(props.x);
    const yPos = toNumber(props.y);
    const value = toNumber(props.value);

    if (
      xPos !== null &&
      yPos !== null &&
      value !== null &&
      props.index !== undefined &&
      props.index >= 0 &&
      props.index < chartDataLength
    ) {
      // 配列のサイズを確保
      if (coordinatesRef.current.length !== chartDataLength) {
        coordinatesRef.current = new Array(chartDataLength);
      }

      // 座標を保存
      coordinatesRef.current[props.index] = {
        cx: xPos,
        cy: yPos,
        value,
      };

      // すべての座標が揃ったら状態を更新
      const validCoords = coordinatesRef.current.filter(
        (c): c is DataPointCoordinate => c !== undefined && c !== null
      );

      if (
        validCoords.length === chartDataLength &&
        !updateScheduledRef.current
      ) {
        updateScheduledRef.current = true;
        requestAnimationFrame(() => {
          const sortedCoords = coordinatesRef.current
            .slice(0, chartDataLength)
            .filter(
              (c): c is DataPointCoordinate => c !== undefined && c !== null
            );
          setDataPointCoordinates(sortedCoords);
          updateScheduledRef.current = false;
        });
      }
    }
    return null;
  };

  return [dataPointCoordinates, collectCoordinate];
}

