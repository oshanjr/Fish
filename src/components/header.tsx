"use client";

import { signOut } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";
import type { SessionUser } from "@/types";

interface HeaderProps {
  user: SessionUser;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Menu button + Page context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString("en-LK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Right: User info + Sign out */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {user.role === "MANAGER" ? "Manager" : "Supervisor"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
