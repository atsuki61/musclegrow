import { BackHeader } from "@/components/layout/back-header";

export default function PrivacyPage() {
  return (
    <>
      <BackHeader title="プライバシーポリシー" />
      <div className="container max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. はじめに</h2>
          <p>
            MuscleGrow（以下、「本アプリ」）は、個人開発により提供される筋トレ記録Webアプリケーションです。
            本アプリは、ユーザーのプライバシーを尊重し、個人情報を適切に取り扱います。
            本ポリシーでは、どのような情報を収集し、どのように利用・保護するかを説明します。
          </p>
          <p>
            本アプリは公開URLからアクセス可能ですが、主に個人利用およびポートフォリオ提示を目的として運用しています。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. 収集する情報</h2>
          <p>本アプリでは、以下の情報を収集する場合があります。</p>

          <h3 className="text-sm font-semibold text-foreground mt-3">ゲストモード（ログインなし）</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>トレーニング記録データ（種目、セット数、重量など）</li>
            <li>身体データ（身長、体重、体脂肪率など）※任意</li>
            <li>アプリの設定情報</li>
          </ul>
          <p className="text-xs italic">
            ※ゲストモードのデータはブラウザのローカルストレージにのみ保存され、サーバーには送信されません。
          </p>

          <h3 className="text-sm font-semibold text-foreground mt-3">ログインモード（アカウント登録）</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>アカウント情報（メールアドレス、ユーザー名、プロフィール画像）</li>
            <li>トレーニング記録データ</li>
            <li>身体データ（身長、体重、体脂肪率など）※任意</li>
            <li>アプリの設定情報</li>
            <li>ログイン履歴やアクセス情報</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的でのみ利用します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本アプリの提供・運営・改善</li>
            <li>ユーザーのトレーニング進捗の記録と分析</li>
            <li>複数端末でのデータ同期（ログインモードのみ）</li>
            <li>不正利用の防止および対応</li>
            <li>重要なお知らせやメンテナンス情報の通知</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. 使用している技術</h2>
          <p>本アプリは、以下の技術・サービスを利用しています。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase</strong>：データベースとして使用。ログインユーザーのデータを保存します。
            </li>
            <li>
              <strong>Vercel</strong>：アプリのホスティングサービス。
            </li>
            <li>
              <strong>Better Auth</strong>：認証システム。メール/パスワード認証を提供します。
            </li>
            <li>
              <strong>Google OAuth</strong>：Googleアカウントでのログイン機能。
            </li>
            <li>
              <strong>ローカルストレージ</strong>：ゲストモードのデータ保存、および一時的なキャッシュ。
            </li>
          </ul>
          <p className="text-xs italic mt-2">
            これらのサービスは、それぞれのプライバシーポリシーに基づいて運用されています。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. データの保存場所と期間</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>ゲストモード</strong>：データはブラウザのローカルストレージに保存されます。ブラウザのデータを削除すると消えます。
            </li>
            <li>
              <strong>ログインモード</strong>：データはクラウド（Supabase）に保存されます。アカウントを削除するまで保持されます。
            </li>
            <li>
              削除されたデータは、バックアップや各サービスの仕様により、完全な削除まで一定期間を要する場合があります。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. 第三者への提供</h2>
          <p>
            法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
          <p>
            ただし、本アプリの提供・認証・データ保存・ホスティングのために、委託先として上記のクラウドサービスプロバイダー（Supabase、Vercel、Google等）を利用します。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">7. ユーザーの権利</h2>
          <p>ユーザーは、以下の権利を有します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>データへのアクセス</strong>：アプリ内で自分のデータを閲覧できます。
            </li>
            <li>
              <strong>データの訂正</strong>：プロフィールや記録データを自由に編集できます。
            </li>
            <li>
              <strong>データの削除</strong>：設定からアカウントとすべてのデータを削除できます。
            </li>
            <li>
              <strong>データのエクスポート</strong>：設定からデータをCSV形式でエクスポートできます。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">8. セキュリティ</h2>
          <p>
            収集した個人情報は、不正アクセス・紛失・改ざん・漏洩などを防ぐため、適切なセキュリティ対策を講じて管理します。
          </p>
          <p>
            ただし、インターネット上のデータ送信は完全に安全とは言えないため、絶対的なセキュリティを保証することはできません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">9. Cookie・トラッキング</h2>
          <p>
            本アプリは、認証セッションの維持やアプリの動作に必要な最小限のCookieを使用します。
          </p>
          <p>
            広告配信や行動追跡を目的としたトラッキングは行っていません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">10. プライバシーポリシーの変更</h2>
          <p>
            本ポリシーは、必要に応じて変更されることがあります。
            重要な変更がある場合は、本アプリ上または本サイト上で告知します。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">11. お問い合わせ</h2>
          <p>
            プライバシーポリシーに関するご質問は、アプリ内のお問い合わせフォームよりご連絡ください。
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
