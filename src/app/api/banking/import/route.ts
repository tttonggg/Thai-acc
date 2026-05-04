/**
 * Bank Statement Import API (CAMT.053)
 * POST /api/banking/import
 *
 * Accepts multipart form data with bank statement file (CAMT.053 XML)
 * Parses entries and stores in BankStatementEntry model
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { parseCamt053Xml, parseCamt053Json, isCamt053Content } from '@/lib/bank-statement-parser';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { handleApiError } from '@/lib/api-error-handler';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for bank statements

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bankAccountId = formData.get('bankAccountId') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบไฟล์',
        },
        { status: 400 }
      );
    }

    if (!bankAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาระบุบัญชีธนาคาร',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    if (file.size < 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไฟล์มีขนาดเล็กเกินไป',
        },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Check if this is a CAMT.053 file
    const isCamt = isCamt053Content(text);

    // Try to parse as CAMT.053 XML
    let parseResult;
    if (isCamt) {
      parseResult = parseCamt053Xml(text);
    } else {
      // Try as JSON
      try {
        const jsonData = JSON.parse(text);
        if (jsonData.entries && Array.isArray(jsonData.entries)) {
          parseResult = parseCamt053Json(jsonData);
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'รูปแบบไฟล์ไม่ถูกต้อง ต้องเป็น CAMT.053 XML หรือ JSON',
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถอ่านไฟล์ได้ ตรวจสอบรูปแบบไฟล์',
          },
          { status: 400 }
        );
      }
    }

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || 'ไม่สามารถแยกวิเคราะห์ไฟล์ได้',
        },
        { status: 400 }
      );
    }

    if (parseResult.entries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบรายการในไฟล์',
        },
        { status: 400 }
      );
    }

    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบบัญชีธนาคาร',
        },
        { status: 404 }
      );
    }

    // Import entries
    const importedEntries = await prisma.$transaction(
      parseResult.entries.map((entry) =>
        prisma.bankStatementEntry.create({
          data: {
            bankAccountId,
            statementDate: entry.statementDate,
            valueDate: entry.valueDate,
            description: entry.description,
            amount: entry.amount,
            type: entry.type,
            reference: entry.reference,
            matched: false,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        imported: importedEntries.length,
        entries: importedEntries.map((e) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          type: e.type,
          valueDate: e.valueDate,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Bank statement import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
      },
      { status: 500 }
    );
  }
}
