"use client";

import { useState, useTransition } from "react";
import {
  ClipboardList,
  Receipt,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { addExpense, deleteExpense } from "@/lib/actions/expenses";
import { saveDaySummary } from "@/lib/actions/summary";
import { EXPENSE_CATEGORIES } from "@/types";
import { expenseSchema, posSalesSchema } from "@/lib/validations";

interface Expense {
  id: string;
  category: string;
  amount: number;
  loggedByName: string;
}

export default function DailyOpsClient({
  initialExpenses,
  initialSummary,
}: {
  initialExpenses: Expense[];
  initialSummary: any;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isPendingExpense, startTransitionExpense] = useTransition();
  const [expenseForm, setExpenseForm] = useState({ category: "", amount: "" });
  const [expenseError, setExpenseError] = useState("");

  const [posForm, setPosForm] = useState({
    cashSales: initialSummary.cashSales > 0 ? initialSummary.cashSales.toString() : "",
    cardSales: initialSummary.cardSales > 0 ? initialSummary.cardSales.toString() : "",
  });
  const [isPendingPos, startTransitionPos] = useTransition();
  const [posMessage, setPosMessage] = useState("");
  const [posTotal, setPosTotal] = useState(initialSummary.totalPosSales || 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");

    const amount = parseFloat(expenseForm.amount);
    const data = { category: expenseForm.category, amount };
    const validation = expenseSchema.safeParse(data);

    if (!validation.success) {
      setExpenseError(validation.error.issues[0].message);
      return;
    }

    startTransitionExpense(async () => {
      try {
        const result = await addExpense(data);
        if (result.success) {
          setExpenses((prev) => [
            {
              id: result.data.id,
              category: result.data.category,
              amount: Number(result.data.amount),
              loggedByName: "You",
            },
            ...prev,
          ]);
          setExpenseForm({ category: "", amount: "" });
        }
      } catch {
        setExpenseError("Failed to add expense.");
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    startTransitionExpense(async () => {
      try {
        await deleteExpense(id);
        setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      } catch {
        setExpenseError("Failed to delete expense.");
      }
    });
  };

  const handleSavePosSales = (e: React.FormEvent) => {
    e.preventDefault();
    setPosMessage("");

    const cash = parseFloat(posForm.cashSales) || 0;
    const card = parseFloat(posForm.cardSales) || 0;
    const data = { cashSales: cash, cardSales: card };
    
    const validation = posSalesSchema.safeParse(data);
    if (!validation.success) {
      setPosMessage(validation.error.issues[0].message);
      return;
    }

    startTransitionPos(async () => {
      try {
        const result = await saveDaySummary(data);
        if (result.success) {
          setPosTotal(result.data.totalPosSales);
          setPosMessage("POS Sales saved successfully!");
        }
      } catch {
        setPosMessage("Failed to save POS sales.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-violet-500" />
          <h1 className="text-xl font-bold text-slate-800">
            Daily Operations
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Log daily cash expenses for the store
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* POS Reconciliation */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-500" />
              POS Reconciliation
            </h2>
            
            {posMessage && (
              <div className={`mb-4 p-3 rounded-lg border text-sm ${
                posMessage.includes("success") ? "bg-green-50 border-green-200 text-green-700" :
                "bg-red-50 border-red-200 text-red-700"
              }`}>
                {posMessage}
              </div>
            )}

            <form onSubmit={handleSavePosSales} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Cash Sales (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={posForm.cashSales}
                  onChange={(e) => setPosForm({ ...posForm, cashSales: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Card Sales (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={posForm.cardSales}
                  onChange={(e) => setPosForm({ ...posForm, cardSales: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="flex justify-between items-center py-2 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-500">Total Sales</span>
                <span className="text-sm font-bold text-slate-800">
                  LKR {((parseFloat(posForm.cashSales) || 0) + (parseFloat(posForm.cardSales) || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="submit"
                disabled={isPendingPos}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPendingPos ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save POS Sales"
                )}
              </button>
            </form>
          </div>

          {/* Add Expense Form */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-500" />
              Add New Expense
            </h2>

            {expenseError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400 transition-all"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Amount (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-400 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPendingExpense}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-md shadow-pink-500/20 hover:shadow-pink-500/40 hover:from-pink-400 hover:to-rose-400 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPendingExpense ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Expense"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                Today&apos;s Expenses
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Total: LKR{" "}
                {expenses
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  No expenses logged today.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Logged By
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount (LKR)
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {expense.category}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {expense.loggedByName}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">
                          {expense.amount.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={isPendingExpense}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
