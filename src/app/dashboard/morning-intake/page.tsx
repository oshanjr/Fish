export const dynamic = "force-dynamic";

import { getTodaysInventory } from "@/lib/actions/inventory";
import { getFishTypes } from "@/lib/actions/fish-types";
import MorningIntakeClient from "./morning-intake-client";

export default async function MorningIntakePage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const [logs, fishTypes] = await Promise.all([
    getTodaysInventory(searchParams.date),
    getFishTypes(),
  ]);

  return <MorningIntakeClient initialLogs={logs} fishTypes={fishTypes} initialDateStr={searchParams.date} />;
}
