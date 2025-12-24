import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
//①ユーザー情報

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(), //メール認証済みかどうか
  image: text("image"), //プロフィール画像
  createdAt: timestamp("created_at").defaultNow().notNull(), //作成日時
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date()) //更新日時
    .notNull(),
});
//②セッション情報
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(), //有効期限
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at") //更新日時
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"), //IPアドレス
  userAgent: text("user_agent"), //ユーザーエージェント
  userId: text("user_id") //ユーザーID
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), //外部キー
});
//③ 外部アカウント連携
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), //プロバイダーID
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"), //アクセストークンの有効期限
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), //リフレッシュトークンの有効期限
  scope: text("scope"), //スコープ
  password: text("password"), //パスワード
  createdAt: timestamp("created_at").defaultNow().notNull(), //作成日時
  updatedAt: timestamp("updated_at") //更新日時
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}); //

//④メール認証など
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), //識別子
  value: text("value").notNull(), //値
  expiresAt: timestamp("expires_at").notNull(), //有効期限
  createdAt: timestamp("created_at").defaultNow().notNull(), //作成日時
  updatedAt: timestamp("updated_at") //更新日時
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(), //更新日時
});
