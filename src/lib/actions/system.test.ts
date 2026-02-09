/**
 * system.ts のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkEnvironmentVariables } from "./system";

describe("checkEnvironmentVariables", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // process.env をモック可能にする
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("正常系: 開発環境での実行", () => {
    it("全ての環境変数が設定されている場合、全てtrueを返す", async () => {
      // Given: 開発環境で全ての環境変数が設定されている
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_SECRET = "test-secret-key";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID =
        "1234567890123456789.apps.googleusercontent.com";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "test-client-secret";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: success: true, 全てのチェックがtrueを返す
      expect(result.success).toBe(true);
      expect(result.data?.environment).toBe("development");
      expect(result.data?.checks.betterAuthSecret).toBe(true);
      expect(result.data?.checks.googleClientId).toBe(true);
      expect(result.data?.checks.googleClientSecret).toBe(true);
    });

    it("一部の環境変数が未設定の場合、該当項目がfalseを返す", async () => {
      // Given: 開発環境でBETTER_AUTH_SECRETのみ設定
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_SECRET = "test-secret-key";
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_ID;
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: success: true, BETTER_AUTH_SECRETのみtrue
      expect(result.success).toBe(true);
      expect(result.data?.checks.betterAuthSecret).toBe(true);
      expect(result.data?.checks.googleClientId).toBe(false);
      expect(result.data?.checks.googleClientSecret).toBe(false);
    });

    it("全ての環境変数が未設定の場合、全てfalseを返す", async () => {
      // Given: 開発環境で全ての環境変数が未設定
      process.env.NODE_ENV = "development";
      delete process.env.BETTER_AUTH_SECRET;
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_ID;
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: success: true, 全てのチェックがfalse
      expect(result.success).toBe(true);
      expect(result.data?.checks.betterAuthSecret).toBe(false);
      expect(result.data?.checks.googleClientId).toBe(false);
      expect(result.data?.checks.googleClientSecret).toBe(false);
    });
  });

  describe("正常系: プレビュー文字列の生成", () => {
    it("長いCLIENT_IDの場合、最初の15文字+...を表示", async () => {
      // Given: 開発環境で長いCLIENT_IDが設定されている
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID =
        "1234567890123456789.apps.googleusercontent.com";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 最初の15文字+...が表示される
      expect(result.data?.previews.clientIdPreview).toBe(
        "123456789012345..."
      );
    });

    it("短いCLIENT_IDの場合、そのまま+...を表示", async () => {
      // Given: 開発環境で短いCLIENT_IDが設定されている
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "short";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: そのまま+...が表示される
      expect(result.data?.previews.clientIdPreview).toBe("short...");
    });

    it("長いCLIENT_SECRETの場合、最初の10文字+...を表示", async () => {
      // Given: 開発環境で長いCLIENT_SECRETが設定されている
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "1234567890ABCDEFGHIJ";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 最初の10文字+...が表示される
      expect(result.data?.previews.secretPreview).toBe("1234567890...");
    });

    it("短いCLIENT_SECRETの場合、そのまま+...を表示", async () => {
      // Given: 開発環境で短いCLIENT_SECRETが設定されている
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "secret";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: そのまま+...が表示される
      expect(result.data?.previews.secretPreview).toBe("secret...");
    });

    it("CLIENT_IDが未設定の場合、「未設定」を表示", async () => {
      // Given: 開発環境でCLIENT_IDが未設定
      process.env.NODE_ENV = "development";
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_ID;

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 「未設定」が表示される
      expect(result.data?.previews.clientIdPreview).toBe("未設定");
    });

    it("CLIENT_SECRETが未設定の場合、「未設定」を表示", async () => {
      // Given: 開発環境でCLIENT_SECRETが未設定
      process.env.NODE_ENV = "development";
      delete process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 「未設定」が表示される
      expect(result.data?.previews.secretPreview).toBe("未設定");
    });
  });

  describe("異常系: 本番環境での実行", () => {
    it("本番環境では実行できない", async () => {
      // Given: NODE_ENV=production
      process.env.NODE_ENV = "production";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: success: false, エラーメッセージが返る
      expect(result.success).toBe(false);
      expect(result.error).toBe("Not available in production");
      expect(result.data).toBeUndefined();
    });

    it("test環境でも実行できない", async () => {
      // Given: NODE_ENV=test
      process.env.NODE_ENV = "test";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: success: false, エラーメッセージが返る
      expect(result.success).toBe(false);
      expect(result.error).toBe("Not available in production");
    });
  });

  describe("境界値: エッジケース", () => {
    it("環境変数が空文字列の場合、falseを返す", async () => {
      // Given: 開発環境で環境変数が空文字列
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_SECRET = "";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 空文字列はfalsyなのでfalse
      expect(result.success).toBe(true);
      expect(result.data?.checks.betterAuthSecret).toBe(false);
      expect(result.data?.checks.googleClientId).toBe(false);
      expect(result.data?.checks.googleClientSecret).toBe(false);
    });

    it("CLIENT_IDが15文字ちょうどの場合、全て+...が表示される", async () => {
      // Given: 開発環境でCLIENT_IDが15文字
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "123456789012345";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 全て+...が表示される
      expect(result.data?.previews.clientIdPreview).toBe("123456789012345...");
    });

    it("CLIENT_SECRETが10文字ちょうどの場合、全て+...が表示される", async () => {
      // Given: 開発環境でCLIENT_SECRETが10文字
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "1234567890";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 全て+...が表示される
      expect(result.data?.previews.secretPreview).toBe("1234567890...");
    });

    it("CLIENT_IDが15文字未満の場合、全て表示+...が表示される", async () => {
      // Given: 開発環境でCLIENT_IDが14文字
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "12345678901234";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 14文字+...が表示される
      expect(result.data?.previews.clientIdPreview).toBe("12345678901234...");
    });

    it("CLIENT_SECRETが10文字未満の場合、全て表示+...が表示される", async () => {
      // Given: 開発環境でCLIENT_SECRETが9文字
      process.env.NODE_ENV = "development";
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "123456789";

      // When: 環境変数チェックを実行
      const result = await checkEnvironmentVariables();

      // Then: 9文字+...が表示される
      expect(result.data?.previews.secretPreview).toBe("123456789...");
    });
  });
});
