"use client";

import { useState, useMemo } from "react";
import {
  Truck,
  Store,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Wallet,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
} from "lucide-react";
import type { ContactType } from "@/types";

interface ContactDashboardClientProps {
  contact: {
    id: string;
    name: string;
    phone: string | null;
    type: ContactType;
    totalBalance: number;
    transactions: {
      id: string;
      date: string;
      description: string;
      amount: number;
    }[];
  };
}

export default function ContactDashboardClient({
  contact,
}: ContactDashboardClientProps) {
  const isSupplier = contact.type === "SUPPLIER";
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"month" | "date">("month");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const isFiltered = filterMode === "month" ? Boolean(filterMonth) : Boolean(filterDate);

  // Compute running balance chronologically (oldest to newest, then reverse for display)
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...contact.transactions].reverse();
    let running = 0;
    const result = sorted.map((t) => {
      running += t.amount;
      return { ...t, runningBalance: running };
    });
    return result.reverse();
  }, [contact.transactions]);

  // Overall statistics
  const totalCredit = useMemo(() => {
    return contact.transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [contact.transactions]);

  const totalPaid = useMemo(() => {
    return contact.transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [contact.transactions]);

  // Filtered by search and month/date
  const displayedTransactions = useMemo(() => {
    return transactionsWithBalance.filter((tx) => {
      const matchesSearch = tx.description
        .toLowerCase()
        .includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filterMode === "date" && filterDate) {
        const d = new Date(tx.date);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dStr === filterDate;
      }

      if (filterMode === "month" && filterMonth) {
        const d = new Date(tx.date);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return mStr === filterMonth;
      }

      return true;
    });
  }, [transactionsWithBalance, search, filterMode, filterMonth, filterDate]);

  // Filtered period statistics
  const filterStats = useMemo(() => {
    if (!isFiltered) return null;
    const credits = displayedTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = displayedTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = credits - payments;
    return { credits, payments, net, count: displayedTransactions.length };
  }, [displayedTransactions, isFiltered]);

  const handlePrev = () => {
    if (filterMode === "month") {
      if (!filterMonth) {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        return;
      }
      const [y, m] = filterMonth.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else {
      const base = filterDate ? new Date(filterDate) : new Date();
      base.setDate(base.getDate() - 1);
      setFilterDate(
        `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`
      );
    }
  };

  const handleNext = () => {
    if (filterMode === "month") {
      if (!filterMonth) {
        const d = new Date();
        setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        return;
      }
      const [y, m] = filterMonth.split("-").map(Number);
      const d = new Date(y, m, 1);
      setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else {
      const base = filterDate ? new Date(filterDate) : new Date();
      base.setDate(base.getDate() + 1);
      setFilterDate(
        `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`
      );
    }
  };

  const handleClear = () => {
    setFilterMonth("");
    setFilterDate("");
  };

  // Statement PDF Download
  const handleDownloadPdfStatement = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download statement as PDF.");
      return;
    }

    const fmt = (n: number) =>
      Number(n || 0).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const periodLabel = filterMode === "date" && filterDate
      ? new Date(filterDate).toLocaleDateString("en-LK", { dateStyle: "long" })
      : filterMode === "month" && filterMonth
      ? new Date(`${filterMonth}-02`).toLocaleDateString("en-LK", { month: "long", year: "numeric" })
      : "Complete All-Time Statement";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${contact.name} - Statement - Arthur & Sons Seafood Center</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; }
    .brand-title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 2px 0; }
    .brand-subtitle { font-size: 11px; color: #64748b; margin: 0; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .info-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
    .info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    .info-val { font-size: 13px; font-weight: 800; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f1f5f9; color: #334155; font-size: 9.5px; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10.5px; }
    .text-right { text-align: right; }
    .text-green { color: #059669; }
    .text-red { color: #dc2626; }
    .total-row { background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; }
    .print-banner { background: #0284c7; color: #fff; padding: 10px; margin-bottom: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
    .print-btn { background: #fff; color: #0284c7; border: none; padding: 5px 12px; border-radius: 4px; font-weight: 700; cursor: pointer; }
    @media print { .print-banner { display: none !important; } }
  </style>
</head>
<body>
  <div class="print-banner">
    <span>Ready to download as PDF. Destination: "Save as PDF".</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1 class="brand-title">Arthur &amp; Sons Seafood Center</h1>
      <p class="brand-subtitle">${isSupplier ? "Supplier" : "Buyer"} Account Statement &bull; ${contact.name}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; font-size: 12px;">${periodLabel}</div>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Generated: ${new Date().toLocaleString("en-LK")}</p>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">${isSupplier ? "Total Goods Supplied" : "Total Purchases"}</div>
      <div class="info-val">LKR ${fmt(totalCredit)}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Total Settlements</div>
      <div class="info-val">LKR ${fmt(totalPaid)}</div>
    </div>
    <div class="info-card">
      <div class="info-label">${isSupplier ? "Store Owes You" : "Outstanding Balance"}</div>
      <div class="info-val" style="color: ${contact.totalBalance > 0 ? (isSupplier ? '#059669' : '#dc2626') : '#0f172a'};">
        LKR ${fmt(contact.totalBalance)}
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Date</th>
        <th style="width: 46%;">Description</th>
        <th class="text-right" style="width: 18%;">Amount (LKR)</th>
        <th class="text-right" style="width: 18%;">Balance (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${displayedTransactions.map((tx) => `<tr>
        <td>${new Date(tx.date).toLocaleDateString("en-LK", { dateStyle: "medium" })}</td>
        <td style="font-weight: 500;">${tx.description}</td>
        <td class="text-right" style="font-weight: 600; color: ${tx.amount > 0 ? '#dc2626' : '#059669'};">
          ${tx.amount > 0 ? '+' : ''}${fmt(tx.amount)}
        </td>
        <td class="text-right" style="font-weight: 700;">${fmt(tx.runningBalance)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 350); };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-gradient-to-r ${
          isSupplier
            ? "from-slate-900 via-teal-950 to-slate-900"
            : "from-slate-900 via-amber-950 to-slate-900"
        }`}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
              isSupplier ? "bg-teal-400" : "bg-amber-400"
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl ${
              isSupplier ? "bg-cyan-400" : "bg-orange-400"
            }`}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isSupplier ? (
                <Truck className="w-4 h-4 text-teal-400" />
              ) : (
                <Store className="w-4 h-4 text-amber-400" />
              )}
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isSupplier ? "text-teal-400" : "text-amber-400"
                }`}
              >
                {isSupplier ? "Supplier Portal" : "Buyer Portal"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              Welcome, {contact.name}! 👋
            </h1>
            <p className="text-slate-300 text-xs flex items-center gap-2">
              {contact.phone && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {contact.phone}
                </span>
              )}
              <span>•</span>
              <span>
                {new Date().toLocaleDateString("en-LK", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSupplier ? "bg-teal-500/20 text-teal-300" : "bg-amber-500/20 text-amber-300"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-medium">
                {isSupplier ? "Balance Store Owes You" : "Your Outstanding Balance"}
              </p>
              <p
                className={`text-lg font-bold ${
                  contact.totalBalance > 0
                    ? isSupplier
                      ? "text-teal-300"
                      : "text-rose-400"
                    : "text-slate-200"
                }`}
              >
                {contact.totalBalance.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                })}{" "}
                <span className="text-xs font-normal">LKR</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Credit / Supply */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {isSupplier ? "Total Goods Supplied" : "Total Purchases (Credit)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {totalCredit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cumulative credit invoices</p>
        </div>

        {/* Total Payments */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {isSupplier ? "Total Payments Received" : "Total Payments Made"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {totalPaid.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total settlements</p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Total Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {contact.transactions.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">All-time record count</p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Transaction History
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {filterMonth
                ? `${displayedTransactions.length} of ${transactionsWithBalance.length}`
                : transactionsWithBalance.length}
            </span>
          </div>

          {/* Controls: Search + Date/Month Filter + PDF Download */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Statement PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdfStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download statement as PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Statement PDF</span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400 w-36 sm:w-44 transition-all"
              />
            </div>

            {/* Mode Toggle (Month vs Date) */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("month")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === "month"
                    ? "bg-white text-slate-800 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("date")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === "date"
                    ? "bg-white text-slate-800 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Date
              </button>
            </div>

            {/* Stepper & Picker */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title={filterMode === "month" ? "Previous Month" : "Previous Day"}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {filterMode === "month" ? (
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-medium text-slate-700 cursor-pointer"
                  />
                ) : (
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-medium text-slate-700 cursor-pointer"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title={filterMode === "month" ? "Next Month" : "Next Day"}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClear}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                  !isFiltered
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All
              </button>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary Banner */}
        {isFiltered && filterStats && (
          <div className="bg-slate-50/70 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Summary for{" "}
              <strong className="text-slate-700">
                {filterMode === "date"
                  ? new Date(filterDate).toLocaleDateString("en-LK", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : new Date(`${filterMonth}-02`).toLocaleDateString("en-LK", {
                      month: "long",
                      year: "numeric",
                    })}
              </strong>
              :
            </span>
            <div className="flex items-center gap-3">
              <span className="text-rose-600 font-semibold">
                Credits: +{filterStats.credits.toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 font-semibold">
                Payments: -{filterStats.payments.toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={
                  filterStats.net >= 0
                    ? "text-slate-700 font-semibold"
                    : "text-emerald-700 font-semibold"
                }
              >
                Net: {filterStats.net >= 0 ? "+" : ""}
                {filterStats.net.toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </span>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {transactionsWithBalance.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No transactions recorded yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Transactions recorded by store staff will appear here.
            </p>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">
              {search
                ? `No transactions match "${search}"`
                : `No transactions found for ${new Date(`${filterMonth}-02`).toLocaleDateString("en-LK", {
                    month: "long",
                    year: "numeric",
                  })}`}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterMonth("");
                setSearch("");
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters and view all ({transactionsWithBalance.length})
            </button>
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
                    Amount (LKR)
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Balance (LKR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(tx.date);
                          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          setFilterMode("date");
                          setFilterDate(dStr);
                        }}
                        className="hover:underline hover:text-sky-600 transition-colors cursor-pointer text-left font-medium"
                        title="Filter transactions by this exact date"
                      >
                        {new Date(tx.date).toLocaleDateString("en-LK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-800 font-medium">
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
                    <td className="px-5 py-3 text-right text-slate-700 font-medium whitespace-nowrap">
                      {tx.runningBalance.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

