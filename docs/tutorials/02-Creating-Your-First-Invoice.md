# Video Tutorial Script: 02 - Creating Your First Invoice

## Video Information
- **Title:** Creating Your First Invoice (สร้างใบกำกับภาษีขายใบแรก)
- **Duration:** 15-18 minutes
- **Target Audience:** Users who completed tutorial 01
- **Prerequisites:** Company settings configured

## Introduction (1 minute)

**[Scene: Invoice list page]**

**Narrator:**
"สวัสดีครับ/ค่ะ กลับมาพบกันในวิดีโอที่สอง ในตอนนี้เราจะมาเรียนรู้การสร้างใบกำกับภาษีขาย ซึ่งเป็นเอกสารสำคัญที่ธุรกิจทุกแห่งต้องใช้"

**On-screen text:**
- ใบกำกับภาษีขาย (Tax Invoice)
- ภาษีมูลค่าเพิ่ม 7%

**Learning Objectives:**
1. เพิ่มข้อมูลลูกค้า
2. เพิ่มข้อมูลสินค้า
3. สร้างใบกำกับภาษี
4. ออกใบกำกับภาษี
5. พิมพ์ใบกำกับภาษี

## Section 1: Adding a Customer (3 minutes)

**[Scene: Customer list page]**

**Narrator:**
"ก่อนสร้างใบกำกับภาษี เราต้องมีข้อมูลลูกค้าก่อน ไปที่เมนู ลูกหนี้"

**[Scene: Click on Customers menu]**

**Narrator:**
"หน้านี้แสดงรายชื่อลูกค้าทั้งหมด ถ้ายังไม่มีลูกค้า ให้คลิกที่ปุ่ม สร้างลูกค้าใหม่"

**[Scene: Customer creation form]**

**Step-by-step:**
```
รหัสลูกค้า: CUST-001
ชื่อ: บริษัท เอบีซี จำกัด
ชื่อ (EN): ABC Company Ltd.
เลขประจำตัวผู้เสียภาษี: 1234567890123
รหัสสาขา: 00000 (สำนักงานใหญ่)
ที่อยู่: 456 ถนนพหลโยธิน แขวงจตุจักร
เขต/อำเภอ: จตุจักร
จังหวัด: กรุงเทพมหานคร
รหัษไปรษณีย์: 10900
โทรศัพท์: 02-987-6543
อีเมล: accounting@abc.com
วงเงินเครดิต: 500000
เครดิต (วัน): 30
```

**[Scene: Fill in customer form]**

**Narrator:**
"รหัสลูกค้าคือรหัสประจำตัวลูกค้าของคุณ สามารถตั้งเป็นแบบไหนก็ได้ที่ไม่ซ้ำกัน เลขประจำตัวผู้เสียภาษีมี 13 หลัก ใช้สำหรับออกใบกำกับภาษี"

**[Scene: Click save, show success]**

**Narrator:**
"วงเงินเครดิตคือวงเงินที่เราอนุญาตให้ลูกค้าซื้อเชื่อได้สูงสุด เครดิต 30 วัน หมายถึงลูกค้าต้องชำระเงินภายใน 30 วันนับจากวันออกใบกำกับภาษี"

## Section 2: Adding Products (3 minutes)

**[Scene: Product list page]**

**Narrator:**
"ต่อไปเราจะเพิ่มสินค้าหรือบริการที่เราจำหน่าย ไปที่เมนู สินค้า"

**[Scene: Click on Products menu]**

**Narrator:**
"คลิกที่ปุ่ม สร้างสินค้าใหม่"

**[Scene: Product creation form]**

**Product 1 - Physical Product:**
```
รหัสสินค้า: PROD-001
ชื่อสินค้า: โต๊ะทำงานไม้สัก
หมวดหมู่: เฟอร์นิเจอร์
หน่วย: ตัว
ราคาขาย: 8500
ราคาทุน: 5000
อัตราภาษี: 7%
ติดตามสต็อก: ✓
จำนวนคงเหลือ: 50
จำนวนต่ำสุด: 10
วิธีคิดต้นทุน: ค่าเฉลี่ยถ่วงน้ำหนัก
```

