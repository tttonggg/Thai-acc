// Thai Accounting Utilities
// ฟังก์ชันช่วยเหลือสำหรับการบัญชีไทย
// NOTE: This file should NOT import from './db' to avoid PrismaClient browser bundle issues

// ประเภทบัญชี
export const ACCOUNT_TYPES = {
  ASSET: { code: '1', name: 'สินทรัพย์', nameEn: 'Assets' },
  LIABILITY: { code: '2', name: 'หนี้สิน', nameEn: 'Liabilities' },
  EQUITY: { code: '3', name: 'ส่วนของผู้ถือหุ้น', nameEn: 'Equity' },
  REVENUE: { code: '4', name: 'รายได้', nameEn: 'Revenue' },
  EXPENSE: { code: '5', name: 'ค่าใช้จ่าย', nameEn: 'Expenses' },
} as const;

// อัตราภาษีมูลค่าเพิ่ม
export const VAT_RATE = 7;

// อัตราภาษีหัก ณ ที่จ่าย
export const WHT_RATES = {
  // ภงด.3 - เงินเดือน/ค่าจ้าง
  PND3: {
    name: 'ภงด.3',
    description: 'ภาษีเงินได้หัก ณ ที่จ่าย จากเงินเดือน/ค่าจ้าง',
    rates: [0, 5, 10, 15, 20, 25, 30, 35], // Progressive rates
  },
  // ภงด.53 - ค่าบริการ/ค่าเช่า
  PND53: {
    name: 'ภงด.53',
    description: 'ภาษีเงินได้หัก ณ ที่จ่าย จากค่าบริการ/ค่าเช่า',
    rates: {
      service: 3, // ค่าบริการ 3%
      rent: 5, // ค่าเช่า 5%
      professional: 3, // ค่าบริการวิชาชีพ 3%
      contract: 1, // ค่าจ้างทำของ 1%
      advertising: 2, // ค่าโฆษณา 2%
    },
  },
} as const;

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย (DD/MM/YYYY)
export function formatThaiDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() + 543; // แปลงเป็นพ.ศ.
  return `${day}/${month}/${year}`;
}

// ฟังก์ชันแปลงวันที่เป็นรูปแบบสากล (DD/MM/YYYY)
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ฟังก์ชันแปลงตัวเลขเป็นรูปแบบเงินบาท
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ฟังก์ชันแปลงตัวเลขเป็นรูปแบบตัวเลขธรรมดา
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// ฟังก์ชันแปลงเลขเป็นคำอ่านภาษาไทย
export function numberToThaiText(num: number): string {
  const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const tens = [
    '',
    'สิบ',
    'ยี่สิบ',
    'สามสิบ',
    'สี่สิบ',
    'ห้าสิบ',
    'หกสิบ',
    'เจ็ดสิบ',
    'แปดสิบ',
    'เก้าสิบ',
  ];
  const scales = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  if (num === 0) return 'ศูนย์บาทถ้วน';

  let result = '';
  const parts = num.toFixed(2).split('.');
  const baht = parseInt(parts[0]);
  const satang = parseInt(parts[1]);

  // แปลงส่วนบาท
  if (baht > 0) {
    result = convertNumberToText(baht, ones, tens) + 'บาท';
  }

  // แปลงส่วนสตางค์
  if (satang > 0) {
    result += convertNumberToText(satang, ones, tens) + 'สตางค์';
  } else if (baht > 0) {
    result += 'ถ้วน';
  }

  return result;
}

function convertNumberToText(num: number, ones: string[], tens: string[]): string {
  if (num === 0) return '';

  let result = '';
  const numStr = num.toString();
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const position = len - i - 1;

    if (digit === 0) continue;

    if (position === 1 && digit === 1) {
      result += 'สิบ';
    } else if (position === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (position === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด';
    } else {
      result += ones[digit];
      if (position > 0) {
        result += ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'][position];
      }
    }
  }

  return result;
}

// คำนวณ VAT
export function calculateVAT(
  amount: number,
  rate: number = VAT_RATE,
  isInclusive: boolean = false
): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  if (isInclusive) {
    const subtotal = amount / (1 + rate / 100);
    const vatAmount = amount - subtotal;
    return { subtotal, vatAmount, total: amount };
  } else {
    const vatAmount = amount * (rate / 100);
    const total = amount + vatAmount;
    return { subtotal: amount, vatAmount, total };
  }
}

// คำนวณภาษีหัก ณ ที่จ่าย
export function calculateWHT(amount: number, rate: number): number {
  return amount * (rate / 100);
}

// NOTE: Server-only functions moved to thai-accounting-server.ts:
// - generateDocumentNumber
// - getCompany
// - getChartOfAccounts
// - getAccountsByType
// - getAccountOptions

// ตรวจสอบยอดเดบิตเท่ากับเครดิต
export function validateBalance(debit: number, credit: number): boolean {
  return Math.abs(debit - credit) < 0.01;
}

// คำนวณยอดลูกหนี้/เจ้าหนี้ตามอายุหนี้
export function calculateAging(
  transactions: { date: Date; amount: number; paidAmount: number }[],
  asOfDate: Date = new Date()
): {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
} {
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
    total: 0,
  };

  const asOfTime = asOfDate.getTime();

  for (const tx of transactions) {
    const outstanding = tx.amount - tx.paidAmount;
    if (outstanding <= 0) continue;

    const daysDiff = Math.floor((asOfTime - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      aging.current += outstanding;
    } else if (daysDiff <= 30) {
      aging.days30 += outstanding;
    } else if (daysDiff <= 60) {
      aging.days60 += outstanding;
    } else if (daysDiff <= 90) {
      aging.days90 += outstanding;
    } else {
      aging.over90 += outstanding;
    }
  }

  aging.total = aging.current + aging.days30 + aging.days60 + aging.days90 + aging.over90;
  return aging;
}
