export const dynamic = "force-dynamic";

import { getAllEmployees } from "@/lib/actions/employees";
import { getTodaysAttendance, getStaffList } from "@/lib/actions/attendance";
import { getAllPayroll } from "@/lib/actions/payroll";
import EmployeesClient from "./employees-client";

export default async function EmployeesPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateStr = typeof searchParams.date === "string" ? searchParams.date : undefined;

  const [employees, attendance, staffList, payroll] = await Promise.all([
    getAllEmployees(),
    getTodaysAttendance(dateStr),
    getStaffList(),
    getAllPayroll(),
  ]);

  return (
    <EmployeesClient
      initialEmployees={employees}
      initialAttendance={attendance}
      staffList={staffList}
      initialPayroll={payroll}
      initialDateStr={dateStr}
    />
  );
}
