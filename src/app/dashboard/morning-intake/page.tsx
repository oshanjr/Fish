import { getTodaysInventory } from "@/lib/actions/inventory";
import MorningIntakeClient from "./morning-intake-client";

export default async function MorningIntakePage() {
  const logs = await getTodaysInventory();

  return <MorningIntakeClient initialLogs={logs} />;
}
