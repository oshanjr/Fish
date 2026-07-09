export const dynamic = "force-dynamic";

import { getAllEmployees } from "@/lib/actions/employees";
import { getTodaysAttendance, getStaffList } from "@/lib/actions/attendance";
import { getAllPayroll } from "@/lib/actions/payroll";
import EmployeesClient from "./employees-client";

export default async function EmployeesPage() {
  const [employees, attendance, staffList, payroll] = await Promise.all([
    getAllEmployees(),
    getTodaysAttendance(),
    getStaffList(),
    getAllPayroll(),
  ]);

  return (
    <EmployeesClient
      initialEmployees={employees}
      initialAttendance={attendance}
      staffList={staffList}
      initialPayroll={payroll}
    />
  );
}
