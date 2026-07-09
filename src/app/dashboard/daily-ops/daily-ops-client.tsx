"use client";

import { useState, useTransition } from "react";
import { ClipboardList, Receipt, CheckCircle2, Circle, Loader2, Trash2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveAttendance } from "@/lib/actions/attendance";
import { addExpense, deleteExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/types";
import { expenseSchema, attendanceSchema } from "@/lib/validations";

interface AttendanceEntry {
  id: string;
  employeeName: string;
  status: "PRESENT" | "ABSENT";
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  loggedByName: string;
}

export default function DailyOpsClient({
  initialAttendance,
  staffList,
  initialExpenses,
}: {
  initialAttendance: AttendanceEntry[];
  staffList: string[];
  initialExpenses: Expense[];
}) {
  const [attendance, setAttendance] = useState(
    staffList.map((name) => {
      const existing = initialAttendance.find((a) => a.employeeName === name);
      return {
        employeeName: name,
        status: existing ? existing.status : ("ABSENT" as "ABSENT" | "PRESENT"),
      };
    })
  );
  const [expenses, setExpenses] = useState(initialExpenses);

  const [isPendingAttendance, startTransitionAttendance] = useTransition();
  const [isPendingExpense, startTransitionExpense] = useTransition();

  const [expenseForm, setExpenseForm] = useState({ category: "", amount: "" });
  const [expenseError, setExpenseError] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const handleToggleAttendance = (name: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeName === name
          ? { ...a, status: a.status === "PRESENT" ? "ABSENT" : "PRESENT" }
          : a
      )
    );
  };

  const handleSaveAttendance = () => {
    setAttendanceMessage("");
    const validation = attendanceSchema.safeParse({ entries: attendance });

    if (!validation.success) {
      setAttendanceMessage("Invalid attendance data.");
      return;
    }

    startTransitionAttendance(async () => {
      try {
        await saveAttendance(attendance);
        setAttendanceMessage("Attendance saved successfully.");
      } catch {
        setAttendanceMessage("Failed to save attendance.");
      }
    });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");

    const amount = parseFloat(expenseForm.amount);
    const data = { category: expenseForm.category, amount };
    const validation = expenseSchema.safeParse(data);

    if (!validation.success) {
      setExpenseError(validation.error.errors[0].message);
      return;
    }

    startTransitionExpense(async () => {
      try {
        const result = await addExpense(data);
        if (result.success) {
          // Note: we might not get the loggedByName from the create response immediately, 
          // but revalidatePath will refresh the page data anyway.
          // For immediate UI update, we append a temporary entry.
          setExpenses((prev) => [
            {
              id: result.data.id,
              category: result.data.category,
              amount: Number(result.data.amount),
              loggedByName: "You", // placeholder until refresh
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-violet-500" />
          <h1 className="text-xl font-bold text-slate-800">Daily Operations</h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage staff attendance and log daily cash expenses
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border border-slate-200/60 h-auto p-1 rounded-xl">
          <TabsTrigger
            value="attendance"
            className="rounded-lg py-2.5 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
          >
            Staff Attendance
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="rounded-lg py-2.5 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-sm"
          >
            Daily Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-700">
                Mark Today's Attendance
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {attendance.filter((a) => a.status === "PRESENT").length} Present
              </span>
            </div>

            {attendanceMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm border ${
                  attendanceMessage.includes("success")
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {attendanceMessage}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {attendance.map((entry) => (
                <div
                  key={entry.employeeName}
                  onClick={() => handleToggleAttendance(entry.employeeName)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    entry.status === "PRESENT"
                      ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-medium text-slate-700 text-sm">
                    {entry.employeeName}
                  </span>
                  {entry.status === "PRESENT" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={isPendingAttendance}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:from-violet-400 hover:to-purple-400 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isPendingAttendance ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Attendance"
              )}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Expense Form */}
            <div className="lg:col-span-1">
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
                        setExpenseForm({ ...expenseForm, category: e.target.value })
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
                        setExpenseForm({ ...expenseForm, amount: e.target.value })
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
                    Today's Expenses
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
