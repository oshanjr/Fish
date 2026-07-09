"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function computeDailySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We still want to get today's POS sales to populate the input field
  const existingTodaySummary = await prisma.dailyStoreSummary.findUnique({
    where: { date: today },
  });
  const todayPosSales = existingTodaySummary ? Number(existingTodaySummary.totalPosSales) : 0;

  // Now calculate WEEKLY totals (Monday to Today)
  const dCopy = new Date(today);
  const day = dCopy.getDay();
  const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const startOfWeek = new Date(dCopy.setDate(diff));

  const weekInventory = await prisma.fishInventoryLog.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const weekExpenses = await prisma.dailyExpense.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const weekSummaries = await prisma.dailyStoreSummary.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const totalBuyingCost = weekInventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const calculatedExpenses = weekExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  // Total POS sales for the week (including what's already saved for today)
  const totalPosSales = weekSummaries.reduce(
    (sum, s) => sum + Number(s.totalPosSales),
    0
  );

  const netProfit = totalPosSales - totalBuyingCost - calculatedExpenses;

  return {
    totalPosSales: todayPosSales, // Send today's POS for the input field
    weeklyTotalPosSales: Math.round(totalPosSales * 100) / 100, // Send weekly for the summary
    totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
    calculatedExpenses: Math.round(calculatedExpenses * 100) / 100,
    calculatedWastageCost: 0, // Wastage is now implicitly handled by reduced POS sales
    netProfit: Math.round(netProfit * 100) / 100,
    isSyncedWithHub: existingTodaySummary?.isSyncedWithHub ?? false,
  };
}

export async function saveDaySummary(totalPosSales: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We need to calculate TODAY'S costs to save in the DB
  const todayInventory = await prisma.fishInventoryLog.findMany({
    where: { date: today },
  });

  const todayExpenses = await prisma.dailyExpense.findMany({
    where: { date: today },
  });

  const todayBuyingCost = todayInventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const todayCalculatedExpenses = todayExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const todayNetProfit = totalPosSales - todayBuyingCost - todayCalculatedExpenses;

  // Save TODAY's record
  await prisma.dailyStoreSummary.upsert({
    where: { date: today },
    update: {
      totalPosSales,
      totalBuyingCost: Math.round(todayBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(todayCalculatedExpenses * 100) / 100,
      calculatedWastageCost: 0,
      netProfit: Math.round(todayNetProfit * 100) / 100,
    },
    create: {
      date: today,
      totalPosSales,
      totalBuyingCost: Math.round(todayBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(todayCalculatedExpenses * 100) / 100,
      calculatedWastageCost: 0,
      netProfit: Math.round(todayNetProfit * 100) / 100,
    },
  });

  // Now calculate WEEKLY totals to return to the UI
  const dCopy = new Date(today);
  const day = dCopy.getDay();
  const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(dCopy.setDate(diff));

  const weekInventory = await prisma.fishInventoryLog.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const weekExpenses = await prisma.dailyExpense.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const weekSummaries = await prisma.dailyStoreSummary.findMany({
    where: { date: { gte: startOfWeek, lte: today } },
  });

  const weekBuyingCost = weekInventory.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );

  const weekCalculatedExpenses = weekExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const weekPosSales = weekSummaries.reduce(
    (sum, s) => sum + Number(s.totalPosSales),
    0
  );

  const weekNetProfit = weekPosSales - weekBuyingCost - weekCalculatedExpenses;

  revalidatePath("/dashboard/evening-closing");
  revalidatePath("/dashboard/hub-sync");
  
  return { 
    success: true, 
    data: {
      totalPosSales, // Send today's for the input
      weeklyTotalPosSales: Math.round(weekPosSales * 100) / 100,
      totalBuyingCost: Math.round(weekBuyingCost * 100) / 100,
      calculatedExpenses: Math.round(weekCalculatedExpenses * 100) / 100,
      calculatedWastageCost: 0,
      netProfit: Math.round(weekNetProfit * 100) / 100,
    } 
  };
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
