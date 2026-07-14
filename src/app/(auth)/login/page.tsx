"use client"; // クライアントコンポーネント（useState / イベントハンドラを使うため）

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client"; // Better Auth のクライアント側ログイン API
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  type LucideIcon,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils"; // className を条件付きで結合するユーティリティ
import { motion } from "framer-motion";

// --- サブコンポーネント ---

/**
 * 画面全体の背景ぼかし（装飾専用）
 * -z-10 でフォームより後ろに置き、操作を邪魔しない
 */
const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50 dark:bg-background">
    {/* オレンジ・赤・黄のぼかし円でグラデーション風の雰囲気を出す */}
    <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-200/30 dark:bg-orange-900/10 blur-3xl" />
    <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-red-200/30 dark:bg-red-900/10 blur-3xl" />
    <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[60%] rounded-full bg-yellow-200/30 dark:bg-yellow-900/10 blur-3xl" />
  </div>
);

/** ログイン用入力欄の props（shadcn Input + アイコン + エラー表示） */
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  /** true のときパスワード表示トグルを出す */
  isPassword?: boolean;
}

/**
 * ラベル・左アイコン・（任意）パスワード表示切替付きの入力コンポーネント
 * forwardRef: 親から ref を Input に渡せるようにする（フォーム制御・フォーカス用）
 */
