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
    const payroll = await prisma.staffPayroll.findUnique({ 
      where: { employeeId },
      include: { employee: true }
    });
    const empName = payroll?.employee?.name || session?.user?.name || "Employee";

    const [attendance, advances] = await Promise.all([
      prisma.staffAttendance.findMany({
        where: { employeeId },
        orderBy: { date: 'asc' }
      }),
      prisma.dailyExpense.findMany({
        where: { category: { endsWith: `- ${empName}` } },
        orderBy: { date: 'desc' }
      })
    ]);

    return (
      <EmployeeDashboardClient
        name={empName}
        earnedSalary={Number(payroll?.earnedSalary || 0)}
        advanceTaken={Number(payroll?.advanceTaken || 0)}
        bonusEarned={Number(payroll?.bonusEarned || 0)}
        balanceOwed={Number(payroll?.balanceOwed || 0)}
        attendance={attendance.map(a => ({
          date: a.date.toISOString(),
          status: a.status,
          inTime: a.inTime,
          outTime: a.outTime,
          hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
          earnedPay: a.earnedPay ? Number(a.earnedPay) : null,
        }))}
        transactions={advances.map(a => ({
          id: a.id,
          date: a.date.toISOString(),
          amount: Number(a.amount),
          type: a.category.startsWith("Bonus:") ? "BONUS" : "ADVANCE",
          description: a.category.startsWith("Bonus:") ? a.category.split(" - ")[0].replace("Bonus: ", "") : "Salary Advance",
        }))}
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
        id: s.id,
        date: s.date.toISOString(),
        totalPosSales: Number(s.totalPosSales),
        totalBuyingCost: Number(s.totalBuyingCost),
        calculatedExpenses: Number(s.calculatedExpenses),
        netProfit: Number(s.netProfit),
      }))}
      recentTransactions={recentTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        contact: {
          id: t.contact.id,
          name: t.contact.name,
          type: t.contact.type,
        }
      }))}
    />
  );
}
