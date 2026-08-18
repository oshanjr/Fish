export const dynamic = "force-dynamic";

import { getTodaysInventory } from "@/lib/actions/inventory";
import { getFishTypes } from "@/lib/actions/fish-types";
import MorningIntakeClient from "./morning-intake-client";

export default async function MorningIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const [logs, fishTypes] = await Promise.all([
    getTodaysInventory(resolvedParams.date),
    getFishTypes(),
  ]);

  return <MorningIntakeClient initialLogs={logs} fishTypes={fishTypes} initialDateStr={resolvedParams.date} />;
}
