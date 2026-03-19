# PR/PO System Design
## ระบบใบขอซื้อและใบสั่งซื้อ (Purchase Request & Purchase Order System)

---

## 📋 ภาพรวมระบบ (System Overview)

ระบบ PR/PO เป็น workflow สำหรับการจัดการการซื้อสินค้าและบริการ โดยมีขั้นตอนดังนี้:

```
Purchase Request (PR) → Approval → Purchase Order (PO) → Goods Receipt → Purchase Invoice
    ใบขอซื้อ           อนุมัติ          ใบสั่งซื้อ          รับสินค้า           ใบซื้อ
```

---

## 🗄️ Database Schema Design

### 1. PurchaseRequest Model (ใบขอซื้อ)

```prisma
model PurchaseRequest {
  id                String              @id @default(cuid())
  requestNo         String              @unique // เลขที่ใบขอซื้อ PR202603-001
  requestDate       DateTime            @default(now()) // วันที่ขอซื้อ
  requestedBy       String              // ผู้ขอซื้อ
  requestedByUser   User                @relation("Requester", fields: [requestedBy], references: [id])
  department        String?             // แผนก
  departmentId      String?             // เชื่อมโยงแผนก
  departmentData    Department?         @relation(fields: [departmentId], references: [id])

  // ข้อมูลผู้อนุมัติ
  approvedBy        String?             // ผู้อนุมัติ
  approvedByUser    User?               @relation("Approver", fields: [approvedBy], references: [id])
  approvedAt        DateTime?           // วันที่อนุมัติ
  approvalNotes     String?             // หมายเหตุการอนุมัติ

  // รายละเอียดการขอซื้อ
  requiredDate      DateTime?           // วันที่ต้องการสินค้า
  reason            String?             // เหตุผลการขอซื้อ
  priority          RequestPriority     @default(NORMAL) // ความสำคัญ

  // งบประมาณ
  budgetId          String?             // อ้างอิงงบประมาณ
  budgetAmount       Int?                // วงเงินงบประมาณ (สตางค์)
  estimatedAmount   Int                 @default(0) // วงเงินประมาณการ (สตางค์)

  // สถานะ
  status            RequestStatus        @default(DRAFT)
  submittedAt       DateTime?           // วันที่ส่งอนุมัติ

  // เชื่อมโยงกับ PO
  purchaseOrderId   String?             @unique // อ้างอิง PO
  purchaseOrder     PurchaseOrder?      @relation(fields: [purchaseOrderId], references: [id])

  // รายการสินค้า
  lines             PurchaseRequestLine[]

  // เอกสารและบันทึก
  notes             String?             // หมายเหตุ
  attachments       Json?               // เอกสารแนบ
  internalNotes     String?             // บันทึกภายใน

  // Audit
  createdById       String
  createdBy         User                @relation("PRCreator", fields: [createdById], references: [id])
  updatedById       String?
  updatedBy         User?               @relation("PRUpdater", fields: [updatedById], references: [id])
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  @@index([requestedBy])
  @@index([status])
  @@index([departmentId])
  @@index([requestDate])
  @@index([createdById])
}

enum RequestPriority {
  URGENT       // ด่วนมาก
  HIGH         // สูง
  NORMAL       // ปกติ
  LOW          // ต่ำ
}

enum RequestStatus {
  DRAFT           // ร่าง
  PENDING         // รออนุมัติ
  APPROVED        // อนุมัติแล้ว
  REJECTED        // ปฏิเสธ
  CANCELLED       // ยกเลิก
  CONVERTED       // แปลงเป็น PO แล้ว
}

model PurchaseRequestLine {
  id              String           @id @default(cuid())
  requestId       String
  request         PurchaseRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  lineNo          Int              // ลำดับรายการ
  productId       String?          // สินค้า
  product         Product?         @relation(fields: [productId], references: [id])
  description     String           // รายการสินค้า
  quantity        Float            // จำนวนที่ขอ
  unit            String           @default("ชิ้น") // หน่วย
  unitPrice       Float            @default(0) // ราคาประมาณการ
  discount        Float            @default(0) // ส่วนลด
  vatRate         Float            @default(7) // อัตรา VAT %
  vatAmount       Float            @default(0) // ภาษีมูลค่าเพิ่ม
  amount          Float            @default(0) // จำนวนเงิน

  // ข้อมูลเพิ่มเติม
  suggestedVendor String?         // ผู้ขายที่แนะนำ
  specUrl         String?          // URL รายละเอียดสินค้า
  notes           String?          // หมายเหตุ

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([requestId])
  @@index([productId])
}
```

