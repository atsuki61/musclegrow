import { BackHeader } from "@/components/layout/back-header";

export default function TermsPage() {
  return (
    <>
      <BackHeader title="利用規約" />
      <div className="container max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. はじめに</h2>
          <p>
            この利用規約（以下、「本規約」といいます。）は、MuscleGrow（以下、「本アプリ」といいます。）の利用条件を定めるものです。ユーザーの皆様には、本規約に従って本アプリをご利用いただきます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            2. アカウント登録
          </h2>
          <p>
            本アプリの一部の機能を利用するためには、アカウント登録が必要です。登録情報は正確かつ最新の状態に保つ義務があります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. 禁止事項</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>
              本アプリのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
            </li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. 免責事項</h2>
          <p>
            本アプリは、トレーニング記録の管理を目的としていますが、ユーザーの身体的変化や健康状態の向上を保証するものではありません。本アプリの利用により生じた損害について、運営者は一切の責任を負いません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            5. 利用規約の変更
          </h2>
          <p>
            運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
          </p>
        </section>

        <div className="pt-8 text-xs text-center opacity-60">
          2025年12月3日 制定
        </div>
      </div>
    </>
  );
}
