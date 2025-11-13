"use client";

import { useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import {
  DeleteConfirmDialog,
  shouldSkipDeleteConfirm,
} from "./delete-confirm-dialog";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";

interface SwipeableExerciseCardProps {
  exercise: Exercise;
  sets?: SetRecord[];
  records?: CardioRecord[];
  onClick?: () => void;
  onDelete?: () => void;
  maxWeights?: Record<string, number>;
}

// スワイプ閾値を緩和（より軽いスワイプで反応）
const SWIPE_THRESHOLD = -50; // 削除ボタンを表示する閾値（-80 → -50）
const DELETE_THRESHOLD = -100; // 自動削除する閾値（-150 → -100）

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // スワイプの進行度に応じて削除ボタンの透明度を変化させる
  // わずか10pxのスワイプで完全に表示されるように設定
  const deleteButtonOpacity = useTransform(x, [0, -10], [0, 1]);

  // スワイプ量に応じて背景の赤枠の幅を拡張（最小80px、最大200px）
  // スワイプが進むと背景が左に伸びていく
  const deleteButtonWidth = useTransform(x, [0, -200], [80, 200]);

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

    // 確認をスキップする設定になっている場合は、即座に削除
    if (shouldSkipDeleteConfirm()) {
      executeDelete();
    } else {
      // 確認ダイアログを表示
      setShowConfirmDialog(true);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    setShowConfirmDialog(false);

    if (onDelete) {
      // 削除アニメーション
      await new Promise((resolve) => {
        x.set(-1000); // 画面外に移動
        setTimeout(resolve, 300);
      });
      onDelete();
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setIsDeleting(false);
    x.set(0); // 元の位置に戻す
  };

  return (
    <>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* 背景の削除ボタン - スワイプ量に応じて幅が伸びる */}
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-lg"
          style={{
            opacity: deleteButtonOpacity,
            width: deleteButtonWidth,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 0.8,
              ease: "easeInOut",
            }}
          >
            <Trash2 className="h-7 w-7 text-white shrink-0" />
          </motion.div>
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
            showSwipeHint={true}
          />
        </motion.div>
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        isOpen={showConfirmDialog}
        exerciseName={exercise.name}
        onConfirm={executeDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
