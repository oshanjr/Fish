"use server";

import { prisma } from "@/lib/prisma";
import { payrollUpdateSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getAllPayroll() {
  const payroll = await prisma.staffPayroll.findMany({
    orderBy: { employeeName: "asc" },
  });

  return payroll.map((p) => ({
    ...p,
    baseSalary: Number(p.baseSalary),
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
  });

  if (!current) {
    throw new Error("Staff member not found");
  }

  const newAdvanceTotal = Number(current.advanceTaken) + validated.advanceTaken;
  const newBalance = Number(current.baseSalary) - newAdvanceTotal;

  const updated = await prisma.staffPayroll.update({
    where: { id: validated.id },
    data: {
      advanceTaken: newAdvanceTotal,
      balanceOwed: newBalance,
    },
  });

  revalidatePath("/dashboard/payroll");
  return {
    success: true,
    data: {
      ...updated,
      baseSalary: Number(updated.baseSalary),
      advanceTaken: Number(updated.advanceTaken),
      balanceOwed: Number(updated.balanceOwed),
    },
  };
}

export async function resetPayrollAdvances() {
  await prisma.staffPayroll.updateMany({
    data: {
      advanceTaken: 0,
      balanceOwed: 0,
    },
  });

  // Recalculate balances
  const allStaff = await prisma.staffPayroll.findMany();
  for (const staff of allStaff) {
    await prisma.staffPayroll.update({
      where: { id: staff.id },
      data: { balanceOwed: staff.baseSalary },
    });
  }

  revalidatePath("/dashboard/payroll");
  return { success: true };
}
