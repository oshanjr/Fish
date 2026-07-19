import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllEmployees } from "@/lib/actions/employees";
import { getEpfEtfRecordsByMonth } from "@/lib/actions/epf-etf";
import EpfEtfClient from "./epf-etf-client";

export default async function EpfEtfPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const userRole = session?.user?.role;

  // Only manager/supervisor
  if (userRole !== "MANAGER" && userRole !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  // Await search params
  const searchParams = props.searchParams ? await props.searchParams : {};
  const monthParam = typeof searchParams.month === "string" ? searchParams.month : "";
  
  // Default to current month (YYYY-MM)
  const currentMonth = monthParam || new Date().toISOString().slice(0, 7);

  const [employees, records] = await Promise.all([
    getAllEmployees(true), // active only
    getEpfEtfRecordsByMonth(currentMonth),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <EpfEtfClient 
        employees={employees} 
        records={records} 
        currentMonth={currentMonth}
        userRole={userRole}
      />
    </div>
  );
}
