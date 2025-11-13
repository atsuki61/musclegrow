"use client";

import { useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

interface SwipeableExerciseCardProps {
  exercise: Exercise;
  sets?: SetRecord[];
  records?: CardioRecord[];
  onClick?: () => void;
  onDelete?: () => void;
  maxWeights?: Record<string, number>;
}

const SWIPE_THRESHOLD = -80; // スワイプで削除ボタンを表示する閾値（px）
const DELETE_THRESHOLD = -150; // スワイプで自動削除する閾値（px）

/**
 * スワイプ可能な種目カードコンポーネント
 * 左にスワイプすると削除ボタンが表示され、さらにスワイプすると削除確認
 */
export function SwipeableExerciseCard({
  exercise,
  sets,
  records,
  onClick,
  onDelete,
  maxWeights,
}: SwipeableExerciseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // スワイプの進行度に応じて削除ボタンの透明度を変化させる
  const deleteButtonOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deleteButtonBg = useTransform(
    x,
    [SWIPE_THRESHOLD, DELETE_THRESHOLD],
    ["hsl(var(--destructive))", "hsl(var(--destructive) / 0.8)"]
  );

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x;

    if (offset < DELETE_THRESHOLD) {
      // 削除閾値を超えた場合は自動削除
      handleDelete();
    } else if (offset < SWIPE_THRESHOLD) {
      // スワイプ閾値を超えた場合は削除ボタンを表示したままにする
      x.set(SWIPE_THRESHOLD);
    } else {
      // 閾値未満の場合は元の位置に戻す
      x.set(0);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    // 確認ダイアログ
    const confirmed = window.confirm(
      `${exercise.name}の記録を削除しますか？\nこの操作は取り消せません。`
    );

    if (confirmed && onDelete) {
      // 削除アニメーション
      await new Promise((resolve) => {
        x.set(-1000); // 画面外に移動
        setTimeout(resolve, 300);
      });
      onDelete();
    } else {
      // キャンセル時は元に戻す
      setIsDeleting(false);
      x.set(0);
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* 背景の削除ボタン */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-lg"
        style={{
          backgroundColor: deleteButtonBg,
          opacity: deleteButtonOpacity,
        }}
      >
        <div className="flex items-center gap-2 text-white">
          <Trash2 className="h-5 w-5" />
          <span className="font-semibold">削除</span>
        </div>
      </motion.div>

      {/* スワイプ可能なカード */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
        whileTap={{ cursor: "grabbing" }}
      >
        <ExerciseCard
          exercise={exercise}
          sets={sets}
          records={records}
          onClick={onClick}
          maxWeights={maxWeights}
        />
      </motion.div>
    </div>
  );
}
