# Video Tutorial Script: 03 - Managing Receipts

## Video Information

- **Title:** Managing Receipts (การบริหารใบเสร็จรับเงิน)
- **Duration:** 12-15 minutes
- **Target Audience:** Users who completed tutorial 02
- **Prerequisites:** Understanding of invoices and customer management

## Introduction (1 minute)

**[Scene: Receipt list page]**

**Narrator:** "สวัสดีครับ/ค่ะ
ในตอนนี้เราจะมาเรียนรู้การบันทึกการรับเงินจากลูกค้า
ซึ่งเป็นขั้นตอนสำคัญในการปิดการขายและติดตามลูกหนี้"

**On-screen text:**

- ใบเสร็จรับเงิน (Receipt)
- การชำระเงิน (Payment)
- การหักภาษี ณ ที่จ่าย (WHT)

**Learning Objectives:**

1. สร้างใบเสร็จรับเงิน
2. จัดสรรกับใบกำกับภาษี
3. บันทึกการหักภาษี ณ ที่จ่าย
4. รับชำระหลายใบกำกับภาษี
5. พิมพ์ใบเสร็จรับเงิน

## Section 1: Understanding the Receipt Process (2 minutes)

**[Scene: Flowchart showing invoice to receipt workflow]**

**Narrator:** "เมื่อลูกค้าชำระเงินตามใบกำกับภาษีที่ส่งให้
เราต้องบันทึกใบเสร็จรับเงินเพื่อ"

**Key Points:**

1. บันทึกรายการรับเงิน
2. ลดยอดลูกหนี้
3. อัปเดตสถานะใบกำกับภาษี
4. สร้างรายการบัญชี
5. ออกเอกสารให้ลูกค้า

**[Scene: Navigate to Receipts menu]**

**Narrator:** "ไปที่เมนู ใบเสร็จรับเงิน เราจะเห็นรายการใบเสร็จทั้งหมด"

## Section 2: Creating a Simple Receipt (4 minutes)

**[Scene: Receipt list, click Create New]**

**Narrator:** "คลิกที่ปุ่ม สร้างใบเสร็จรับเงินใหม่"

**[Scene: Receipt creation form]**

**Receipt Header:**

```
ลูกค้า: บริษัท เอบีซี จำกัด
วันที่รับเงิน: 20/03/2026
เลขที่อ้างอิง: โอน-1234
วิธีการชำระเงิน: โอนเงิน
บัญชีธนาคาร: กสิกรไทย 123-4-56789-0
```

**[Scene: Select customer and payment method]**

**Narrator:** "เมื่อเลือกลูกค้า ระบบจะแสดงใบกำกับภาษีที่ค้างชำระทั้งหมด"

**Outstanding Invoices:**

```
☐ INV-202603-0001 - 17,815.50 บาท - ครบกำหนด: 15/04/2026
☐ INV-202603-0002 - 53,500.00 บาท - ครบกำหนด: 31/03/2026
☐ INV-202603-0003 - 10,700.00 บาท - ครบกำหนด: 10/04/2026
```

**[Scene: Select invoice to allocate]**

**Narrator:** "เลือกใบกำกับภาษีที่ต้องการจัดสรร
ในตัวอย่างนี้ลูกค้าชำระใบแรกเต็มจำนวน"

**Allocation:**

```
ใบกำกับภาษี: INV-202603-0001
จำนวนเงิน: 17,815.50
ยอดคงเหลือ: 0.00
หัก ณ ที่จ่าย: -
```

**[Scene: Enter allocation amount]**

**Narrator:** "กรอกจำนวนเงินที่รับชำระ ถ้าชำระเต็มจำนวน ยอดคงเหลือจะเป็นศูนย์"

**Receipt Summary:**

```
จำนวนเงินรวม: 17,815.50
หัก ณ ที่จ่าย: 0.00
ยอดสุทธิ: 17,815.50
```

**[Scene: Click Save]**

**Narrator:** "บันทึกใบเสร็จ สถานะจะเป็น ฉบับร่าง (Draft)"

## Section 3: Posting the Receipt (2 minutes)

**[Scene: Receipt detail page]**

**Narrator:** "หลังจากบันทึกแล้ว เราต้อง โพสต์ (Post) เพื่อบันทึกบัญชี"

**[Scene: Click Post button]**

**Confirmation Dialog:**

```
ยืนยันการโพสต์ใบเสร็จรับเงิน?

การโพสต์จะ:
✓ สร้างรายการบัญชี
✓ ลดยอดลูกหนี้
✓ อัปเดตสถานะใบกำกับภาษี
✓ ไม่สามารถแก้ไขได้

[ยกเลิก] [ยืนยัน]
```

**[Scene: Confirm post]**

**Journal Entry Created:**

```
เดบิต เงินฝากธนาคาร: 17,815.50
เครดิต ลูกหนี้การค้า: 17,815.50
```

**[Scene: Show posted status and linked journal]**

**Narrator:** "ระบบสร้างรายการบัญชีโดยอัตโนมัติ เพิ่มเงินในธนาคาร และลดลูกหนี้"

## Section 4: Partial Payment (3 minutes)

**[Scene: Create new receipt]**

**Narrator:** "ในกรณีที่ลูกค้าชำระบางส่วน เราสามารถบันทึกได้เช่นกัน"

**Receipt Header:**

```
ลูกค้า: บริษัท เอบีซี จำกัด
วันที่รับเงิน: 25/03/2026
วิธีการชำระเงิน: เงินสด
```

