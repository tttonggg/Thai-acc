import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { invoiceLineEditSchema } from '@/lib/validations';
import { headers } from 'next/headers';
import { requireAuth, apiResponse, notFoundError, unauthorizedError, apiError, forbiddenError } from '@/lib/api-utils';

// GET /api/invoices/[id]/lines/[lineId] - Get single line item with audit history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, lineId } = await params;

    const line = await db.invoiceLine.findUnique({
      where: { id: lineId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
            createdById: true,
          },
        },
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
          },
        },
        auditTrail: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!line || line.invoiceId !== id) {
      return notFoundError('ไม่พบรายการสินค้า');
    }

    // IDOR Protection: Check ownership - only ADMIN can access any invoice
    if (user.role !== 'ADMIN' && line.invoice.createdById && line.invoice.createdById !== user.id) {
      return forbiddenError();
    }

    return apiResponse(line);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า');
  }
}

// PUT /api/invoices/[id]/lines/[lineId] - Edit invoice line item with audit trail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, lineId } = await params;

    // Role-based access control
    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์แก้ไขรายการสินค้า', 403);
    }

    // Fetch existing line with invoice in a transaction
    const result = await db.$transaction(async (tx) => {
      // Lock the row for update
      const existingLine = await tx.invoiceLine.findUnique({
        where: { id: lineId },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
              createdById: true,
            },
          },
        },
      });

      if (!existingLine || existingLine.invoiceId !== id) {
        throw new Error('LINE_NOT_FOUND');
      }

      // IDOR Protection: Check ownership
      if (
        user.role !== 'ADMIN' &&
        existingLine.invoice.createdById &&
        existingLine.invoice.createdById !== user.id
      ) {
        throw new Error('FORBIDDEN');
      }

      // Thai Tax Compliance: Only allow edits on DRAFT invoices
      if (existingLine.invoice.status !== 'DRAFT') {
        throw new Error('INVOICE_NOT_DRAFT');
      }

      // Validate request body
      const body = await request.json();
      const validatedData = invoiceLineEditSchema.parse(body);

      // Business rule validation
      if (validatedData.quantity !== undefined && validatedData.quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
      }

      if (validatedData.unitPrice !== undefined && validatedData.unitPrice < 0) {
        throw new Error('INVALID_UNIT_PRICE');
      }

      if (validatedData.discount !== undefined && validatedData.discount < 0) {
        throw new Error('INVALID_DISCOUNT');
      }

      // Calculate differences for audit
      const quantityDiff =
        validatedData.quantity !== undefined
          ? validatedData.quantity - existingLine.quantity
          : undefined;

      const unitPriceDiff =
        validatedData.unitPrice !== undefined
          ? validatedData.unitPrice - existingLine.unitPrice
          : undefined;

      const discountDiff =
        validatedData.discount !== undefined
          ? validatedData.discount - existingLine.discount
          : undefined;

      // Calculate new amount and VAT
      const newQuantity = validatedData.quantity ?? existingLine.quantity;
      const newUnitPrice = validatedData.unitPrice ?? existingLine.unitPrice;
      const newDiscount = validatedData.discount ?? existingLine.discount;
      const newVatRate = existingLine.vatRate; // VAT rate not editable

      const newAmount = newQuantity * newUnitPrice - newDiscount;
      const newVatAmount = newAmount * (newVatRate / 100);

      // Build update data with only changed fields
      const updateData: any = {
        amount: newAmount,
        vatAmount: newVatAmount,
      };

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }

      if (validatedData.quantity !== undefined) {
        updateData.quantity = validatedData.quantity;
      }

      if (validatedData.unit !== undefined) {
        updateData.unit = validatedData.unit;
      }

      if (validatedData.unitPrice !== undefined) {
        updateData.unitPrice = validatedData.unitPrice;
      }

      if (validatedData.discount !== undefined) {
        updateData.discount = validatedData.discount;
      }

      // Track which fields changed
      const changedFields: string[] = [];
      if (
        validatedData.description !== undefined &&
        validatedData.description !== existingLine.description
      ) {
        changedFields.push('description');
      }
      if (
        validatedData.quantity !== undefined &&
        validatedData.quantity !== existingLine.quantity
      ) {
        changedFields.push('quantity');
      }
      if (
        validatedData.unitPrice !== undefined &&
        validatedData.unitPrice !== existingLine.unitPrice
      ) {
        changedFields.push('unitPrice');
      }
      if (
        validatedData.discount !== undefined &&
        validatedData.discount !== existingLine.discount
      ) {
        changedFields.push('discount');
      }
      if (validatedData.unit !== undefined && validatedData.unit !== existingLine.unit) {
        changedFields.push('unit');
      }

      // Update the line item
      const updatedLine = await tx.invoiceLine.update({
        where: { id: lineId },
        data: updateData,
      });

      // Create comprehensive audit trail entries for each changed field
      const auditPromises = changedFields.map((field) =>
        tx.invoiceLineItemAudit.create({
          data: {
            lineItemId: lineId,
            action: 'UPDATED',
            field,
            oldValue: String((existingLine as any)[field] ?? ''),
            newValue: String((validatedData as any)[field] ?? ''),
            beforeQuantity: field === 'quantity' ? existingLine.quantity : undefined,
            afterQuantity: field === 'quantity' ? validatedData.quantity : undefined,
            quantityDiff: field === 'quantity' ? quantityDiff : undefined,
            beforeUnitPrice: field === 'unitPrice' ? existingLine.unitPrice : undefined,
            afterUnitPrice: field === 'unitPrice' ? validatedData.unitPrice : undefined,
            unitPriceDiff: field === 'unitPrice' ? unitPriceDiff : undefined,
            beforeDiscount: field === 'discount' ? existingLine.discount : undefined,
            afterDiscount: field === 'discount' ? validatedData.discount : undefined,
            discountDiff: field === 'discount' ? discountDiff : undefined,
            beforeDescription: field === 'description' ? existingLine.description : undefined,
            afterDescription: field === 'description' ? validatedData.description : undefined,
            changeType: 'EDIT',
            changeReason: validatedData.changeReason,
            changedById: user.id,
            changedByName: user.name || user.email,
          },
        })
      );

      // Create a summary audit entry if multiple fields changed
      if (changedFields.length > 1) {
        auditPromises.push(
          tx.invoiceLineItemAudit.create({
            data: {
              lineItemId: lineId,
              action: 'UPDATED',
              field: 'SUMMARY',
              oldValue: JSON.stringify({
                description: existingLine.description,
                quantity: existingLine.quantity,
                unit: existingLine.unit,
                unitPrice: existingLine.unitPrice,
                discount: existingLine.discount,
              }),
              newValue: JSON.stringify({
                description: validatedData.description ?? existingLine.description,
                quantity: validatedData.quantity ?? existingLine.quantity,
                unit: validatedData.unit ?? existingLine.unit,
                unitPrice: validatedData.unitPrice ?? existingLine.unitPrice,
                discount: validatedData.discount ?? existingLine.discount,
              }),
              beforeQuantity: existingLine.quantity,
              afterQuantity: newQuantity,
              quantityDiff,
              beforeUnitPrice: existingLine.unitPrice,
              afterUnitPrice: newUnitPrice,
              unitPriceDiff,
              beforeDiscount: existingLine.discount,
              afterDiscount: newDiscount,
              discountDiff,
              beforeDescription: existingLine.description,
              afterDescription: validatedData.description ?? existingLine.description,
              changeType: 'EDIT',
              changeReason: validatedData.changeReason,
              changedById: user.id,
              changedByName: user.name || user.email,
            },
          })
        );
      }

      await Promise.all(auditPromises);

      // Update invoice totals
      const allLines = await tx.invoiceLine.findMany({
        where: { invoiceId: id },
      });

      let subtotal = 0;
      let totalVat = 0;

      for (const line of allLines) {
        subtotal += line.amount;
        totalVat += line.vatAmount;
      }

      await tx.invoice.update({
        where: { id },
        data: {
          subtotal,
          vatAmount: totalVat,
          totalAmount: subtotal + totalVat,
        },
      });

      return updatedLine;
    });

    // Log to AuditLog
    const headersList = await headers();
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'InvoiceLine',
        entityId: lineId,
        beforeState: JSON.stringify({ id: lineId, invoiceId: id }),
        afterState: JSON.stringify(result),
        ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
        userAgent: headersList.get('user-agent') || 'unknown',
        hash: '', // Tamper-evident hash would be computed here
      },
    });

    // Return updated line with fresh data
    const response = await db.invoiceLine.findUnique({
      where: { id: lineId },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
          },
        },
      },
    });

    return apiResponse(response);
  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'LINE_NOT_FOUND') {
      return notFoundError('ไม่พบรายการสินค้า');
    }

    if (error.message === 'FORBIDDEN') {
      return forbiddenError();
    }

    if (error.message === 'INVOICE_NOT_DRAFT') {
      return apiError(
        'ไม่สามารถแก้ไขรายการในใบกำกับภาษีที่ออกแล้วได้ - เฉพาะสถานะร่างเท่านั้น (Thai Tax Compliance)'
      );
    }

    if (error.message === 'INVALID_QUANTITY') {
      return apiError('จำนวนต้องมากกว่า 0');
    }

    if (error.message === 'INVALID_UNIT_PRICE') {
      return apiError('ราคาต่อหน่วยต้องไม่ติดลบ');
    }

    if (error.message === 'INVALID_DISCOUNT') {
      return apiError('ส่วนลดต้องไม่ติดลบ');
    }

    // Handle auth errors
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError(
        'ข้อมูลไม่ถูกต้อง: ' + JSON.parse(error.message)[0]?.message || 'กรุณาตรวจสอบข้อมูล'
      );
    }

    // Generic error
    console.error('Invoice line edit error:', error);
    return apiError('เกิดข้อผิดพลาดในการแก้ไขรายการสินค้า');
  }
}