### 2. PurchaseOrder Model (ใบสั่งซื้อ)

```prisma
model PurchaseOrder {
  id                String              @id @default(cuid())
  orderNo           String              @unique // เลขที่ PO PO202603-001
  orderDate         DateTime            @default(now()) // วันที่สั่งซื้อ
  expectedDate      DateTime?           // วันที่คาดว่าจะได้รับสินค้า

  // ข้อมูลผู้ขาย
  vendorId          String
  vendor            Vendor              @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  vendorContact     String?             // ผู้ติดต่อ
  vendorEmail       String?             // อีเมลผู้ขาย
  vendorPhone       String?             // โทรศัพท์ผู้ขาย
  vendorAddress     String?             // ที่อยู่จัดส่ง

  // อ้างอิง PR
  purchaseRequestId String?            @unique // อ้างอิง PR
  purchaseRequest   PurchaseRequest?    @relation(fields: [purchaseRequestId], references: [id])

  // รายละเอียดการสั่งซื้อ
  shippingTerms     String?             // เงื่อนไขการจัดส่ง
  paymentTerms      String?             // เงื่อนไขการชำระเงิน
  deliveryAddress   String?             // สถานที่จัดส่ง

  // งบประมาณ
  budgetId          String?             // อ้างอิงงบประมาณ
  budgetAmount      Int?                // วงเงินงบประมาณ (สตางค์)

  // ยอดรวม
  subtotal          Int                 @default(0) // มูลค่าก่อน VAT (สตางค์)
  vatRate           Float               @default(7) // อัตรา VAT %
  vatAmount         Int                 @default(0) // ภาษีมูลค่าเพิ่ม (สตางค์)
  totalAmount       Int                 @default(0) // ยอดรวม (สตางค์)
  discountAmount    Int                 @default(0) // ส่วนลด (สตางค์)

  // สถานะ
  status            OrderStatus         @default(DRAFT)
  submittedAt       DateTime?           // วันที่ส่งผู้ขาย
  confirmedAt       DateTime?           // วันที่ยืนยันจากผู้ขาย
  shippedAt         DateTime?           // วันที่จัดส่ง
  receivedAt        DateTime?           // วันที่รับสินค้า

  // เชื่อมโยงกับใบซื้อ
  purchaseInvoiceId String?            @unique // อ้างอิงใบซื้อ
  purchaseInvoice   PurchaseInvoice?    @relation(fields: [purchaseInvoiceId], references: [id])

  // รายการสินค้า
  lines             PurchaseOrderLine[]

  // เอกสารและบันทึก
  notes             String?             // หมายเหตุ
  internalNotes     String?             // บันทึกภายใน
  attachments       Json?               // เอกสารแนบ
  vendorNotes       String?             // หมายเหตุสำหรับผู้ขาย

  // Audit
  createdById       String
  createdBy         User                @relation("POCreator", fields: [createdById], references: [id])
  updatedById       String?
  updatedBy         User?               @relation("POUpdater", fields: [updatedById], references: [id])
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  @@index([vendorId])
  @@index([status])
  @@index([orderDate])
  @@index([createdById])
  @@index([purchaseRequestId])
}

enum OrderStatus {
  DRAFT           // ร่าง
  PENDING         // รออนุมัติ
  APPROVED        // อนุมัติแล้ว
  SENT            // ส่งให้ผู้ขายแล้ว
  CONFIRMED       // ผู้ขายยืนยันแล้ว
  SHIPPED         // จัดส่งแล้ว
  RECEIVED        // รับสินค้าแล้ว
  CANCELLED       // ยกเลิก
  CLOSED          // ปิดบัญชีแล้ว
}

model PurchaseOrderLine {
  id              String         @id @default(cuid())
  orderId        String
  order          PurchaseOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  lineNo          Int            // ลำดับรายการ
  productId       String?        // สินค้า
  product         Product?       @relation(fields: [productId], references: [id])
  description     String         // รายการสินค้า
  quantity        Float          // จำนวนสั่งซื้อ
  receivedQty     Float          @default(0) // จำนวนที่รับแล้ว
  unit            String         @default("ชิ้น") // หน่วย
  unitPrice       Float          @default(0) // ราคาต่อหน่วย
  discount        Float          @default(0) // ส่วนลด
  vatRate         Float          @default(7) // อัตรา VAT %
  vatAmount       Float          @default(0) // ภาษีมูลค่าเพิ่ม
  amount          Float          @default(0) // จำนวนเงิน

  // ข้อมูลเพิ่มเติม
  specUrl         String?        // URL รายละเอียดสินค้า
  notes           String?        // หมายเหตุ

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([orderId])
  @@index([productId])
}
```

