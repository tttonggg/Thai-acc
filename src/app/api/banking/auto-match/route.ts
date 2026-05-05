/**
 * POST /api/banking/auto-match
 * Run auto-match algorithm on unmatched bank statement entries
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import prisma from '@/lib/db';

interface MatchCandidate {
  docId: string;
  docType: 'RECEIPT' | 'PAYMENT';
  docRef: string | null;
  score: number;
  label: 'แม่นยำ' | 'สูง' | 'ปานกลาง' | 'ต่ำ' | 'ไม่แน่นอน';
  reasons: string[];
}

function dateDiffDays(a: Date, b: Date): number {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function scoreLabel(score: number): MatchCandidate['label'] {
  if (score === 100) return 'แม่นยำ';
  if (score >= 80) return 'สูง';
  if (score >= 60) return 'ปานกลาง';
  if (score >= 30) return 'ต่ำ';
  return 'ไม่แน่นอน';
}

async function findCandidates(entry: {
  amount: number;
  type: string;
  valueDate: Date;
  description: string;
  reference: string | null;
}): Promise<MatchCandidate[]> {
  const candidates: MatchCandidate[] = [];
  const isCredit = entry.type === 'CREDIT';

  // Helper to score a matched document
  const scoreDoc = (
    doc: { id: string; receiptNo?: string; paymentNo?: string; receiptDate?: Date; paymentDate?: Date },
    docType: 'RECEIPT' | 'PAYMENT',
    baseScore: number,
    reasonBase: string
  ): MatchCandidate => {
    const docDate = docType === 'RECEIPT' ? doc.receiptDate : doc.paymentDate;
    const docRef = docType === 'RECEIPT' ? doc.receiptNo : doc.paymentNo;
    const days = docDate ? dateDiffDays(entry.valueDate, docDate) : 99;
    let score = baseScore;
    const reasons: string[] = [reasonBase];
    if (days === 0) { score += 30; reasons.push('วันที่ตรงกัน (+30)'); }
    else if (days <= 3) { score += 20; reasons.push(`วันที่ ±3 วัน (+20)`); }
    else if (days <= 7) { score += 10; reasons.push(`วันที่ ±7 วัน (+10)`); }
    if (entry.reference && docRef) {
      const ref = entry.reference.toLowerCase();
      const desc = entry.description.toLowerCase();
      const docRefLower = docRef.toLowerCase();
      if (ref.includes(docRefLower) || desc.includes(docRefLower)) {
        score += 20; reasons.push('อ้างอิงเลขที่เอกสารในรายละเอียดธนาคาร (+20)');
      }
    }
    if (baseScore === 50) reasons.push('ตรงกันทุกประการ');
    return { docId: doc.id, docType, docRef: docRef ?? null, score, label: scoreLabel(score), reasons };
  };

  if (isCredit) {
    // Exact: POSTED receipt, exact amount, ±3 days
    const min3 = new Date(entry.valueDate); min3.setDate(min3.getDate() - 3);
    const max3 = new Date(entry.valueDate); max3.setDate(max3.getDate() + 3);
    const receipts = await prisma.receipt.findMany({
      where: { amount: entry.amount, receiptDate: { gte: min3, lte: max3 }, status: 'POSTED' as any },
      take: 10,
    });
    for (const r of receipts) {
      candidates.push(scoreDoc(r, 'RECEIPT', 50, 'ยอดตรงกัน วันที่ ±3 วัน (+50)'));
    }

    // Fuzzy: POSTED receipt, ±1% amount, ±7 days
    const min7 = new Date(entry.valueDate); min7.setDate(min7.getDate() - 7);
    const max7 = new Date(entry.valueDate); max7.setDate(max7.getDate() + 7);
    const fuzzyLow = Math.floor(entry.amount * 0.99);
    const fuzzyHigh = Math.ceil(entry.amount * 1.01);
    const fuzzy = await prisma.receipt.findMany({
      where: {
        amount: { gte: fuzzyLow, lte: fuzzyHigh },
        receiptDate: { gte: min7, lte: max7 },
        status: 'POSTED' as any,
        NOT: { id: { in: candidates.map((c) => c.docId) } },
      },
      take: 5,
    });
    for (const r of fuzzy) {
      candidates.push(scoreDoc(r, 'RECEIPT', 40, 'ยอดใกล้เคียง ±1% (+40)'));
    }
  } else {
    // Exact: POSTED payment, exact amount, ±3 days
    const min3 = new Date(entry.valueDate); min3.setDate(min3.getDate() - 3);
    const max3 = new Date(entry.valueDate); max3.setDate(max3.getDate() + 3);
    const payments = await prisma.payment.findMany({
      where: { amount: entry.amount, paymentDate: { gte: min3, lte: max3 }, status: 'POSTED' as any },
      take: 10,
    });
    for (const p of payments) {
      candidates.push(scoreDoc(p, 'PAYMENT', 50, 'ยอดตรงกัน วันที่ ±3 วัน (+50)'));
    }

    // Fuzzy: POSTED payment, ±1% amount, ±7 days
    const min7 = new Date(entry.valueDate); min7.setDate(min7.getDate() - 7);
    const max7 = new Date(entry.valueDate); max7.setDate(max7.getDate() + 7);
    const fuzzyLow = Math.floor(entry.amount * 0.99);
    const fuzzyHigh = Math.ceil(entry.amount * 1.01);
    const fuzzy = await prisma.payment.findMany({
      where: {
        amount: { gte: fuzzyLow, lte: fuzzyHigh },
        paymentDate: { gte: min7, lte: max7 },
        status: 'POSTED' as any,
        NOT: { id: { in: candidates.map((c) => c.docId) } },
      },
      take: 5,
    });
    for (const p of fuzzy) {
      candidates.push(scoreDoc(p, 'PAYMENT', 40, 'ยอดใกล้เคียง ±1% (+40)'));
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { bankAccountId } = await request.json();
    if (!bankAccountId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีธนาคาร' }, { status: 400 });
    }

    const entries = await prisma.bankStatementEntry.findMany({
      where: { bankAccountId, matched: false },
      orderBy: { valueDate: 'asc' },
    });

    const results = await Promise.all(
      entries.map(async (entry) => ({
        entry: {
          id: entry.id,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
          valueDate: entry.valueDate,
          reference: entry.reference,
        },
        candidates: await findCandidates({
          amount: entry.amount,
          type: entry.type,
          valueDate: entry.valueDate,
          description: entry.description,
          reference: entry.reference,
        }),
      }))
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
