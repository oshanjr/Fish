"use server";

import { prisma } from "@/lib/prisma";
import { payrollUpdateSchema, bonusUpdateSchema } from "@/lib/validations";
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
    earnedSalary: Number(p.earnedSalary),
    advanceTaken: Number(p.advanceTaken),
    bonusEarned: Number(p.bonusEarned),
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
  // Balance Owed = Base Salary + Earned Salary - Advances Taken
  const newBalance = Number(current.employee.baseSalary) + Number(current.earnedSalary) - newAdvanceTotal;

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

      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (userExists) {
          await prisma.dailyExpense.create({
            data: {
              date: today,
              category: `Salary Advance - ${current.employee.name}`,
              amount: validated.advanceTaken,
              loggedBy: userId,
            },
          });
        }
      } catch (e) {
        console.error("Failed to log daily expense for salary advance", e);
        // We don't want to throw and crash the advance update if expense logging fails
      }
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
      bonusEarned: Number(updated.bonusEarned),
      balanceOwed: Number(updated.balanceOwed),
    },
  };
}

export async function resetPayrollAdvances() {
  const payrolls = await prisma.staffPayroll.findMany({
    include: { employee: { select: { baseSalary: true } } }
  });

  for (const p of payrolls) {
    await prisma.staffPayroll.update({
      where: { id: p.id },
      data: {
        earnedSalary: 0,
        advanceTaken: 0,
        bonusEarned: 0,
        balanceOwed: Number(p.employee.baseSalary),
      },
    });
  }

  revalidatePath("/dashboard/employees");
  return { success: true };
}

export async function addPayrollBonus(data: {
  employeeId: string;
  amount: number;
  description: string;
}) {
  const validated = bonusUpdateSchema.parse(data);

  const current = await prisma.staffPayroll.findUnique({
    where: { employeeId: validated.employeeId },
    include: { employee: { select: { name: true, baseSalary: true } } },
  });

  if (!current) {
    throw new Error("Staff member not found");
  }

  const newBonusTotal = Number(current.bonusEarned) + validated.amount;
  // Balance Owed = Base Salary + Earned Salary - Advances Taken (Bonuses are paid out immediately)
  const newBalance = Number(current.employee.baseSalary) + Number(current.earnedSalary) - Number(current.advanceTaken);

  await prisma.staffPayroll.update({
    where: { employeeId: validated.employeeId },
    data: {
      bonusEarned: newBonusTotal,
      balanceOwed: newBalance,
    }
  });

  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (userExists) {
      await prisma.dailyExpense.create({
        data: {
          date: today,
          category: `Bonus: ${validated.description} - ${current.employee.name}`,
          amount: validated.amount,
          loggedBy: userId,
        },
      });
    }
  }

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/daily-ops");
  return { success: true };
}

export async function issueAdvanceByEmployeeId(employeeId: string, amount: number) {
  const current = await prisma.staffPayroll.findUnique({
    where: { employeeId },
  });

  if (!current) {
    throw new Error("Payroll record not found for this employee");
  }

  return updatePayrollAdvance({
    id: current.id,
    advanceTaken: amount,
  });
}
