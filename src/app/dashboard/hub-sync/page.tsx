import { getSyncHistory } from "@/lib/actions/summary";
import HubSyncClient from "./hub-sync-client";
import { SyncHistoryEntry } from "@/types";

export default async function HubSyncPage() {
  const history = await getSyncHistory();

  return <HubSyncClient initialHistory={history as SyncHistoryEntry[]} />;
}
