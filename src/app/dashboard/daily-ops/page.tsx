export const dynamic = "force-dynamic";

import { getTodaysExpenses } from "@/lib/actions/expenses";
import { computeDailySummary } from "@/lib/actions/summary";
import { getAllEmployees } from "@/lib/actions/employees";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateStr = typeof searchParams.date === "string" ? searchParams.date : undefined;

  const expenses = await getTodaysExpenses(dateStr);
  const summary = await computeDailySummary(dateStr);
  const employees = await getAllEmployees(true); // active only

  // Try to fetch categories; if error (e.g., db push not run), fallback to default
  let categories = [];
  try {
    categories = await getExpenseCategories();
    // Seed initial categories if empty
    if (categories.length === 0) {
      const defaultCategories = ["Salary Advance", "Bonus", "Sunday Payment"];
      for (const cat of defaultCategories) {
        await prisma.expenseCategory.create({
          data: { name: cat, isSystem: true }
        });
      }
      categories = await getExpenseCategories();
    }
  } catch (e) {
    // Graceful fallback during development
    categories = [
      { id: "1", name: "Salary Advance", isSystem: true, createdAt: new Date() },
      { id: "2", name: "Bonus", isSystem: true, createdAt: new Date() },
      { id: "3", name: "Sunday Payment", isSystem: true, createdAt: new Date() },
    ];
  }

  const session = await auth();
  const isManager = session?.user?.role === "MANAGER";

  return <DailyOpsClient initialExpenses={expenses} initialSummary={summary} employees={employees} initialDateStr={dateStr} categories={categories} isManager={isManager} />;
}
