"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Fish,
  ClipboardList,
  Moon,
  RefreshCw,
  Users,
  UserCog,
  TrendingUp,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Activity
} from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

interface ManagerDashboardClientProps {
  name: string;
  role: UserRole;
  todaySummary: {
    totalPosSales: number;
    totalBuyingCost: number;
    calculatedExpenses: number;
    netProfit: number;
  } | null;
  weekSummaries: any[];
  recentTransactions: any[];
}

export default function ManagerDashboardClient({
  name,
  role,
  todaySummary,
  weekSummaries,
  recentTransactions
}: ManagerDashboardClientProps) {

  const quickActions = [
    {
      title: "Morning Intake",
      description: "Log today's fish supply delivery",
      href: "/dashboard/morning-intake",
      icon: Fish,
      gradient: "from-cyan-500 to-teal-500",
      shadow: "shadow-cyan-500/20",
      roles: ["MANAGER", "SUPERVISOR"],
    },
    {
      title: "Daily Operations",
      description: "Log daily cash expenses",
      href: "/dashboard/daily-ops",
      icon: ClipboardList,
      gradient: "from-violet-500 to-purple-500",
      shadow: "shadow-violet-500/20",
      roles: ["MANAGER", "SUPERVISOR"],
    },
    {
      title: "Evening Closing",
      description: "Record wastage & reconcile POS",
      href: "/dashboard/evening-closing",
      icon: Moon,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
      roles: ["MANAGER"],
    },
    {
      title: "Sellers & Buyers",
      description: "Manage suppliers & buyer credit ledgers",
      href: "/dashboard/contacts",
      icon: Users,
      gradient: "from-sky-500 to-blue-500",
      shadow: "shadow-sky-500/20",
      roles: ["MANAGER"],
    },
    {
      title: "Employees",
      description: "Staff, attendance & payroll",
      href: "/dashboard/employees",
      icon: UserCog,
      gradient: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/20",
      roles: ["MANAGER", "SUPERVISOR"],
    },
    {
      title: "Hub Sync",
      description: "Sync daily summary to central hub",
      href: "/dashboard/hub-sync",
      icon: RefreshCw,
      gradient: "from-emerald-500 to-green-500",
      shadow: "shadow-emerald-500/20",
      roles: ["MANAGER"],
    },
  ].filter((a) => a.roles.includes(role));

  const chartData = weekSummaries.map(s => {
    const d = new Date(s.date);
    return {
      name: d.toLocaleDateString("en-LK", { weekday: 'short' }),
      Sales: Number(s.totalPosSales),
      Costs: Number(s.totalBuyingCost) + Number(s.calculatedExpenses),
      Profit: Number(s.netProfit)
    };
  }).reverse(); // API returns desc, we want asc for chart

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400/80 text-sm font-medium">
              Fish Store Manager
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Welcome back, {name}! 👋
          </h1>
          <p className="text-slate-300/70 text-sm">
            {new Date().toLocaleDateString("en-LK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" — "}
            {role === "MANAGER"
              ? "Full access to all store operations"
              : "Data entry access for daily operations"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {role === "MANAGER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's POS Sales</p>
              <h3 className="text-xl font-bold text-slate-800">
                {(todaySummary?.totalPosSales || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Costs & Expenses</p>
              <h3 className="text-xl font-bold text-slate-800">
                {((todaySummary?.totalBuyingCost || 0) + (todaySummary?.calculatedExpenses || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Activity className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Net Profit</p>
              <h3 className={`text-xl font-bold ${(todaySummary?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(todaySummary?.netProfit || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })} LKR
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions and Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          {role === "MANAGER" && chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-6">Weekly Performance</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                    <RechartsTooltip 
                      cursor={{fill: '#F1F5F9'}} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="Sales" fill="#0EA5E9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Costs" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Profit" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md ${action.shadow}`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Transactions */}
        {role === "MANAGER" && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm h-fit">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
              Recent Transactions
              <Link href="/dashboard/contacts" className="text-xs font-medium text-cyan-600 hover:text-cyan-700">View All</Link>
            </h2>
            
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent transactions</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tx.contact.name}</p>
                      <p className="text-xs text-slate-500">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.contact.type === 'BUYER' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.contact.type === 'BUYER' ? '+' : '-'}{Number(tx.amount).toLocaleString("en-LK")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleDateString("en-LK", { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
