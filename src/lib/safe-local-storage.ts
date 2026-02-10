/**
 * localStorage の安全なラッパー関数
 * プライベートモードやストレージ満杯時のエラーを適切に処理する
 */

/**
 * localStorage から値を取得する（エラーハンドリング付き）
 * @param key - localStorage のキー
 * @returns 取得した値、エラー時は null
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to get item from localStorage: ${key}`, e);
    }
    return null;
  }
}

/**
 * localStorage に値を保存する（エラーハンドリング付き）
 * @param key - localStorage のキー
 * @param value - 保存する値
 * @returns 成功時 true、失敗時 false
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === "QuotaExceededError") {
      // ストレージ満杯
      if (process.env.NODE_ENV === "development") {
        console.error("localStorage quota exceeded", e);
      }
    } else if (e instanceof Error && e.name === "SecurityError") {
      // プライベートモード
      if (process.env.NODE_ENV === "development") {
        console.warn("localStorage is not available (private mode?)", e);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.error(`Failed to set item in localStorage: ${key}`, e);
      }
    }
    return false;
  }
}

/**
 * localStorage から値を削除する（エラーハンドリング付き）
 * @param key - localStorage のキー
 * @returns 成功時 true、失敗時 false
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to remove item from localStorage: ${key}`, e);
    }
    return false;
  }
}
