"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fish,
  ClipboardList,
  Moon,
  RefreshCw,
  Wallet,
  LayoutDashboard,
  X,
} from "lucide-react";
import type { UserRole } from "@/types";

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["MANAGER", "SUPERVISOR"] as UserRole[],
  },
  {
    label: "Morning Intake",
    href: "/dashboard/morning-intake",
    icon: Fish,
    roles: ["MANAGER", "SUPERVISOR"] as UserRole[],
  },
  {
    label: "Daily Operations",
    href: "/dashboard/daily-ops",
    icon: ClipboardList,
    roles: ["MANAGER", "SUPERVISOR"] as UserRole[],
  },
  {
    label: "Evening Closing",
    href: "/dashboard/evening-closing",
    icon: Moon,
    roles: ["MANAGER"] as UserRole[],
  },
  {
    label: "Hub Sync",
    href: "/dashboard/hub-sync",
    icon: RefreshCw,
    roles: ["MANAGER"] as UserRole[],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: Wallet,
    roles: ["MANAGER"] as UserRole[],
  },
];

export default function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px]
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          border-r border-white/5
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
            onClick={onClose}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">
                FishStore
              </span>
              <span className="block text-[10px] text-cyan-400/60 font-medium -mt-0.5">
                Gampaha
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Navigation
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-sky-500/10 text-cyan-300 shadow-sm shadow-cyan-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon
                  className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-cyan-400" : ""
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom role badge */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
            <div
              className={`w-2 h-2 rounded-full ${
                userRole === "MANAGER"
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "bg-amber-400 shadow-sm shadow-amber-400/50"
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              {userRole === "MANAGER" ? "Manager Access" : "Supervisor Access"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
