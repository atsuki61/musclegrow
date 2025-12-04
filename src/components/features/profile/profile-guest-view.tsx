"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, LogIn, UserPlus } from "lucide-react";

export function ProfileGuestView() {
  return (
    <div className="min-h-screen bg-background pb-32 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 mb-8">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Dumbbell className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">ゲストユーザー</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          現在はゲストとして利用しています。
          <br />
          アカウントを作成すると、データのバックアップや機種変更時の引き継ぎが可能になります。
        </p>
      </div>

      <Card className="w-full max-w-sm p-6 space-y-4 border-border/60 shadow-sm">
        <Button className="w-full font-bold h-12 text-base" asChild>
          <Link href="/signup">
            <UserPlus className="w-5 h-5 mr-2" />
            アカウントを作成する
          </Link>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">または</span>
          </div>
        </div>

        <Button variant="outline" className="w-full font-bold h-12" asChild>
          <Link href="/login">
            <LogIn className="w-5 h-5 mr-2" />
            ログイン
          </Link>
        </Button>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground font-medium">
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
    </div>
  );
}
