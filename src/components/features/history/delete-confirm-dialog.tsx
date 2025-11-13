"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  exerciseName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const STORAGE_KEY = "musclegrow_skip_delete_confirm";

/**
 * 削除確認ダイアログ
 * 初回のみ表示し、「次回以降表示しない」をチェックすると次回から表示しない
 */
export function DeleteConfirmDialog({
  isOpen,
  exerciseName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [skipNextTime, setSkipNextTime] = useState(false);

  const handleConfirm = () => {
    // 「次回以降表示しない」がチェックされている場合、localStorageに保存
    if (skipNextTime) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>記録を削除しますか？</DialogTitle>
          <DialogDescription className="pt-2">
            <span className="font-semibold text-foreground">
              {exerciseName}
            </span>
            の記録を削除します。
            <br />
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        {/* 次回以降表示しないチェックボックス */}
        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="skip-confirm"
            checked={skipNextTime}
            onCheckedChange={(checked) => setSkipNextTime(checked === true)}
          />
          <Label
            htmlFor="skip-confirm"
            className="text-sm cursor-pointer select-none"
          >
            次回以降は確認せずに削除
          </Label>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            className="flex-1"
          >
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 削除確認をスキップするかどうかをチェック
 */
export function shouldSkipDeleteConfirm(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * 削除確認スキップ設定をリセット
 */
export function resetDeleteConfirmPreference(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
