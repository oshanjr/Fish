import { getTodaysAttendance, getStaffList } from "@/lib/actions/attendance";
import { getTodaysExpenses } from "@/lib/actions/expenses";
import DailyOpsClient from "./daily-ops-client";

export default async function DailyOpsPage() {
  const [attendance, staffList, expenses] = await Promise.all([
    getTodaysAttendance(),
    getStaffList(),
    getTodaysExpenses(),
  ]);

  return (
    <DailyOpsClient
      initialAttendance={attendance}
      staffList={staffList}
      initialExpenses={expenses}
    />
  );
}
