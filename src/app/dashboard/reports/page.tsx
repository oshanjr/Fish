import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import ReportsClient from "./reports-client";
import { 
  getMonthlyFinancials, 
  getMonthlyAttendanceAndPayroll,
  getPastMonthsSummary
} from "@/lib/actions/reports";

export default async function ReportsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const role = (session?.user?.role ?? "SUPERVISOR") as UserRole;

  if (role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const searchParams = props.searchParams ? await props.searchParams : {};
  const today = new Date();

  const rawYear = typeof searchParams.year === "string" ? parseInt(searchParams.year, 10) : NaN;
  const rawMonth = typeof searchParams.month === "string" ? parseInt(searchParams.month, 10) : NaN;

  const year = !isNaN(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : today.getFullYear();
  const month = !isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : today.getMonth() + 1;

  const [financials, attendance, pastMonths] = await Promise.all([
    getMonthlyFinancials(year, month),
    getMonthlyAttendanceAndPayroll(year, month),
    getPastMonthsSummary(),
  ]);

  return (
    <ReportsClient 
      selectedYear={year}
      selectedMonth={month}
      financials={financials}
      attendance={attendance}
      pastMonths={pastMonths}
    />
  );
}
