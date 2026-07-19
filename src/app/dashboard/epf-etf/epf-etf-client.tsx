"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEpfEtfRecord, deleteEpfEtfRecord } from "@/lib/actions/epf-etf";
import { 
  Building2, 
  Trash2, 
  Loader2,
  Calendar,
  Plus
} from "lucide-react";
import type { UserRole } from "@/types";

type Employee = { id: string; name: string };
type EpfEtfRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  epfAmount: number;
  etfAmount: number;
  loggedByName: string;
  createdAt: string;
};

export default function EpfEtfClient({
  employees,
  records,
  currentMonth,
  userRole,
}: {
  employees: Employee[];
  records: EpfEtfRecord[];
  currentMonth: string;
  userRole: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    epfAmount: "",
    etfAmount: "",
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    router.push(`/dashboard/epf-etf?month=${newMonth}`);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.employeeId) {
      setError("Please select an employee");
      return;
    }

    const epf = parseFloat(form.epfAmount) || 0;
    const etf = parseFloat(form.etfAmount) || 0;

    startTransition(async () => {
      try {
        const result = await addEpfEtfRecord({
          employeeId: form.employeeId,
          month: currentMonth,
          epfAmount: epf,
          etfAmount: etf,
        });

        if (result.success) {
          setSuccessMsg("Record added successfully!");
          setForm({ employeeId: "", epfAmount: "", etfAmount: "" });
        }
      } catch (err: any) {
        setError(err.message || "Failed to add record");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    startTransition(async () => {
      try {
        await deleteEpfEtfRecord(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete record");
      }
    });
  };

  const totalEpf = records.reduce((sum, r) => sum + r.epfAmount, 0);
  const totalEtf = records.reduce((sum, r) => sum + r.etfAmount, 0);
  const totalCombined = totalEpf + totalEtf;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-800">
            EPF & ETF Management
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Manually log monthly statutory contributions for employees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Add Contribution
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Target Month
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="month"
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Employee
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                >
                  <option value="">Select an employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  EPF Amount (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.epfAmount}
                  onChange={(e) => setForm({ ...form, epfAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  ETF Amount (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.etfAmount}
                  onChange={(e) => setForm({ ...form, etfAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Contribution
              </button>
            </form>
          </div>
          
          <div className="bg-slate-900 rounded-xl p-5 text-white">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Month Summary</h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total EPF</span>
                  <span className="font-semibold">LKR {totalEpf.toLocaleString("en-LK", {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total ETF</span>
                  <span className="font-semibold">LKR {totalEtf.toLocaleString("en-LK", {minimumFractionDigits: 2})}</span>
               </div>
               <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-medium">Grand Total</span>
                  <span className="text-lg font-bold text-cyan-400">LKR {totalCombined.toLocaleString("en-LK", {minimumFractionDigits: 2})}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700">
                Records for {new Date(currentMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {records.length} Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              {records.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    No EPF/ETF contributions logged for this month.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        EPF (LKR)
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        ETF (LKR)
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {record.employeeName}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {record.epfAmount.toLocaleString("en-LK", {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {record.etfAmount.toLocaleString("en-LK", {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">
                          {(record.epfAmount + record.etfAmount).toLocaleString("en-LK", {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
