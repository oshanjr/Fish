"use server";

import { prisma } from "@/lib/prisma";

/**
 * Recalculates and updates the dailyStoreSummary for a specific date.
 * Call this after any inventory or expense change so the stored summary
 * stays in sync with the source-of-truth tables (fishInventoryLog, dailyExpense).
 *
 * If no dailyStoreSummary exists for the date, this is a no-op
 * (the summary is only created when the manager explicitly saves POS sales).
 */
export async function recalcDaySummary(targetDate: Date) {
  const normalized = new Date(targetDate);
  normalized.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyStoreSummary.findUnique({
    where: { date: normalized },
  });

  if (!existing) {
    // No summary for this date yet — nothing to update
    return;
  }

  const [inventory, expenses] = await Promise.all([
    prisma.fishInventoryLog.findMany({
      where: { date: normalized },
      select: { incomingWeight: true, buyingPricePerKg: true },
    }),
    prisma.dailyExpense.findMany({
      where: { date: normalized },
      select: { amount: true },
    }),
  ]);

  const totalBuyingCost = inventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const calculatedExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  const totalPosSales = Number(existing.totalPosSales);
  const netProfit = totalPosSales - totalBuyingCost - calculatedExpenses;

  await prisma.dailyStoreSummary.update({
    where: { id: existing.id },
    data: {
      totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(calculatedExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    },
  });
}

