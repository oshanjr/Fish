"use server";

import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addExpense(data: { category: string; amount: number }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validated = expenseSchema.parse(data);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expense = await prisma.dailyExpense.create({
    data: {
      date: today,
      category: validated.category,
      amount: validated.amount,
      loggedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/daily-ops");
  revalidatePath("/dashboard/evening-closing");
  return { 
    success: true, 
    data: {
      ...expense,
      amount: Number(expense.amount),
    } 
  };
}

export async function getTodaysExpenses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expenses = await prisma.dailyExpense.findMany({
    where: { date: today },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
    loggedByName: expense.user.name,
  }));
}

export async function deleteExpense(id: string) {
  await prisma.dailyExpense.delete({ where: { id } });
  revalidatePath("/dashboard/daily-ops");
  revalidatePath("/dashboard/evening-closing");
  return { success: true };
}
