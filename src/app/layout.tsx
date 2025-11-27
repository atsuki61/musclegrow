import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { FooterNav } from "@/components/layout/footer-nav";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  ),
  title: "MuscleGrow - 筋トレ記録アプリ",
  description: "筋トレ習慣を可視化し、継続的なモチベーションを提供",

  // PWAアイコンとファビコンの設定
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-16x16.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon-32x32.ico", sizes: "32x32", type: "image/x-icon" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // PWA用の追加メタデータ
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MuscleGrow",
  },

  // OGP画像の設定（SNSシェア用）
  openGraph: {
    title: "MuscleGrow - 筋トレ記録アプリ",
    description: "筋トレ習慣を可視化し、継続的なモチベーションを提供",
    url: "https://musclegrow.app",
    siteName: "MuscleGrow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MuscleGrow - 筋トレ記録アプリ",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },

  // Twitter用のOGP設定
  twitter: {
    card: "summary_large_image",
    title: "MuscleGrow - 筋トレ記録アプリ",
    description: "筋トレ習慣を可視化し、継続的なモチベーションを提供",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EF4444",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen pb-24">{children}</main>
          <FooterNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
