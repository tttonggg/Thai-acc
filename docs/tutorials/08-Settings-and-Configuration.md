# Video Tutorial Script: 08 - Settings and Configuration

## Video Information

- **Title:** Settings and Configuration (การตั้งค่าและการกำหนดค่า)
- **Duration:** 12-15 minutes
- **Target Audience:** Administrators, system admins
- **Prerequisites:** Admin access

## Introduction (1 minute)

**[Scene: Settings dashboard]**

**Narrator:** "สวัสดีครับ/ค่ะ ในตอนนี้เราจะมาเรียนรู้การตั้งค่าระบบทั้งหมด
ซึ่งจำเป็นสำหรับผู้ดูแลระบบ"

**On-screen text:**

- Company Settings
- User Management
- Document Numbering
- Security Settings

## Section 1: Company Information (3 minutes)

**[Scene: Company settings page]**

**Narrator:** "เริ่มจากข้อมูลบริษัท ซึ่งจะปรากฏในเอกสารทั้งหมด"

**Company Details:**

```
ชื่อบริษัท (ไทย): บริษัท ตัวอย่าง จำกัด
ชื่อบริษัท (อังกฤษ): Example Company Ltd.
เลขประจำตัวผู้เสียภาษี: 1234567890123
รหัสสาขา: 00000 (สำนักงานใหญ่)

ที่อยู่:
123 ถนนสุขุมวิท
แขวงคลองเตย เขตคลองเตย
กรุงเทพมหานคร 10110

โทรศัพท์: 02-123-4567
อีเมล: info@example.com
เว็บไซต์: www.example.com
```

**[Scene: Upload logo]**

**Narrator:** "อัปโหลดโลโก้บริษัทสำหรับแสดงในเอกสาร"

**Logo Requirements:**

- ขนาดแนะนำ: 200x80 pixels
- รูปแบบ: PNG หรือ JPG
- พื้นหลังโปร่งใสแนะนำ

## Section 2: Accounting Settings (3 minutes)

**[Scene: Accounting settings]**

**Narrator:** "กำหนดค่าทางบัญชีที่สำคัญ"

**Settings:**

```
อัตราภาษีมูลค่าเพิ่ม: 7%
วันเริ่มปีงบประมาณ: 01/01
สกุลเงิน: THB (บาท)
รูปแบบวันที่: วัน/เดือน/ปี
ตำแหน่งทศนิยม: 2 ตำแหน่ง
ภาษาที่ใช้: ไทย
```

**Fiscal Year:**

```
ปีงบประมาณ: มกราคม - ธันวาคม
หรือ
ปีงบประมาณ: เมษายน - มีนาคม
```

## Section 3: Document Numbering (2 minutes)

**[Scene: Document numbering settings]**

**Narrator:** "กำหนดรูปแบบเลขที่เอกสารอัตโนมัติ"

**Number Formats:**

```
ใบกำกับภาษีขาย: INV-{YYYY}{MM}-{0000}
ใบเสร็จรับเงิน: REC-{YYYY}{MM}-{0000}
ใบสำคัญจ่าย:    PAY-{YYYY}{MM}-{0000}
สมุดรายวัน:    JV-{YYYY}{MM}-{0000}
ใบสั่งซื้อ:     PO-{YYYY}{MM}-{0000}
```

**Variables:**

- {YYYY} = ปี ค.ศ. (2026)
- {MM} = เดือน (03)
- {0000} = ลำดับเลข (0001)

**Example Result:**

```
INV-202603-0001
REC-202603-0156
JV-202603-0089
```

## Section 4: User Management (3 minutes)

**[Scene: User management page]**

**Narrator:** "จัดการผู้ใช้งานและสิทธิ์การเข้าถึง"

**Create New User:**

```
ชื่อ: นักบัญชี หนึ่ง
อีเมล: accountant@example.com
รหัสผ่าน: ********
ยืนยันรหัสผ่าน: ********

บทบาท: ACCOUNTANT
- ดู: ทั้งหมด
- สร้าง: ทั้งหมด
- แก้ไข: เอกสารที่ยังไม่โพสต์
- โพสต์: ได้
- ลบ: เอกสารที่ยังไม่โพสต์
```

**[Scene: Show role permissions]**

**Role Descriptions:**

```
ADMIN: ควบคุมทั้งหมด
- จัดการผู้ใช้
- ตั้งค่าระบบ
- ทุกอย่าง

ACCOUNTANT: นักบัญชี
- บัญชีทั้งหมด
- โพสต์เอกสาร
- รายงานทั้งหมด

USER: ผู้ใช้ทั่วไป
- สร้างเอกสาร
- ไม่สามารถโพสต์
- ไม่เข้าถึงการตั้งค่า

VIEWER: ผู้ดูอย่างเดียว
- ดูรายงาน
- ดูเอกสาร
- ไม่สามารถแก้ไข
```

## Section 5: Email Settings (2 minutes)

**[Scene: Email settings]**

**Narrator:** "ตั้งค่าอีเมลสำหรับส่งเอกสาร"

**SMTP Configuration:**

```
SMTP Server: smtp.gmail.com
Port: 587
Security: TLS

Username: noreply@example.com
Password: ********

From Name: Example Company
From Email: noreply@example.com
```

**Test Email:**

```
[ส่งอีเมลทดสอบ]
```

## Section 6: Backup Settings (2 minutes)

**[Scene: Backup settings]**

**Narrator:** "ตั้งค่าการสำรองข้อมูลอัตโนมัติ"

**Automatic Backup:**

```
ความถี่: ทุกวัน
เวลา: 02:00 น.
เก็บย้อนหลัง: 30 วัน

ที่เก็บ:
☐ คลาวด์ (Google Drive)
☑ ดิสก์ภายใน
☐ FTP Server
```

## Conclusion (1 minute)

**[Scene: Settings summary]**

**Narrator:** "คุณได้เรียนรู้การตั้งค่าระบบทั้งหมดแล้ว
ต่อไปเราจะเรียนรู้การสำรองและกู้คืนข้อมูล"
