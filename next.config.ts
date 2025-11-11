import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバーのエントリーポイント管理を最適化
  // エラーが発生してもサーバーを継続させる
  onDemandEntries: {
    // ページをメモリに保持する期間を延長（エラー時の再読み込みを緩和）
    maxInactiveAge: 60 * 1000, // 60秒
    // バッファサイズを増やす（同時に保持するページ数）
    pagesBufferLength: 5,
  },
  // 実験的な機能の設定
  experimental: {
    // Turbopack使用時も安定性を向上
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
