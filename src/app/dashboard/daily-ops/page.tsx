export const dynamic = "force-dynamic";

import { getTodaysExpenses } from "@/lib/actions/expenses";
import { computeDailySummary } from "@/lib/actions/summary";
import { getAllEmployees } from "@/lib/actions/employees";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage() {
  const expenses = await getTodaysExpenses();
  const summary = await computeDailySummary();
  const employees = await getAllEmployees(true); // active only

  return <DailyOpsClient initialExpenses={expenses} initialSummary={summary} employees={employees} />;
}
