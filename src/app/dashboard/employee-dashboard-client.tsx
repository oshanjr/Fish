"use client";

import { Wallet, CalendarCheck, TrendingUp, DollarSign } from "lucide-react";

interface EmployeeDashboardClientProps {
  name: string;
  advanceTaken: number;
  balanceOwed: number;
  attendanceCount: number;
}

export default function EmployeeDashboardClient({
  name,
  advanceTaken,
  balanceOwed,
  attendanceCount,
}: EmployeeDashboardClientProps) {
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Days Present
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                {attendanceCount}
              </span>
              <span className="text-sm text-slate-500 font-medium">days</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Total attendance records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
