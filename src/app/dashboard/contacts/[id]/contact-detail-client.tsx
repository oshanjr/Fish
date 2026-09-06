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
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { addTransaction, deleteTransaction } from "@/lib/actions/contacts";
import { contactTransactionSchema } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ContactDetailEntry, ContactTransactionEntry } from "@/types";

export default function ContactDetailClient({
  contact: initialContact,
  userRole,
}: {
  contact: ContactDetailEntry;
  userRole?: string;
}) {
  const [contact, setContact] = useState(initialContact);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    description: "",
    amount: "",
    isPayment: false,
  });
  
  const [calcForm, setCalcForm] = useState({
    fishType: "",
    weight: "",
    pricePerKg: "",
    amountPaid: "",
    creditAmount: "",
  });

  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formError, setFormError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<ContactTransactionEntry | null>(null);

  const isSupplier = contact.type === "SUPPLIER";
  const accentFrom = isSupplier ? "from-cyan-500" : "from-amber-500";
  const accentTo = isSupplier ? "to-teal-500" : "to-orange-500";

  const totalCredit = contact.transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = contact.transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleAmountPaidChange = (val: string) => {
    const total = (parseFloat(calcForm.weight) || 0) * (parseFloat(calcForm.pricePerKg) || 0);
    const paid = parseFloat(val);

    if (val === "") {
      setCalcForm((prev) => ({ ...prev, amountPaid: "", creditAmount: "" }));
      return;
    }

    if (!isNaN(paid) && total > 0) {
      const remaining = Math.max(0, total - paid);
      setCalcForm((prev) => ({
        ...prev,
        amountPaid: val,
        creditAmount: remaining > 0 ? remaining.toFixed(2).replace(/\.00$/, "") : "0",
      }));
    } else {
      setCalcForm((prev) => ({ ...prev, amountPaid: val }));
    }
  };

  const handleCreditAmountChange = (val: string) => {
    const total = (parseFloat(calcForm.weight) || 0) * (parseFloat(calcForm.pricePerKg) || 0);
    const credit = parseFloat(val);

    if (val === "") {
      setCalcForm((prev) => ({ ...prev, creditAmount: "", amountPaid: "" }));
      return;
    }

    if (!isNaN(credit) && total > 0) {
      const remaining = Math.max(0, total - credit);
      setCalcForm((prev) => ({
        ...prev,
        creditAmount: val,
        amountPaid: remaining > 0 ? remaining.toFixed(2).replace(/\.00$/, "") : "0",
      }));
    } else {
      setCalcForm((prev) => ({ ...prev, creditAmount: val }));
    }
  };

  const handleWeightChange = (val: string) => {
    const newWeight = parseFloat(val) || 0;
    const price = parseFloat(calcForm.pricePerKg) || 0;
    const total = newWeight * price;

    setCalcForm((prev) => {
      let newCredit = prev.creditAmount;
      let newPaid = prev.amountPaid;
      const paidNum = parseFloat(prev.amountPaid);
      const creditNum = parseFloat(prev.creditAmount);

      if (total > 0) {
        if (!isNaN(paidNum) && prev.amountPaid !== "") {
          const rem = Math.max(0, total - paidNum);
          newCredit = rem > 0 ? rem.toFixed(2).replace(/\.00$/, "") : "0";
        } else if (!isNaN(creditNum) && prev.creditAmount !== "") {
          const rem = Math.max(0, total - creditNum);
          newPaid = rem > 0 ? rem.toFixed(2).replace(/\.00$/, "") : "0";
        }
      }
      return { ...prev, weight: val, creditAmount: newCredit, amountPaid: newPaid };
    });
  };

  const handlePriceChange = (val: string) => {
    const weight = parseFloat(calcForm.weight) || 0;
    const newPrice = parseFloat(val) || 0;
    const total = weight * newPrice;

    setCalcForm((prev) => {
      let newCredit = prev.creditAmount;
      let newPaid = prev.amountPaid;
      const paidNum = parseFloat(prev.amountPaid);
      const creditNum = parseFloat(prev.creditAmount);

      if (total > 0) {
        if (!isNaN(paidNum) && prev.amountPaid !== "") {
          const rem = Math.max(0, total - paidNum);
          newCredit = rem > 0 ? rem.toFixed(2).replace(/\.00$/, "") : "0";
        } else if (!isNaN(creditNum) && prev.creditAmount !== "") {
          const rem = Math.max(0, total - creditNum);
          newPaid = rem > 0 ? rem.toFixed(2).replace(/\.00$/, "") : "0";
        }
      }
      return { ...prev, pricePerKg: val, creditAmount: newCredit, amountPaid: newPaid };
    });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    let finalDescription = form.description;
    let rawAmount = parseFloat(form.amount);

    if (!form.isPayment) {
      const weight = parseFloat(calcForm.weight);
      const price = parseFloat(calcForm.pricePerKg);
      const creditAmt = parseFloat(calcForm.creditAmount);
      const paidAmt = parseFloat(calcForm.amountPaid);

      const hasCalc = !isNaN(weight) && !isNaN(price) && weight > 0 && price > 0;
      const hasDirectCredit = !isNaN(creditAmt) && creditAmt > 0;

      if (!calcForm.fishType.trim()) {
        setFormError("Fish Type or description is required.");
        return;
      }

      if (!hasCalc && !hasDirectCredit) {
        setFormError("Please enter valid Weight & Price, or enter a Credit Amount.");
        return;
      }

      if (hasCalc) {
        rawAmount = weight * price;
        finalDescription = `${calcForm.fishType} — ${weight}kg @ ${price.toLocaleString("en-LK")} LKR/kg`;

        if (!isNaN(paidAmt) && paidAmt > rawAmount) {
          setFormError("Amount paid cannot exceed the calculated total.");
          return;
        }
        if (!isNaN(creditAmt) && creditAmt > rawAmount) {
          setFormError("Credit amount cannot exceed the calculated total.");
          return;
        }
      } else {
        rawAmount = creditAmt;
        finalDescription = calcForm.fishType;
      }
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
      date: transactionDate,
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
          let addedTxs = [result.data];
          let balanceChange = finalAmount;
          
          if (!form.isPayment) {
            let effectivePaid = 0;
            if (calcForm.amountPaid) {
              const p = parseFloat(calcForm.amountPaid);
              if (!isNaN(p) && p > 0) effectivePaid = p;
            } else if (calcForm.creditAmount && rawAmount > 0) {
              const c = parseFloat(calcForm.creditAmount);
              if (!isNaN(c) && c >= 0 && rawAmount > c) {
                effectivePaid = rawAmount - c;
              }
            }

            if (effectivePaid > 0) {
              const paymentResult = await addTransaction({
                contactId: contact.id,
                description: `Payment for ${calcForm.fishType}${calcForm.weight ? ` (${calcForm.weight}kg)` : ""}`,
                amount: -effectivePaid,
                date: transactionDate,
              });
              if (paymentResult.success) {
                addedTxs.unshift(paymentResult.data);
                balanceChange -= effectivePaid;
              }
            }
          }

          setContact((prev) => ({
            ...prev,
            totalBalance: prev.totalBalance + balanceChange,
            transactions: [...addedTxs, ...prev.transactions],
          }));
          setForm({ description: "", amount: "", isPayment: false });
          setCalcForm({ fishType: "", weight: "", pricePerKg: "", amountPaid: "", creditAmount: "" });
        }
      } catch {
        setFormError("Failed to add transaction.");
      }
    });
  };

  const openDeleteDialog = (tx: ContactTransactionEntry) => {
    setTxToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (!txToDelete) return;
    const txId = txToDelete.id;
    const amount = txToDelete.amount;

    startTransition(async () => {
      try {
        const res = await deleteTransaction(txId);
        if (res.success) {
          setContact((prev) => ({
            ...prev,
            totalBalance:
              res.newBalance !== undefined
                ? res.newBalance
                : prev.totalBalance - amount,
            transactions: prev.transactions.filter((t) => t.id !== txId),
          }));
          setDeleteDialogOpen(false);
          setTxToDelete(null);
        }
      } catch (err: any) {
        setFormError(err.message || "Failed to delete transaction.");
        setDeleteDialogOpen(false);
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
        prefetch={false}
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
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

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

              {!form.isPayment ? (
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
                        onChange={(e) => handleWeightChange(e.target.value)}
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
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Amount Paid Now (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcForm.amountPaid}
                        onChange={(e) => handleAmountPaidChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Credit Amount (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcForm.creditAmount}
                        onChange={(e) => handleCreditAmountChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {/* Auto-calculated preview */}
                  {((parseFloat(calcForm.weight) || 0) > 0 && (parseFloat(calcForm.pricePerKg) || 0) > 0) && (
                    <div className="pt-2.5 border-t border-amber-200/60 mt-2 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Calculated Total:</span>
                        <span className="text-sm font-bold text-amber-600">
                          LKR {((parseFloat(calcForm.weight) || 0) * (parseFloat(calcForm.pricePerKg) || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {parseFloat(calcForm.amountPaid) > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Amount Paid Now:</span>
                          <span className="text-xs font-semibold text-emerald-600">
                            - LKR {(parseFloat(calcForm.amountPaid) || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-100">
                        <span className="text-slate-600 font-semibold">Net Credit Added:</span>
                        <span className="text-sm font-bold text-rose-600">
                          LKR {Math.max(
                            0,
                            ((parseFloat(calcForm.weight) || 0) * (parseFloat(calcForm.pricePerKg) || 0)) - (parseFloat(calcForm.amountPaid) || 0)
                          ).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {((parseFloat(calcForm.weight) || 0) <= 0 || (parseFloat(calcForm.pricePerKg) || 0) <= 0) && parseFloat(calcForm.creditAmount) > 0 && (
                    <div className="pt-2.5 border-t border-amber-200/60 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Net Credit Added:</span>
                        <span className="text-sm font-bold text-rose-600">
                          LKR {(parseFloat(calcForm.creditAmount) || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
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
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                        Actions
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
                          {userRole === "MANAGER" && (
                            <button
                              onClick={() => openDeleteDialog(tx)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete Transaction
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete this transaction? The contact's balance will be automatically recalculated. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {txToDelete && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(txToDelete.date).toLocaleDateString("en-LK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Description:</span>
                <span className="font-semibold text-slate-700 max-w-[200px] truncate text-right">
                  {txToDelete.description}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Amount:</span>
                <span
                  className={`font-bold ${
                    txToDelete.amount > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {txToDelete.amount > 0 ? "+" : ""}
                  {txToDelete.amount.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  LKR
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDeleteDialogOpen(false);
                setTxToDelete(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmDeleteTransaction}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Transaction
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
