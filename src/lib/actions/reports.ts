"use server";

import { prisma } from "@/lib/prisma";

export async function getMonthlyFinancials(year: number, month: number) {
  // month is 1-indexed (1 = Jan, 12 = Dec)
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Get Daily Store Summaries for the month
  const summaries = await prisma.dailyStoreSummary.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // 2. Get detailed Daily Expenses for the month
  const detailedExpenses = await prisma.dailyExpense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { date: "desc" },
  });

  const totalPosSales = summaries.reduce((sum, s) => sum + Number(s.totalPosSales), 0);
  const totalBuyingCost = summaries.reduce((sum, s) => sum + Number(s.totalBuyingCost), 0);
  
  // If store summaries were recorded, use calculatedExpenses; otherwise fall back to logged expenses
  const totalExpenses = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + Number(s.calculatedExpenses), 0)
    : detailedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
  const totalNetProfit = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + Number(s.netProfit), 0)
    : (totalPosSales - totalBuyingCost - totalExpenses);

  return {
    totals: {
      totalPosSales,
      totalBuyingCost,
      totalExpenses,
      totalNetProfit,
    },
    summaries: summaries.map(s => ({
      ...s,
      date: s.date.toISOString(),
      totalPosSales: Number(s.totalPosSales),
      cashSales: Number(s.cashSales),
      cardSales: Number(s.cardSales),
      totalBuyingCost: Number(s.totalBuyingCost),
      calculatedExpenses: Number(s.calculatedExpenses),
      calculatedWastageCost: Number(s.calculatedWastageCost),
      netProfit: Number(s.netProfit),
    })),
    detailedExpenses: detailedExpenses.map(e => ({
      ...e,
      date: e.date.toISOString(),
      amount: Number(e.amount),
      userName: e.user.name,
    })),
  };
}

export async function getMonthlyAttendanceAndPayroll(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Get employees (including inactive employees who may have worked in past months)
  const allEmployees = await prisma.employee.findMany({
    select: { id: true, name: true, baseSalary: true, sundayPayment: true, isActive: true },
  });

  // 2. Get attendance for the month
  const attendance = await prisma.staffAttendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: "PRESENT",
    },
  });

  // 3. Get salary advances (from DailyExpense containing 'Salary Advance - [Name]')
  const advances = await prisma.dailyExpense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      category: {
        startsWith: "Salary Advance",
      }
    },
  });

  // Calculate days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();

  return allEmployees
    .map((emp) => {
      // Get attendance records for this employee
      const empAttendance = attendance.filter((a) => a.employeeId === emp.id);
      const presentDays = empAttendance.length;
      
      // Count Sunday present days for Sunday payment
      const sundayPresentDays = empAttendance.filter((a) => a.date.getDay() === 0).length;
      
      // Sum advances for this specific employee in this month
      const empAdvances = advances
        .filter((adv) => adv.category.includes(emp.name))
        .reduce((sum, adv) => sum + Number(adv.amount), 0);

      const baseSal = Number(emp.baseSalary);
      const sundayPay = Number(emp.sundayPayment);
      
      // Non-Sunday days get prorated base salary, Sundays get flat sundayPayment only
      const nonSundayPresentDays = presentDays - sundayPresentDays;
      const earnedPay = (baseSal / daysInMonth) * nonSundayPresentDays + (sundayPay * sundayPresentDays);
      
      // Final Payout
      const finalPayout = earnedPay - empAdvances;

      return {
        id: emp.id,
        name: emp.name,
        baseSalary: baseSal,
        isActive: emp.isActive,
        presentDays,
        sundayPresentDays,
        daysInMonth,
        earnedPay: Math.round(earnedPay * 100) / 100,
        advancesTaken: empAdvances,
        finalPayout: Math.round(finalPayout * 100) / 100,
      };
    })
    .filter((emp) => emp.isActive || emp.presentDays > 0 || emp.advancesTaken > 0);
}

export async function getPastMonthsSummary(limit: number = 12) {
  // 1. Get all store summaries ordered by date desc
  const summaries = await prisma.dailyStoreSummary.findMany({
    select: {
      date: true,
      totalPosSales: true,
      totalBuyingCost: true,
      calculatedExpenses: true,
      netProfit: true,
    },
    orderBy: { date: "desc" },
  });

  // 2. Get all expenses to detect months that might have expenses even without store summaries
  const expenses = await prisma.dailyExpense.findMany({
    select: {
      date: true,
      amount: true,
    },
    orderBy: { date: "desc" },
  });

  const monthMap = new Map<string, {
    year: number;
    month: number;
    monthKey: string;
    totalPosSales: number;
    totalBuyingCost: number;
    totalExpenses: number;
    totalNetProfit: number;
    daysCount: number;
  }>();

  for (const s of summaries) {
    const d = new Date(s.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    const item = monthMap.get(key) || {
      year,
      month,
      monthKey: key,
      totalPosSales: 0,
      totalBuyingCost: 0,
      totalExpenses: 0,
      totalNetProfit: 0,
      daysCount: 0,
    };

    item.totalPosSales += Number(s.totalPosSales);
    item.totalBuyingCost += Number(s.totalBuyingCost);
    item.totalExpenses += Number(s.calculatedExpenses);
    item.totalNetProfit += Number(s.netProfit);
    item.daysCount += 1;
    monthMap.set(key, item);
  }

  for (const e of expenses) {
    const d = new Date(e.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year,
        month,
        monthKey: key,
        totalPosSales: 0,
        totalBuyingCost: 0,
        totalExpenses: Number(e.amount),
        totalNetProfit: -Number(e.amount),
        daysCount: 0,
      });
    }
  }

  // Ensure current month exists in the list
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!monthMap.has(currentKey)) {
    monthMap.set(currentKey, {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      monthKey: currentKey,
      totalPosSales: 0,
      totalBuyingCost: 0,
      totalExpenses: 0,
      totalNetProfit: 0,
      daysCount: 0,
    });
  }

  return Array.from(monthMap.values())
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    .slice(0, limit);
}
