"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { setUserPassword } from "@/lib/actions/settings";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPassword?: boolean;
}

// --- メールアドレス変更ダイアログ ---
export function ChangeEmailDialog({ open, onOpenChange }: DialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.changeEmail({
        newEmail,
        callbackURL: "/profile",
      });

      if (error) {
        setError(error.message || "メールアドレスの変更に失敗しました");
      } else {
        toast.success(
          "確認メールを送信しました。メール内のリンクから変更を完了してください。"
        );
        onOpenChange(false);
        setNewEmail("");
      }
    } catch {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>メールアドレスの変更</DialogTitle>
          <DialogDescription>
            新しいメールアドレスを入力してください。確認メールが送信されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-email">新しいメールアドレス</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="new@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !newEmail}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              変更メールを送信
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- パスワード変更/設定ダイアログ ---
export function ChangePasswordDialog({
  open,
  onOpenChange,
  hasPassword = true,
}: DialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モード判定
  const isSetupMode = !hasPassword;
  const title = isSetupMode ? "パスワードの設定" : "パスワードの変更";
  const description = isSetupMode
    ? "ログイン用のパスワードを新しく設定します。"
    : "現在のパスワードと新しいパスワードを入力してください。";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("新しいパスワードは6文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("確認用パスワードが一致しません");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSetupMode) {
        // パスワード設定モード (Server Action)
        const result = await setUserPassword(newPassword);

        if (!result.success) {
          setError(result.error || "処理に失敗しました");
        } else {
          toast.success("パスワードを設定しました");
          onOpenChange(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          window.location.reload();
        }
      } else {
        // パスワード変更モード (Client API)
        const { error: changeError } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });

        if (changeError) {
          setError(changeError.message || "パスワードの変更に失敗しました");
        } else {
          toast.success("パスワードを変更しました");
          onOpenChange(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    } catch {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 変更モードの場合のみ現在のパスワードを表示 */}
          {!isSetupMode && (
            <div className="space-y-2">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">
              {isSetupMode ? "パスワード" : "新しいパスワード"}
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="6文字以上"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">確認用パスワード</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="もう一度入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                (!isSetupMode && !currentPassword) || // 変更モードなら現在PW必須
                !newPassword ||
                !confirmPassword
              }
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSetupMode ? "設定する" : "変更する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
