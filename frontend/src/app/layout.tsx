import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import WebMCP from "@/components/WebMCP";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "Thai ACC - โปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย",
  description:
    "ระบบบัญชีออนไลน์สำหรับธุรกิจไทย รองรับ e-Tax Invoice VAT WHT และรายงานภาษีครบถ้วนตามกรมสรรพากร",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%237c3aed'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='white' font-family='Arial'%3ET%3C/text%3E%3C/svg%3E",
      },
    ],
  },
  other: {
    "application-name": "Thai ACC",
    "agent-skills": "https://acc3.k56mm.uk/.well-known/agent-skills/index.json",
    "api-catalog": "https://acc3.k56mm.uk/.well-known/api-catalog",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable}`}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
        <WebMCP />
      </body>
    </html>
  );
}
