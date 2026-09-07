"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowRight,
  RotateCcw,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

interface PastMonthSummary {
  year: number;
  month: number;
  monthKey: string;
  totalPosSales: number;
  totalBuyingCost: number;
  totalExpenses: number;
  totalNetProfit: number;
  daysCount: number;
}

interface ReportsClientProps {
  selectedYear: number;
  selectedMonth: number;
  financials: {
    totals: {
      totalPosSales: number;
      totalBuyingCost: number;
      totalExpenses: number;
      totalNetProfit: number;
    };
    summaries: any[];
    detailedExpenses: any[];
  };
  attendance: any[];
  pastMonths?: PastMonthSummary[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function ReportsClient({
  selectedYear,
  selectedMonth,
  financials,
  attendance,
  pastMonths = [],
}: ReportsClientProps) {
  const router = useRouter();
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync pickerYear when selectedYear changes
  useEffect(() => {
    setPickerYear(selectedYear);
  }, [selectedYear]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  // Previous month calculation
  const prevMonthIdx = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYearVal = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevLabel = `${SHORT_MONTHS[prevMonthIdx - 1]} ${prevYearVal}`;

  // Next month calculation
  const nextMonthIdx = selectedMonth === 12 ? 1 : selectedMonth + 1;
  const nextYearVal = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
  const nextLabel = `${SHORT_MONTHS[nextMonthIdx - 1]} ${nextYearVal}`;

  const handlePrevMonth = () => {
    router.push(`/dashboard/reports?year=${prevYearVal}&month=${prevMonthIdx}`);
  };

  const handleNextMonth = () => {
    router.push(`/dashboard/reports?year=${nextYearVal}&month=${nextMonthIdx}`);
  };

  const handleJumpToCurrent = () => {
    router.push(`/dashboard/reports?year=${currentYear}&month=${currentMonth}`);
  };

  const handleSelectMonth = (monthIdx: number, yearVal: number = pickerYear) => {
    setIsMonthOpen(false);
    router.push(`/dashboard/reports?year=${yearVal}&month=${monthIdx}`);
  };

  const handleNativeMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split("-").map(Number);
    if (y && m) {
      setIsMonthOpen(false);
      router.push(`/dashboard/reports?year=${y}&month=${m}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-fuchsia-500" />
            <h1 className="text-xl font-bold text-slate-800">Monthly Reports</h1>
          </div>
          <p className="text-sm text-slate-500">
            View aggregated financial and staff data for {MONTHS[selectedMonth - 1]} {selectedYear}.
          </p>
          {!isCurrentMonth && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 mt-1.5 shadow-xs">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Viewing Historical Report: <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong></span>
              <button
                onClick={handleJumpToCurrent}
                className="underline hover:text-amber-900 ml-1 font-semibold flex items-center gap-1 cursor-pointer"
                title="Return to current month"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Jump to Current Month
              </button>
            </div>
          )}
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Jump to Current Button (if in past) */}
          {!isCurrentMonth && (
            <button
              onClick={handleJumpToCurrent}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Return to this month's report"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Current Month
            </button>
          )}

          {/* Stepper: Previous Month Button */}
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title={`Go to previous month: ${prevLabel}`}
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{prevLabel}</span>
          </button>

          {/* Stepper: Main Month/Year Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white border rounded-lg text-sm font-semibold shadow-xs hover:bg-slate-50 transition-all cursor-pointer min-w-[170px] ${
                isMonthOpen ? "border-fuchsia-500 ring-2 ring-fuchsia-100" : "border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fuchsia-500" />
                <span>{MONTHS[selectedMonth - 1]} {selectedYear}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMonthOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Popover */}
            {isMonthOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Year Header Navigator */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Previous year"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                    <span>{pickerYear}</span>
                    {pickerYear === currentYear && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Current</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Next year"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12-Month Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MONTHS.map((monthName, idx) => {
                    const mNum = idx + 1;
                    const isSelected = selectedYear === pickerYear && selectedMonth === mNum;
                    const isThisCurrent = currentYear === pickerYear && currentMonth === mNum;

                    return (
                      <button
                        key={monthName}
                        type="button"
                        onClick={() => handleSelectMonth(mNum, pickerYear)}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200 font-bold"
                            : isThisCurrent
                            ? "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {SHORT_MONTHS[idx]}
                      </button>
                    );
                  })}
                </div>

                {/* Native Month Picker Shortcut */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Specific Date:</span>
                  <div className="relative">
                    <input
                      type="month"
                      value={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`}
                      onChange={handleNativeMonthInput}
                      className="text-xs px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper: Next Month Button */}
          <button
            onClick={handleNextMonth}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title={`Go to next month: ${nextLabel}`}
          >
            <span className="hidden sm:inline">{nextLabel}</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Financials Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Financial Overview</span>
            <span className="text-xs font-medium text-slate-400 font-normal">
              ({MONTHS[selectedMonth - 1]} {selectedYear})
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total POS Sales</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg shrink-0">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Buying Cost</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg shrink-0">
              <Activity className="w-6 h-6 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-fuchsia-100 rounded-lg shrink-0">
              <PieChart className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Profit</p>
              <h3 className={`text-xl font-bold truncate ${financials.totals.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                LKR {financials.totals.totalNetProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance, Payroll & Expenses Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance and Payroll Report */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Monthly Payroll & Attendance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Calculated as (Base Salary / Days in Month) * Days Present - Advances</p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium text-center">Days Present</th>
                  <th className="px-4 py-2.5 font-medium text-right">Earned (LKR)</th>
                  <th className="px-4 py-2.5 font-medium text-right">Advances (LKR)</th>
                  <th className="px-4 py-2.5 font-medium text-right text-emerald-600">Final Pay (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No employee data found for {MONTHS[selectedMonth - 1]} {selectedYear}.</td>
                  </tr>
                ) : (
                  attendance.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {emp.name}
                        {!emp.isActive && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">Past Staff</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">
                        {emp.presentDays} <span className="text-xs text-slate-400 font-normal">/ {emp.daysInMonth}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{emp.earnedPay.toLocaleString("en-LK")}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{emp.advancesTaken > 0 ? `-${emp.advancesTaken.toLocaleString("en-LK")}` : "0"}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{emp.finalPayout.toLocaleString("en-LK")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Expenses Report */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Detailed Expense Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">All expenses recorded during {MONTHS[selectedMonth - 1]} {selectedYear}.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
              <p className="text-sm font-bold text-rose-600">{financials.totals.totalExpenses.toLocaleString("en-LK")} LKR</p>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Category / Note</th>
                  <th className="px-4 py-2.5 font-medium">Logged By</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials.detailedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No expenses recorded for {MONTHS[selectedMonth - 1]} {selectedYear}.</td>
                  </tr>
                ) : (
                  financials.detailedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(exp.date).toLocaleDateString("en-LK", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{exp.category}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{exp.userName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">{exp.amount.toLocaleString("en-LK")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Months Archive Section */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-fuchsia-500" />
              Past Monthly Reports Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of recorded monthly financials. Click "View Report" to inspect any past month's full breakdown.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
            {pastMonths.length} {pastMonths.length === 1 ? "Month" : "Months"} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Month & Year</th>
                <th className="px-4 py-3 font-semibold text-right">POS Sales</th>
                <th className="px-4 py-3 font-semibold text-right">Buying Cost</th>
                <th className="px-4 py-3 font-semibold text-right">Expenses</th>
                <th className="px-4 py-3 font-semibold text-right">Net Profit</th>
                <th className="px-4 py-3 font-semibold text-center">Days Active</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastMonths.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No historical monthly records found.
                  </td>
                </tr>
              ) : (
                pastMonths.map((pm) => {
                  const isViewing = pm.year === selectedYear && pm.month === selectedMonth;
                  const monthName = MONTHS[pm.month - 1];

                  return (
                    <tr
                      key={pm.monthKey}
                      className={`transition-colors ${
                        isViewing ? "bg-fuchsia-50/60 font-medium" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{monthName} {pm.year}</span>
                          {pm.year === currentYear && pm.month === currentMonth && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              Current Month
                            </span>
                          )}
                          {isViewing && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-fuchsia-600" />
                              Active View
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">
                        LKR {pm.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        LKR {pm.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        LKR {pm.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${pm.totalNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        LKR {pm.totalNetProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs">
                        {pm.daysCount > 0 ? `${pm.daysCount} days` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isViewing ? (
                          <span className="text-xs font-bold text-fuchsia-600">
                            Viewing
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectMonth(pm.month, pm.year)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-300 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

