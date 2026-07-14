import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
//①ユーザー情報

export const users = pgTable("users", {
  id: text("id").primaryKey(), // ユーザーID（文字列・主キー）
  name: text("name").notNull(), // 表示名（文字列・必須）
  email: text("email").notNull().unique(), // メールアドレス（文字列・必須・重複不可）
  emailVerified: boolean("email_verified").default(false).notNull(), // メール認証済みか（真偽値・必須・初期値false）
  image: text("image"), // プロフィール画像URL（文字列・任意）
  createdAt: timestamp("created_at").defaultNow().notNull(), // ユーザー作成日時（日時・必須・初期値は現在時刻）
  updatedAt: timestamp("updated_at") // ユーザー更新日時（日時・必須・更新時に自動更新）
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
//②セッション情報
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // セッションID（文字列・主キー）
  expiresAt: timestamp("expires_at").notNull(), // セッション有効期限（日時・必須）
  token: text("token").notNull().unique(), // セッショントークン（文字列・必須・重複不可）
  createdAt: timestamp("created_at").defaultNow().notNull(), // セッション作成日時（日時・必須・初期値は現在時刻）
  updatedAt: timestamp("updated_at") // セッション更新日時（日時・必須・更新時に自動更新）
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"), // 接続元IPアドレス（文字列・任意）
  userAgent: text("user_agent"), // ブラウザ・端末情報（文字列・任意）
  userId: text("user_id") // セッションの所有者となるユーザーID（文字列・外部キー）
    .notNull() // 必須
    .references(() => users.id, { onDelete: "cascade" }), // ユーザー削除時にセッションも削除
});
//③ 外部アカウント連携
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(), // 連携アカウントID（文字列・主キー）
  accountId: text("account_id").notNull(), // 認証プロバイダー側のアカウントID（文字列・必須）
  providerId: text("provider_id").notNull(), // 認証方式・プロバイダー名（文字列・必須）
  userId: text("user_id") // 連携先のユーザーID（文字列・外部キー）
    .notNull() // 必須
    .references(() => users.id, { onDelete: "cascade" }), // ユーザー削除時に連携情報も削除
  accessToken: text("access_token"), // OAuthアクセストークン（文字列・任意）
  refreshToken: text("refresh_token"), // OAuthリフレッシュトークン（文字列・任意）
  idToken: text("id_token"), // OpenID ConnectのIDトークン（文字列・任意）
  accessTokenExpiresAt: timestamp("access_token_expires_at"), // アクセストークン有効期限（日時・任意）
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), // リフレッシュトークン有効期限（日時・任意）
  scope: text("scope"), // 認証プロバイダーから許可された権限範囲（文字列・任意）
  password: text("password"), // メール認証用のパスワードハッシュ（文字列・任意・平文ではない）
  createdAt: timestamp("created_at").defaultNow().notNull(), // 連携情報作成日時（日時・必須・初期値は現在時刻）
  updatedAt: timestamp("updated_at") // 連携情報更新日時（日時・必須・更新時に自動更新）
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}); //

//④メール認証など
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(), // 認証確認レコードID（文字列・主キー）
  identifier: text("identifier").notNull(), // 確認対象のメールアドレスなど（文字列・必須）
  value: text("value").notNull(), // 確認用トークン・コード（文字列・必須）
  expiresAt: timestamp("expires_at").notNull(), // 確認用トークンの有効期限（日時・必須）
  createdAt: timestamp("created_at").defaultNow().notNull(), // 確認レコード作成日時（日時・必須・初期値は現在時刻）
  updatedAt: timestamp("updated_at") // 確認レコード更新日時（日時・必須・更新時に自動更新）
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
