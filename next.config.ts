import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバーのエントリーポイント管理を最適化
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // 実験的な機能の設定
  experimental: {
    // Turbopack使用時も安定性を向上
    // recharts（グラフ）とdate-fns（日付）は重い
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  // 画像最適化の設定
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