### 3. Department Model (แผนก)

```prisma
model Department {
  id              String              @id @default(cuid())
  code            String              @unique // รหัสแผนก
  name            String              // ชื่อแผนก
  nameEn          String?             // ชื่อภาษาอังกฤษ
  managerId       String?             // ผู้จัดการแผนก
  manager         User?               @relation(fields: [managerId], references: [id])
  parentId        String?             // แผนกแม่
  parent          Department?         @relation("DeptHierarchy", fields: [parentId], references: [id])
  children        Department[]        @relation("DeptHierarchy")
  costCenter      String?             // ศูนย์ต้นทุน
  location        String?             // ที่ตั้ง
  isActive        Boolean             @default(true)
  notes           String?             // หมายเหตุ

  // เชื่อมโยง
  purchaseRequests PurchaseRequest[]
  budgets         Budget[]

  createdById     String
  createdBy       User                @relation(fields: [createdById], references: [id])
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([parentId])
  @@index([managerId])
}
```

### 4. Budget Model (งบประมาณ)

```prisma
model Budget {
  id              String          @id @default(cuid())
  code            String          @unique // รหัสงบประมาณ
  name            String          // ชื่องบประมาณ
  fiscalYear      Int             // ปีงบประมาณ
  departmentId    String?         // แผนก
  department      Department?     @relation(fields: [departmentId], references: [id])

  // วงเงิน
  allocatedAmount Int             @default(0) // วงเงินจัดสรร (สตางค์)
  usedAmount      Int             @default(0) // วงเงินที่ใช้ไป (สตางค์)
  remainingAmount Int             @default(0) // วงเงินคงเหลือ (สตางค์)

  startDate       DateTime        // วันที่เริ่ม
  endDate         DateTime        // วันที่สิ้นสุด
  status          BudgetStatus    @default(ACTIVE)

  notes           String?         // หมายเหตุ

  createdById     String
  createdBy       User            @relation(fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([fiscalYear])
  @@index([departmentId])
  @@index([status])
}

enum BudgetStatus {
  DRAFT       // ร่าง
  ACTIVE      // ใช้งานอยู่
  CLOSED      // ปิดแล้ว
  LOCKED      // ล็อก
}
```

### 5. อัปเดต Model ที่มีอยู่

```prisma
// อัปเดต PurchaseInvoice
model PurchaseInvoice {
  // ... เดิมมีอยู่ ...

  // เพิ่มเชื่อมโยง PO
  purchaseOrderId String?         // อ้างอิง PO
  purchaseOrder   PurchaseOrder?  @relation(fields: [purchaseOrderId], references: [id])
}

// อัปเดต User
model User {
  // ... เดิมมีอยู่ ...

  // เพิ่มเชื่อมโยง
  requestedPRs   PurchaseRequest[] @relation("Requester")
  approvedPRs    PurchaseRequest[] @relation("Approver")
  createdPRs     PurchaseRequest[] @relation("PRCreator")
  updatedPRs     PurchaseRequest[] @relation("PRUpdater")

  createdPOs     PurchaseOrder[]   @relation("POCreator")
  updatedPOs     PurchaseOrder[]   @relation("POUpdater")
}
```

---

## 🔌 API Routes Design

### Purchase Request APIs

```
GET    /api/purchase-requests          - ดึงรายการใบขอซื้อทั้งหมด
GET    /api/purchase-requests/:id      - ดึงรายละเอียดใบขอซื้อ
POST   /api/purchase-requests          - สร้างใบขอซื้อใหม่
PUT    /api/purchase-requests/:id      - แก้ไขใบขอซื้อ
DELETE /api/purchase-requests/:id      - ลบใบขอซื้อ
POST   /api/purchase-requests/:id/submit   - ส่งอนุมัติ
POST   /api/purchase-requests/:id/approve  - อนุมัติ
POST   /api/purchase-requests/:id/reject   - ปฏิเสธ
POST   /api/purchase-requests/:id/convert  - แปลงเป็น PO
GET    /api/purchase-requests/pending  - รายการรออนุมัติ
```

