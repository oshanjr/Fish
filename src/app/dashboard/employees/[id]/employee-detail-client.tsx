"use client";

import { useState, useTransition } from "react";
import {
  UserCog,
  Wallet,
  DollarSign,
  ArrowLeft,
  Calendar,
  History,
  CreditCard,
  Phone,
  Gift,
  HandCoins
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePayrollAdvance, addPayrollBonus } from "@/lib/actions/payroll";
import { payrollUpdateSchema } from "@/lib/validations";

type EmployeeData = {
  id: string;
  name: string;
  phone: string | null;
  nic: string | null;
  baseSalary: number;
  isActive: boolean;
};

type PayrollData = {
  id: string;
  employeeId: string;
  earnedSalary: number;
  advanceTaken: number;
  bonusEarned: number;
  balanceOwed: number;
} | null;

type HistoryData = {
  id: string;
  date: string;
  category: string;
  amount: number;
  loggedBy: string;
  createdAt: string;
};

type AttendanceData = {
  id: string;
  date: string;
  status: string;
  inTime: string | null;
  outTime: string | null;
  hoursWorked: number | null;
  earnedPay: number | null;
};

export default function EmployeeDetailClient({
  employee,
  payroll: initialPayroll,
  paymentHistory: initialPaymentHistory,
  attendanceHistory,
}: {
  employee: EmployeeData;
  payroll: PayrollData;
  paymentHistory: HistoryData[];
  attendanceHistory: AttendanceData[];
}) {
  const router = useRouter();
  const [payroll, setPayroll] = useState(initialPayroll);
  const [paymentHistory, setPaymentHistory] = useState(initialPaymentHistory);
  
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusDescription, setBonusDescription] = useState("");
  const [message, setMessage] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleUpdateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!payroll) return;

    const amount = parseFloat(advanceAmount);
    const data = { id: payroll.id, advanceTaken: amount };
    const validation = payrollUpdateSchema.safeParse(data);

    if (!validation.success) {
      setMessage(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePayrollAdvance(data);

        if (result.success) {
          setPayroll((prev) => 
            prev ? {
              ...prev,
              advanceTaken: result.data.advanceTaken,
              balanceOwed: result.data.balanceOwed,
            } : null
          );
          
          // Optimistically add to history
          const newEntry: HistoryData = {
            id: `temp-${Date.now()}`,
            date: new Date().toISOString(),
            category: `Salary Advance - ${employee.name}`,
            amount: amount,
            loggedBy: "You",
            createdAt: new Date().toISOString(),
          };
          setPaymentHistory((prev) => [newEntry, ...prev]);
          
          setAdvanceAmount("");
          setMessage("Advance updated & logged in daily expenses.");
        }
      } catch {
        setMessage("Failed to update advance.");
      }
    });
  };

  const handleUpdateBonus = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!payroll) return;

    const amount = parseFloat(bonusAmount);
    const data = { employeeId: employee.id, amount, description: bonusDescription || "Bonus" };

    startTransition(async () => {
      try {
        const result = await addPayrollBonus(data);

        if (result.success) {
           const newBonus = payroll.bonusEarned + amount;
           const newBalance = employee.baseSalary + payroll.earnedSalary - payroll.advanceTaken;
           
           setPayroll((prev) => 
             prev ? {
               ...prev,
               bonusEarned: newBonus,
               balanceOwed: newBalance,
             } : null
           );

           // Optimistically add to history
          const newEntry: HistoryData = {
            id: `temp-${Date.now()}`,
            date: new Date().toISOString(),
            category: `Bonus: ${data.description} - ${employee.name}`,
            amount: amount,
            loggedBy: "You",
            createdAt: new Date().toISOString(),
          };
          setPaymentHistory((prev) => [newEntry, ...prev]);

          setBonusAmount("");
          setBonusDescription("");
          setMessage("Extra pay logged in daily expenses.");
        }
      } catch {
        setMessage("Failed to log extra pay.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/employees")}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-bold text-slate-800">
                {employee.name}
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Manage salary, issue advances, and view payment history
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            message.includes("success") || message.includes("logged")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                 <CreditCard className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-sm font-medium text-slate-600">Base Salary</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {employee.baseSalary.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </p>
         </div>
         <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 rounded-lg">
                 <HandCoins className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-sm font-medium text-slate-600">Total Advances</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {payroll?.advanceTaken.toLocaleString("en-LK", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
         </div>
         <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                 <Gift className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-slate-600">Total Bonuses</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {payroll?.bonusEarned.toLocaleString("en-LK", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
         </div>
         <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md p-5 text-white">
            <div className="flex items-center gap-3 mb-2 text-indigo-100">
              <div className="p-2 bg-white/10 rounded-lg">
                 <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Balance Owed</span>
            </div>
            <p className="text-2xl font-bold">
              {payroll?.balanceOwed.toLocaleString("en-LK", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Issue Advance */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-500" />
              Issue Advance Payment
            </h2>

            <form onSubmit={handleUpdateAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Amount (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !payroll}
                className="w-full py-2.5 rounded-lg bg-rose-500 text-white text-sm font-semibold shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 hover:bg-rose-400 disabled:opacity-50 transition-all duration-200"
              >
                {isPending ? "Processing..." : "Issue Advance"}
              </button>
            </form>
          </div>

          {/* Issue Bonus */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-500" />
              Add Extra Pay / Bonus
            </h2>

            <form onSubmit={handleUpdateBonus} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Amount (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={bonusDescription}
                  onChange={(e) => setBonusDescription(e.target.value)}
                  placeholder="e.g. Performance Bonus"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !payroll}
                className="w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-50 transition-all duration-200"
              >
                {isPending ? "Processing..." : "Add Bonus"}
              </button>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Payment History
              </h2>
            </div>
            
            <div className="p-0 overflow-y-auto max-h-[600px]">
              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400">No payment history found for this employee.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount (LKR)
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Issued By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.map((history) => {
                      const isAdvance = history.category.startsWith("Salary Advance");
                      return (
                        <tr key={history.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(history.createdAt).toLocaleDateString("en-LK", {
                               year: 'numeric', month: 'short', day: 'numeric',
                               hour: '2-digit', minute:'2-digit'
                            })}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-700">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                isAdvance ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {isAdvance ? "Advance" : "Bonus"}
                            </span>
                            <span className="ml-2 text-slate-500 text-xs hidden sm:inline-block truncate max-w-[150px]" title={history.category}>
                                {history.category}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-700">
                            {history.amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500 text-xs">
                            {history.loggedBy}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Section */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Recent Attendance
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {attendanceHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No attendance records found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Time In / Out
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Earned (LKR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceHistory.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(att.date).toLocaleDateString("en-LK", {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        att.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : att.status === "ABSENT"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-slate-600 font-medium">
                      {att.status === "PRESENT" && att.inTime && att.outTime ? (
                        `${att.inTime} - ${att.outTime}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {att.hoursWorked ? att.hoursWorked.toFixed(1) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600">
                      {att.earnedPay ? att.earnedPay.toLocaleString("en-LK", { minimumFractionDigits: 2 }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
