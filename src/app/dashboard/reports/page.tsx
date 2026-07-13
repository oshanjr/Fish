import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import ReportsClient from "./reports-client";
import { getMonthlyFinancials, getMonthlyAttendanceAndPayroll } from "@/lib/actions/reports";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await auth();
  const role = (session?.user?.role ?? "SUPERVISOR") as UserRole;

  if (role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const today = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1;

  const [financials, attendance] = await Promise.all([
    getMonthlyFinancials(year, month),
    getMonthlyAttendanceAndPayroll(year, month),
  ]);

  return (
    <ReportsClient 
      selectedYear={year}
      selectedMonth={month}
      financials={financials}
      attendance={attendance}
    />
  );
}
