"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function computeDailySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's inventory
  const inventory = await prisma.fishInventoryLog.findMany({
    where: { date: today },
  });

  // Get today's expenses
  const expenses = await prisma.dailyExpense.findMany({
    where: { date: today },
  });

  // Calculate totals
  const totalBuyingCost = inventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const calculatedExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const calculatedWastageCost = inventory.reduce(
    (sum, log) => sum + Number(log.wastageWeight) * Number(log.buyingPricePerKg),
    0
  );

  // Get existing summary for POS sales (if already entered)
  const existingSummary = await prisma.dailyStoreSummary.findUnique({
    where: { date: today },
  });

  const totalPosSales = existingSummary ? Number(existingSummary.totalPosSales) : 0;
  const netProfit = totalPosSales - totalBuyingCost - calculatedExpenses - calculatedWastageCost;

  return {
    totalPosSales,
    totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
    calculatedExpenses: Math.round(calculatedExpenses * 100) / 100,
    calculatedWastageCost: Math.round(calculatedWastageCost * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    isSyncedWithHub: existingSummary?.isSyncedWithHub ?? false,
  };
}

export async function saveDaySummary(totalPosSales: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Recompute everything fresh
  const inventory = await prisma.fishInventoryLog.findMany({
    where: { date: today },
  });

  const expenses = await prisma.dailyExpense.findMany({
    where: { date: today },
  });

  const totalBuyingCost = inventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const calculatedExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const calculatedWastageCost = inventory.reduce(
    (sum, log) => sum + Number(log.wastageWeight) * Number(log.buyingPricePerKg),
    0
  );

  const netProfit = totalPosSales - totalBuyingCost - calculatedExpenses - calculatedWastageCost;

  const summary = await prisma.dailyStoreSummary.upsert({
    where: { date: today },
    update: {
      totalPosSales,
      totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(calculatedExpenses * 100) / 100,
      calculatedWastageCost: Math.round(calculatedWastageCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    },
    create: {
      date: today,
      totalPosSales,
      totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(calculatedExpenses * 100) / 100,
      calculatedWastageCost: Math.round(calculatedWastageCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    },
  });

  revalidatePath("/dashboard/evening-closing");
  revalidatePath("/dashboard/hub-sync");
  return { success: true, data: summary };
}

export async function getSyncHistory() {
  const summaries = await prisma.dailyStoreSummary.findMany({
    orderBy: { date: "desc" },
    take: 30,
  });

  return summaries.map((s) => ({
    ...s,
    totalPosSales: Number(s.totalPosSales),
    calculatedExpenses: Number(s.calculatedExpenses),
    calculatedWastageCost: Number(s.calculatedWastageCost),
    totalBuyingCost: Number(s.totalBuyingCost),
    netProfit: Number(s.netProfit),
  }));
}
