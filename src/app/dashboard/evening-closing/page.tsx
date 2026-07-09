export const dynamic = "force-dynamic";

import { getTodaysInventory } from "@/lib/actions/inventory";
import { computeDailySummary } from "@/lib/actions/summary";
import { getTodaysTransactions } from "@/lib/actions/contacts";
import EveningClosingClient from "./evening-closing-client";
import { DailySummary } from "@/types";

export default async function EveningClosingPage() {
  const [inventory, summary, transactions] = await Promise.all([
    getTodaysInventory(),
    computeDailySummary(),
    getTodaysTransactions(),
  ]);

  return (
    <EveningClosingClient
      inventory={inventory}
      initialSummary={summary as DailySummary}
      transactions={transactions}
    />
  );
}
