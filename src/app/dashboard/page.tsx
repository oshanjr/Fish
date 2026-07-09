import { auth } from "@/auth";
import type { UserRole } from "@/types";
import { prisma } from "@/lib/prisma";
import EmployeeDashboardClient from "./employee-dashboard-client";
import ManagerDashboardClient from "./manager-dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "SUPERVISOR") as UserRole;

  if (role === "EMPLOYEE") {
    const employeeId = session?.user?.id;
    
    // Fetch employee data
    const [payroll, attendance] = await Promise.all([
      prisma.staffPayroll.findUnique({ where: { employeeId } }),
      prisma.staffAttendance.findMany({
        where: { employeeId, status: "PRESENT" },
      }),
    ]);

    return (
      <EmployeeDashboardClient
        name={session?.user?.name || "Employee"}
        advanceTaken={Number(payroll?.advanceTaken || 0)}
        balanceOwed={Number(payroll?.balanceOwed || 0)}
        attendanceCount={attendance.length}
      />
    );
  }

  // Fetch data for MANAGER/SUPERVISOR
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dCopy = new Date(today);
  const day = dCopy.getDay();
  const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(dCopy.setDate(diff));

  const [todaySummary, weekSummaries, recentTransactions] = await Promise.all([
    prisma.dailyStoreSummary.findUnique({ where: { date: today } }),
    prisma.dailyStoreSummary.findMany({
      where: { date: { gte: startOfWeek, lte: today } },
      orderBy: { date: 'desc' }
    }),
    prisma.contactTransaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { contact: true }
    })
  ]);

  return (
    <ManagerDashboardClient 
      name={session?.user?.name?.split(" ")[0] || "Manager"}
      role={role}
      todaySummary={todaySummary ? {
        totalPosSales: Number(todaySummary.totalPosSales),
        totalBuyingCost: Number(todaySummary.totalBuyingCost),
        calculatedExpenses: Number(todaySummary.calculatedExpenses),
        netProfit: Number(todaySummary.netProfit),
      } : null}
      weekSummaries={weekSummaries.map(s => ({
        ...s,
        totalPosSales: Number(s.totalPosSales),
        totalBuyingCost: Number(s.totalBuyingCost),
        calculatedExpenses: Number(s.calculatedExpenses),
        netProfit: Number(s.netProfit),
        date: s.date.toISOString(),
      }))}
      recentTransactions={recentTransactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString(),
      }))}
    />
  );
}
