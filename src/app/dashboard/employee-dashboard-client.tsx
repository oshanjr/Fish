"use client";

import { Wallet, CalendarCheck, TrendingUp, DollarSign, Receipt, Plus } from "lucide-react";

interface EmployeeDashboardClientProps {
  name: string;
  earnedSalary: number;
  advanceTaken: number;
  bonusEarned: number;
  balanceOwed: number;
  attendance: { 
    date: string; 
    status: "PRESENT" | "ABSENT" | "HALF_DAY";
    inTime?: string | null;
    outTime?: string | null;
    hoursWorked?: number | null;
    earnedPay?: number | null;
  }[];
  transactions: { id: string; date: string; amount: number; type: string; description: string }[];
}

export default function EmployeeDashboardClient({
  name,
  earnedSalary,
  advanceTaken,
  bonusEarned,
  balanceOwed,
  attendance,
  transactions,
}: EmployeeDashboardClientProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const totalDaysPresent = attendance.reduce((acc, a) => {
    if (a.status === "PRESENT") return acc + 1;
    if (a.status === "HALF_DAY") return acc + 0.5;
    return acc;
  }, 0);

  const getRecordForDay = (day: number) => {
    const targetDateStr = new Date(currentYear, currentMonth, day).toLocaleDateString();
    return attendance.find(a => new Date(a.date).toLocaleDateString() === targetDateStr) || null;
  };
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-400/80 text-sm font-medium">
              Staff Portal
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Welcome back, {name.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-300/70 text-sm">
            {new Date().toLocaleDateString("en-LK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-4 pt-4">
        Your Summary
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Earned Salary */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Earned Salary
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                LKR {earnedSalary.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Pay from hours worked
            </p>
          </div>
        </div>
        {/* Salary Balance */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Salary Balance
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                LKR {balanceOwed.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Current amount owed to you
            </p>
          </div>
        </div>

        {/* Advances Taken */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Advances Taken
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-600">
                LKR {advanceTaken.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Deducted from base salary
            </p>
          </div>
        </div>

        {/* Bonus Earned */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Bonus Earned
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600">
                LKR {bonusEarned.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Extra pay added to balance
            </p>
          </div>
        </div>

        {/* Attendance Calendar */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Days Present
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-800">
                      {totalDaysPresent}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">days</span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                {today.toLocaleString('default', { month: 'short' })}
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="mt-3">
              <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] font-semibold text-slate-400 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-sm" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const record = getRecordForDay(day);
                  const isToday = day === today.getDate();
                  
                  let tooltip = "Not Marked";
                  if (record) {
                    if (record.status === "PRESENT") {
                      if (record.hoursWorked === 12) tooltip = "Full Day (12h)";
                      else if (record.hoursWorked) tooltip = `Custom (${record.hoursWorked}h) [${record.inTime || '?'} - ${record.outTime || '?'}]`;
                      else tooltip = "Present";
                    } else if (record.status === "HALF_DAY") {
                      tooltip = "Half Day";
                    } else {
                      tooltip = "Absent";
                    }
                  }
                  
                  return (
                    <div
                      key={`day-${day}`}
                      title={tooltip}
                      className={`
                        aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium cursor-help
                        ${isToday ? 'ring-1 ring-blue-400 ring-offset-1' : ''}
                        ${record?.status === 'PRESENT' ? 'bg-emerald-500 text-white' : 
                          record?.status === 'HALF_DAY' ? 'bg-amber-400 text-amber-900' : 
                          record?.status === 'ABSENT' ? 'bg-rose-500 text-white' : 
                          'bg-slate-100 text-slate-400'}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500"></div> Full</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-400"></div> Half</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-rose-500"></div> Absent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            Advances & Extra Pay History
          </h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No recent transactions found.
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
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount (LKR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(tx.date).toLocaleDateString("en-LK", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {tx.description}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          tx.type === "BONUS"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.type === "BONUS" ? "Extra Pay" : "Advance"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold ${tx.type === "BONUS" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
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
