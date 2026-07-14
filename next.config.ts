import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler: コンポーネントの再レンダリングを自動最適化
  reactCompiler: true,
  // 開発サーバーのエントリーポイント管理を最適化
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // パッケージインポート最適化（recharts / date-fns は重い）
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  // 画像最適化の設定
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