### Purchase Order APIs

```
GET    /api/purchase-orders             - ดึงรายการใบสั่งซื้อทั้งหมด
GET    /api/purchase-orders/:id         - ดึงรายละเอียดใบสั่งซื้อ
POST   /api/purchase-orders             - สร้างใบสั่งซื้อใหม่
PUT    /api/purchase-orders/:id         - แก้ไขใบสั่งซื้อ
DELETE /api/purchase-orders/:id         - ลบใบสั่งซื้อ
POST   /api/purchase-orders/:id/submit  - ส่งให้ผู้ขาย
POST   /api/purchase-orders/:id/confirm - ยืนยันจากผู้ขาย
POST   /api/purchase-orders/:id/cancel  - ยกเลิก
POST   /api/purchase-orders/:id/receive - รับสินค้า
GET    /api/purchase-orders/pending    - รายการรอดำเนินการ
```

### Department APIs

```
GET    /api/departments                 - ดึงรายการแผนกทั้งหมด
GET    /api/departments/:id             - ดึงรายละเอียดแผนก
POST   /api/departments                 - สร้างแผนกใหม่
PUT    /api/departments/:id             - แก้ไขแผนก
DELETE /api/departments/:id             - ลบแผนก
```

### Budget APIs

```
GET    /api/budgets                     - ดึงรายการงบประมาณทั้งหมด
GET    /api/budgets/:id                 - ดึงรายละเอียดงบประมาณ
POST   /api/budgets                     - สร้างงบประมาณใหม่
PUT    /api/budgets/:id                 - แก้ไขงบประมาณ
DELETE /api/budgets/:id                 - ลบงบประมาณ
GET    /api/budgets/check               - ตรวจสอบวงเงินคงเหลือ
```

---

## 🎨 UI Components Design

### Directory Structure

```
src/components/
├── purchase-requests/           # Purchase Request Components
│   ├── purchase-request-list.tsx      # รายการใบขอซื้อ
│   ├── purchase-request-form.tsx      # ฟอร์มสร้าง/แก้ไข
│   ├── purchase-request-view-dialog.tsx  # ดูรายละเอียด
│   ├── pr-approval-dialog.tsx         # กล่องอนุมัติ
│   └── pr-line-items.tsx              # รายการสินค้า
├── purchase-orders/              # Purchase Order Components
│   ├── purchase-order-list.tsx        # รายการใบสั่งซื้อ
│   ├── purchase-order-form.tsx        # ฟอร์มสร้าง/แก้ไข
│   ├── purchase-order-view-dialog.tsx # ดูรายละเอียด
│   ├── po-confirm-dialog.tsx          # กล่องยืนยัน
│   ├── po-receive-dialog.tsx          # กล่องรับสินค้า
│   └── po-line-items.tsx              # รายการสินค้า
├── departments/                  # Department Components
│   ├── department-list.tsx            # รายการแผนก
│   └── department-form.tsx            # ฟอร์มแผนก
└── budgets/                      # Budget Components
    ├── budget-list.tsx               # รายการงบประมาณ
    ├── budget-form.tsx               # ฟอร์มงบประมาณ
    └── budget-status-card.tsx        # การ์ดแสดงสถานะงบประมาณ
```

### Key UI Features

**Purchase Request List:**
- ตารางแสดงรายการ PR พร้อมสถานะและจำนวนเงิน
- ฟิลเตอร์ตามสถานะ (DRAFT, PENDING, APPROVED, REJECTED)
- ปุ่มดำเนินการ: สร้าง, แก้ไข, อนุมัติ, ปฏิเสธ, แปลงเป็น PO
- แสดง workflow status bar
- Dashboard cards: รออนุมัติ, อนุมัติแล้ว, ปฏิเสธ

