"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CloudLightning, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { syncToHub } from "@/lib/actions/sync";
import type { SyncHistoryEntry } from "@/types";

export default function HubSyncClient({
  initialHistory,
}: {
  initialHistory: SyncHistoryEntry[];
}) {
  const [history, setHistory] = useState(initialHistory);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const pendingSyncs = history.filter((h) => !h.isSyncedWithHub);

  const handleSync = () => {
    if (pendingSyncs.length === 0) return;

    setMessage(null);
    const summaryToSync = pendingSyncs[0]; // Sync the most recent pending day

    startTransition(async () => {
      try {
        const result = await syncToHub(summaryToSync.id);
        if (result.success) {
          setMessage({ type: "success", text: "Successfully synced data to central hub!" });
          setHistory((prev) =>
            prev.map((h) => (h.id === summaryToSync.id ? { ...h, isSyncedWithHub: true } : h))
          );
        } else {
          setMessage({ type: "error", text: result.error || "Sync failed." });
        }
      } catch {
        setMessage({ type: "error", text: "An unexpected error occurred during sync." });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-800">Hub Sync</h1>
        </div>
        <p className="text-sm text-slate-500">
          Synchronize your daily summaries with the central admin hub.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Action Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              pendingSyncs.length > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}>
              <CloudLightning className="w-8 h-8" />
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {pendingSyncs.length > 0 ? "Ready to Sync" : "All Caught Up"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {pendingSyncs.length > 0
                ? `You have ${pendingSyncs.length} unsynced day(s).`
                : "All your daily summaries have been successfully synchronized to the central hub."}
            </p>

            {message && (
              <div className={`mb-4 p-3 text-sm rounded-lg text-left ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={isPending || pendingSyncs.length === 0}
              className={`w-full py-3 rounded-xl font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                pendingSyncs.length > 0
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className={`w-5 h-5 ${pendingSyncs.length > 0 && !isPending ? "animate-pulse" : ""}`} />
              )}
              {isPending ? "Syncing..." : "Close Day & Sync to Hub"}
            </button>
          </div>
        </div>

        {/* Sync History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">
                Synchronization History
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      POS Sales (LKR)
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Net Profit (LKR)
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No day summaries found. Complete an evening closing first.
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {new Date(record.date).toLocaleDateString("en-LK")}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {record.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {record.netProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {record.isSyncedWithHub ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <XCircle className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
