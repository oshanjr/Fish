"use client";

import { useState, useTransition } from "react";
import { Wallet, DollarSign, Loader2, RotateCcw } from "lucide-react";
import { updatePayrollAdvance, resetPayrollAdvances } from "@/lib/actions/payroll";
import type { PayrollEntry } from "@/types";

export default function PayrollClient({
  initialPayroll,
}: {
  initialPayroll: PayrollEntry[];
}) {
  const [payroll, setPayroll] = useState(initialPayroll);
  const [isPending, startTransition] = useTransition();
  const [advanceForm, setAdvanceForm] = useState({ id: "", amount: "" });
  const [message, setMessage] = useState("");

  const handleUpdateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const amount = parseFloat(advanceForm.amount);
    if (!advanceForm.id || isNaN(amount) || amount <= 0) {
      setMessage("Please select an employee and enter a valid advance amount.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePayrollAdvance({
          id: advanceForm.id,
          advanceTaken: amount,
        });

        if (result.success) {
          setPayroll((prev) =>
            prev.map((p) =>
              p.id === result.data.id
                ? {
                    ...p,
                    advanceTaken: result.data.advanceTaken,
                    balanceOwed: result.data.balanceOwed,
                  }
                : p
            )
          );
          setAdvanceForm({ id: "", amount: "" });
          setMessage("Advance updated successfully.");
        }
      } catch {
        setMessage("Failed to update advance.");
      }
    });
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to reset all advances for a new pay period? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await resetPayrollAdvances();
        setPayroll((prev) =>
          prev.map((p) => ({
            ...p,
            advanceTaken: 0,
            balanceOwed: p.baseSalary,
          }))
        );
        setMessage("All advances reset for the new pay period.");
      } catch {
        setMessage("Failed to reset advances.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-slate-800">Staff Payroll</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage staff salaries, issue advances, and track balances.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isPending}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Period
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.includes("success") || message.includes("reset")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advance Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-500" />
              Issue Advance Payment
            </h2>

            <form onSubmit={handleUpdateAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Employee
                </label>
                <select
                  value={advanceForm.id}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                >
                  <option value="">Select employee...</option>
                  {payroll.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Advance Amount (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                  placeholder="0.00"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This amount will be added to any existing advances.
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 hover:from-rose-400 hover:to-pink-400 disabled:opacity-50 transition-all duration-200 flex justify-center items-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Issue Advance"}
              </button>
            </form>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Staff Ledger
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Base Salary (LKR)
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Advances Taken (LKR)
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Balance Owed (LKR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payroll.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No staff records found. Add staff via database seed.
                      </td>
                    </tr>
                  ) : (
                    payroll.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {record.employeeName}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {record.baseSalary.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-right text-rose-600 font-medium">
                          {record.advanceTaken > 0 ? record.advanceTaken.toLocaleString("en-LK", { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-800 font-semibold">
                          {record.balanceOwed.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
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
