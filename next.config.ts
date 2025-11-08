import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows環境でのファイル監視の問題を緩和
  // Turbopack使用時はwebpack設定は無視されますが、
  // `dev:webpack` コマンドで通常のwebpackモードを使用する場合に有効です
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // ファイル監視の設定を最適化（Windows環境での競合を緩和）
      config.watchOptions = {
        poll: 1000, // 1秒ごとにポーリング
        aggregateTimeout: 300, // 300ms待機してから再コンパイル
        ignored: /node_modules/,
      };
    }
    return config;
  },
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
