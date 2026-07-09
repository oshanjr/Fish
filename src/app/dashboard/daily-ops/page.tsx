export const dynamic = "force-dynamic";

import { getTodaysExpenses } from "@/lib/actions/expenses";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage() {
  const expenses = await getTodaysExpenses();

  return <DailyOpsClient initialExpenses={expenses} />;
}