**Purchase Order List:**
- ตารางแสดงรายการ PO พร้อมสถานะ
- ฟิลเตอร์ตามสถานะและผู้ขาย
- ปุ่มดำเนินการ: สร้าง, แก้ไข, ส่งผู้ขาย, ยืนยัน, ยกเลิก, รับสินค้า
- Progress tracker: DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED
- Dashboard cards: รอดำเนินการ, ส่งแล้ว, รับสินค้าแล้ว

---

## 🔄 Workflow Design

### Purchase Request Workflow

```
1. DRAFT (สร้าง PR)
   ↓
2. SUBMIT (ส่งอนุมัติ)
   ↓
3. PENDING_APPROVAL (รออนุมัติ)
   ↓
4a. APPROVE (อนุมัติ) → APPROVED
   4b. REJECT (ปฏิเสธ) → REJECTED
   ↓
5. CONVERT_TO_PO (แปลงเป็น PO)
   ↓
6. CONVERTED (แปลงเป็น PO แล้ว)
```

### Purchase Order Workflow

```
1. DRAFT (สร้าง PO จาก PR หรือสร้างใหม่)
   ↓
2. APPROVE (อนุมัติ)
   ↓
3. SENT (ส่งให้ผู้ขาย)
   ↓
4. CONFIRMED (ผู้ขายยืนยัน)
   ↓
5. SHIPPED (จัดส่งสินค้า)
   ↓
6. RECEIVED (รับสินค้าแล้ว)
   ↓
7. CREATE_INVOICE (สร้างใบซื้อ)
   ↓
8. CLOSED (ปิดบัญชี)
```

### Approval Matrix

| ยอดเงิน | ผู้อนุมัติ | ระดับการอนุมัติ |
|-----------|--------------|-------------------|
| < 50,000 บาท | Department Manager | 1 ระดับ |
| 50,000 - 200,000 บาท | Department Manager + Finance Manager | 2 ระดับ |
| > 200,000 บาท | Department Manager + Finance Manager + Director | 3 ระดับ |

---

## 🔗 Integration Points

### 1. Integration with Existing PurchaseInvoice

```typescript
// PurchaseInvoice จะอ้างอิง PO
purchaseOrderId: String?  // เชื่อมโยงกับ PO
purchaseOrder: PurchaseOrder?

// เมื่อสร้าง PurchaseInvoice จาก PO:
// 1. Copy ข้อมูลจาก PO
// 2. เปลี่ยนสถานะ PO → RECEIVED
// 3. สร้าง journal entry
```

### 2. Integration with Inventory

```typescript
// เมื่อ PO ได้รับสินค้า:
// 1. อัปเดต stock ใน Inventory
// 2. บันทึก stock movement
// 3. คำนวณ WAC costing
```

### 3. Integration with Budget

```typescript
// ตรวจสอบงบประมาณก่อนอนุมัติ PR/PO:
if (pr.estimatedAmount > budget.remainingAmount) {
  throw new Error("เกินวงเงินงบประมาณ");
}
```

### 4. Integration with Chart of Accounts

```typescript
// Journal Entry สำหรับ PO:
// DR - Inventory/Purchase (สินทรัพย์)
// CR - Accounts Payable (เจ้าหนี้)
```

---

## 📝 Document Numbering

```
PR: PR{YYYY}{MM}-{XXX}
   เช่น PR202603-001

PO: PO{YYYY}{MM}-{XXX}
   เช่น PO202603-001

XXX = Running number per month
```

---

## ✅ Requirements Checklist

- [x] Database Schema Design
- [x] API Routes Design
- [x] UI Components Design
- [x] Workflow Design
- [x] Integration Points
- [ ] Prisma Migration Implementation
- [ ] API Routes Implementation
- [ ] UI Components Implementation
- [ ] E2E Tests
- [ ] Documentation

---

## 🚀 Implementation Priority

### Phase 1: Core PR/PO (Must Have)
1. Database schema & migrations
2. PR APIs (CRUD + Submit/Approve/Reject)
3. PO APIs (CRUD + Send/Confirm/Receive)
4. PR List & Form Components
5. PO List & Form Components

### Phase 2: Workflow & Approval (Should Have)
1. Approval workflow logic
2. Email notifications
3. Approval history tracking
4. Budget checking

### Phase 3: Advanced Features (Nice to Have)
1. Department management
2. Budget management
3. Advanced reporting
4. Document attachments
5. Mobile responsive design

---

**Status**: ✅ Design Complete - Ready for Implementation
