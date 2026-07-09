"use server";

import { prisma } from "@/lib/prisma";
import { payrollUpdateSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getAllPayroll() {
  const payroll = await prisma.staffPayroll.findMany({
    include: { employee: { select: { name: true, baseSalary: true } } },
    orderBy: { employee: { name: "asc" } },
  });

  return payroll.map((p) => ({
    id: p.id,
    employeeId: p.employeeId,
    employeeName: p.employee.name,
    baseSalary: Number(p.employee.baseSalary),
    advanceTaken: Number(p.advanceTaken),
    balanceOwed: Number(p.balanceOwed),
  }));
}

export async function updatePayrollAdvance(data: {
  id: string;
  advanceTaken: number;
}) {
  const validated = payrollUpdateSchema.parse(data);

  const current = await prisma.staffPayroll.findUnique({
    where: { id: validated.id },
    include: { employee: { select: { baseSalary: true, name: true } } },
  });

  if (!current) {
    throw new Error("Staff member not found");
  }

  const newAdvanceTotal = Number(current.advanceTaken) + validated.advanceTaken;
  const newBalance = Number(current.employee.baseSalary) - newAdvanceTotal;

  const updated = await prisma.staffPayroll.update({
    where: { id: validated.id },
    data: {
      advanceTaken: newAdvanceTotal,
      balanceOwed: newBalance,
    },
  });

  // Auto-log salary advance as a daily expense
  if (validated.advanceTaken > 0) {
    const session = await auth();
    const userId = session?.user?.id;

    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyExpense.create({
        data: {
          date: today,
          category: `Salary Advance - ${current.employee.name}`,
          amount: validated.advanceTaken,
          loggedBy: userId,
        },
      });
    }
  }

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/daily-ops");
  return {
    success: true,
    data: {
      id: updated.id,
      employeeId: updated.employeeId,
      employeeName: current.employee.name,
      baseSalary: Number(current.employee.baseSalary),
      advanceTaken: Number(updated.advanceTaken),
      balanceOwed: Number(updated.balanceOwed),
    },
  };
}

export async function resetPayrollAdvances() {
  // Reset all advances
  await prisma.staffPayroll.updateMany({
    data: {
      advanceTaken: 0,
      balanceOwed: 0,
    },
  });

  // Recalculate balances based on employee base salary
  const allPayroll = await prisma.staffPayroll.findMany({
    include: { employee: { select: { baseSalary: true } } },
  });

  for (const record of allPayroll) {
    await prisma.staffPayroll.update({
      where: { id: record.id },
      data: { balanceOwed: record.employee.baseSalary },
    });
  }

  revalidatePath("/dashboard/employees");
  return { success: true };
}
