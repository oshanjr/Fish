import { auth } from "@/auth";
import {
  Fish,
  ClipboardList,
  Moon,
  RefreshCw,
  Users,
  UserCog,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

import { prisma } from "@/lib/prisma";
import EmployeeDashboardClient from "./employee-dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "SUPERVISOR") as UserRole;

  if (role === "EMPLOYEE") {
    const employeeId = session?.user?.id;
    
    // Fetch employee data
    const [payroll, attendance] = await Promise.all([
      prisma.staffPayroll.findUnique({ where: { employeeId } }),
      prisma.staffAttendance.findMany({
        where: { employeeId, status: "PRESENT" },
      }),
    ]);

    return (
      <EmployeeDashboardClient
        name={session?.user?.name || "Employee"}
        advanceTaken={Number(payroll?.advanceTaken || 0)}
        balanceOwed={Number(payroll?.balanceOwed || 0)}
        attendanceCount={attendance.length}
      />
    );
  }

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
            Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
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

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
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
  );
}