**Product 2 - Service:**
```
รหัสสินค้า: SERV-001
ชื่อสินค้า: ค่าบริการติดตั้ง
หมวดหมู่: บริการ
หน่วย: รายการ
ราคาขาย: 1500
ราคาทุน: 0
อัตราภาษี: 7%
ติดตามสต็อก: ✗
```

**[Scene: Fill in both products]**

**Narrator:**
"สินค้าที่ติดตามสต็อก ระบบจะลดจำนวนสินค้าอัตโนมัติเมื่อขาย ส่วนบริการไม่ต้องติดตามสต็อก"

## Section 3: Creating an Invoice (4 minutes)

**[Scene: Invoice list page]**

**Narrator:**
"ตอนนี้เรามีทั้งลูกค้าและสินค้าแล้ว มาสร้างใบกำกับภาษีกัน ไปที่เมนู ใบกำกับภาษีขาย"

**[Scene: Click on Sales Invoices]**

**[Scene: Click Create New Invoice]**

**Narrator:**
"คลิกที่ปุ่ม สร้างใบกำกับภาษีใหม่"

**[Scene: Invoice creation form]**

**Invoice Header:**
```
ลูกค้า: บริษัท เอบีซี จำกัด
วันที่: 16/03/2026
วันครบกำหนด: 15/04/2026 (30 วัน)
เลขที่อ้างอิง: PO-2026-123
หมายเหตุ: ส่งสินค้าภายใน 3 วันทำการ
```

**[Scene: Select customer, dates auto-populate]**

**Narrator:**
"เมื่อเลือกลูกค้า วันครบกำหนดจะคำนวณอัตโนมัติตามเครดิตที่กำหนดไว้ ในกรณีนี้คือ 30 วัน"

**Adding Invoice Lines:**

**Line 1:**
```
สินค้า: โต๊ะทำงานไม้สัก
จำนวน: 2
ราคาต่อหน่วย: 8,500
ส่วนลด %: 5
```

**[Scene: Add first line item]**

**Narrator:**
"ระบบคำนวณยอดรวมทันที 2 ตัว ราคา 8,500 บาท ลด 5% เหลือ 16,150 บาท"

**Line 2 (Manual Entry):**
```
รายละเอียด: ค่าขนส่ง
จำนวน: 1
ราคาต่อหน่วย: 500
ส่วนลด %: 0
```

**[Scene: Add second line]**

**Narrator:**
"ถ้าไม่ต้องการเลือกจากสินค้าที่มีอยู่ สามารถพิมพ์รายละเอียดเองได้เลย สะดวกสำหรับรายการที่ไม่มีในฐานข้อมูล"

**Invoice Totals:**
```
รวมเงิน: 16,650 บาท
ภาษีมูลค่าเพิ่ม (7%): 1,165.50 บาท
จำนวนเงินรวมทั้งสิ้น: 17,815.50 บาท
```

**[Scene: Show calculated totals]**

**Narrator:**
"ระบบคำนวณภาษีมูลค่าเพิ่ม 7% โดยอัตโนมัติ แสดงทั้งยอดก่อนภาษี ภาษี และยอดรวม"

**[Scene: Click Save]**

**Narrator:**
"คลิก บันทึก เพื่อบันทึกใบกำกับภาษี สถานะตอนนี้คือ ฉบับร่าง (Draft) ซึ่งยังแก้ไขได้"

## Section 4: Issuing the Invoice (3 minutes)

**[Scene: Invoice detail page showing DRAFT status]**

**Narrator:**
"ใบกำกับภาษีในสถานะ ฉบับร่าง ยังไม่มีผลทางบัญชี และยังแก้ไขได้ ก่อนส่งให้ลูกค้า เราต้อง ออกใบกำกับภาษี"

**[Scene: Click Issue Invoice button]**

**Confirmation Dialog:**
```
ยืนยันการออกใบกำกับภาษี?

การออกใบกำกับภาษีจะ:
✓ กำหนดเลขที่เอกสาร
✓ สร้างรายการบัญชีอัตโนมัติ
✓ ลดสต็อกสินค้า (ถ้ามี)
✓ ไม่สามารถแก้ไขได้

[ยกเลิก] [ยืนยัน]
```

