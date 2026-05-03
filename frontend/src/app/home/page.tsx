"use client";

import Link from "next/link";
import Head from "next/head";
import {
  Receipt,
  Users,
  Package,
  FileText,
  BarChart3,
  Globe,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  Star,
  Calculator,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

/* ── Color Palette (NO peak-purple) ──
   Primary Dark:   slate-900  (#0f172a)
   Accent:         cyan-500   (#06b6d4)
   Accent Hover:   cyan-400   (#22d3ee)
   CTA/Hero:       amber-500  (#f59e0b)
   CTA Hover:      amber-400  (#fbbf24)
   Gradients:      slate-900 → cyan-900 / amber-500 → orange-500
── */

/* ── Schema Markup ── */
function SchemaMarkup() {
  const schemas = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Thai ACC",
        url: "https://acc3.k56mm.uk",
        logo: "https://acc3.k56mm.uk/logo.png",
        sameAs: [],
        description:
          "โปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย รองรับ e-Tax Invoice VAT WHT และรายงานภาษีครบถ้วนตามกรมสรรพากร",
      },
      {
        "@type": "SoftwareApplication",
        name: "Thai ACC",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "THB",
          priceValidUntil: "2027-12-31",
        },
        featureList: [
          "e-Tax Invoice (ใบกำกับภาษีอิเล็กทรอนิกส์)",
          "จัดการลูกหนี้-เจ้าหนี้",
          "บัญชีสต็อก FIFO",
          "รายงานภาษี P.P.30 P.N.D.1",
          "ควบคุมต้นทุนโครงการ",
          "รองรับหลายสกุลเงิน",
          "บันทึกรายรับรายจ่ายอัตโนมัติ",
          "งบทดลอง งบกำไรขาดทุน งบดุล",
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "1240",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Thai ACC คืออะไร",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Thai ACC คือโปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย SME ระบบรองรับการออกใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice) คำนวณ VAT และ WHT อัตโนมัติ บันทึกรายรับรายจ่าย จัดการสต็อกสินค้า และออกรายงานภาษีครบถ้วนตามที่กรมสรรพากรกำหนด ใช้งานผ่านเว็บเบราว์เซอร์ได้ทันทีไม่ต้องติดตั้งโปรแกรม",
            },
          },
          {
            "@type": "Question",
            name: "ใช้ Thai ACC ฟรีหรือไม่",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Thai ACC ให้ใช้งานฟรีสำหรับธุรกิจขนาดเล็กและขนาดกลาง ไม่มีค่าใช้จ่ายรายเดือน ไม่มีข้อจำกัดจำนวนใบแจ้งหนี้หรือเอกสาร สามารถอัปเกรดเป็นแพ็กเกจที่มีฟีเจอร์เพิ่มเติมได้เมื่อธุรกิจเติบโต",
            },
          },
          {
            "@type": "Question",
            name: "รองรับ e-Tax Invoice ของกรมสรรพากรหรือไม่",
            acceptedAnswer: {
              "@type": "Answer",
              text: "รองรับเต็มรูปแบบ Thai ACC สร้างไฟล์ XML ตามมาตรฐาน e-Tax Invoice ของกรมสรรพากรโดยตรง ผู้ใช้สามารถส่งอีเมล e-Tax ให้ลูกค้า หรือเชื่อมต่อ API กับระบบของกรมสรรพากรได้ผ่านระบบที่มีความปลอดภัยสูง",
            },
          },
          {
            "@type": "Question",
            name: "คำนวณ VAT และ WHT อย่างไร",
            acceptedAnswer: {
              "@type": "Answer",
              text: "ระบบคำนวณ VAT 7% และ WHT ตามประเภทธุรกรรมอัตโนมัติ บริการ 3% ค่าเช่า 5% ค่าโฆษณา 2% ค่าขนส่ง 1% ระบบสร้าง Journal Entry บัญชีคู่โดยอัตโนมัติทุกครั้งที่มีการบันทึกธุรกรรม มั่นใจได้ว่าตัวเลขถูกต้องตามมาตรฐานบัญชีไทย",
            },
          },
          {
            "@type": "Question",
            name: "เหมาะกับธุรกิจแบบไหน",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Thai ACC เหมาะกับธุรกิจ SME ทุกประเภท ร้านค้าออนไลน์ บริษัทขนส่ง ร้านอาหาร คลินิก สำนักงานบัญชี และธุรกิจนำเข้าส่งออก ระบบรองรับหลายสกุลเงินและการบัญชีโครงการ ช่วยให้ธุรกิจขนาดเล็กมีระบบบัญชีมืออาชีพในราคาที่จับต้องได้",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

/* ── FAQ Data ── */
const faqs = [
  {
    q: "Thai ACC คืออะไร",
    a: "Thai ACC คือโปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย SME ระบบรองรับการออกใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice) คำนวณ VAT และ WHT อัตโนมัติ บันทึกรายรับรายจ่าย จัดการสต็อกสินค้า และออกรายงานภาษีครบถ้วนตามที่กรมสรรพากรกำหนด ใช้งานผ่านเว็บเบราว์เซอร์ได้ทันทีไม่ต้องติดตั้งโปรแกรม",
  },
  {
    q: "ใช้ Thai ACC ฟรีหรือไม่",
    a: "Thai ACC ให้ใช้งานฟรีสำหรับธุรกิจขนาดเล็กและขนาดกลาง ไม่มีค่าใช้จ่ายรายเดือน ไม่มีข้อจำกัดจำนวนใบแจ้งหนี้หรือเอกสาร สามารถอัปเกรดเป็นแพ็กเกจที่มีฟีเจอร์เพิ่มเติมได้เมื่อธุรกิจเติบโต",
  },
  {
    q: "รองรับ e-Tax Invoice ของกรมสรรพากรหรือไม่",
    a: "รองรับเต็มรูปแบบ Thai ACC สร้างไฟล์ XML ตามมาตรฐาน e-Tax Invoice ของกรมสรรพากรโดยตรง ผู้ใช้สามารถส่งอีเมล e-Tax ให้ลูกค้า หรือเชื่อมต่อ API กับระบบของกรมสรรพากรได้ผ่านระบบที่มีความปลอดภัยสูง",
  },
  {
    q: "คำนวณ VAT และ WHT อย่างไร",
    a: "ระบบคำนวณ VAT 7% และ WHT ตามประเภทธุรกรรมอัตโนมัติ บริการ 3% ค่าเช่า 5% ค่าโฆษณา 2% ค่าขนส่ง 1% ระบบสร้าง Journal Entry บัญชีคู่โดยอัตโนมัติทุกครั้งที่มีการบันทึกธุรกรรม มั่นใจได้ว่าตัวเลขถูกต้องตามมาตรฐานบัญชีไทย",
  },
  {
    q: "เหมาะกับธุรกิจแบบไหน",
    a: "Thai ACC เหมาะกับธุรกิจ SME ทุกประเภท ร้านค้าออนไลน์ บริษัทขนส่ง ร้านอาหาร คลินิก สำนักงานบัญชี และธุรกิจนำเข้าส่งออก ระบบรองรับหลายสกุลเงินและการบัญชีโครงการ ช่วยให้ธุรกิจขนาดเล็กมีระบบบัญชีมืออาชีพในราคาที่จับต้องได้",
  },
  {
    q: "ข้อมูลปลอดภัยหรือไม่",
    a: "Thai ACC ใช้ระบบรักษาความปลอดภัยระดับสูง ข้อมูลเข้ารหัส SSL/TLS แยกฐานข้อมูลตามบริษัท (multi-tenant) มีการสำรองข้อมูลอัตโนมัติทุกวัน และรองรับการลบแบบ soft-delete เพื่อป้องกันการสูญหายของข้อมูล",
  },
  {
    q: "มีรายงานภาษีอะไรบ้าง",
    a: "ระบบออกรายงานภาษีครบถ้วน ได้แก่ งบทดลอง Trial Balance งบกำไรขาดทุน Income Statement งบดุล Balance Sheet รายงานอายุลูกหนี้ AR Aging รายงานอายุเจ้าหนี้ AP Aging และรายงานภาษีซื้อ-ขายสำหรับการยื่น P.P.30",
  },
  {
    q: "ใช้งานบนมือถือได้หรือไม่",
    a: "ได้ Thai ACC เป็นระบบ Responsive Design ใช้งานบนมือถือ แท็บเล็ต และคอมพิวเตอร์ได้อย่างสมบูรณ์ ไม่ต้องดาวน์โหลดแอป เปิดเว็บเบราว์เซอร์แล้วเข้าใช้งานได้ทันทีทุกที่ทุกเวลา",
  },
  {
    q: "ถ่ายโอนข้อมูลจาก Excel ได้หรือไม่",
    a: "ได้ Thai ACC รองรับการนำเข้าข้อมูลลูกค้า สินค้า และธุรกรรมจากไฟล์ CSV นอกจากนี้ยังมีระบบนำเข้า Statement ธนาคารอัตโนมัติจาก KBank SCB BBL เพื่อทำ Bank Reconciliation ได้อย่างรวดเร็ว",
  },
  {
    q: "ต้องมีความรู้บัญชีถึงใช้ได้หรือไม่",
    a: "ไม่จำเป็น Thai ACC ออกแบบมาให้ใช้งานง่าย ระบบบันทึกบัญชีคู่ (Double Entry) อัตโนมัติในพื้นหลัง ผู้ใช้เพียงบันทึกเอกสารขาย ซื้อ หรือเบิกจ่าย ระบบจะสร้าง Journal Entry ที่ถูกต้องให้โดยอัตโนมัติ ทีมงานมีคู่มือและวิดีโอสอนใช้งานฟรี",
  },
];

/* ── Feature Card ── */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-cyan-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Step Card ── */
function StepCard({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-cyan-200">
        {num}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-xs">{desc}</p>
    </div>
  );
}

/* ── Comparison Row ── */
function CompareRow({
  feature,
  thaiacc,
  excel,
  others,
}: {
  feature: string;
  thaiacc: string;
  excel: string;
  others: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 py-3 px-4 border-b border-slate-100 last:border-0">
      <div className="text-sm text-slate-700 font-medium">{feature}</div>
      <div className="text-sm text-emerald-700 font-medium flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" /> {thaiacc}
      </div>
      <div className="text-sm text-slate-500">{excel}</div>
      <div className="text-sm text-slate-500">{others}</div>
    </div>
  );
}

/* ── Main Page ── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Head>
        <title>Thai ACC — โปรแกรมบัญชีออนไลน์ครบวงจร สำหรับ SME | ฟรี</title>
        <meta
          name="description"
          content="โปรแกรมบัญชีออนไลน์ฟรีสำหรับธุรกิจไทย รองรับ e-Tax Invoice VAT WHT จัดการสต็อก FIFO รายงานภาษีครบถ้วนตามกรมสรรพากร ใช้งานผ่านเว็บได้ทันที"
        />
        <meta name="keywords" content="โปรแกรมบัญชีออนไลน์, ระบบบัญชีออนไลน์, e-Tax Invoice, บัญชี SME, VAT, WHT, กรมสรรพากร" />
        <meta property="og:title" content="Thai ACC — โปรแกรมบัญชีออนไลน์ครบวงจร สำหรับ SME" />
        <meta property="og:description" content="บัญชีออนไลน์ฟรี รองรับ e-Tax Invoice VAT WHT และรายงานภาษีครบถ้วนตามกรมสรรพากร" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://acc3.k56mm.uk/home" />
      </Head>
      <SchemaMarkup />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-cyan-600 flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="font-bold text-xl text-slate-900">Thai ACC</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">ฟีเจอร์</a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">วิธีใช้</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">ราคา</a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">คำถามที่พบบ่อย</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all"
              >
                เริ่มต้นใช้งานฟรี
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-cyan-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-xs font-medium mb-6">
                <Sparkles className="w-3 h-3" />
                โปรแกรมบัญชีออนไลน์ยอดนิยมสำหรับ SME ไทย
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                บัญชีออนไลน์
                <span className="bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                  {" "}ครบวงจร
                </span>
                <br />
                สำหรับธุรกิจไทย
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
                ออกใบกำกับภาษี <strong className="text-cyan-400">e-Tax Invoice</strong> บันทึกรายรับรายจ่าย
                จัดการสต็อก และดูรายงานภาษีครบถ้วน — ง่าย เร็ว
                ถูกต้องตาม <strong className="text-amber-400">กรมสรรพากร</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25"
                >
                  เริ่มต้นใช้งานฟรี
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ไม่ต้องใช้บัตรเครดิต
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ใช้ฟรีตลอดชีพ
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ยกเลิกได้ทุกเมื่อ
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-slate-800/80 backdrop-blur rounded-2xl shadow-2xl shadow-cyan-900/20 border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400 ml-2">Thai ACC Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-950/50 rounded-xl p-4 border border-emerald-900/50">
                    <p className="text-xs text-emerald-400 mb-1">ยอดขายรวม</p>
                    <p className="text-xl font-bold text-emerald-300">฿1,250,000</p>
                  </div>
                  <div className="bg-cyan-950/50 rounded-xl p-4 border border-cyan-900/50">
                    <p className="text-xs text-cyan-400 mb-1">รับเงินแล้ว</p>
                    <p className="text-xl font-bold text-cyan-300">฿890,000</p>
                  </div>
                  <div className="bg-amber-950/50 rounded-xl p-4 border border-amber-900/50">
                    <p className="text-xs text-amber-400 mb-1">ลูกหนี้การค้า</p>
                    <p className="text-xl font-bold text-amber-300">฿360,000</p>
                  </div>
                  <div className="bg-red-950/50 rounded-xl p-4 border border-red-900/50">
                    <p className="text-xs text-red-400 mb-1">เกินกำหนด</p>
                    <p className="text-xl font-bold text-red-300">฿45,000</p>
                  </div>
                </div>
                <div className="mt-4 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-300">แนวโน้มยอดขาย</span>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 45, 80, 55, 90].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">e-Tax ส่งสำเร็จ</p>
                    <p className="text-xs text-slate-500">INV-2026-0042</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-8">เชื่อถือได้โดยธุรกิจไทย พร้อมรองรับมาตรฐานกรมสรรพากร</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-6 h-6" />, label: "รองรับ e-Tax Invoice", sub: "กรมสรรพากร" },
              { icon: <Calculator className="w-6 h-6" />, label: "VAT / WHT", sub: "คำนวณอัตโนมัติ" },
              { icon: <Lock className="w-6 h-6" />, label: "SSL Encryption", sub: "ความปลอดภัยสูง" },
              { icon: <Zap className="w-6 h-6" />, label: "บัญชีคู่อัตโนมัติ", sub: "GL Posting" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                  {badge.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{badge.label}</p>
                  <p className="text-xs text-slate-500">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              ทุกฟีเจอร์ที่ธุรกิจไทยต้องการ
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              ไม่ว่าธุรกิจของคุณจะเป็นร้านค้าออนไลน์ บริษัทขนส่ง หรือสำนักงานบัญชี
              Thai ACC มีเครื่องมือครบครันให้คุณจัดการบัญชีได้อย่างมืออาชีพ
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Receipt className="w-6 h-6" />}
              title="e-Tax Invoice"
              desc="ออกใบกำกับภาษีอิเล็กทรอนิกส์ตามมาตรฐานกรมสรรพากร สร้างไฟล์ XML พร้อมส่งอีเมลให้ลูกค้าได้ทันที"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="จัดการลูกหนี้-เจ้าหนี้"
              desc="ติดตามใบแจ้งหนี้ บันทึกรับเงินและจ่ายเงิน ดูรายงานอายุลูกหนี้เจ้าหนี้แบบ realtime"
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="บัญชีสต็อก FIFO"
              desc="ปรับสต็อกสินค้าได้หลายประเภท คำนวณต้นทุนสินค้าด้วยวิธี FIFO อัตโนมัติ พร้อมประวัติการเคลื่อนไหว"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="รายงานภาษีครบถ้วน"
              desc="งบทดลอง งบกำไรขาดทุน งบดุล รายงานภาษีซื้อขายสำหรับยื่น P.P.30 ออกได้ทันทีไม่ต้องคำนวณเอง"
            />
            <FeatureCard
              icon={<Briefcase className="w-6 h-6" />}
              title="ควบคุมต้นทุนโครงการ"
              desc="ติดตามรายได้และต้นทุนแยกต่องาน ดูกำไรขาดทุนแบบ realtime ช่วยตัดสินใจเรื่องราคาและต้นทุน"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="หลายสกุลเงิน"
              desc="รองรับ THB USD EUR CNY JPY GBP พร้อมอัตราแลกเปลี่ยนที่อัปเดตได้ บันทึกบัญชีเป็นสกุลเงินหลักอัตโนมัติ"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              เริ่มต้นใช้งานใน 3 ขั้นตอน
            </h2>
            <p className="text-lg text-slate-600">
              ไม่ต้องติดตั้งโปรแกรม ไม่ต้องมีความรู้บัญชีลึก ใช้งานได้ทันที
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              num="1"
              title="ลงทะเบียนฟรี"
              desc="สร้างบัญชีด้วยอีเมลในเวลาไม่ถึง 1 นาที ระบบจะสร้างบัญชีแยกประเภท (Chart of Accounts) มาตรฐานให้อัตโนมัติ"
            />
            <StepCard
              num="2"
              title="บันทึกธุรกรรม"
              desc="สร้างใบแจ้งหนี้ ใบเสร็จ ใบสั่งซื้อ หรือบันทึกค่าใช้จ่าย ระบบจะคำนวณ VAT WHT และสร้างบัญชีคู่อัตโนมัติ"
            />
            <StepCard
              num="3"
              title="ดูรายงานและยื่นภาษี"
              desc="เข้าถึงรายงานภาษีและงบการเงินได้ทุกเมื่อ นำข้อมูลไปยื่นภาษีกับกรมสรรพากรได้ทันที"
            />
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              เปรียบเทียบกับทางเลือกอื่น
            </h2>
            <p className="text-lg text-slate-600">
              ทำไมธุรกิจไทยถึงเลือก Thai ACC
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 py-4 px-4 bg-slate-50 border-b border-slate-200 font-semibold text-sm">
              <div className="text-slate-900">ฟีเจอร์</div>
              <div className="text-cyan-700">Thai ACC</div>
              <div className="text-slate-600">Excel</div>
              <div className="text-slate-600">โปรแกรมอื่น</div>
            </div>
            <CompareRow feature="e-Tax Invoice" thaiacc="รองรับ" excel="ไม่มี" others="บางราย" />
            <CompareRow feature="VAT/WHT อัตโนมัติ" thaiacc="ครบ" excel="คำนวณเอง" others="ส่วนใหญ่มี" />
            <CompareRow feature="บัญชีคู่อัตโนมัติ" thaiacc="มี" excel="ทำเอง" others="ไม่ทุกราย" />
            <CompareRow feature="บัญชีสต็อก FIFO" thaiacc="มี" excel="ยากมาก" others="บางราย" />
            <CompareRow feature="รายงานภาษี" thaiacc="ครบ" excel="ทำเอง" others="ค่าใช้จ่ายสูง" />
            <CompareRow feature="ราคา" thaiacc="ฟรี" excel="ฟรี" others="เริ่ม 500-2,000/เดือน" />
            <CompareRow feature="หลายสกุลเงิน" thaiacc="6 สกุล" excel="คำนวณเอง" others="เพิ่มเงิน" />
            <CompareRow feature="ควบคุมต้นทุนโครงการ" thaiacc="มี" excel="ทำเอง" others="แพ็กเกจสูง" />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              เริ่มต้นใช้งาน <span className="text-amber-600">ฟรี</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Thai ACC ให้ใช้งานฟรีสำหรับธุรกิจขนาดเล็ก ไม่มีข้อจำกัดจำนวนเอกสาร
              ไม่ต้องใช้บัตรเครดิต ไม่มีค่าใช้จ่ายแอบแฝง
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border-2 border-amber-200 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium">
                  แนะนำ
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">SME Free</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-slate-900">฿0</span>
                  <span className="text-slate-500">/เดือน</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">ฟรีตลอดชีพ</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "เอกสารไม่จำกัดจำนวน",
                  "e-Tax Invoice ครบฟีเจอร์",
                  "VAT / WHT คำนวณอัตโนมัติ",
                  "รายงานภาษีครบถ้วน",
                  "จัดการสต็อก FIFO",
                  "บัญชีโครงการ",
                  "หลายสกุลเงิน",
                  "รองรับ 1 ผู้ใช้",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all"
              >
                สมัครใช้งานฟรี
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              คำถามที่พบบ่อย
            </h2>
            <p className="text-lg text-slate-600">
              คำตอบสำหรับคำถามที่ลูกค้าถามบ่อยที่สุด
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-900 pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            เริ่มต้นจัดการบัญชี
            <br />
            ให้เป็นระบบวันนี้
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            สมัครใช้งานฟรี ไม่ต้องใช้บัตรเครดิต ไม่มีข้อผูกมัด
            ใช้เวลาไม่ถึง 1 นาทีก็เริ่มบันทึกธุรกรรมแรกได้ทันที
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
            >
              สมัครใช้งานฟรี
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border-2 border-white/20 hover:bg-white/20 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            อัปเดตล่าสุด: พฤษภาคม 2569 · ใช้งานได้บนมือถือและคอมพิวเตอร์
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-cyan-600 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <span className="font-bold text-xl text-white">Thai ACC</span>
              </div>
              <p className="text-sm">
                โปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย SME รองรับ e-Tax Invoice VAT WHT และรายงานภาษีครบถ้วน
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">ฟีเจอร์</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">e-Tax Invoice</a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">จัดการลูกหนี้-เจ้าหนี้</a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">บัญชีสต็อก</a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">รายงานภาษี</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">บริษัท</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-cyan-400 transition-colors cursor-pointer">เกี่ยวกับเรา</span></li>
                <li><span className="hover:text-cyan-400 transition-colors cursor-pointer">ติดต่อ</span></li>
                <li><span className="hover:text-cyan-400 transition-colors cursor-pointer">นโยบายความเป็นส่วนตัว</span></li>
                <li><span className="hover:text-cyan-400 transition-colors cursor-pointer">ข้อกำหนดการใช้งาน</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">ติดต่อ</h4>
              <ul className="space-y-2 text-sm">
                <li>support@thai-acc.com</li>
                <li>กรุงเทพมหานคร ประเทศไทย</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2026 Thai ACC. สงวนลิขสิทธิ์.</p>
            <p className="text-sm">เวอร์ชัน 0.3.0-alpha</p>
          </div>
        </div>
      </footer>
    </>
  );
}
