"use client";

import { useState, useRef } from "react";
import {
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
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

// 定数定義
const SWIPE_THRESHOLD = -60; // 削除ボタンを表示する閾値
const DELETE_THRESHOLD = -120; // 自動削除発動の閾値
const MAX_DRAG = -200; // 引っ張れる最大距離

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
  const [isDragging, setIsDragging] = useState(false); // ドラッグ中かどうかのフラグ

  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ゴミ箱アイコンのスタイル制御
  const deleteOpacity = useTransform(x, [-20, -50], [0, 1]);
  const deleteScale = useTransform(
    x,
    [SWIPE_THRESHOLD, DELETE_THRESHOLD],
    [1, 1.3]
  );
  const deleteColor = useTransform(
    x,
    [SWIPE_THRESHOLD, DELETE_THRESHOLD],
    ["#ef4444", "#dc2626"] // red-500 -> red-600
  );

  // ドラッグ開始時
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // ドラッグ終了時
  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // ドラッグ判定の解除（少し遅延させてクリックイベントの発火を防ぐ）
    setTimeout(() => setIsDragging(false), 100);

    if (offset < DELETE_THRESHOLD || velocity < -500) {
      // 削除閾値を超えた、または勢いよくスワイプした場合
      handleDelete();
    } else if (offset < SWIPE_THRESHOLD) {
      // ボタン表示位置で止める
      animate(x, SWIPE_THRESHOLD, {
        type: "spring",
        stiffness: 400,
        damping: 25,
      });
    } else {
      // 元の位置に戻す
      resetPosition();
    }
  };

  // 元の位置に戻すアニメーション
  const resetPosition = () => {
    animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  // 削除フロー開始
  const handleDelete = () => {
    if (isDeleting) return;

    // タクタイルフィードバック（振動）対応デバイス向け
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (shouldSkipDeleteConfirm()) {
      executeDelete();
    } else {
      // 位置を固定しつつダイアログ表示
      animate(x, DELETE_THRESHOLD, {
        type: "spring",
        stiffness: 400,
        damping: 25,
      });
      setShowConfirmDialog(true);
    }
  };

  // 実際の削除実行
  const executeDelete = async () => {
    setIsDeleting(true);
    setShowConfirmDialog(false);

    if (onDelete) {
      // 画面外へスライドアウトさせるアニメーション
      await animate(x, -500, { duration: 0.2 }).then(() => {});
      onDelete();
    }
  };

  // 削除キャンセル
  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setIsDeleting(false);
    resetPosition();
  };

  // クリックハンドラ（ドラッグ中は発火させない）
  const handleClick = () => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* 背景の削除エリア */}
        <div className="absolute inset-0 flex justify-end rounded-xl overflow-hidden">
          <motion.div
            className="h-full bg-red-100 flex items-center justify-center rounded-r-xl"
            style={{
              width: useTransform(x, (val) => Math.max(0, -val)), // スワイプ量に合わせて背景を伸ばす
              opacity: deleteOpacity,
            }}
          >
            <motion.div
              style={{ scale: deleteScale, color: deleteColor }}
              className="pr-6"
            >
              <Trash2 className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>

        {/* 前面のカード */}
        <motion.div
          style={{ x }}
          drag="x"
          dragConstraints={{ left: MAX_DRAG, right: 0 }}
          dragElastic={0.1} // 引っ張りの抵抗感
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="relative z-10 bg-background rounded-xl touch-pan-y" // 縦スクロールを阻害しない
          whileTap={{ cursor: "grabbing" }}
        >
          <ExerciseCard
            exercise={exercise}
            sets={sets}
            records={records}
            onClick={handleClick}
            maxWeights={maxWeights}
            showSwipeHint
          />
        </motion.div>
      </div>

      <DeleteConfirmDialog
        isOpen={showConfirmDialog}
        exerciseName={exercise.name}
        onConfirm={executeDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
