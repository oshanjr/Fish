export const dynamic = "force-dynamic";

import { getTodaysExpenses } from "@/lib/actions/expenses";
import { computeDailySummary } from "@/lib/actions/summary";
import { getAllEmployees } from "@/lib/actions/employees";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateStr = typeof searchParams.date === "string" ? searchParams.date : undefined;

  const expenses = await getTodaysExpenses(dateStr);
  const summary = await computeDailySummary(dateStr);
  const employees = await getAllEmployees(true); // active only

  return <DailyOpsClient initialExpenses={expenses} initialSummary={summary} employees={employees} initialDateStr={dateStr} />;
}
