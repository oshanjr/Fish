"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Phone,
  Truck,
  Store,
  Plus,
  Loader2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Banknote,
  Receipt,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { addTransaction, deleteTransaction } from "@/lib/actions/contacts";
import { contactTransactionSchema } from "@/lib/validations";
import type { ContactDetailEntry } from "@/types";

export default function ContactDetailClient({
  contact: initialContact,
}: {
  contact: ContactDetailEntry;
}) {
  const [contact, setContact] = useState(initialContact);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    description: "",
    amount: "",
    isPayment: false,
  });
  
  // Calculator mode state for discounted bulk sales
  const [calcMode, setCalcMode] = useState(false);
  const [calcForm, setCalcForm] = useState({
    fishType: "",
    weight: "",
    pricePerKg: "",
  });

  const [formError, setFormError] = useState("");

  const isSupplier = contact.type === "SUPPLIER";
  const accentFrom = isSupplier ? "from-cyan-500" : "from-amber-500";
  const accentTo = isSupplier ? "to-teal-500" : "to-orange-500";

  const totalCredit = contact.transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = contact.transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    let finalDescription = form.description;
    let rawAmount = parseFloat(form.amount);

    if (calcMode && !form.isPayment) {
      const weight = parseFloat(calcForm.weight);
      const price = parseFloat(calcForm.pricePerKg);
      
      if (!calcForm.fishType || isNaN(weight) || isNaN(price) || weight <= 0 || price <= 0) {
        setFormError("Please fill out all calculation fields with valid numbers.");
        return;
      }
      
      rawAmount = weight * price;
      finalDescription = `${calcForm.fishType} — ${weight}kg @ ${price.toLocaleString("en-LK")} LKR/kg`;
    } else {
      if (!finalDescription.trim()) {
        setFormError("Description is required.");
        return;
      }
      if (isNaN(rawAmount) || rawAmount <= 0) {
        setFormError("Please enter a valid positive amount.");
        return;
      }
    }

    // If it's a payment, make the amount negative
    const finalAmount = form.isPayment ? -rawAmount : rawAmount;

    const data = {
      contactId: contact.id,
      description: finalDescription,
      amount: finalAmount,
    };

    const validation = contactTransactionSchema.safeParse(data);
    if (!validation.success) {
      setFormError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await addTransaction(data);
        if (result.success) {
          setContact((prev) => ({
            ...prev,
            totalBalance: prev.totalBalance + finalAmount,
            transactions: [result.data, ...prev.transactions],
          }));
          setForm({ description: "", amount: "", isPayment: false });
          setCalcForm({ fishType: "", weight: "", pricePerKg: "" });
          setCalcMode(false);
        }
      } catch {
        setFormError("Failed to add transaction.");
      }
    });
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!confirm("Delete this transaction? Balance will be recalculated."))
      return;

    startTransition(async () => {
      try {
        await deleteTransaction(txId);
        const tx = contact.transactions.find((t) => t.id === txId);
        setContact((prev) => ({
          ...prev,
          totalBalance: prev.totalBalance - (tx?.amount || 0),
          transactions: prev.transactions.filter((t) => t.id !== txId),
        }));
      } catch {
        // silently fail
      }
    });
  };

  // Compute running balance for display (oldest first)
  const transactionsWithBalance = (() => {
    const sorted = [...contact.transactions].reverse();
    let running = 0;
    const result = sorted.map((t) => {
      running += t.amount;
      return { ...t, runningBalance: running };
    });
    return result.reverse();
  })();

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Contact Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-15">
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
              isSupplier ? "bg-cyan-400" : "bg-amber-400"
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl ${
              isSupplier ? "bg-teal-400" : "bg-orange-400"
            }`}
          />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} flex items-center justify-center text-lg font-bold text-white shadow-lg`}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isSupplier ? (
                  <Truck className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Store className="w-4 h-4 text-amber-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isSupplier ? "text-cyan-400" : "text-amber-400"
                  }`}
                >
                  {isSupplier ? "Supplier" : "Buyer"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
              {contact.phone && (
                <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {contact.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-medium text-slate-400 tracking-wider mb-1">
              {contact.totalBalance > 0
                ? "Outstanding Balance"
                : contact.totalBalance < 0
                  ? "Overpaid"
                  : "Balance"}
            </p>
            <p
              className={`text-2xl font-bold ${
                contact.totalBalance > 0
                  ? "text-rose-400"
                  : contact.totalBalance < 0
                    ? "text-emerald-400"
                    : "text-emerald-400"
              }`}
            >
              LKR{" "}
              {Math.abs(contact.totalBalance).toLocaleString("en-LK", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-medium text-slate-500">Total Credit</p>
          </div>
          <p className="text-lg font-bold text-slate-800">
            LKR{" "}
            {totalCredit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-medium text-slate-500">Total Paid</p>
          </div>
          <p className="text-lg font-bold text-slate-800">
            LKR{" "}
            {totalPaid.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-sky-500" />
            <p className="text-xs font-medium text-slate-500">Transactions</p>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {contact.transactions.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-500" />
                Add Transaction
              </div>
              
              {/* Show calculation toggle only for credits (not payments) */}
              {!form.isPayment && (
                <button
                  type="button"
                  onClick={() => setCalcMode(!calcMode)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    calcMode 
                      ? "bg-amber-100 text-amber-600" 
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                  title="Calculate from weight and custom price"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              )}
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, isPayment: false });
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      !form.isPayment
                        ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Credit / Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, isPayment: true });
                      setCalcMode(false); // Disable calc mode for payments
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      form.isPayment
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Payment
                  </button>
                </div>
              </div>

              {calcMode && !form.isPayment ? (
                /* Advanced Calculation Form */
                <div className="space-y-4 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Fish Type
                    </label>
                    <input
                      type="text"
                      value={calcForm.fishType}
                      onChange={(e) =>
                        setCalcForm({ ...calcForm, fishType: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                      placeholder="e.g., Tuna, Seer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcForm.weight}
                        onChange={(e) =>
                          setCalcForm({ ...calcForm, weight: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Custom Price/kg
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcForm.pricePerKg}
                        onChange={(e) =>
                          setCalcForm({ ...calcForm, pricePerKg: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {/* Auto-calculated preview */}
                  <div className="pt-2 border-t border-amber-200/60 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Calculated Total:</span>
                      <span className="text-sm font-bold text-amber-600">
                        LKR {((parseFloat(calcForm.weight) || 0) * (parseFloat(calcForm.pricePerKg) || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Form */
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      placeholder={
                        form.isPayment
                          ? "e.g., Cash payment"
                          : "e.g., 50kg Tuna supply"
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {form.isPayment
                        ? "This amount will reduce the outstanding balance."
                        : "This amount will be added to the outstanding balance."}
                    </p>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isPending}
                className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold shadow-md transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 ${
                  form.isPayment
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/20 hover:shadow-emerald-500/40"
                    : "bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/20 hover:shadow-rose-500/40"
                }`}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : form.isPayment ? (
                  "Record Payment"
                ) : (
                  "Add Credit"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                Transaction History
              </h2>
            </div>

            {transactionsWithBalance.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  No transactions yet. Add a credit or payment to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactionsWithBalance.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString("en-LK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3 text-slate-700 font-medium">
                          {tx.description}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                            tx.amount > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                          {tx.runningBalance.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
