import { BackHeader } from "@/components/layout/back-header";

export default function TermsPage() {
  return (
    <>
      <BackHeader title="利用規約" />
      <div className="container max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. サービスについて</h2>
          <p>
            MuscleGrow（以下、「本アプリ」）は、個人開発により提供される、筋トレの記録と進捗を管理するための無料Webアプリケーションです。
            ユーザーは、ゲストモード（ローカルのみ）またはアカウント登録（クラウド保存）を選択して利用できます。
          </p>
          <p>
            本規約は、本アプリにアクセスし、または本アプリを利用するすべてのユーザーに適用されます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. アカウント登録</h2>
          <p>
            本アプリの一部機能（クラウド保存、複数端末での同期）を利用するには、アカウント登録が必要です。
            登録時は、メールアドレス/パスワードまたはGoogleアカウントでログインできます。
          </p>
          <p>
            登録情報は正確に保ち、パスワードは厳重に管理してください。アカウントの不正利用による損害について、運営者は責任を負いません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. データの取り扱い</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>ゲストモード</strong>：データはブラウザのローカルストレージに保存されます。ブラウザのデータ削除やキャッシュクリアで消える可能性があります。
            </li>
            <li>
              <strong>ログインモード</strong>：データはクラウド（Supabase）に保存され、複数端末で同期できます。
            </li>
            <li>
              データのバックアップやエクスポート機能を定期的に利用することをおすすめします。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. 禁止事項</h2>
          <p>本アプリの利用にあたり、以下の行為を禁止します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>本アプリのサーバーやネットワークに過度な負荷をかける行為</li>
            <li>本アプリのセキュリティを脅かす行為（不正アクセス、リバースエンジニアリング等）</li>
            <li>他のユーザーになりすます行為</li>
            <li>本アプリの運営を妨害する行為</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. 免責事項</h2>
          <p>
            本アプリはトレーニング記録の管理ツールであり、医療・健康アドバイスを提供するものではありません。
            トレーニングを始める前に、必要に応じて医師や専門家に相談してください。
          </p>
          <p>
            本アプリの利用により生じた損害（データの紛失、身体的損害、その他の損害）について、運営者は法令上認められる範囲で責任を負いません。
            ただし、運営者の故意または重過失による場合はこの限りではありません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. サービスの変更・中断・終了</h2>
          <p>
            運営者は、事前の通知なく本アプリの内容を変更、一時中断、または終了することがあります。
            サービス終了時は、可能な限りデータのエクスポート期間を設けますが、保証はできません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">7. アカウントの削除</h2>
          <p>
            ユーザーは、アプリ内の設定からいつでもアカウントとデータを削除できます。
            削除されたデータは復元できませんのでご注意ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">8. 利用規約の変更</h2>
          <p>
            運営者は、必要に応じて本規約を変更することがあります。
            重要な変更がある場合は、本アプリ上または本サイト上で告知します。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">9. 準拠法</h2>
          <p>
            本規約の解釈にあたっては、日本法を準拠法とします。
          </p>
        </section>

        <div className="pt-8 text-xs text-center opacity-60">
          制定日：2025年12月3日<br />
          最終更新日：2026年4月26日
        </div>
      </div>
    </>
  );
}
