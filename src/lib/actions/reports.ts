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

  // 3. Get detailed Fish Inventory for the month (source of truth for buying costs)
  const inventoryLogs = await prisma.fishInventoryLog.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalPosSales = summaries.reduce((sum, s) => sum + Number(s.totalPosSales), 0);

  // Total Buying Cost: sum all fish inventory logs for the month
  // This accurately captures intake even if it was logged retroactively after a day summary was closed
  const totalBuyingCost = inventoryLogs.reduce(
    (sum, log) => sum + Number(log.incomingWeight) * Number(log.buyingPricePerKg),
    0
  );
  
  // Total Expenses: sum all detailed expenses for the month to match the breakdown table exactly
  const totalExpenses = detailedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalNetProfit = totalPosSales - totalBuyingCost - totalExpenses;

  // Build a map of daily inventory buying costs so daily summary rows also reflect true intake
  const dailyInventoryCostMap = new Map<string, number>();
  for (const log of inventoryLogs) {
    const key = log.date.toISOString().split("T")[0];
    const cost = Number(log.incomingWeight) * Number(log.buyingPricePerKg);
    dailyInventoryCostMap.set(key, (dailyInventoryCostMap.get(key) || 0) + cost);
  }

  return {
    totals: {
      totalPosSales: Math.round(totalPosSales * 100) / 100,
      totalBuyingCost: Math.round(totalBuyingCost * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalNetProfit: Math.round(totalNetProfit * 100) / 100,
    },
    summaries: summaries.map(s => {
      const key = s.date.toISOString().split("T")[0];
      const directCost = dailyInventoryCostMap.get(key);
      const buyingCost = directCost !== undefined && directCost > 0 ? directCost : Number(s.totalBuyingCost);
      const posSales = Number(s.totalPosSales);
      const expenses = Number(s.calculatedExpenses);
      return {
        ...s,
        date: s.date.toISOString(),
        totalPosSales: posSales,
        cashSales: Number(s.cashSales),
        cardSales: Number(s.cardSales),
        totalBuyingCost: Math.round(buyingCost * 100) / 100,
        calculatedExpenses: expenses,
        calculatedWastageCost: Number(s.calculatedWastageCost),
        netProfit: Math.round((posSales - buyingCost - expenses) * 100) / 100,
      };
    }),
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
    orderBy: { name: "asc" },
  });

  // 2. Get attendance for the month (both PRESENT and HALF_DAY)
  const attendance = await prisma.staffAttendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["PRESENT", "HALF_DAY"],
      },
    },
    select: {
      id: true,
      employeeId: true,
      date: true,
      status: true,
      hoursWorked: true,
      earnedPay: true,
    },
  });

  // 3. Get salary advances (from DailyExpense)
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
      const sundayPresentDays = empAttendance.filter((a) => new Date(a.date).getDay() === 0).length;

      const baseSal = Number(emp.baseSalary);
      const sundayPay = Number(emp.sundayPayment);

      // Calculate earned pay:
      // Use the stored earnedPay calculated by attendance/payroll system;
      // fallback to formula if a historical record had null earnedPay
      const earnedPay = empAttendance.reduce((sum, a) => {
        if (a.earnedPay !== null && a.earnedPay !== undefined) {
          return sum + Number(a.earnedPay);
        }
        const hours = a.hoursWorked ? Number(a.hoursWorked) : (a.status === "HALF_DAY" ? 6 : 12);
        const isSunday = new Date(a.date).getDay() === 0;
        if (isSunday && hours > 0) {
          return sum + sundayPay;
        }
        return sum + (baseSal * (hours / 12));
      }, 0);
      
      // Sum advances for this specific employee in this month
      // Exact matching to prevent substring collision (e.g., "Dan" matching "Daniel")
      const empNameLower = emp.name.trim().toLowerCase();
      const empAdvances = advances
        .filter((adv) => {
          const cat = adv.category.trim().toLowerCase();
          const parsedName = cat.replace(/^salary advance[\s:-]+/, "").trim();
          return parsedName === empNameLower;
        })
        .reduce((sum, adv) => sum + Number(adv.amount), 0);

      // Final Payout = Earned Pay - Advances Taken
      const finalPayout = earnedPay - empAdvances;

      return {
        id: emp.id,
        name: emp.name,
        baseSalary: baseSal,
        sundayPayment: sundayPay,
        isActive: emp.isActive,
        presentDays,
        sundayPresentDays,
        daysInMonth,
        earnedPay: Math.round(earnedPay * 100) / 100,
        advancesTaken: Math.round(empAdvances * 100) / 100,
        finalPayout: Math.round(finalPayout * 100) / 100,
        dates: empAttendance.map((a) => a.date.toISOString().split("T")[0]),
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

  // 3. Get all fish inventory logs to calculate true monthly buying costs
  const allInventoryLogs = await prisma.fishInventoryLog.findMany({
    select: {
      date: true,
      incomingWeight: true,
      buyingPricePerKg: true,
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
    item.daysCount += 1;
    monthMap.set(key, item);
  }

  // Aggregate true buying costs from fishInventoryLog
  for (const inv of allInventoryLogs) {
    const d = new Date(inv.date);
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

    item.totalBuyingCost += Number(inv.incomingWeight) * Number(inv.buyingPricePerKg);
    monthMap.set(key, item);
  }

  // Aggregate actual monthly expenses from dailyExpense for full consistency with getMonthlyFinancials
  for (const e of expenses) {
    const d = new Date(e.date);
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

    item.totalExpenses += Number(e.amount);
    monthMap.set(key, item);
  }

  // Compute totalNetProfit consistently: Sales - Buying Cost - Expenses
  for (const item of monthMap.values()) {
    item.totalPosSales = Math.round(item.totalPosSales * 100) / 100;
    item.totalBuyingCost = Math.round(item.totalBuyingCost * 100) / 100;
    item.totalExpenses = Math.round(item.totalExpenses * 100) / 100;
    item.totalNetProfit = Math.round((item.totalPosSales - item.totalBuyingCost - item.totalExpenses) * 100) / 100;
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
