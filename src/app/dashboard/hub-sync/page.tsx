export const dynamic = "force-dynamic";

import { getSyncHistory } from "@/lib/actions/summary";
import HubSyncClient from "./hub-sync-client";
import { SyncHistoryEntry } from "@/types";

export default async function HubSyncPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateStr = typeof searchParams.date === "string" ? searchParams.date : undefined;

  const history = await getSyncHistory(dateStr);

  return <HubSyncClient initialHistory={history as SyncHistoryEntry[]} initialDateStr={dateStr} />;
}
