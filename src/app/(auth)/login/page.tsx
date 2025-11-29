"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

/**
 * エネルギッシュな背景コンポーネント
 */
const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50 dark:bg-background">
    <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-200/30 dark:bg-orange-900/10 blur-3xl" />
    <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-red-200/30 dark:bg-red-900/10 blur-3xl" />
    <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[60%] rounded-full bg-yellow-200/30 dark:bg-yellow-900/10 blur-3xl" />
  </div>
);

/**
 * アイコン付きカスタム入力フィールド
 */
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  isPassword?: boolean;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, icon: Icon, error, isPassword, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : props.type || "text";

    return (
      <div className="w-full mb-3 space-y-1">
        <Label className="text-xs font-bold text-muted-foreground ml-1">
          {label}
        </Label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              "pl-10 h-11 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
              isPassword && "pr-10",
              error && "border-red-500 focus-visible:border-red-500",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="ml-1 text-[10px] text-red-500 font-medium animate-in slide-in-from-top-1 fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);
CustomInput.displayName = "CustomInput";

/**
 * Googleアイコン SVG
 */
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path
        fill="#4285F4"
        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
      />
      <path
        fill="#34A853"
        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
      />
      <path
        fill="#FBBC05"
        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
      />
      <path
        fill="#EA4335"
        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.439 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
      />
    </g>
  </svg>
);

// --- Main Page ---

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "signup">("login");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // バリデーション
  const validate = () => {
    if (view === "signup") {
      if (password.length < 6) return "パスワードは6文字以上で入力してください";
      if (password !== confirmPassword) return "パスワードが一致しません";
    }
    return null;
  };

  // Google認証
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError("Google認証に失敗しました");
      console.error(err);
      setIsGoogleLoading(false);
    }
  };

  // メール認証
  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (view === "login") {
        // ログイン処理
        const result = await signIn.email({ email, password });
        if (result.error) {
          const msg = result.error.message;
          if (msg && msg.includes("Invalid"))
            setError("メールアドレスまたはパスワードが違います");
          else setError("ログインに失敗しました");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        // 新規登録処理
        const result = await signUp.email({ email, password, name });
        if (result.error) {
          setError(result.error.message || "登録に失敗しました");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // モード切り替え時にエラーをクリア
  const switchView = (newView: "login" | "signup") => {
    setView(newView);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4 relative">
      <Background />

      {/* ヘッダーエリア */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 text-center z-10">
        <div className="flex justify-center mb-4">
          {/* ロゴアイコン: 傾きとシャドウで立体感を出す */}
          <div className="h-14 w-14 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-xl shadow-primary/30 transform -rotate-6 ring-4 ring-background">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          MuscleGrow
        </h2>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {view === "login"
            ? "さあ、今日のワークアウトを始めましょう。"
            : "理想の体への第一歩を踏み出しましょう。"}
        </p>
      </div>

      {/* カード本体 */}
      <div className="w-full max-w-[400px] min-h-[580px] flex flex-col z-10">
        <div className="bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-3xl overflow-hidden transition-all duration-300 flex flex-col h-full">
          {/* フォーム部分 (Framer Motionで切り替え) */}
          <div className="p-6 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, x: view === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === "login" ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <form onSubmit={handleEmailAuth} className="space-y-1">
                  {view === "signup" && (
                    <CustomInput
                      label="ユーザーネーム"
                      placeholder="トレーニー名"
                      icon={User}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  )}

                  <CustomInput
                    label="メールアドレス"
                    type="email"
                    placeholder="fitness@example.com"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <div className="relative">
                    <CustomInput
                      label="パスワード"
                      placeholder="••••••••"
                      icon={Lock}
                      isPassword
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {/* ログイン時のみパスワード忘れリンク */}
                    {view === "login" && (
                      <div className="absolute top-0 right-0">
                        <button
                          type="button"
                          className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                          onClick={() => alert("未実装です")}
                        >
                          お忘れですか？
                        </button>
                      </div>
                    )}
                  </div>

                  {view === "signup" && (
                    <CustomInput
                      label="パスワード（確認）"
                      placeholder="確認用"
                      icon={Lock}
                      isPassword
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  )}

                  {/* エラーメッセージ */}
                  {error && (
                    <div className="p-3 mb-3 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg animate-in fade-in">
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || isGoogleLoading}
                      className="w-full h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      {view === "login"
                        ? "ワークアウトを再開 (ログイン)"
                        : "メンバー登録して開始"}
                    </Button>
                  </div>
                </form>

                {/* 区切り線 */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-medium uppercase tracking-wider">
                    <span className="bg-background/0 backdrop-blur-xl px-2 text-muted-foreground">
                      または
                    </span>
                  </div>
                </div>

                {/* Googleボタン */}
                <div>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full h-11 font-bold bg-card hover:bg-muted/50 border-border/60 transition-all"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <GoogleIcon className="w-4 h-4 mr-2" />
                    )}
                    Googleで{view === "login" ? "ログイン" : "登録"}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* フッターリンク (固定) */}
          <div className="p-6 pt-2 border-t border-border/30 bg-muted/30 text-center mt-auto">
            <p className="text-xs text-muted-foreground">
              {view === "login" ? "初めてですか？" : "すでにメンバーですか？"}{" "}
              <button
                onClick={() =>
                  switchView(view === "login" ? "signup" : "login")
                }
                className="font-bold text-primary hover:underline ml-1 transition-colors"
              >
                {view === "login" ? "新規登録 (無料)" : "ログイン"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* コピーライト */}
      <p className="text-[10px] text-muted-foreground/40 text-center mt-8 z-10">
        &copy; 2024 MuscleGrow Inc. All rights reserved.
      </p>
    </div>
  );
}
