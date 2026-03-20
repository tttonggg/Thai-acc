// Thai Accounting Server-Only Functions
// ฟังก์ชันสำหรับการบัญชีไทยที่ใช้ฐานข้อมูล (Server-side only)
// NOTE: These functions import from './db' and can only be used in server contexts

import { db } from './db';

// สร้างเลขที่เอกสาร
export async function generateDocumentNumber(type: string): Promise<string> {
  const docNum = await db.documentNumber.findUnique({
    where: { type },
  });

  if (!docNum) {
    throw new Error(`Document type ${type} not found`);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  let currentNo = docNum.currentNo + 1;

  // ตรวจสอบการรีเซ็ตเลขที่
  if (docNum.resetMonthly || docNum.resetYearly) {
    // สำหรับตอนนี้ให้เริ่มจาก 1 ทุกเดือน
    currentNo = 1;
  }

  // อัพเดทเลขที่ปัจจุบัน
  await db.documentNumber.update({
    where: { type },
    data: { currentNo },
  });

  // สร้างเลขที่จากรูปแบบ
  let documentNo = docNum.format
    .replace('{prefix}', docNum.prefix)
    .replace('{yyyy}', year.toString())
    .replace('{yy}', (year % 100).toString())
    .replace('{mm}', month)
    .replace('{0000}', currentNo.toString().padStart(4, '0'))
    .replace('{000}', currentNo.toString().padStart(3, '0'))
    .replace('{00}', currentNo.toString().padStart(2, '0'));

  return documentNo;
}

// ดึงข้อมูลบริษัท
export async function getCompany() {
  const company = await db.company.findFirst();
  return company;
}

// ดึงผังบัญชีทั้งหมด
export async function getChartOfAccounts() {
  const accounts = await db.chartOfAccount.findMany({
    orderBy: { code: 'asc' },
    include: {
      children: true,
    },
  });
  return accounts;
}

// ดึงบัญชีตามประเภท
export async function getAccountsByType(type: string) {
  const accounts = await db.chartOfAccount.findMany({
    where: { type: type as any, isDetail: true },
    orderBy: { code: 'asc' },
  });
  return accounts;
}

// ดึงบัญชีสำหรับ dropdown
export async function getAccountOptions() {
  const accounts = await db.chartOfAccount.findMany({
    where: { isDetail: true, isActive: true },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
    },
  });
  return accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
    code: a.code,
    name: a.name,
    type: a.type,
  }));
}
