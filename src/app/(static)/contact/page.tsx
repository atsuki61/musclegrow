import { BackHeader } from "@/components/layout/back-header";
import { ExternalLink } from "lucide-react";
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
            機能の不具合やご要望は
            <br />
            以下より受け付けております。
          </p>
        </div>

        <Card className="p-6 border-border/60 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                お問い合わせフォーム
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                不具合の報告や機能リクエストなどは、専用のGoogleフォームから受け付けています。
              </p>
            </div>
            <Button className="w-full font-bold" asChild>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfLTwZ-fVdR9UM5QXOztKQLaSk_IPIGbTN-hB7l6UH0TvMBeQ/viewform?usp=header"
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
