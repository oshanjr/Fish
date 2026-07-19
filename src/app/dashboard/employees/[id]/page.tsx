import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeDetailClient from "./employee-detail-client";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userRole = session?.user?.role;

  if (userRole !== "MANAGER" && userRole !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // 1. Fetch Employee
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    redirect("/dashboard/employees");
  }

  // 2. Fetch Payroll Record
  const payrollRecord = await prisma.staffPayroll.findUnique({
    where: { employeeId: id },
  });

  // 3. Fetch Payment History (Advances and Bonuses from DailyExpense)
  const paymentHistory = await prisma.dailyExpense.findMany({
    where: {
      category: {
        contains: employee.name,
      },
      OR: [
        { category: { startsWith: "Salary Advance" } },
        { category: { startsWith: "Bonus:" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // 4. Fetch Attendance History
  const attendanceHistory = await prisma.staffAttendance.findMany({
    where: { employeeId: id },
    orderBy: { date: "desc" },
    take: 30, // Last 30 days
  });

  // Serialize to avoid passing Prisma Decimal objects to client components
  const serializedEmployee = {
    ...employee,
    baseSalary: Number(employee.baseSalary),
  };

  const serializedPayroll = payrollRecord ? {
    ...payrollRecord,
    earnedSalary: Number(payrollRecord.earnedSalary),
    advanceTaken: Number(payrollRecord.advanceTaken),
    bonusEarned: Number(payrollRecord.bonusEarned),
    balanceOwed: Number(payrollRecord.balanceOwed),
  } : null;

  const serializedHistory = paymentHistory.map(h => ({
    id: h.id,
    date: h.date.toISOString(),
    category: h.category,
    amount: Number(h.amount),
    loggedBy: h.user.name,
    createdAt: h.createdAt.toISOString(),
  }));

  const serializedAttendance = attendanceHistory.map(a => ({
    id: a.id,
    date: a.date.toISOString(),
    status: a.status,
    inTime: a.inTime,
    outTime: a.outTime,
    hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
    earnedPay: a.earnedPay ? Number(a.earnedPay) : null,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <EmployeeDetailClient
        employee={serializedEmployee}
        payroll={serializedPayroll}
        paymentHistory={serializedHistory}
        attendanceHistory={serializedAttendance}
      />
    </div>
  );
}
