export const dynamic = "force-dynamic";

import { getTodaysInventory } from "@/lib/actions/inventory";
import { getFishTypes } from "@/lib/actions/fish-types";
import { auth } from "@/auth";
import MorningIntakeClient from "./morning-intake-client";

export default async function MorningIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const session = await auth();
  const dateStr = resolvedParams.date;
  const role = session?.user?.role || "SUPERVISOR";

  const [logs, fishTypes] = await Promise.all([
    getTodaysInventory(dateStr),
    getFishTypes(),
  ]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <MorningIntakeClient 
        initialLogs={logs} 
        fishTypes={fishTypes} 
        initialDateStr={dateStr}
        userRole={role}
      />
    </div>
  );
}
