import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ตรวจสอบข้อมูลใบลดหนี้ ===\n');

  const creditNoteCount = await prisma.creditNote.count();
  console.log(`จำนวนใบลดหนี้ทั้งหมด: ${creditNoteCount}`);

  if (creditNoteCount > 0) {
    const creditNotes = await prisma.creditNote.findMany({
      take: 10,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\nใบลดหนี้ล่าสุด:');
    for (let i = 0; i < creditNotes.length; i++) {
      const cn = creditNotes[i];
      console.log(`${i + 1}. ${cn.creditNoteNo} - ${cn.customer.name}`);
      console.log(`   วันที่: ${cn.creditNoteDate.toISOString().split('T')[0]}`);
      console.log(`   จำนวนเงิน: ${cn.totalAmount} บาท`);
      console.log(`   สถานะ: ${cn.status}`);
      console.log('');
    }
  } else {
    console.log('\n✅ ยังไม่มีข้อมูลใบลดหนี้ในระบบ');
    console.log('\nข้อความ "ไม่พบข้อมูลใบลดหนี้" ที่คุณเห็นเป็นสถานะปกติ');
    console.log('เมื่อไม่มีข้อมูล ระบบจะแสดงข้อความนี้เพื่อแจ้งให้ทราบ');
    console.log('\nการสร้างใบลดหนี้ใหม่:');
    console.log('1. ต้องมีข้อมูลลูกค้าก่อน');
    console.log('2. สามารถอ้างอิงใบกำกับภาษีที่มีอยู่ได้ (ไม่บังคับ)');
    console.log('3. คลิกปุ่ม "สร้างใบลดหนี้" เพื่อสร้างใบใหม่');
  }

  const customerCount = await prisma.customer.count();
  console.log(`\nจำนวนลูกค้า: ${customerCount}`);

  const invoiceCount = await prisma.invoice.count();
  console.log(`จำนวนใบกำกับภาษี: ${invoiceCount}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
