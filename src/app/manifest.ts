import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MuscleGrow - 筋トレ記録アプリ",
    short_name: "MuscleGrow",
    description: "筋トレ習慣を可視化し、継続的なモチベーションを提供",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#EF4444",
    orientation: "portrait",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        // Next.jsの型定義がスペース区切りに対応していないため、型アサーションで回避
        purpose: "any maskable" as unknown as "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable" as unknown as "maskable",
      },
    ],
    categories: ["health", "fitness", "lifestyle"],
    lang: "ja",
    dir: "ltr",
  };
}
