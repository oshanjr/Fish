export const dynamic = "force-dynamic";

import { getTodaysExpenses } from "@/lib/actions/expenses";
import { computeDailySummary } from "@/lib/actions/summary";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage() {
  const [expenses, summary] = await Promise.all([
    getTodaysExpenses(),
    computeDailySummary(),
  ]);

  return <DailyOpsClient initialExpenses={expenses} initialSummary={summary} />;
}
