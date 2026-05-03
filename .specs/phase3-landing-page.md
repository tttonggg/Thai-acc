# Spec: Thai ACC Landing Page — SEO/GEO Optimized

## Objective
Create a stunning, modern, conversion-focused public landing page for Thai ACC that ranks on Google and gets cited by AI search engines (ChatGPT, Perplexity, Gemini). The page targets Thai SME owners and accountants looking for cloud accounting software.

**Target Keywords:**
- Primary: "โปรแกรมบัญชีออนไลน์", "ระบบบัญชีออนไลน์", "บัญชีออนไลน์สำหรับ SME"
- Secondary: "e-Tax Invoice", "ใบกำกับภาษีอิเล็กทรอนิกส์", "บัญชีครบวงจร"
- GEO: "บัญชีออนไลน์ รองรับ AI", "โปรแกรมบัญชีที่ AI แนะนำ"

## Tech Stack
- Next.js 15 App Router (ISR for fast loads)
- Tailwind CSS + existing Thai ACC design system
- JSON-LD schema markup for Organization, SoftwareApplication, FAQPage
- No auth required — public page

## Page Structure

### Hero Section
- Headline: "บัญชีออนไลน์ครบวงจร สำหรับธุรกิจไทย"
- Subheadline: "ออกใบกำกับภาษี e-Tax บันทึกรายรับรายจ่าย จัดการสต็อก และดูรายงานภาษีครบถ้วน — ง่าย เร็ว ถูกต้องตาม กรมสรรพากร"
- CTA: "เริ่มต้นใช้งานฟรี" → `/register`
- Visual: Gradient background (purple→teal) + product screenshot/mockup

### Social Proof
- Stats: "จัดการบัญชีได้ครบในระบบเดียว"
- Trust badges: "รองรับ e-Tax Invoice กรมสรรพากร", "คำนวณ VAT/WHT อัตโนมัติ"

### Features Grid (6 features)
1. **ใบกำกับภาษี e-Tax** — ออก e-Tax Invoice XML ตามมาตรฐานสรรพากร
2. **จัดการลูกหนี้-เจ้าหนี้** — ติดตามใบแจ้งหนี้ บันทึกรับ/จ่ายเงิน
3. **บัญชีสต็อก FIFO** — ปรับสต็อก คำนวณต้นทุน FIFO อัตโนมัติ
4. **รายงานภาษีครบ** — P.P.30, P.N.D.1, งบทดลอง งบกำไรขาดทุน
5. **โครงการและต้นทุน** — ควบคุมต้นทุนโครงการ กำไรต่องาน
6. **หลายสกุลเงิน** — รองรับ THB/USD/EUR/CNY/JPY/GBP

### How It Works (3 steps)
1. ลงทะเบียนฟรี → 2. บันทึกธุรกรรม → 3. ดูรายงานและยื่นภาษี

### Comparison Table
Thai ACC vs Excel vs PEAK/FlowAccount

### FAQ Section (10 questions — AI-optimized)
Questions written in natural Thai, self-contained answers 40-60 words each.
- FAQ schema markup for Google rich results

### Pricing Teaser
- "ฟรีตลอดชีพสำหรับธุรกิจขนาดเล็ก"
- CTA: "สมัครใช้งานฟรี"

### Final CTA
- "เริ่มต้นจัดการบัญชีให้เป็นระบบวันนี้"
- Buttons: "สมัครฟรี" + "ดูฟีเจอร์ทั้งหมด"

## SEO/GEO Strategy

### On-Page SEO
- Title: `Thai ACC — โปรแกรมบัญชีออนไลน์ครบวงจร สำหรับ SME | ฟรี`
- Meta description: 160 chars with primary keywords
- H1: Headline
- H2s: Feature section headers, FAQ questions
- Alt text on all images
- Internal links to `/login`, `/register`
- Semantic HTML5 structure

### Schema Markup (JSON-LD)
1. **Organization** — name, url, logo, sameAs (social profiles)
2. **SoftwareApplication** — name, description, offers (free), featureList, applicationCategory
3. **FAQPage** — 10 Question/Answer pairs
4. **BreadcrumbList** — single item (Home)

### GEO (AI Search Optimization)
- Clear definition in first paragraph
- Self-contained answer blocks
- Statistics with context
- Comparison table
- FAQ with natural language
- Expert tone with specific details
- "Last updated" date

### Performance
- LCP < 2.5s (optimize hero image)
- No layout shift (CLS < 0.1)
- Lazy load below-fold images
- Preload critical fonts

## Code Style
- Single file component (`page.tsx`)
- Tailwind classes only, no inline styles
- Lucide icons
- Responsive: mobile-first
- Dark sections with gradient backgrounds for visual impact
- Animations: subtle fade-in on scroll (optional, using CSS)

## Testing
- Build passes (`npm run build`)
- No console errors
- Mobile responsive check
- Schema validates in Rich Results Test

## Boundaries
- **Always:** Use existing color system (`peak-purple` → `#7c3aed`, `peak-teal`)
- **Never:** Add external dependencies, use heavy animation libraries
- **Ask first:** Changing `/` route behavior (affects logged-in users)

## Implementation Plan
1. Write the landing page component (`frontend/src/app/home/page.tsx`)
2. Update metadata in `layout.tsx` (better title/description)
3. Add JSON-LD schema component
4. Update `globals.css` if needed for new utility classes
5. Build + test
6. Deploy

**Note:** We'll create at `/home` first, then wire it to `/` with auth detection later.