// DELETE /api/invoices/[id]/lines/[lineId] - Delete invoice line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, lineId } = await params;

    // Role-based access control
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return apiError('ไม่มีสิทธิ์ลบรายการสินค้า', 403);
    }

    const result = await db.$transaction(async (tx) => {
      // Lock the row for update
      const existingLine = await tx.invoiceLine.findUnique({
        where: { id: lineId },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
              createdById: true,
            },
          },
        },
      });

      if (!existingLine || existingLine.invoiceId !== id) {
        throw new Error('LINE_NOT_FOUND');
      }

      // IDOR Protection: Check ownership
      if (
        user.role !== 'ADMIN' &&
        existingLine.invoice.createdById &&
        existingLine.invoice.createdById !== user.id
      ) {
        throw new Error('FORBIDDEN');
      }

      // Thai Tax Compliance: Only allow deletes on DRAFT invoices
      if (existingLine.invoice.status !== 'DRAFT') {
        throw new Error('INVOICE_NOT_DRAFT');
      }

      // Create audit entry before deletion
      await tx.invoiceLineItemAudit.create({
        data: {
          lineItemId: lineId,
          action: 'DELETED',
          field: 'ALL',
          oldValue: JSON.stringify({
            description: existingLine.description,
            quantity: existingLine.quantity,
            unit: existingLine.unit,
            unitPrice: existingLine.unitPrice,
            discount: existingLine.discount,
            amount: existingLine.amount,
            vatRate: existingLine.vatRate,
            vatAmount: existingLine.vatAmount,
          }),
          changeType: 'DELETE',
          changeReason: 'Line item deleted',
          changedById: user.id,
          changedByName: user.name || user.email,
        },
      });

      // Delete the line
      await tx.invoiceLine.delete({
        where: { id: lineId },
      });

      // Update invoice totals
      const allLines = await tx.invoiceLine.findMany({
        where: { invoiceId: id },
      });

      let subtotal = 0;
      let totalVat = 0;

      for (const line of allLines) {
        subtotal += line.amount;
        totalVat += line.vatAmount;
      }

      await tx.invoice.update({
        where: { id },
        data: {
          subtotal,
          vatAmount: totalVat,
          totalAmount: subtotal + totalVat,
        },
      });

      return existingLine;
    });

    // Log to AuditLog
    const headersList = await headers();
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'InvoiceLine',
        entityId: lineId,
        beforeState: JSON.stringify(result),
        afterState: undefined as any,
        ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
        userAgent: headersList.get('user-agent') || 'unknown',
        hash: '', // Tamper-evident hash would be computed here
      },
    });

    return apiResponse({ message: 'ลบรายการสินค้าสำเร็จ' });
  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'LINE_NOT_FOUND') {
      return notFoundError('ไม่พบรายการสินค้า');
    }

    if (error.message === 'FORBIDDEN') {
      return forbiddenError();
    }

    if (error.message === 'INVOICE_NOT_DRAFT') {
      return apiError(
        'ไม่สามารถลบรายการในใบกำกับภาษีที่ออกแล้วได้ - เฉพาะสถานะร่างเท่านั้น (Thai Tax Compliance)'
      );
    }

    // Handle auth errors
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }

    // Generic error
    console.error('Invoice line delete error:', error);
    return apiError('เกิดข้อผิดพลาดในการลบรายการสินค้า');
  }
}
