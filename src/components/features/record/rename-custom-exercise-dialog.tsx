"use client";

/**
 * カスタム種目の名前変更 Dialog（見た目のみ）
 * state と保存処理は useRecordExercises が持ち、props で受け取る controlled コンポーネント
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Exercise } from "@/types/workout";

interface RenameCustomExerciseDialogProps {
  error: string | null;
  exercise: Exercise | null;
  name: string;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function RenameCustomExerciseDialog({
  error,
  exercise,
  name,
  onClose,
  onNameChange,
  onSubmit,
}: RenameCustomExerciseDialogProps) {
  return (
    <Dialog
      open={exercise !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="border-[var(--mg-border)] bg-[var(--mg-bg)] text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>種目名を変更</DialogTitle>
          <DialogDescription>
            カスタム作成した種目だけ名前を変更できます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            aria-label="新しい種目名"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
            className="h-11 rounded-xl border-[var(--mg-border)] bg-[var(--mg-surface)] text-sm font-bold"
          />
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" onClick={onSubmit}>
            変更する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