**[Scene: Confirm issue]**

**Narrator:**
"เมื่อออกใบกำกับภาษีแล้ว ระบบจะกำหนดเลขที่เอกสารตามรูปแบบที่ตั้งค่าไว้ สร้างรายการบัญชีโดยอัตโนมัติ และลดจำนวนสินค้าคงเหลือ"

**[Scene: Invoice status changes to ISSUED]**

**Narrator:**
"สถานะเปลี่ยนเป็น ออกแล้ว (Issued) และแสดงเลขที่เอกสาร INV-202603-0001"

**Journal Entry Created:**
```
เดบิต ลูกหนี้การค้า: 17,815.50
เครดิต รายได้ขายสินค้า: 16,650.00
เครดิต ภาษีขาย: 1,165.50
```

**[Scene: Show linked journal entry]**

## Section 5: Printing the Invoice (2 minutes)

**[Scene: Invoice detail page]**

**Narrator:**
"หลังจากออกใบกำกับภาษีแล้ว เราสามารถพิมพ์หรือส่งอีเมลให้ลูกค้าได้"

**[Scene: Click Print button]**

**Print Options:**
```
รูปแบบเอกสาร:
○ ใบกำกับภาษีอย่างเต็มอักษร
● ใบกำกับภาษี/ใบเสร็จรับเงิน
○ สำเนา (ไม่มีสำเนาภาษี)

[ดูตัวอย่าง] [พิมพ์] [ส่งอีเมล] [ส่ง Line]
```

**[Scene: Show print preview]**

**Narrator:**
"ใบกำกับภาษีจะแสดงข้อมูลบริษัทของเรา ข้อมูลลูกค้า รายการสินค้า ยอดรวม และเลขที่ใบอนุญาต"

**[Scene: Click Print]**

## Section 6: Invoice Status Workflow (2 minutes)

**[Scene: Status diagram]**

**Narrator:**
"ทำความเข้าใจสถานะของใบกำกับภาษี"

**Status Flow:**
```
DRAFT (ฉบับร่าง)
    ↓
ISSUED (ออกแล้ว)
    ↓
├── PAID (ชำระแล้ว) ← รับเงินครบ
├── PARTIAL (ชำระบางส่วน) ← รับเงินบางส่วน
└── CANCELLED (ยกเลิก) ← ยกเลิกเอกสาร
```

**Narrator:**
"เมื่อลูกค้าชำระเงิน เราจะบันทึกใบเสร็จรับเงิน สถานะใบกำกับภาษีจะเปลี่ยนเป็น ชำระแล้ว โดยอัตโนมัติ"

## Conclusion (1 minute)

**[Scene: Return to invoice list]**

**Narrator:**
"ในตอนนี้คุณได้เรียนรู้การสร้างใบกำกับภาษีขายครบถ้วนแล้ว ต่อไปเราจะเรียนรู้การรับชำระเงินจากลูกค้า"

**Summary:**
✅ เพิ่มข้อมูลลูกค้า  
✅ เพิ่มข้อมูลสินค้า  
✅ สร้างใบกำกับภาษี  
✅ ออกใบกำกับภาษี  
✅ พิมพ์ใบกำกับภาษี  

**Next Episode:**
"ตอนหน้าเราจะเรียนรู้การบันทึกใบเสร็จรับเงินและการจัดสรรเงินกับใบกำกับภาษี"

**Call to Action:**
"ฝึกฝนการสร้างใบกำกับภาษีด้วยตัวเอง และติดตามตอนต่อไป"

---

## Production Notes

### Key Screenshots Needed
1. Customer list and creation
2. Product list and creation
3. Invoice form - header
4. Invoice form - line items
5. Invoice totals calculation
6. Issue invoice confirmation
7. Print preview

### Calculations to Show
- Line item totals
- Discount calculations
- VAT calculations
- Grand total

### Common Mistakes to Warn
- Wrong customer selection
- Incorrect dates
- Math errors in manual entry
- Forgetting to issue invoice
