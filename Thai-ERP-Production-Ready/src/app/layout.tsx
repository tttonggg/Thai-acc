import type { Metadata, Viewport } from "next";
import { Quicksand, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Keerati ERP - โปรแกรมบัญชีสไตล์คุณ",
  description: "ระบบบัญชีสไตล์พาสเทล ใช้งานง่าย สวยงาม ครบวงจร รองรับภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย งบการเงิน และรายงานต่างๆ",
  keywords: ["Keerati ERP", "บัญชี", "ERP", "TFRS", "บัญชีไทย", "ภาษีมูลค่าเพิ่ม", "VAT", "WHT", "พาสเทล", "สีพาสเทล"],
  authors: [{ name: "Keerati ERP Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KeeratiERP",
  },
  openGraph: {
    title: "Keerati ERP",
    description: "โปรแกรมบัญชีสไตล์พาสเทล ครบวงจร",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fefdfb" },
    { media: "(prefers-color-scheme: dark)", color: "#2d2a3a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Keerati ERP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KeeratiERP" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#ffb6c1" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${quicksand.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif' }}
      >
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
