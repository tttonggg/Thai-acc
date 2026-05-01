# Video Tutorial Script: 04 - Journal Entries

## Video Information

- **Title:** Journal Entries (สมุดรายวัน)
- **Duration:** 15-18 minutes
- **Target Audience:** Accountants and accounting staff
- **Prerequisites:** Understanding of double-entry bookkeeping

## Introduction (1 minute)

**[Scene: Journal entry list]**

**Narrator:** "สวัสดีครับ/ค่ะ
ในตอนนี้เราจะมาเรียนรู้การบันทึกรายการบัญชีด้วยสมุดรายวัน
ซึ่งเป็นหัวใจสำคัญของระบบบัญชี Double Entry"

**On-screen text:**

- Double-Entry Bookkeeping
- เดบิต = Credit
- บัญชีแยกประเภท (GL)

**Learning Objectives:**

1. เข้าใจหลักการบัญชี Double Entry
2. สร้างรายการบัญชี
3. บันทึกรายการประจำวัน
4. บันทึกรายการปรับปรุง
5. ยกเลิกรายการบัญชี

## Section 1: Double-Entry Basics (3 minutes)

**[Scene: Accounting equation diagram]**

**Narrator:** "ระบบบัญชี Double Entry มีหลักการสำคัญคือ
ทุกรายการต้องมีเดบิตและเครดิตเท่ากัน"

**Accounting Equation:**

```
สินทรัพย์ = หนี้สิน + ทุน
Assets = Liabilities + Equity
```

**Debit/Credit Rules:**

| ประเภทบัญชี | เดบิต (Debit) | เครดิต (Credit) |
| ----------- | ------------- | --------------- |
| สินทรัพย์   | เพิ่ม         | ลด              |
| หนี้สิน     | ลด            | เพิ่ม           |
| ทุน         | ลด            | เพิ่ม           |
| รายได้      | ลด            | เพิ่ม           |
| ค่าใช้จ่าย  | เพิ่ม         | ลด              |

**[Scene: Show T-accounts]**

**Narrator:** "จำไว้ว่า สินทรัพย์และค่าใช้จ่าย เดบิตเพิ่ม ส่วนหนี้สิน ทุน
และรายได้ เครดิตเพิ่ม"

## Section 2: Chart of Accounts Review (2 minutes)

**[Scene: Chart of accounts]**

**Narrator:** "ก่อนบันทึกบัญชี เราต้องเข้าใจผังบัญชีของเรา"

**Account Structure:**

```
1xxx - สินทรัพย์ (Assets)
  11xx - สินทรัพย์หมุนเวียน
    1101 - ลูกหนี้การค้า
    1102 - เงินสด
    1103 - เงินฝากธนาคาร
  12xx - สินทรัพย์ถาวร

2xxx - หนี้สิน (Liabilities)
  21xx - หนี้สินหมุนเวียน
    2101 - เจ้าหนี้การค้า

4xxx - รายได้ (Revenue)
  4101 - รายได้ขายสินค้า
  4102 - รายได้ค่าบริการ

5xxx - ค่าใช้จ่าย (Expenses)
  5101 - ต้นทุนขาย
  5102 - ค่าใช้จ่ายบุคลากร
```

## Section 3: Creating a Journal Entry (4 minutes)

**[Scene: Journal entry list, click Create New]**

**Narrator:** "ไปที่เมนู สมุดรายวัน และคลิก สร้างรายการใหม่"

**[Scene: Journal entry form]**

**Journal Entry Header:**

```
วันที่: 31/03/2026
คำอธิบาย: บันทึกค่าเช่าสำนักงาน เดือน มี.ค.
เลขที่อ้างอิง: INV-RENT-0326
```

**[Scene: Enter header information]**

**Adding Journal Lines:**

**Example 1: Rent Expense**

```
รายการที่ 1:
  บัญชี: ค่าเช่า (5220)
  คำอธิบาย: ค่าเช่าสำนักงาน มี.ค. 66
  เดบิต: 25,000
  เครดิต: -

รายการที่ 2:
  บัญชี: เงินฝากธนาคาร (1103)
  คำอธิบาย: จ่ายค่าเช่า
  เดบิต: -
  เครดิต: 25,000
```

**[Scene: Add both lines]**

**Balance Check:**

```
รวมเดบิต: 25,000
รวมเครดิต: 25,000
สถานะ: บัญชีดุล (Balanced) ✓
```

**[Scene: Verify balance]**

**Narrator:** "ตรวจสอบให้แน่ใจว่ายอดเดบิตเท่ากับยอดเครดิต
ระบบจะแสดงสถานะบัญชีดุลเมือยอดเท่ากัน"

**[Scene: Click Save]**

## Section 4: Common Journal Entry Types (4 minutes)

**[Scene: Multiple examples]**

**Example 1: Accrued Expenses**

