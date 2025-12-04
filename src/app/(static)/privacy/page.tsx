import { BackHeader } from "@/components/layout/back-header";

export default function PrivacyPage() {
  return (
    <>
      <BackHeader title="プライバシーポリシー" />
      <div className="container max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. 収集する情報</h2>
          <p>本アプリでは、以下の情報を収集する場合があります。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              アカウント情報（メールアドレス、ユーザー名、プロフィール画像）
            </li>
            <li>身体データ（身長、体重、体脂肪率など）</li>
            <li>トレーニング記録データ</li>
            <li>端末情報およびアクセスログ</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            2. 情報の利用目的
          </h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本アプリの提供・運営のため</li>
            <li>
              ユーザーに合わせたトレーニング分析やフィードバックを提供するため
            </li>
            <li>重要なお知らせやメンテナンス情報を通知するため</li>
            <li>不正利用の防止および対応のため</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            3. 第三者への提供
          </h2>
          <p>
            法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、データのバックアップや解析のために、信頼できるクラウドサービスプロバイダーを利用する場合があります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. セキュリティ</h2>
          <p>
            収集した個人情報は、不正アクセス・紛失・改ざん・漏洩などを防ぐため、適切なセキュリティ対策を講じて管理します。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. お問い合わせ</h2>
          <p>
            プライバシーポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
          </p>
        </section>

        <div className="pt-8 text-xs text-center opacity-60">
          2025年12月3日 制定
        </div>
      </div>
    </>
  );
}
