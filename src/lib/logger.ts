/**
 * 開発環境のみログを出力するロガーユーティリティ
 * 
 * 本番環境でのコンソール出力を最小限に抑え、
 * エラートラッキングサービス（Sentry等）への移行を容易にします。
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * 通常のログ（開発環境のみ）
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  /**
   * 警告ログ（開発環境のみ）
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  /**
   * エラーログ（本番環境でも出力）
   * 本番環境では監視ツールで検知するため、常に出力
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  
  /**
   * デバッグログ（開発環境のみ）
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

