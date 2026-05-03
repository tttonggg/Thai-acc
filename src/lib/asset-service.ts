// ============================================
// 🏢 Asset & Depreciation Service (Agent 04: Fixed Assets Engineer)
// TAS 16 Compliant - Straight-Line Depreciation
// Schema-exact — DepreciationSchedule fields verified
// ============================================
import prisma from '@/lib/db';

export async function generateDepreciationSchedule(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error(`Asset ${assetId} not found`);

  const totalMonths = asset.usefulLifeYears * 12;
  const depreciableAmount = asset.purchaseCost - asset.salvageValue;
  const monthlyDepreciation = depreciableAmount / totalMonths;

  const startDate = new Date(asset.purchaseDate);
  let accumulated = 0;
  let created = 0;

  // Delete existing unposted schedules
  await prisma.depreciationSchedule.deleteMany({ where: { assetId, posted: false } });

  for (let i = 0; i < totalMonths; i++) {
    const scheduleDate = new Date(startDate);
    scheduleDate.setMonth(scheduleDate.getMonth() + i + 1);
    scheduleDate.setDate(0); // last day of month

    const monthAmount =
      i === totalMonths - 1 ? depreciableAmount - accumulated : monthlyDepreciation;

    accumulated += monthAmount;
    const netBookValue = asset.purchaseCost - accumulated;

    await prisma.depreciationSchedule.create({
      data: {
        assetId,
        date: scheduleDate,
        amount: Math.round(monthAmount * 100) / 100,
        accumulated: Math.round(accumulated * 100) / 100,
        netBookValue: Math.round(netBookValue * 100) / 100,
        posted: false,
      },
    });
    created++;
  }

  return { created };
}

export async function postMonthlyDepreciation(scheduleId: string, userId?: string) {
  const schedule = await prisma.depreciationSchedule.findUnique({
    where: { id: scheduleId },
    include: { asset: true },
  });

  if (!schedule) throw new Error('Schedule not found');
  if (schedule.posted) throw new Error('Already posted');

  const asset = schedule.asset;
  const count = await prisma.journalEntry.count();
  const entryNo = `DEP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

  let lineNo = 1;

  const journalEntry = await prisma.$transaction(async (tx) => {
    const je = await tx.journalEntry.create({
      data: {
        entryNo,
        entryDate: new Date(schedule.date),
        description: `ค่าเสื่อมราคา ${asset.name} ${schedule.date.getMonth() + 1}/${schedule.date.getFullYear()}`,
        status: 'POSTED',
        createdById: userId,
        lines: {
          create: [
            {
              lineNo: lineNo++,
              accountId: asset.depExpenseAccountId,
              description: `ค่าเสื่อมราคา ${asset.name}`,
              debit: schedule.amount,
              credit: 0,
            },
            {
              lineNo: lineNo++,
              accountId: asset.accumDepAccountId,
              description: `ค่าเสื่อมราคาสะสม ${asset.name}`,
              debit: 0,
              credit: schedule.amount,
            },
          ],
        },
      } as any,
    });

    await tx.depreciationSchedule.update({
      where: { id: scheduleId },
      data: { posted: true, journalEntryId: je.id },
    });

    return je;
  });

  return journalEntry;
}

export async function getAssetNetBookValue(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');

  const lastPosted = await prisma.depreciationSchedule.findFirst({
    where: { assetId, posted: true },
    orderBy: { date: 'desc' },
  });

  return {
    purchaseCost: asset.purchaseCost,
    accumulatedDepreciation: lastPosted?.accumulated || 0,
    netBookValue: lastPosted?.netBookValue || asset.purchaseCost,
    salvageValue: asset.salvageValue,
  };
}
