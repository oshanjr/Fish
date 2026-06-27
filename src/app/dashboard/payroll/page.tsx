import { getAllPayroll } from "@/lib/actions/payroll";
import PayrollClient from "./payroll-client";
import { PayrollEntry } from "@/types";

export default async function PayrollPage() {
  const payroll = await getAllPayroll();

  return <PayrollClient initialPayroll={payroll as PayrollEntry[]} />;
}