**Outstanding Invoices:**

```
☑ INV-202603-0002 - 53,500.00 บาท - ครบกำหนด: 31/03/2026
```

**Partial Allocation:**

```
ใบกำกับภาษี: INV-202603-0002
จำนวนเงิน: 30,000.00
ยอดคงเหลือ: 23,500.00
หัก ณ ที่จ่าย: -
```

**[Scene: Enter partial amount]**

**Narrator:** "ลูกค้าชำระ 30,000 บาท จากยอด 53,500 บาท เหลือค้างชำระ 23,500 บาท"

**[Scene: Post receipt]**

**Invoice Status:**

```
สถานะใบกำกับภาษี INV-202603-0002: ชำระบางส่วน (PARTIAL)
ชำระแล้ว: 30,000.00
ค้างชำระ: 23,500.00
```

## Section 5: Withholding Tax (3 minutes)

**[Scene: Create new receipt with WHT]**

**Narrator:** "บางครั้งลูกค้าหักภาษี ณ ที่จ่ายไว้ เช่น ค่าบริการต้องหัก 3%"

**Receipt with WHT:**

```
ลูกค้า: บริษัท เอบีซี จำกัด
วันที่รับเงิน: 28/03/2026
วิธีการชำระเงิน: โอนเงิน
```

**Outstanding Invoice:**

```
☑ INV-202603-0004 - 100,000.00 บาท (ค่าบริการ)
```

**WHT Configuration:**

```
จำนวนเงิน: 100,000.00
หัก ณ ที่จ่าย: ✓
ประเภท: ภ.ง.ด.53 (นิติบุคคล)
รายได้: ค่าบริการ
อัตรา: 3%
ภาษีหัก: 3,000.00
```

**[Scene: Enable WHT and configure]**

**Narrator:** "เลือกประเภทเอกสารและรายได้ ระบบจะคำนวณอัตราภาษีอัตโนมัติ"

**Receipt Summary:**

```
จำนวนเงินใบกำกับภาษี: 100,000.00
หัก ณ ที่จ่าย (3%): 3,000.00
รับเงินสุทธิ: 97,000.00
```

**[Scene: Post receipt]**

**Journal Entries:**

```
เดบิต เงินฝากธนาคาร: 97,000.00
เดบิต ภาษีหัก ณ ที่จ่าย: 3,000.00
เครดิต ลูกหนี้การค้า: 100,000.00
```

**Narrator:** "ภาษีหัก ณ ที่จ่ายจะถูกบันทึกเป็นสินทรัพย์
ใช้หักภาษีเงินได้สิ้นปี"

## Section 6: Multi-Invoice Payment (2 minutes)

**[Scene: Create receipt for multiple invoices]**

**Narrator:** "ลูกค้าสามารถชำระหลายใบกำกับภาษีในครั้งเดียว"

**Multiple Allocations:**

```
☑ INV-202603-0001 - ชำระ: 17,815.50 / ค้าง: 0.00
☑ INV-202603-0003 - ชำระ: 10,000.00 / ค้าง: 700.00
☑ INV-202603-0005 - ชำระ: 25,000.00 / ค้าง: 0.00

รวมรับชำระ: 52,815.50
```

**[Scene: Select multiple invoices]**

**Narrator:** "เลือกหลายใบกำกับภาษีและกรอกจำนวนที่รับชำระในแต่ละใบ"

## Section 7: Receipt Reports (2 minutes)

**[Scene: Reports menu]**

**Narrator:** "ระบบมีรายงานเกี่ยวกับการรับเงินหลายรูปแบบ"

**Available Reports:**

1. **รายงานใบเสร็จรับเงิน** - แสดงใบเสร็จทั้งหมดตามช่วงเวลา
2. **รายงานการรับชำระตามลูกค้า** - สรุปยอดรับจากแต่ละลูกค้า
3. **รายงานการรับชำระตามวิธีการ** - เงินสด โอน เช็ค

**[Scene: Generate receipt report]**

**Narrator:** "สามารถส่งออกรายงานเป็น Excel หรือ PDF เพื่อวิเคราะห์ต่อไป"

## Conclusion (1 minute)

**[Scene: Receipt list summary]**

**Narrator:** "ในตอนนี้คุณได้เรียนรู้การบันทึกใบเสร็จรับเงินครบถ้วนแล้ว
ต่อไปเราจะเรียนรู้การบันทึกการจ่ายเงินให้ผู้ขาย"

**Summary:** ✅ สร้างใบเสร็จรับเงิน  
✅ จัดสรรกับใบกำกับภาษี  
✅ บันทึกภาษีหัก ณ ที่จ่าย  
✅ รับชำระหลายใบ  
✅ ดูรายงาน

**Next Episode:** "ตอนหน้าเราจะเรียนรู้การบันทึกใบสำคัญจ่ายและการจัดการเจ้าหนี้"

---

## Production Notes

### Calculations to Show

- Partial payment calculations
- WHT calculations (various rates)
- Running balance
- Multi-invoice totals

### WHT Rates Reference

| รายได้       | PND3 | PND53 |
| ------------ | ---- | ----- |
| ค่าบริการ    | 3%   | 3%    |
| ค่าเช่า      | 5%   | 5%    |
| ค่าจ้างทำของ | 3%   | 1%    |
| ค่าโฆษณา     | 2%   | 2%    |

### Common Scenarios

- Full payment
- Partial payment
- Overpayment (advance)
- WHT on service
- WHT on rent
- Multi-invoice payment
