"use server";

import { prisma } from "@/lib/prisma";

export async function getMonthlyFinancials(year: number, month: number) {
  // month is 1-indexed (1 = Jan, 12 = Dec)
  const startDate = new Date(year, month - 1, 1);
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

  const totalPosSales = summaries.reduce((sum, s) => sum + Number(s.totalPosSales), 0);
  const totalBuyingCost = summaries.reduce((sum, s) => sum + Number(s.totalBuyingCost), 0);
  const totalExpenses = summaries.reduce((sum, s) => sum + Number(s.calculatedExpenses), 0);
  const totalNetProfit = summaries.reduce((sum, s) => sum + Number(s.netProfit), 0);

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
      totalBuyingCost: Number(s.totalBuyingCost),
      calculatedExpenses: Number(s.calculatedExpenses),
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
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Get all active employees
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true, baseSalary: true },
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

  return employees.map((emp) => {
    // Count present days
    const presentDays = attendance.filter((a) => a.employeeId === emp.id).length;
    
    // Sum advances for this specific employee in this month
    const empAdvances = advances
      .filter((adv) => adv.category.includes(emp.name))
      .reduce((sum, adv) => sum + Number(adv.amount), 0);

    const baseSal = Number(emp.baseSalary);
    
    // Calculate Earned Pay (Prorated)
    const earnedPay = (baseSal / daysInMonth) * presentDays;
    
    // Final Payout
    const finalPayout = earnedPay - empAdvances;

    return {
      id: emp.id,
      name: emp.name,
      baseSalary: baseSal,
      presentDays,
      daysInMonth,
      earnedPay: Math.round(earnedPay * 100) / 100,
      advancesTaken: empAdvances,
      finalPayout: Math.round(finalPayout * 100) / 100,
    };
  });
}
