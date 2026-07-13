"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Calendar,
  ChevronDown
} from "lucide-react";

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
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ReportsClient({
  selectedYear,
  selectedMonth,
  financials,
  attendance
}: ReportsClientProps) {
  const router = useRouter();
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const handleMonthChange = (monthIdx: number) => {
    setIsMonthOpen(false);
    router.push(`/dashboard/reports?year=${selectedYear}&month=${monthIdx}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-fuchsia-500" />
            <h1 className="text-xl font-bold text-slate-800">Monthly Reports</h1>
          </div>
          <p className="text-sm text-slate-500">
            View aggregated financial and staff data for the selected month.
          </p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsMonthOpen(!isMonthOpen)}
            className="flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 min-w-[160px]"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          {isMonthOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
              {MONTHS.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => handleMonthChange(idx + 1)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${idx + 1 === selectedMonth ? 'bg-fuchsia-50 text-fuchsia-700 font-medium' : 'text-slate-700'}`}
                >
                  {month} {selectedYear}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financials Overview */}
      <h2 className="text-lg font-semibold text-slate-800 pt-2 border-t border-slate-200/60">Financial Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total POS Sales</p>
            <h3 className="text-xl font-bold text-slate-800">
              {financials.totals.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Buying Cost</p>
            <h3 className="text-xl font-bold text-slate-800">
              {financials.totals.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-lg">
            <Activity className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <h3 className="text-xl font-bold text-slate-800">
              {financials.totals.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-fuchsia-100 rounded-lg">
            <PieChart className="w-6 h-6 text-fuchsia-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Net Profit</p>
            <h3 className={`text-xl font-bold ${financials.totals.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {financials.totals.totalNetProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4">
        {/* Attendance and Payroll Report */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Monthly Payroll & Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-1">Calculated as (Base Salary / 30) * Days Present - Salary Advances</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium text-center">Days Present</th>
                  <th className="px-4 py-3 font-medium text-right">Earned (LKR)</th>
                  <th className="px-4 py-3 font-medium text-right">Advances (LKR)</th>
                  <th className="px-4 py-3 font-medium text-right text-emerald-600">Final Pay (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No employee data found.</td>
                  </tr>
                ) : (
                  attendance.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{emp.name}</td>
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
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Detailed Expense Log
              </h2>
              <p className="text-xs text-slate-500 mt-1">All expenses recorded during the month.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-sm font-bold text-rose-600">{financials.totals.totalExpenses.toLocaleString("en-LK")} LKR</p>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category / Note</th>
                  <th className="px-4 py-3 font-medium">Logged By</th>
                  <th className="px-4 py-3 font-medium text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials.detailedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No expenses recorded for this month.</td>
                  </tr>
                ) : (
                  financials.detailedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(exp.date).toLocaleDateString("en-LK", { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{exp.category}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{exp.userName}</td>
                      <td className="px-4 py-3 text-right font-medium text-rose-600">{exp.amount.toLocaleString("en-LK")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
