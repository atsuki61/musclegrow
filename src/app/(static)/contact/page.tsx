import { BackHeader } from "@/components/layout/back-header";
import { Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <>
      <BackHeader title="お問い合わせ" />
      <div className="container max-w-md mx-auto px-5 py-8 space-y-6">
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-xl font-bold">サポート＆フィードバック</h2>
          <p className="text-sm text-muted-foreground">
            機能の不具合やご要望、その他のお問い合わせは
            <br />
            以下より受け付けております。
          </p>
        </div>

        <Card className="p-6 space-y-6 border-border/60 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                メールでのお問い合わせ
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                お使いのメーラーが起動します。件名にお問い合わせ内容の概要をご記入ください。
              </p>
            </div>
            <Button className="w-full font-bold" asChild>
              <a href="mailto:support@musclegrow.app">メールを送る</a>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Googleフォーム
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                不具合の報告や機能リクエストなどは、専用フォームからも受け付けています。
              </p>
            </div>
            <Button variant="outline" className="w-full font-bold" asChild>
              {/* ※実際のフォームURLに置き換えてください */}
              <a
                href="https://forms.google.com/your-form-url"
                target="_blank"
                rel="noopener noreferrer"
              >
                フォームを開く
              </a>
            </Button>
          </div>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground/60">
          ※お問い合わせ内容によっては、回答までにお時間をいただく場合や、返信できない場合がございます。あらかじめご了承ください。
        </p>
      </div>
    </>
  );
}
