"use client";

import { useState, useTransition } from "react";
import { Moon, AlertTriangle, Calculator, DollarSign, Loader2, Save } from "lucide-react";
import { updateWastage } from "@/lib/actions/inventory";
import { saveDaySummary } from "@/lib/actions/summary";
import type { DailySummary } from "@/types";
import { wastageSchema, posSalesSchema } from "@/lib/validations";

interface InventoryItem {
  id: string;
  fishType: string;
  buyingPricePerKg: number;
  wastageWeight: number;
}

export default function EveningClosingClient({
  inventory,
  initialSummary,
}: {
  inventory: InventoryItem[];
  initialSummary: DailySummary;
}) {
  const [summary, setSummary] = useState<DailySummary>(initialSummary);
  const [isPendingWastage, startTransitionWastage] = useTransition();
  const [isPendingSummary, startTransitionSummary] = useTransition();

  const [wastageForm, setWastageForm] = useState({ inventoryLogId: "", wastageWeight: "" });
  const [posSalesInput, setPosSalesInput] = useState(
    summary.totalPosSales > 0 ? summary.totalPosSales.toString() : ""
  );

  const [message, setMessage] = useState("");

  const handleUpdateWastage = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const weight = parseFloat(wastageForm.wastageWeight);
    const data = { inventoryLogId: wastageForm.inventoryLogId, wastageWeight: weight };
    const validation = wastageSchema.safeParse(data);

    if (!validation.success) {
      setMessage(validation.error.errors[0].message);
      return;
    }

    startTransitionWastage(async () => {
      try {
        await updateWastage(data);
        
        // Optimistically update the summary UI (actual numbers will refresh on navigate or revalidatePath)
        const item = inventory.find(i => i.id === wastageForm.inventoryLogId);
        if (item) {
          const costDiff = (weight - item.wastageWeight) * item.buyingPricePerKg;
          setSummary(prev => ({
            ...prev,
            calculatedWastageCost: prev.calculatedWastageCost + costDiff,
            netProfit: prev.netProfit - costDiff,
          }));
        }

        setMessage("Wastage updated.");
        setWastageForm({ inventoryLogId: "", wastageWeight: "" });
      } catch {
        setMessage("Failed to update wastage.");
      }
    });
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const sales = parseFloat(posSalesInput);
    const data = { totalPosSales: sales };
    const validation = posSalesSchema.safeParse(data);

    if (!validation.success) {
      setMessage(validation.error.errors[0].message);
      return;
    }

    startTransitionSummary(async () => {
      try {
        const result = await saveDaySummary(data.totalPosSales);
        if (result.success) {
          setSummary({
            ...result.data,
            totalPosSales: Number(result.data.totalPosSales),
            totalBuyingCost: Number(result.data.totalBuyingCost),
            calculatedExpenses: Number(result.data.calculatedExpenses),
            calculatedWastageCost: Number(result.data.calculatedWastageCost),
            netProfit: Number(result.data.netProfit),
          });
          setMessage("Day summary saved successfully!");
        }
      } catch {
        setMessage("Failed to save day summary.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Moon className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-800">Evening Closing</h1>
        </div>
        <p className="text-sm text-slate-500">
          Record wastage, reconcile POS, and generate daily financial summary.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.includes("success") ? "bg-green-50 border-green-200 text-green-700" :
          message.includes("Wastage") ? "bg-blue-50 border-blue-200 text-blue-700" :
          "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Forms */}
        <div className="space-y-6">
          
          {/* Wastage Tracker */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Wastage Tracker
            </h2>
            <form onSubmit={handleUpdateWastage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Select Fish (From Today's Intake)
                </label>
                <select
                  value={wastageForm.inventoryLogId}
                  onChange={(e) => setWastageForm({ ...wastageForm, inventoryLogId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                >
                  <option value="">Select entry...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fishType} — {item.wastageWeight}kg recorded
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  New Wastage Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={wastageForm.wastageWeight}
                  onChange={(e) => setWastageForm({ ...wastageForm, wastageWeight: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">This will override the previous wastage value for this entry.</p>
              </div>
              <button
                type="submit"
                disabled={isPendingWastage || inventory.length === 0}
                className="w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 border border-amber-200"
              >
                {isPendingWastage && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Wastage
              </button>
            </form>
          </div>

          {/* POS Reconciliation */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-500" />
              POS Reconciliation
            </h2>
            <form onSubmit={handleSaveSummary} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Today's Total POS Sales (LKR)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={posSalesInput}
                    onChange={(e) => {
                      setPosSalesInput(e.target.value);
                      // Optimistically update net profit in UI
                      const sales = parseFloat(e.target.value) || 0;
                      setSummary(prev => ({
                        ...prev,
                        totalPosSales: sales,
                        netProfit: sales - prev.totalBuyingCost - prev.calculatedExpenses - prev.calculatedWastageCost
                      }));
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPendingSummary}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50 transition-all duration-200 flex justify-center items-center gap-2"
              >
                {isPendingSummary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Day Summary
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Financial Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
          
          <h2 className="text-lg font-semibold text-white/90 mb-6 flex items-center gap-2 relative z-10">
            Financial Summary
            <span className="text-xs font-normal text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full ml-auto">
              Real-time
            </span>
          </h2>

          <div className="space-y-4 relative z-10 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-slate-400">Gross Sales (POS)</span>
              <span className="font-medium">
                {summary.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-slate-300">
              <span>− Total Buying Cost</span>
              <span>{summary.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-300">
              <span>− Operational Expenses</span>
              <span>{summary.calculatedExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/10 text-slate-300">
              <span>− Wastage Loss</span>
              <span>{summary.calculatedWastageCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 font-medium">Estimated Net Profit</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {summary.netProfit >= 0 ? "+" : ""}
                    {summary.netProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 block">LKR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