```
วันที่: 31/03/2026
คำอธิบาย: ค่าใช้จ่ายค้างจ่าย - เงินเดือน

เดบิต  ค่าใช้จ่ายเงินเดือน      150,000
เครดิต ค่าใช้จ่ายเงินเดือนค้างจ่าย    150,000
```

**Example 2: Depreciation**

```
วันที่: 31/03/2026
คำอธิบาย: ค่าเสื่อมราคาเครื่องใช้สำนักงาน

เดบิต  ค่าเสื่อมราคา           5,000
เครดิต ค่าเสื่อมราคาสะสม        5,000
```

**Example 3: Prepaid Expenses**

```
วันที่: 01/03/2026
คำอธิบาย: จ่ายค่าประกันภัยล่วงหน้า 1 ปี

เดบิต  ประกันภัยจ่ายล่วงหน้า    60,000
เครดิต เงินฝากธนาคาร            60,000
```

**Example 4: Adjusting Prepaid**

```
วันที่: 31/03/2026
คำอธิบาย: บันทึกค่าประกันภัยเดือน มี.ค.

เดบิต  ค่าใช้จ่ายประกันภัย       5,000
เครดิต ประกันภัยจ่ายล่วงหน้า      5,000
```

**Example 5: Owner's Drawings**

```
วันที่: 15/03/2026
คำอธิบาย: เบิกเงินส่วนตัวเจ้าของ

เดบิต  เงินเบิกเกินบัญชี        20,000
เครดิต เงินฝากธนาคาร            20,000
```

## Section 5: Posting Journal Entries (2 minutes)

**[Scene: Journal entry detail]**

**Narrator:** "หลังจากบันทึกรายการแล้ว เราต้องโพสต์เพื่อบันทึกลงบัญชีแยกประเภท"

**[Scene: Click Post]**

**Confirmation:**

```
ยืนยันการโพสต์รายการบัญชี?

เลขที่: JV-202603-0156
วันที่: 31/03/2026
ยอด: 25,000 บาท

[ยกเลิก] [ยืนยัน]
```

**[Scene: Confirm, show posted status]**

**Narrator:** "เมื่อโพสต์แล้วจะได้เลขที่รายการบัญชี และไม่สามารถแก้ไขได้"

## Section 6: Reversing Entries (2 minutes)

**[Scene: Posted journal entry]**

**Narrator:** "หากบันทึกผิดพลาด เราต้องยกเลิกด้วยการบันทึกสมผล (Reversing
Entry)"

**[Scene: Click Reverse]**

**Reversing Entry Created:**

```
เลขที่: JV-202603-0156-R
วันที่: 31/03/2026
คำอธิบาย: ยกเลิกรายการ JV-202603-0156

เดบิต  เงินฝากธนาคาร           25,000
เครดิต ค่าเช่า                  25,000
```

**[Scene: Show original and reversing entries]**

**Narrator:** "การยกเลิกจะสร้างรายการใหม่ที่สลับเดบิตเครดิตกัน
ทำให้ผลกระทบเป็นศูนย์"

## Section 7: Recurring Entries (1 minute)

**[Scene: Recurring entries setup]**

**Narrator:** "สำหรับรายการที่เกิดขึ้นประจำ สามารถตั้งค่ารายการประจำได้"

**Example Recurring Entries:**

- ค่าเช่า เดือนละครั้ง
- ค่าเสื่อมราคา เดือนละครั้ง
- เงินเดือน เดือนละครั้ง

**[Scene: Set up recurring template]**

## Section 8: General Ledger Report (1 minute)

**[Scene: GL Report]**

**Narrator:** "ดูรายการทั้งหมดในบัญชีแยกประเภท"

**GL View:**

```
บัญชี: ค่าเช่า (5220)
งวด: มีนาคม 2026

วันที่       | เลขที่      | คำอธิบาย        | เดบิต   | เครดิต  | คงเหลือ
--------------------------------------------------------------------------------
01/03/2026 | OB         | ยอดยกมา        | -       | -       | 0.00
05/03/2026 | JV-156     | ค่าเช่าร้านค้า  | 15,000  | -       | 15,000
15/03/2026 | JV-157     | ค่าเช่าเครื่อง  | 8,000   | -       | 23,000
31/03/2026 | JV-158     | ค่าเช่าสำนักงาน | 25,000  | -       | 48,000
```

## Conclusion (1 minute)

**[Scene: Summary]**

**Narrator:** "คุณได้เรียนรู้การใช้สมุดรายวันแล้ว
ซึ่งเป็นพื้นฐานสำคัญของการบัญชี"

**Next Episode:** "ตอนหน้าเราจะเรียนรู้การอ่านและวิเคราะห์รายงานทางการเงิน"

---

## Production Notes

### Key Concepts

- Double-entry visualization
- T-accounts
- Trial balance concept
- Account classifications

### Animations Needed

- Debit/Credit arrows
- Account balance changes
- Journal flow to GL
