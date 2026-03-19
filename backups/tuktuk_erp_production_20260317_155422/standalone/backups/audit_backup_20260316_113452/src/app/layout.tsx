import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thai Accounting ERP - โปรแกรมบัญชีมาตรฐานไทย",
  description: "ระบบบัญชีมาตรฐานไทย (TFRS) ครบวงจร รองรับภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย งบการเงิน และรายงานต่างๆ",
  keywords: ["Thai Accounting", "ERP", "TFRS", "บัญชีไทย", "ภาษีมูลค่าเพิ่ม", "VAT", "WHT", "ภงด.3", "ภงด.53"],
  authors: [{ name: "Thai Accounting ERP Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Thai Accounting ERP",
    description: "โปรแกรมบัญชีมาตรฐานไทย ครบวงจร",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
