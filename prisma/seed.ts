import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Cleanup function to remove seed data
async function cleanSeedData() {
  console.log('🧹 Cleaning existing seed data...');

  // Delete in correct order due to foreign key constraints
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.journalLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});

  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Optional: Clean existing seed data before seeding
  // Uncomment the line below to start fresh each time
  // await cleanSeedData()

  // ============================================
  // Create Company
  // ============================================
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'บริษัท ไทย แอคเคานติ้ง จำกัด',
      nameEn: 'Thai Accounting Co., Ltd.',
      taxId: '0123456789012',
      branchCode: '00000',
      address: '123 ถนนสุขุมวิท แขวงคลองตัน',
      subDistrict: 'คลองตัน',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      phone: '02-123-4567',
      fax: '02-123-4568',
      email: 'info@thaiaccounting.com',
      website: 'www.thaiaccounting.com',
      fiscalYearStart: 1,
    },
  });
  console.log('✅ Company created:', company.name);

  // ============================================
  // Create Users
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedPasswordAcc = await bcrypt.hash('acc123', 10);
  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  const hashedPasswordViewer = await bcrypt.hash('viewer123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@thaiaccounting.com' },
    update: {},
    create: {
      email: 'admin@thaiaccounting.com',
      name: 'ผู้ดูแลระบบ',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  const accountantUser = await prisma.user.upsert({
    where: { email: 'accountant@thaiaccounting.com' },
    update: {},
    create: {
      email: 'accountant@thaiaccounting.com',
      name: 'นักบัญชี ทดสอบ',
      password: hashedPasswordAcc,
      role: 'ACCOUNTANT',
      isActive: true,
    },
  });
  console.log('✅ Accountant user created:', accountantUser.email);

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@thaiaccounting.com' },
    update: {},
    create: {
      email: 'user@thaiaccounting.com',
      name: 'ผู้ใช้ทั่วไป',
      password: hashedPasswordUser,
      role: 'USER',
      isActive: true,
    },
  });
  console.log('✅ Normal user created:', normalUser.email);

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@thaiaccounting.com' },
    update: {},
    create: {
      email: 'viewer@thaiaccounting.com',
      name: 'ผู้ดูเท่านั้น',
      password: hashedPasswordViewer,
      role: 'VIEWER',
      isActive: true,
    },
  });
  console.log('✅ Viewer user created:', viewerUser.email);

  // ============================================
  // Create Thai Chart of Accounts
  // ============================================
  const accounts = [
    // หมวดสินทรัพย์ (1xxx)
    { code: '1000', name: 'สินทรัพย์', type: 'ASSET', level: 1, isDetail: false },
    {
      code: '1100',
      name: 'สินทรัพย์หมุนเวียน',
      type: 'ASSET',
      level: 2,
      isDetail: false,
      parentId: '1000',
    },
    {
      code: '1110',
      name: 'เงินสดและเงินฝากธนาคาร',
      type: 'ASSET',
      level: 3,
      isDetail: false,
      parentId: '1100',
    },
    {
      code: '1111',
      name: 'เงินสด - ธนาคารกรุงเทพ',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1110',
    },
    {
      code: '1112',
      name: 'เงินสด - ธนาคารกสิกรไทย',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1110',
    },
    {
      code: '1113',
      name: 'เงินสด - เงินสดย่อย',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1110',
    },
    {
      code: '1101',
      name: 'เงินฝากธนาคาร',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1110',
    },
    {
      code: '1102',
      name: 'ลูกหนี้การค้า',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1120',
    },
    {
      code: '1103',
      name: 'ภาษีมูลค่าเพิ่มซื้อ',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1130',
    },
    {
      code: '1120',
      name: 'ลูกหนี้การค้า',
      type: 'ASSET',
      level: 3,
      isDetail: false,
      parentId: '1100',
    },
    {
      code: '1121',
      name: 'ลูกหนี้การค้า',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1120',
    },
    {
      code: '1122',
      name: 'สำรองค่าเสื่อมราคาลูกหนี้',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1120',
    },
    {
      code: '1130',
      name: 'ลูกหนี้อื่น',
      type: 'ASSET',
      level: 3,
      isDetail: false,
      parentId: '1100',
    },
    { code: '1131', name: 'เงินมัดจำ', type: 'ASSET', level: 4, isDetail: true, parentId: '1130' },
    {
      code: '1132',
      name: 'ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1130',
    },
    {
      code: '1140',
      name: 'สินค้าคงเหลือ',
      type: 'ASSET',
      level: 3,
      isDetail: true,
      parentId: '1100',
    },
    {
      code: '1145',
      name: 'ภาษีมูลค่าเพิ่มซื้อ',
      type: 'ASSET',
      category: 'CURRENT_ASSET',
      isActive: true,
    },
    {
      code: '1150',
      name: 'ค่าใช้จ่ายจ่ายล่วงหน้า',
      type: 'ASSET',
      level: 3,
      isDetail: true,
      parentId: '1100',
    },
    {
      code: '1200',
      name: 'สินทรัพย์ไม่หมุนเวียน',
      type: 'ASSET',
      level: 2,
      isDetail: false,
      parentId: '1000',
    },
    {
      code: '1210',
      name: 'ที่ดิน อาคารและอุปกรณ์',
      type: 'ASSET',
      level: 3,
      isDetail: false,
      parentId: '1200',
    },
    { code: '1211', name: 'ที่ดิน', type: 'ASSET', level: 4, isDetail: true, parentId: '1210' },
    { code: '1212', name: 'อาคาร', type: 'ASSET', level: 4, isDetail: true, parentId: '1210' },
    {
      code: '1213',
      name: 'ค่าเสื่อมราคาอาคารสะสม',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1210',
    },
    {
      code: '1214',
      name: 'เครื่องจักรและอุปกรณ์',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1210',
    },
    {
      code: '1215',
      name: 'ค่าเสื่อมราคาเครื่องจักรสะสม',
      type: 'ASSET',
      level: 4,
      isDetail: true,
      parentId: '1210',
    },
    {
      code: '1220',
      name: 'สินทรัพย์ไม่มีตัวตน',
      type: 'ASSET',
      level: 3,
      isDetail: true,
      parentId: '1200',
    },

    // หมวดหนี้สิน (2xxx)
    { code: '2000', name: 'หนี้สิน', type: 'LIABILITY', level: 1, isDetail: false },
    {
      code: '2100',
      name: 'หนี้สินหมุนเวียน',
      type: 'LIABILITY',
      level: 2,
      isDetail: false,
      parentId: '2000',
    },
    {
      code: '2110',
      name: 'เจ้าหนี้การค้า',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2100',
    },
    {
      code: '2120',
      name: 'ตั๋วเงินจ่าย',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2100',
    },
    {
      code: '2130',
      name: 'เจ้าหนี้อื่น',
      type: 'LIABILITY',
      level: 3,
      isDetail: false,
      parentId: '2100',
    },
    {
      code: '2131',
      name: 'ภาษีเงินได้หัก ณ ที่จ่าย',
      type: 'LIABILITY',
      level: 4,
      isDetail: true,
      parentId: '2130',
    },
    {
      code: '2132',
      name: 'ภาษีมูลค่าเพิ่มต้องชำระ',
      type: 'LIABILITY',
      level: 4,
      isDetail: true,
      parentId: '2130',
    },
    {
      code: '2133',
      name: 'ประกันสังคมต้องจ่าย',
      type: 'LIABILITY',
      level: 4,
      isDetail: true,
      parentId: '2130',
    },
    {
      code: '2140',
      name: 'เงินเดือนต้องจ่าย',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2100',
    },
    {
      code: '2150',
      name: 'ภาษีเงินได้นิติบุคคลต้องชำระ',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2100',
    },
    {
      code: '2160',
      name: 'สินค้ารับมาแต่ยังไม่ออกใบกำกับ',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2100',
    },
    {
      code: '2200',
      name: 'หนี้สินไม่หมุนเวียน',
      type: 'LIABILITY',
      level: 2,
      isDetail: false,
      parentId: '2000',
    },
    {
      code: '2210',
      name: 'เงินกู้ยืมระยะยาว',
      type: 'LIABILITY',
      level: 3,
      isDetail: true,
      parentId: '2200',
    },

    // หมวดทุน (3xxx)
    { code: '3000', name: 'ส่วนของผู้ถือหุ้น', type: 'EQUITY', level: 1, isDetail: false },
    {
      code: '3100',
      name: 'ทุนจดทะเบียน',
      type: 'EQUITY',
      level: 2,
      isDetail: false,
      parentId: '3000',
    },
    {
      code: '3110',
      name: 'ทุนจดทะเบียนสามัญ',
      type: 'EQUITY',
      level: 3,
      isDetail: true,
      parentId: '3100',
    },
    {
      code: '3200',
      name: 'ทุนเกินมูลค่าหุ้น',
      type: 'EQUITY',
      level: 2,
      isDetail: true,
      parentId: '3000',
    },
    {
      code: '3300',
      name: 'กำไร(ขาดทุน)สะสม',
      type: 'EQUITY',
      level: 2,
      isDetail: true,
      parentId: '3000',
    },
    { code: '3400', name: 'งวดบัญชี', type: 'EQUITY', level: 2, isDetail: false, parentId: '3000' },
    {
      code: '3410',
      name: 'งวดบัญชีเจ้าหนี้',
      type: 'EQUITY',
      level: 3,
      isDetail: true,
      parentId: '3400',
    },

    // หมวดรายได้ (4xxx)
    { code: '4000', name: 'รายได้', type: 'REVENUE', level: 1, isDetail: false },
    {
      code: '4100',
      name: 'รายได้จากการขาย',
      type: 'REVENUE',
      level: 2,
      isDetail: false,
      parentId: '4000',
    },
    {
      code: '4110',
      name: 'รายได้จากการขายสินค้า',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4100',
    },
    {
      code: '4120',
      name: 'รายได้จากการให้บริการ',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4100',
    },
    {
      code: '4130',
      name: 'ส่วนลดให้แก่ลูกค้า',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4100',
    },
    {
      code: '4200',
      name: 'รายได้อื่น',
      type: 'REVENUE',
      level: 2,
      isDetail: false,
      parentId: '4000',
    },
    {
      code: '4210',
      name: 'ดอกเบี้ยรับ',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4200',
    },
    {
      code: '4220',
      name: 'รายได้ค่าเช่า',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4200',
    },
    {
      code: '4230',
      name: 'รายได้จากการจำหน่ายสินทรัพย์',
      type: 'REVENUE',
      level: 3,
      isDetail: true,
      parentId: '4200',
    },

    // หมวดค่าใช้จ่าย (5xxx)
    { code: '5000', name: 'ค่าใช้จ่าย', type: 'EXPENSE', level: 1, isDetail: false },
    {
      code: '5100',
      name: 'ต้นทุนขาย',
      type: 'EXPENSE',
      level: 2,
      isDetail: false,
      parentId: '5000',
    },
    {
      code: '5110',
      name: 'ต้นทุนสินค้าขาย',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5100',
    },
    {
      code: '5200',
      name: 'ค่าใช้จ่ายในการขาย',
      type: 'EXPENSE',
      level: 2,
      isDetail: false,
      parentId: '5000',
    },
    { code: '5210', name: 'ค่าโฆษณา', type: 'EXPENSE', level: 3, isDetail: true, parentId: '5200' },
    {
      code: '5220',
      name: 'ค่าเดินทาง',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5200',
    },
    {
      code: '5230',
      name: 'ค่านายหน้า',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5200',
    },
    {
      code: '5300',
      name: 'ค่าใช้จ่ายในการบริหาร',
      type: 'EXPENSE',
      level: 2,
      isDetail: false,
      parentId: '5000',
    },
    {
      code: '5310',
      name: 'เงินเดือนและค่าจ้าง',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    {
      code: '5320',
      name: 'ค่าเช่าอาคาร',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    {
      code: '5330',
      name: 'ค่าน้ำประปา',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    { code: '5340', name: 'ค่าไฟฟ้า', type: 'EXPENSE', level: 3, isDetail: true, parentId: '5300' },
    {
      code: '5350',
      name: 'ค่าโทรศัพท์และอินเทอร์เน็ต',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    {
      code: '5360',
      name: 'ค่าซ่อมแซมและบำรุงรักษา',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    { code: '5370', name: 'ค่าขนส่ง', type: 'EXPENSE', level: 3, isDetail: true, parentId: '5300' },
    {
      code: '5380',
      name: 'ค่าใช้จ่ายเบ็ดเตล็ด',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    {
      code: '5390',
      name: 'ค่าเสื่อมราคา',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5300',
    },
    {
      code: '5400',
      name: 'ค่าใช้จ่ายทางการเงิน',
      type: 'EXPENSE',
      level: 2,
      isDetail: false,
      parentId: '5000',
    },
    {
      code: '5410',
      name: 'ดอกเบี้ยจ่าย',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5400',
    },
    {
      code: '5420',
      name: 'ค่าธรรมเนียมธนาคาร',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5400',
    },
    {
      code: '5500',
      name: 'ภาษีและส่วนสมทบ',
      type: 'EXPENSE',
      level: 2,
      isDetail: false,
      parentId: '5000',
    },
    {
      code: '5510',
      name: 'ภาษีเงินได้นิติบุคคล',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5500',
    },
    {
      code: '5520',
      name: 'ภาษีธุรกิจเฉพาะ',
      type: 'EXPENSE',
      level: 3,
      isDetail: true,
      parentId: '5500',
    },
  ];

  // Create parent ID mapping
  const accountIdMap: Record<string, string> = {};

  // First pass - create all accounts
  for (const account of accounts) {
    const created = await prisma.chartOfAccount.upsert({
      where: { code: account.code },
      update: {
        name: account.name,
        type: account.type as any,
        level: account.level,
        isDetail: account.isDetail,
        isSystem: true,
      },
      create: {
        code: account.code,
        name: account.name,
        type: account.type as any,
        level: account.level,
        isDetail: account.isDetail,
        isSystem: true,
        isActive: true,
      },
    });
    accountIdMap[account.code] = created.id;
  }

  // Second pass - update parent references
  for (const account of accounts) {
    if (account.parentId) {
      await prisma.chartOfAccount.update({
        where: { code: account.code },
        data: {
          parentId: accountIdMap[account.parentId],
        },
      });
    }
  }
  console.log('✅ Chart of Accounts created:', accounts.length, 'accounts');

  // ============================================
  // Create Document Numbers
  // ============================================
  const docNumbers = [
    { type: 'JOURNAL', prefix: 'JE', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'INVOICE', prefix: 'INV', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'RECEIPT', prefix: 'RC', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'PAYMENT', prefix: 'PY', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'CREDIT_NOTE', prefix: 'CN', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'DEBIT_NOTE', prefix: 'DN', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'PURCHASE', prefix: 'PO', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'WHT_CERT', prefix: 'WHT', format: '{prefix}{yyyy}{mm}-{0000}' },
    { type: 'STOCK_TRANSFER', prefix: 'TRF', format: '{prefix}{yyyy}{mm}-{0000}' },
  ];

  for (const doc of docNumbers) {
    await prisma.documentNumber.upsert({
      where: { type: doc.type },
      update: {},
      create: {
        type: doc.type,
        prefix: doc.prefix,
        format: doc.format,
        currentNo: 0,
        resetMonthly: true,
      },
    });
  }
  console.log('✅ Document Numbers created:', docNumbers.length, 'types');

  // ============================================
  // Create Sample Customers
  // ============================================
  const customers = [
    { code: 'C001', name: 'บริษัท เอบีซี จำกัด', taxId: '0105555123456', phone: '02-111-2222' },
    {
      code: 'C002',
      name: 'บริษัท เอ็กซ์วายแซด จำกัด',
      taxId: '0105555789012',
      phone: '02-333-4444',
    },
    {
      code: 'C003',
      name: 'ห้างหุ้นส่วนจำกัด ไทยเทรดดิ้ง',
      taxId: '0105555345678',
      phone: '02-555-6666',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: {
        code: customer.code,
        name: customer.name,
        taxId: customer.taxId,
        phone: customer.phone,
        province: 'กรุงเทพมหานคร',
        creditDays: 30,
        creditLimit: 100000,
      },
    });
  }
  console.log('✅ Sample Customers created:', customers.length, 'customers');

  // ============================================
  // Create Sample Vendors
  // ============================================
  const vendors = [
    {
      code: 'V001',
      name: 'บริษัท ซัพพลายเออร์ จำกัด',
      taxId: '0105555111222',
      phone: '02-777-8888',
    },
    {
      code: 'V002',
      name: 'บริษัท โลจิสติกส์ไทย จำกัด',
      taxId: '0105555333444',
      phone: '02-999-0000',
    },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { code: vendor.code },
      update: {},
      create: {
        code: vendor.code,
        name: vendor.name,
        taxId: vendor.taxId,
        phone: vendor.phone,
        province: 'กรุงเทพมหานคร',
        creditDays: 30,
      },
    });
  }
  console.log('✅ Sample Vendors created:', vendors.length, 'vendors');

  // ============================================
  // Create Sample Products
  // ============================================
  const products = [
    { code: 'P001', name: 'สินค้าตัวอย่าง A', unit: 'ชิ้น', salePrice: 1000, costPrice: 700 },
    { code: 'P002', name: 'สินค้าตัวอย่าง B', unit: 'ชุด', salePrice: 2500, costPrice: 1800 },
    {
      code: 'S001',
      name: 'ค่าบริการให้คำปรึกษา',
      unit: 'ครั้ง',
      salePrice: 5000,
      costPrice: 0,
      type: 'SERVICE',
    },
    {
      code: 'S002',
      name: 'ค่าบริการซ่อมบำรุง',
      unit: 'ครั้ง',
      salePrice: 3000,
      costPrice: 0,
      type: 'SERVICE',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: {
        code: product.code,
        name: product.name,
        unit: product.unit,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        type: (product.type === 'SERVICE' ? 'SERVICE' : 'PRODUCT') as any,
      },
    });
  }
  console.log('✅ Sample Products created:', products.length, 'products');

  // ============================================
  // Get Account IDs for Journal Entries
  // ============================================
  const account1111 = await prisma.chartOfAccount.findUnique({ where: { code: '1111' } }); // Cash - Bangkok Bank
  const account1112 = await prisma.chartOfAccount.findUnique({ where: { code: '1112' } }); // Cash - Krungthai Bank
  const account1113 = await prisma.chartOfAccount.findUnique({ where: { code: '1113' } }); // Petty Cash
  const account1121 = await prisma.chartOfAccount.findUnique({ where: { code: '1121' } }); // Accounts Receivable
  const account1131 = await prisma.chartOfAccount.findUnique({ where: { code: '1131' } }); // Deposits
  const account1132 = await prisma.chartOfAccount.findUnique({ where: { code: '1132' } }); // VAT Input
  const account1140 = await prisma.chartOfAccount.findUnique({ where: { code: '1140' } }); // Inventory
  const account1150 = await prisma.chartOfAccount.findUnique({ where: { code: '1150' } }); // Prepaid Expenses
  const account1211 = await prisma.chartOfAccount.findUnique({ where: { code: '1211' } }); // Land
  const account1212 = await prisma.chartOfAccount.findUnique({ where: { code: '1212' } }); // Buildings
  const account2110 = await prisma.chartOfAccount.findUnique({ where: { code: '2110' } }); // Accounts Payable
  const account2131 = await prisma.chartOfAccount.findUnique({ where: { code: '2131' } }); // WHT Payable
  const account2132 = await prisma.chartOfAccount.findUnique({ where: { code: '2132' } }); // VAT Payable
  const account2140 = await prisma.chartOfAccount.findUnique({ where: { code: '2140' } }); // Wages Payable
  const account2150 = await prisma.chartOfAccount.findUnique({ where: { code: '2150' } }); // Corporate Tax Payable
  const account2210 = await prisma.chartOfAccount.findUnique({ where: { code: '2210' } }); // Long-term Loans
  const account3110 = await prisma.chartOfAccount.findUnique({ where: { code: '3110' } }); // Registered Capital
  const account3300 = await prisma.chartOfAccount.findUnique({ where: { code: '3300' } }); // Retained Earnings
  const account4110 = await prisma.chartOfAccount.findUnique({ where: { code: '4110' } }); // Sales Revenue
  const account4120 = await prisma.chartOfAccount.findUnique({ where: { code: '4120' } }); // Service Revenue
  const account4130 = await prisma.chartOfAccount.findUnique({ where: { code: '4130' } }); // Sales Discounts
  const account4210 = await prisma.chartOfAccount.findUnique({ where: { code: '4210' } }); // Interest Income
  const account5110 = await prisma.chartOfAccount.findUnique({ where: { code: '5110' } }); // Cost of Goods Sold
  const account5210 = await prisma.chartOfAccount.findUnique({ where: { code: '5210' } }); // Advertising
  const account5220 = await prisma.chartOfAccount.findUnique({ where: { code: '5220' } }); // Travel Expenses
  const account5310 = await prisma.chartOfAccount.findUnique({ where: { code: '5310' } }); // Salaries
  const account5320 = await prisma.chartOfAccount.findUnique({ where: { code: '5320' } }); // Rent
  const account5330 = await prisma.chartOfAccount.findUnique({ where: { code: '5330' } }); // Water
  const account5340 = await prisma.chartOfAccount.findUnique({ where: { code: '5340' } }); // Electricity
  const account5350 = await prisma.chartOfAccount.findUnique({ where: { code: '5350' } }); // Telephone & Internet
  const account5360 = await prisma.chartOfAccount.findUnique({ where: { code: '5360' } }); // Repairs
  const account5370 = await prisma.chartOfAccount.findUnique({ where: { code: '5370' } }); // Transportation
  const account5380 = await prisma.chartOfAccount.findUnique({ where: { code: '5380' } }); // Miscellaneous
  const account5390 = await prisma.chartOfAccount.findUnique({ where: { code: '5390' } }); // Depreciation
  const account5410 = await prisma.chartOfAccount.findUnique({ where: { code: '5410' } }); // Interest Expense
  const account5420 = await prisma.chartOfAccount.findUnique({ where: { code: '5420' } }); // Bank Charges
  const account5510 = await prisma.chartOfAccount.findUnique({ where: { code: '5510' } }); // Corporate Tax

  // ============================================
  // Generate More Customers (Total 20)
  // ============================================
  const additionalCustomers = [
    {
      code: 'C004',
      name: 'บริษัท ไทย ฟู้ดส์ จำกัด',
      taxId: '0105551234567',
      address: '123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110',
      phone: '02-123-4567',
      email: 'accounting@thaifoods.co.th',
      creditLimit: 100000,
      paymentTerms: 30,
      contactPerson: 'สมชาย ใจดี',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C005',
      name: 'บริษัท เจริญ การค้า จำกัด',
      taxId: '0105552345678',
      address: '456 ถนนพระราม 4 เขตบางรัก กรุงเทพฯ 10500',
      phone: '02-234-5678',
      email: 'ap@charoen.co.th',
      creditLimit: 150000,
      paymentTerms: 45,
      contactPerson: 'วิชัย มั่งมี',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C006',
      name: 'ห้างหุ้นส่วนจำกัด สยาม ทรานสปอร์ต',
      taxId: '0105553456789',
      address: '789 ถนนวิภาวดีรังสิต เขตดอนเมือง กรุงเทพฯ 10210',
      phone: '02-345-6789',
      email: 'transport@siam.co.th',
      creditLimit: 80000,
      paymentTerms: 30,
      contactPerson: 'อนันต์ บุญสม',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C007',
      name: 'บริษัท อุตสาหกรรม ไทย-จีน จำกัด',
      taxId: '0105554567890',
      address: '321 ถนนเกษตร เขตหลักสี่ กรุงเทพฯ 10240',
      phone: '02-456-7890',
      email: 'finance@thaichina.co.th',
      creditLimit: 200000,
      paymentTerms: 60,
      contactPerson: 'จีน ฮั่ว',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C008',
      name: 'บริษัท ดิจิทัล โซลูชั่น จำกัด',
      taxId: '0105555678901',
      address: '654 ถนนสาทร เขตสาทร กรุงเทพฯ 10120',
      phone: '02-567-8901',
      email: 'credit@digital.co.th',
      creditLimit: 120000,
      paymentTerms: 30,
      contactPerson: 'ไอที โปรแกรมเมอร์',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C009',
      name: 'บริษัท พฤกษา คอนสตรัคชั่น จำกัด',
      taxId: '0105556789012',
      address: '987 ถนนพหลโยธิน เขตพญาไท กรุงเทพฯ 10400',
      phone: '02-678-9012',
      email: 'account@phruksa.co.th',
      creditLimit: 300000,
      paymentTerms: 45,
      contactPerson: 'สมศักดิ์ วิศวกร',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C010',
      name: 'บริษัท เหมืองแร่ เอเชีย จำกัด',
      taxId: '0105557890123',
      address: '147 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500',
      phone: '02-789-0123',
      email: 'ap@asiamining.co.th',
      creditLimit: 500000,
      paymentTerms: 60,
      contactPerson: 'เหมือง แร่',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C011',
      name: 'ห้างหุ้นส่วนจำกัด โรงน้ำแข็ง ไทย',
      taxId: '0105558901234',
      address: '258 ถนนเจริญกรุง เขตปทุมวัน กรุงเทพฯ 10330',
      phone: '02-890-1234',
      email: 'sales@icecube.co.th',
      creditLimit: 50000,
      paymentTerms: 30,
      contactPerson: 'เย็น จังเลย',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'C012',
      name: 'บริษัท สยาม เซรามิก จำกัด',
      taxId: '0321456789012',
      address: '369 อำเภอเมือง จังหวัดสระบุรี 18000',
      phone: '036-123-456',
      email: 'account@siamceramic.co.th',
      creditLimit: 180000,
      paymentTerms: 45,
      contactPerson: 'ดิน เผา',
      province: 'สระบุรี',
    },
    {
      code: 'C013',
      name: 'บริษัท ภาคตะวันออก เปเปอร์ จำกัด',
      taxId: '0201456789012',
      address: '741 อำเภอเมือง จังหวัดชลบุรี 20000',
      phone: '038-234-567',
      email: 'sales@eastpaper.co.th',
      creditLimit: 250000,
      paymentTerms: 30,
      contactPerson: 'กระดาษ ขาว',
      province: 'ชลบุรี',
    },
    {
      code: 'C014',
      name: 'บริษัท ระยอง ฟิชชี่ จำกัด',
      taxId: '0202456789012',
      address: '852 อำเภอเมือง จังหวัดระยอง 21000',
      phone: '038-345-678',
      email: 'fish@rayong.co.th',
      creditLimit: 150000,
      paymentTerms: 30,
      contactPerson: 'ปลา สด',
      province: 'ระยอง',
    },
    {
      code: 'C015',
      name: 'บริษัท พัทยา รีสอร์ท จำกัด',
      taxId: '0203456789012',
      address: '963 อำเภอบางละมุง จังหวัดชลบุรี 20150',
      phone: '038-456-789',
      email: 'reservation@pattaya.co.th',
      creditLimit: 400000,
      paymentTerms: 45,
      contactPerson: 'โรงแรม หรู',
      province: 'ชลบุรี',
    },
    {
      code: 'C016',
      name: 'บริษัท เชียงใหม่ คอตตอน จำกัด',
      taxId: '0501456789012',
      address: '159 อำเภอเมือง จังหวัดเชียงใหม่ 50000',
      phone: '053-123-456',
      email: 'order@chiangmaicotton.co.th',
      creditLimit: 100000,
      paymentTerms: 30,
      contactPerson: 'ฝ้าย แท้',
      province: 'เชียงใหม่',
    },
    {
      code: 'C017',
      name: 'บริษัท ภาคเหนือ ไม้์ จำกัด',
      taxId: '0502456789012',
      address: '357 อำเภอเมือง จังหวัดเชียงราย 57000',
      phone: '053-234-567',
      email: 'sales@northernwood.co.th',
      creditLimit: 120000,
      paymentTerms: 45,
      contactPerson: 'ไม้ แข็ง',
      province: 'เชียงราย',
    },
    {
      code: 'C018',
      name: 'บริษัท ขอนแก่น อินดัสเทรียล จำกัด',
      taxId: '0401456789012',
      address: '486 อำเภอเมือง จังหวัดขอนแก่น 40000',
      phone: '043-123-456',
      email: 'factory@khonkaen.co.th',
      creditLimit: 220000,
      paymentTerms: 60,
      contactPerson: 'โรงงาน ใหญ่',
      province: 'ขอนแก่น',
    },
    {
      code: 'C019',
      name: 'บริษัท อีสาน ฟาร์ม จำกัด',
      taxId: '0402456789012',
      address: '268 อำเภอเมือง จังหวัดนครราชสีมา 30000',
      phone: '044-123-456',
      email: 'farm@isan.co.th',
      creditLimit: 90000,
      paymentTerms: 30,
      contactPerson: 'เกษตร กรรม',
      province: 'นครราชสีมา',
    },
    {
      code: 'C020',
      name: 'บริษัท ใต้ฟ้า เฟอร์นิเจอร์ จำกัด',
      taxId: '0801456789012',
      address: '975 อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000',
      phone: '077-123-456',
      email: 'export@taifa.co.th',
      creditLimit: 180000,
      paymentTerms: 45,
      contactPerson: 'ไม้ สวย',
      province: 'สุราษฎร์ธานี',
    },
    {
      code: 'C021',
      name: 'บริษัท ภูเก็ต ทัวร์ จำกัด',
      taxId: '0802456789012',
      address: '684 อำเภอเมือง จังหวัดภูเก็ต 83000',
      phone: '076-123-456',
      email: 'travel@phuket.co.th',
      creditLimit: 160000,
      paymentTerms: 30,
      contactPerson: 'ท่องเที่ยว สนุก',
      province: 'ภูเก็ต',
    },
    {
      code: 'C022',
      name: 'บริษัท หาดใหญ่ เทรดดิ้ง จำกัด',
      taxId: '0901456789012',
      address: '147 อำเภอหาดใหญ่ จังหวัดสงขลา 90110',
      phone: '074-123-456',
      email: 'trade@hatyai.co.th',
      creditLimit: 140000,
      paymentTerms: 30,
      contactPerson: 'ค้าขาย รวย',
      province: 'สงขลา',
    },
    {
      code: 'C023',
      name: 'บริษัท นารา ไทย จำกัด',
      taxId: '0721456789012',
      address: '369 อำเภอเมือง จังหวัดเชียงใหม่ 50100',
      phone: '053-234-789',
      email: 'sales@narathai.co.th',
      creditLimit: 110000,
      paymentTerms: 30,
      contactPerson: 'วิญญาณ สงบ',
      province: 'เชียงใหม่',
    },
  ];

  for (const customer of additionalCustomers) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: {
        code: customer.code,
        name: customer.name,
        taxId: customer.taxId,
        address: customer.address,
        phone: customer.phone,
        email: customer.email,
        contactName: customer.contactPerson,
        province: customer.province,
        creditDays: customer.paymentTerms,
        creditLimit: customer.creditLimit,
      },
    });
  }
  console.log('✅ Additional Customers created:', additionalCustomers.length, 'customers');

  // ============================================
  // Generate More Vendors (Total 10)
  // ============================================
  const additionalVendors = [
    {
      code: 'V003',
      name: 'บริษัท ซัพพลายเออร์ เอเชีย จำกัด',
      taxId: '0105556789012',
      address: '789 ถนนพระราม 2 เขตบางขุนเทียน กรุงเทพฯ 10150',
      phone: '02-111-3333',
      email: 'sales@asiasupplier.co.th',
      bankName: 'ธนาคารกรุงเทพ',
      bankAccount: '123-4-56789-0',
      bankAccountName: 'บจก. ซัพพลายเออร์ เอเชีย',
      paymentTerms: 30,
      contactPerson: 'วุฒิ ผู้ใหญ่',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'V004',
      name: 'บริษัท โลจิสติกส์ ดีลิเวอรี่ จำกัด',
      taxId: '0105557890123',
      address: '456 ถนนกัลปพฤกษ์ เขตตลิ่งชัน กรุงเทพฯ 10170',
      phone: '02-222-4444',
      email: 'logistics@delivery.co.th',
      bankName: 'ธนาคารกสิกรไทย',
      bankAccount: '234-5-67890-1',
      bankAccountName: 'บจก. โลจิสติกส์ ดีลิเวอรี่',
      paymentTerms: 45,
      contactPerson: 'ส่ง ไว',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'V005',
      name: 'บริษัท เทคโน ซัพพลาย จำกัด',
      taxId: '0105558901234',
      address: '123 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900',
      phone: '02-333-5555',
      email: 'tech@technosupply.co.th',
      bankName: 'ธนาคารไทยพาณิชย์',
      bankAccount: '345-6-78901-2',
      bankAccountName: 'บจก. เทคโน ซัพพลาย',
      paymentTerms: 30,
      contactPerson: 'เทค โนโลยี',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'V006',
      name: 'บริษัท ออฟฟิศ แมททีเรียล จำกัด',
      taxId: '0105559012345',
      address: '258 ถนนลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230',
      phone: '02-444-6666',
      email: 'office@officemat.co.th',
      bankName: 'ธนาคารกรุงเทพ',
      bankAccount: '456-7-89012-3',
      bankAccountName: 'บจก. ออฟฟิศ แมททีเรียล',
      paymentTerms: 30,
      contactPerson: 'สำนักงาน เรียบร้อย',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'V007',
      name: 'บริษัท พลังงาน ไทย จำกัด',
      taxId: '0105550123456',
      address: '963 ถนนนราธิวาสราชนครินทร์ เขตทุ่งครุ กรุงเทพฯ 10140',
      phone: '02-555-7777',
      email: 'energy@thaipower.co.th',
      bankName: 'ธนาคารกรุงไทย',
      bankAccount: '567-8-90123-4',
      bankAccountName: 'บจก. พลังงาน ไทย',
      paymentTerms: 30,
      contactPerson: 'ไฟฟ้า ส่องสว่าง',
      province: 'กรุงเทพมหานคร',
    },
    {
      code: 'V008',
      name: 'ห้างหุ้นส่วนจำกัด น้ำมัน หอมระยอง',
      taxId: '0205551234567',
      address: '741 อำเภอเมือง จังหวัดระยอง 21000',
      phone: '038-444-5555',
      email: 'oil@rayong.co.th',
      bankName: 'ธนาคารกรุงเทพ',
      bankAccount: '678-9-01234-5',
      bankAccountName: 'หจก. น้ำมัน หอม',
      paymentTerms: 45,
      contactPerson: 'น้ำมัน ดี',
      province: 'ระยอง',
    },
    {
      code: 'V009',
      name: 'บริษัท ฮาร์ดแวร์ โปร จำกัด',
      taxId: '0505552345678',
      address: '852 ถนนนิมมานรดี อำเภอเมือง จังหวัดเชียงใหม่ 50000',
      phone: '053-444-6666',
      email: 'hardware@hardwarepro.co.th',
      bankName: 'ธนาคารกรุงเทพ',
      bankAccount: '789-0-12345-6',
      bankAccountName: 'บจก. ฮาร์ดแวร์ โปร',
      paymentTerms: 30,
      contactPerson: 'เหล็ก แข็งแรง',
      province: 'เชียงใหม่',
    },
    {
      code: 'V010',
      name: 'บริษัท อิเล็กทรอนิกส์ พาร์ท จำกัด',
      taxId: '0405553456789',
      address: '159 อำเภอเมือง จังหวัดขอนแก่น 40000',
      phone: '043-555-7777',
      email: 'parts@electronicparts.co.th',
      bankName: 'ธนาคารกสิกรไทย',
      bankAccount: '890-1-23456-7',
      bankAccountName: 'บจก. อิเล็กทรอนิกส์ พาร์ท',
      paymentTerms: 30,
      contactPerson: 'วงจร ไฟฟ้า',
      province: 'ขอนแก่น',
    },
  ];

  for (const vendor of additionalVendors) {
    await prisma.vendor.upsert({
      where: { code: vendor.code },
      update: {},
      create: {
        code: vendor.code,
        name: vendor.name,
        taxId: vendor.taxId,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        contactName: vendor.contactPerson,
        bankName: vendor.bankName,
        bankAccount: vendor.bankAccount,
        bankAccountName: vendor.bankAccountName,
        creditDays: vendor.paymentTerms,
        province: vendor.province,
      },
    });
  }
  console.log('✅ Additional Vendors created:', additionalVendors.length, 'vendors');

  // ============================================
  // Get All Customers, Vendors, and Products for Invoices
  // ============================================
  const allCustomers = await prisma.customer.findMany();
  const allVendors = await prisma.vendor.findMany();
  const allProducts = await prisma.product.findMany();

  // Helper function to generate Thai date
  function toThaiDate(date: Date): Date {
    return date;
  }

  // Helper function to generate random dates within range
  function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // Helper function to format invoice number
  function generateInvoiceNumber(prefix: string, year: number, month: number, num: number): string {
    const yearStr = year.toString().slice(-2);
    const monthStr = month.toString().padStart(2, '0');
    const numStr = num.toString().padStart(4, '0');
    return `${prefix}${yearStr}${monthStr}-${numStr}`;
  }

  // Helper function to calculate VAT
  function calculateVat(amount: number, rate: number = 7): number {
    return Math.round((amount * rate) / 100);
  }

  // ============================================
  // Generate 50 Invoices (Micro-task 6.1.1)
  // ============================================
  const invoiceTypes = [
    'TAX_INVOICE',
    'TAX_INVOICE',
    'TAX_INVOICE',
    'RECEIPT',
    'RECEIPT',
    'DELIVERY_NOTE',
    'CREDIT_NOTE',
    'DEBIT_NOTE',
  ];
  const invoiceStatuses = [
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'ISSUED',
    'ISSUED',
    'ISSUED',
    'ISSUED',
    'PAID',
    'PAID',
    'PARTIAL',
    'CANCELLED',
  ];

  const invoiceData: any[] = [];
  let invoiceCounter = 1;
  let receiptCounter = 1;
  let creditNoteCounter = 1;
  let debitNoteCounter = 1;
  let deliveryNoteCounter = 1;

  // Define date range: October 2025 - March 2026
  const startDate = new Date('2025-10-01');
  const endDate = new Date('2026-03-31');

  // Invoice amount distributions
  const amountRanges = [
    { min: 1000, max: 10000, count: 15 }, // Small
    { min: 10001, max: 50000, count: 25 }, // Medium
    { min: 50001, max: 100000, count: 8 }, // Large
    { min: 100001, max: 200000, count: 2 }, // Very Large
  ];

  // Generate invoices with proper distribution
  for (let range of amountRanges) {
    for (let i = 0; i < range.count; i++) {
      const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
      const invoiceDate = randomDate(startDate, endDate);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth() + 1;

      // Determine invoice type and status
      const typeIndex = Math.floor(Math.random() * invoiceTypes.length);
      const invoiceType = invoiceTypes[typeIndex] as any;
      const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] as any;

      let invoiceNo = '';
      if (invoiceType === 'TAX_INVOICE') {
        invoiceNo = generateInvoiceNumber('INV', invoiceYear, invoiceMonth, invoiceCounter++);
      } else if (invoiceType === 'RECEIPT') {
        invoiceNo = generateInvoiceNumber('REC', invoiceYear, invoiceMonth, receiptCounter++);
      } else if (invoiceType === 'CREDIT_NOTE') {
        invoiceNo = generateInvoiceNumber('CN', invoiceYear, invoiceMonth, creditNoteCounter++);
      } else if (invoiceType === 'DEBIT_NOTE') {
        invoiceNo = generateInvoiceNumber('DN', invoiceYear, invoiceMonth, debitNoteCounter++);
      } else {
        invoiceNo = generateInvoiceNumber('DN', invoiceYear, invoiceMonth, deliveryNoteCounter++);
      }

      // Generate 1-5 line items
      const numLineItems = Math.floor(Math.random() * 5) + 1;
      const lineItems: any[] = [];
      let subtotal = 0;

      for (let j = 0; j < numLineItems; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 5000) + 500;
        const amount = quantity * unitPrice;
        subtotal += amount;

        lineItems.push({
          product: product,
          description: product.name,
          quantity: quantity,
          unit: product.unit,
          unitPrice: unitPrice,
          amount: amount,
          vatRate: 7,
          vatAmount: calculateVat(amount),
        });
      }

      const vatAmount = calculateVat(subtotal);
      const totalAmount = subtotal + vatAmount;
      const discountAmount = Math.random() > 0.7 ? Math.floor(Math.random() * subtotal * 0.1) : 0;
      const netAmount = totalAmount - discountAmount;

      // Calculate paid amount based on status
      let paidAmount = 0;
      if (status === 'PAID') {
        paidAmount = netAmount;
      } else if (status === 'PARTIAL') {
        paidAmount = netAmount * 0.5;
      }

      invoiceData.push({
        invoiceNo,
        invoiceDate: toThaiDate(invoiceDate),
        dueDate: toThaiDate(new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)),
        customerId: customer.id,
        type: invoiceType,
        subtotal,
        vatRate: 7,
        vatAmount,
        totalAmount,
        discountAmount,
        netAmount,
        paidAmount,
        status,
        lineItems,
      });
    }
  }

  // Create invoices and their line items (using upsert for idempotency)
  const createdInvoices: any[] = [];
  for (const inv of invoiceData) {
    try {
      // Check if invoice already exists
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNo: inv.invoiceNo },
      });

      if (existing) {
        console.log('⚠️  Invoice already exists:', inv.invoiceNo);
        createdInvoices.push(existing);
        continue;
      }

      const created = await prisma.invoice.create({
        data: {
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          customerId: inv.customerId,
          type: inv.type,
          subtotal: inv.subtotal,
          vatRate: inv.vatRate,
          vatAmount: inv.vatAmount,
          totalAmount: inv.totalAmount,
          discountAmount: inv.discountAmount,
          netAmount: inv.netAmount,
          paidAmount: inv.paidAmount,
          status: inv.status,
          lines: {
            create: inv.lineItems.map((item, idx) => ({
              lineNo: idx + 1,
              productId: item.product.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              amount: item.amount,
              vatRate: item.vatRate,
              vatAmount: item.vatAmount,
            })),
          },
        },
      });
      createdInvoices.push(created);
    } catch (error: any) {
      // Handle unique constraint violations gracefully
      if (error.code === 'P2002') {
        console.log('⚠️  Duplicate invoice number skipped:', inv.invoiceNo);
        // Try to fetch the existing invoice
        const existing = await prisma.invoice.findUnique({
          where: { invoiceNo: inv.invoiceNo },
        });
        if (existing) {
          createdInvoices.push(existing);
        }
      } else {
        console.error('❌ Error creating invoice:', inv.invoiceNo, error.message);
        throw error;
      }
    }
  }
  console.log('✅ Invoices created:', createdInvoices.length, 'invoices');

  // ============================================
  // Generate 100 Journal Entries (Micro-task 6.1.2)
  // ============================================
  const journalData: any[] = [];
  const entryTypes = [
    { type: 'SALES', count: 40 },
    { type: 'PURCHASE', count: 20 },
    { type: 'CASH_RECEIPT', count: 15 },
    { type: 'CASH_PAYMENT', count: 10 },
    { type: 'ADJUSTING', count: 10 },
    { type: 'ACCRUAL', count: 5 },
  ];

  let journalCounter = 1;
  const journalStartYear = 2568; // Buddhist year 2025

  // Helper to create balanced journal entry
  function createJournalEntry(type: string, date: Date, entryNo: string) {
    const lines: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    switch (type) {
      case 'SALES': {
        const amount = Math.floor(Math.random() * 50000) + 5000;
        const vat = calculateVat(amount);

        // Debit: Accounts Receivable
        lines.push({
          accountId: account1121!.id,
          description: 'ลูกหนี้การค้า',
          debit: amount + vat,
          credit: 0,
        });
        totalDebit += amount + vat;

        // Credit: Sales Revenue
        lines.push({
          accountId: account4110!.id,
          description: 'รายได้จากการขายสินค้า',
          debit: 0,
          credit: amount,
        });
        totalCredit += amount;

        // Credit: VAT Payable
        lines.push({
          accountId: account2132!.id,
          description: 'ภาษีมูลค่าเพิ่มต้องชำระ',
          debit: 0,
          credit: vat,
        });
        totalCredit += vat;
        break;
      }

      case 'PURCHASE': {
        const amount = Math.floor(Math.random() * 30000) + 3000;
        const vat = calculateVat(amount);

        // Debit: Purchases/COGS
        lines.push({
          accountId: account5110!.id,
          description: 'ต้นทุนสินค้าขาย',
          debit: amount,
          credit: 0,
        });
        totalDebit += amount;

        // Debit: VAT Input
        lines.push({
          accountId: account1132!.id,
          description: 'ภาษีมูลค่าเพิ่มถูกหัก ณ ที่จ่าย',
          debit: vat,
          credit: 0,
        });
        totalDebit += vat;

        // Credit: Accounts Payable
        lines.push({
          accountId: account2110!.id,
          description: 'เจ้าหนี้การค้า',
          debit: 0,
          credit: amount + vat,
        });
        totalCredit += amount + vat;
        break;
      }

      case 'CASH_RECEIPT': {
        const amount = Math.floor(Math.random() * 40000) + 4000;

        // Debit: Cash
        lines.push({
          accountId: Math.random() > 0.5 ? account1111!.id : account1112!.id,
          description: 'เงินสดธนาคาร',
          debit: amount,
          credit: 0,
        });
        totalDebit += amount;

        // Credit: Accounts Receivable
        lines.push({
          accountId: account1121!.id,
          description: 'ลูกหนี้การค้า',
          debit: 0,
          credit: amount,
        });
        totalCredit += amount;
        break;
      }

      case 'CASH_PAYMENT': {
        const amount = Math.floor(Math.random() * 25000) + 2500;

        // Debit: Accounts Payable
        lines.push({
          accountId: account2110!.id,
          description: 'เจ้าหนี้การค้า',
          debit: amount,
          credit: 0,
        });
        totalDebit += amount;

        // Credit: Cash
        lines.push({
          accountId: Math.random() > 0.5 ? account1111!.id : account1112!.id,
          description: 'เงินสดธนาคาร',
          debit: 0,
          credit: amount,
        });
        totalCredit += amount;
        break;
      }

      case 'ADJUSTING': {
        // Various adjusting entries
        const adjType = Math.floor(Math.random() * 5);
        let amount = 0;
        let description = '';

        switch (adjType) {
          case 0: // Depreciation
            amount = Math.floor(Math.random() * 5000) + 1000;
            lines.push({
              accountId: account5390!.id,
              description: 'ค่าเสื่อมราคา',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account1212!.id,
              description: 'ค่าเสื่อมราคาอาคารสะสม',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกค่าเสื่อมราคาประจำเดือน';
            break;

          case 1: // Rent expense accrual
            amount = Math.floor(Math.random() * 30000) + 20000;
            lines.push({
              accountId: account5320!.id,
              description: 'ค่าเช่าอาคาร',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account2110!.id,
              description: 'ค่าใช้จ่ายจ่ายล่วงหน้า - ค่าเช่า',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกค่าเช่าอาคาร';
            break;

          case 2: // Salary accrual
            amount = Math.floor(Math.random() * 100000) + 50000;
            lines.push({
              accountId: account5310!.id,
              description: 'เงินเดือนและค่าจ้าง',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account2140!.id,
              description: 'เงินเดือนต้องจ่าย',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกเงินเดือนประจำเดือน';
            break;

          case 3: // Utilities
            amount = Math.floor(Math.random() * 10000) + 2000;
            lines.push({
              accountId: account5330!.id,
              description: 'ค่าน้ำประปา',
              debit: amount * 0.3,
              credit: 0,
            });
            lines.push({
              accountId: account5340!.id,
              description: 'ค่าไฟฟ้า',
              debit: amount * 0.7,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account1113!.id,
              description: 'เงินสดย่อย',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกค่าน้ำประปาและไฟฟ้า';
            break;

          case 4: // Bank charges
            amount = Math.floor(Math.random() * 500) + 50;
            lines.push({
              accountId: account5420!.id,
              description: 'ค่าธรรมเนียมธนาคาร',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account1111!.id,
              description: 'ธนาคารกรุงเทพ',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'ค่าธรรมเนียมธนาคาร';
            break;
        }
        break;
      }

      case 'ACCRUAL': {
        const accType = Math.floor(Math.random() * 3);
        let amount = 0;
        let description = '';

        switch (accType) {
          case 0: // Interest receivable
            amount = Math.floor(Math.random() * 2000) + 500;
            lines.push({
              accountId: account1131!.id,
              description: 'ดอกเบี้ยรับมัดจำ',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account4210!.id,
              description: 'ดอกเบี้ยรับ',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกดอกเบี้ยรับ';
            break;

          case 1: // Interest payable
            amount = Math.floor(Math.random() * 3000) + 1000;
            lines.push({
              accountId: account5410!.id,
              description: 'ดอกเบี้ยจ่าย',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account2131!.id,
              description: 'ดอกเบี้ยจ่ายต้องชำระ',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกดอกเบี้ยจ่าย';
            break;

          case 2: // Prepaid expense
            amount = Math.floor(Math.random() * 6000) + 3000;
            lines.push({
              accountId: account1150!.id,
              description: 'ค่าใช้จ่ายจ่ายล่วงหน้า',
              debit: amount,
              credit: 0,
            });
            totalDebit += amount;
            lines.push({
              accountId: account1111!.id,
              description: 'ธนาคารกรุงเทพ',
              debit: 0,
              credit: amount,
            });
            totalCredit += amount;
            description = 'บันทึกค่าใช้จ่ายจ่ายล่วงหน้า';
            break;
        }
        break;
      }
    }

    // Ensure balance
    if (totalDebit !== totalCredit) {
      const difference = Math.abs(totalDebit - totalCredit);
      if (totalDebit < totalCredit) {
        lines.push({
          accountId: account5380!.id,
          description: 'ค่าใช้จ่ายเบ็ดเตล็ด (ปรับ)',
          debit: difference,
          credit: 0,
        });
        totalDebit += difference;
      } else {
        lines.push({
          accountId: account4210!.id,
          description: 'รายได้อื่น (ปรับ)',
          debit: 0,
          credit: difference,
        });
        totalCredit += difference;
      }
    }

    return {
      entryNo,
      date,
      description: lines[0]?.description || 'บันทึกบัญชี',
      totalDebit,
      totalCredit,
      status: 'POSTED' as const,
      lines,
    };
  }

  // Generate journal entries
  for (const entryType of entryTypes) {
    for (let i = 0; i < entryType.count; i++) {
      const entryDate = randomDate(startDate, endDate);
      const entryNo = `JV-${journalStartYear}-${journalCounter.toString().padStart(4, '0')}`;
      journalCounter++;

      const entry = createJournalEntry(entryType.type, entryDate, entryNo);
      journalData.push(entry);
    }
  }

  // Create journal entries and their lines (using upsert for idempotency)
  const createdJournalEntries: any[] = [];
  for (const je of journalData) {
    try {
      // Check if journal entry already exists
      const existing = await prisma.journalEntry.findUnique({
        where: { entryNo: je.entryNo },
      });

      if (existing) {
        console.log('⚠️  Journal entry already exists:', je.entryNo);
        createdJournalEntries.push(existing);
        continue;
      }

      const created = await prisma.journalEntry.create({
        data: {
          entryNo: je.entryNo,
          date: toThaiDate(je.date),
          description: je.description,
          totalDebit: je.totalDebit,
          totalCredit: je.totalCredit,
          status: je.status,
          lines: {
            create: je.lines.map((line, idx) => ({
              lineNo: idx + 1,
              accountId: line.accountId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          },
        },
      });
      createdJournalEntries.push(created);
    } catch (error: any) {
      // Handle unique constraint violations gracefully
      if (error.code === 'P2002') {
        console.log('⚠️  Duplicate journal entry number skipped:', je.entryNo);
        // Try to fetch the existing journal entry
        const existing = await prisma.journalEntry.findUnique({
          where: { entryNo: je.entryNo },
        });
        if (existing) {
          createdJournalEntries.push(existing);
        }
      } else {
        console.error('❌ Error creating journal entry:', je.entryNo, error.message);
        throw error;
      }
    }
  }
  console.log('✅ Journal Entries created:', createdJournalEntries.length, 'entries');

  // ============================================
  // Initialize Document Number Formats
  // ============================================
  const documentTypes = [
    {
      type: 'invoice',
      prefix: 'INV',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'receipt',
      prefix: 'RCP',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'payment',
      prefix: 'PAY',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'journal',
      prefix: 'JE',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'credit_note',
      prefix: 'CN',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'debit_note',
      prefix: 'DN',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'purchase',
      prefix: 'PO',
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'payroll',
      prefix: 'PAYROLL',
      format: '{prefix}-{yyyy}-{mm}-{000}',
      resetMonthly: true,
      resetYearly: false,
    },
    {
      type: 'petty_cash',
      prefix: 'PCV',
      format: '{prefix}-{yyyy}-{mm}-{000}',
      resetMonthly: true,
      resetYearly: false,
    },
  ];

  for (const docType of documentTypes) {
    await prisma.documentNumber.upsert({
      where: { type: docType.type },
      update: {},
      create: docType,
    });
  }
  console.log('✅ Document number formats initialized');

  // ============================================
  // Initialize System Settings
  // ============================================
  await prisma.systemSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      vatRate: 7,
      whtPnd53Service: 3,
      whtPnd53Rent: 5,
      whtPnd53Prof: 3,
      whtPnd53Contract: 1,
      whtPnd53Advert: 2,
    },
  });
  console.log('✅ System settings initialized');

  // ============================================
  // Link Journal Entries to Invoices (for non-DRAFT invoices)
  // ============================================
  let journalIndex = 0;
  for (const invoice of createdInvoices) {
    if (invoice.status !== 'DRAFT' && journalIndex < createdJournalEntries.length) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { journalEntryId: createdJournalEntries[journalIndex].id },
      });
      journalIndex++;
    }
  }
  console.log('✅ Linked', journalIndex, 'invoices to journal entries');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