const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, icon: Icon, error, isPassword, className, ...props }, ref) => {
    // パスワードの表示/非表示（目のアイコンで切り替え）
    const [showPassword, setShowPassword] = useState(false);

    // isPassword なら showPassword に応じて type を切り替え、それ以外は props.type を使う
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
          {/* 左端の装飾アイコン（フォーカス時に primary 色へ） */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Icon className="w-4 h-4" />
          </div>
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              // pl-10: 左アイコン分の余白 / エラー時は赤枠
              "pl-10 h-11 bg-background/50 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
              isPassword && "pr-10", // 右の目アイコン分の余白
              error && "border-red-500 focus-visible:border-red-500",
              className
            )}
            {...props}
          />
          {/* パスワード欄のみ: 表示/非表示トグル（type="button" でフォーム送信を防ぐ） */}
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
        {/* フィールド単位のバリデーションエラー（あれば表示） */}
        {error && (
          <p className="ml-1 text-[10px] text-red-500 font-medium animate-in slide-in-from-top-1 fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);
// DevTools / React DevTools で名前が分かるようにする（forwardRef 必須）
CustomInput.displayName = "CustomInput";

/** Google ブランドカラーの SVG アイコン（OAuth ボタン用） */
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

// --- メインページ ---

/**
 * ログインページ
 * - メール/パスワード（Better Auth）
 * - Google OAuth
 * - ゲスト利用（認証なしでホームへ。データは localStorage）
 */
export default function LoginPage() {
  const router = useRouter();

  // フォーム入力値
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 送信中フラグ（二重送信防止・ボタン disabled 用）
  const [isLoading, setIsLoading] = useState(false); // メールログイン / ゲスト
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Google OAuth
  const [error, setError] = useState<string | null>(null); // 画面上部に出すエラー文言

  /**
   * メール/パスワードログイン
   * 成功 → ホームへ遷移 + refresh でサーバーセッションを再取得
   * 失敗 → ユーザー向けメッセージを error state にセット
   */
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ブラウザのデフォルト送信（ページリロード）を防ぐ
    setIsLoading(true);
    setError(null);

    try {
      // Better Auth: メールログイン。成功時はセッション Cookie がセットされる
      const result = await signIn.email({ email, password });
      if (result.error) {
        const msg = result.error.message;
        // ライブラリの英語メッセージを日本語に変換（認証失敗の典型パターン）
        if (msg && msg.includes("Invalid"))
          setError("メールアドレスまたはパスワードが違います");
        else setError("ログインに失敗しました");
      } else {
        router.push("/"); // ホーム（アプリ本体）へ
        router.refresh(); // RSC / サーバーセッションを最新化
      }
    } catch (err) {
      // ネットワーク障害など、想定外の例外
      setError("予期せぬエラーが発生しました");
      console.error(err);
    } finally {
      // 成功・失敗どちらでもローディングを解除
      setIsLoading(false);
    }
  };

  /**
   * Google OAuth ログイン
   * signIn.social は外部プロバイダへリダイレクトするため、
   * 成功時はこの関数の続きは実行されない（ページ遷移する）
   * → 失敗時だけ isGoogleLoading を false に戻す
   */
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/", // 認証完了後の戻り先
      });
    } catch (err) {
      setError("Google認証に失敗しました");
      console.error(err);
      setIsGoogleLoading(false);
    }
  };

  /**
   * ゲスト利用開始
   * 認証 API は呼ばず、そのままホームへ。記録は localStorage に保存される想定
   */
  const handleGuestLogin = () => {
    setIsLoading(true);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4 relative">
      <Background />

      {/* ブランドヘッダー（ロゴ・アプリ名・キャッチコピー） */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 text-center z-10">
        <div className="flex justify-center mb-4">
          {/* ブランドアイコン（少し傾けて立体感） */}
          <div className="h-14 w-14 bg-linear-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-xl shadow-primary/30 transform -rotate-6 ring-4 ring-background">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          MuscleGrow
        </h2>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          さあ、今日のワークアウトを始めましょう。
        </p>
      </div>

      {/* ログインカード本体 */}
      <div className="w-full max-w-[400px] flex flex-col z-10">
        <div className="bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-3xl overflow-hidden transition-all duration-300 flex flex-col">
          <div className="p-6 pb-2">
            {/* 入場アニメーション（左からフェードイン） */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* メール/パスワードフォーム */}
              <form onSubmit={handleEmailLogin} className="space-y-1">
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
                  {/* 「お忘れですか？」— 現状は未実装のプレースホルダ */}
                  <div className="absolute top-0 right-0">
                    <button
                      type="button"
                      className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                      onClick={() => alert("未実装です")}
                    >
                      お忘れですか？
                    </button>
                  </div>
                </div>

                {/* フォーム全体のエラー（認証失敗など） */}
                {error && (
                  <div className="p-3 mb-3 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg animate-in fade-in">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  {/* メールログイン送信。他方式の処理中は無効化して二重送信を防ぐ */}
                  <Button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                  >
                    {isLoading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    ワークアウトを再開 (ログイン)
                  </Button>
                </div>
              </form>

              {/* 区切り線「または」 */}
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

              {/* Google OAuth */}
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
                  Googleでログイン
                </Button>
              </div>

              {/* ゲスト: アカウントなしでアプリを試せる入口 */}
              <div className="mt-3">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11 font-bold bg-card hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-primary transition-all"
                  onClick={handleGuestLogin}
                  // 他のログイン処理中はゲスト開始も止める（遷移の競合防止）
                  disabled={isLoading || isGoogleLoading}
                >
                  <User className="w-4 h-4 mr-2" />
                  ゲストとして利用開始
                </Button>
              </div>
            </motion.div>
          </div>

          {/* カード下部: 新規登録への導線 */}
          <div className="p-6 pt-2 border-t border-border/30 bg-muted/30 text-center mt-6">
            <p className="text-xs text-muted-foreground">
              初めてですか？{" "}
              <Link
                href="/signup"
                className="font-bold text-primary hover:underline ml-1 transition-colors"
              >
                新規登録 (無料)
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 静的ページ（利用規約・プライバシー・お問い合わせ）へのリンク */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground font-medium z-10">
        <Link href="/terms" className="hover:text-primary transition-colors">
          利用規約
        </Link>
        <span className="text-muted-foreground/40">・</span>
        <Link href="/privacy" className="hover:text-primary transition-colors">
          プライバシーポリシー
        </Link>
        <span className="text-muted-foreground/40">・</span>
        <Link href="/contact" className="hover:text-primary transition-colors">
          お問い合わせ
        </Link>
      </div>

      <p className="text-[10px] text-muted-foreground/40 text-center mt-4 z-10">
        &copy; 2024 MuscleGrow Inc. All rights reserved.
      </p>
    </div>
  );
}
