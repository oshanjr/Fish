"use client";

import { useState, useTransition } from "react";
import {
  UserCog,
  UserPlus,
  CheckCircle2,
  Circle,
  Loader2,
  Wallet,
  DollarSign,
  RotateCcw,
  Plus,
  Pencil,
  X,
  Phone,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createEmployee, updateEmployee, toggleEmployeeActive } from "@/lib/actions/employees";
import { saveAttendance } from "@/lib/actions/attendance";
import { updatePayrollAdvance, resetPayrollAdvances, addPayrollBonus } from "@/lib/actions/payroll";
import { employeeSchema, attendanceSchema, payrollUpdateSchema } from "@/lib/validations";
import type { EmployeeEntry, AttendanceEntry, PayrollEntry } from "@/types";

export default function EmployeesClient({
  initialEmployees,
  initialAttendance,
  staffList,
  initialPayroll,
}: {
  initialEmployees: EmployeeEntry[];
  initialAttendance: AttendanceEntry[];
  staffList: { id: string; name: string }[];
  initialPayroll: PayrollEntry[];
}) {
  // Employee state
  const [employees, setEmployees] = useState(initialEmployees);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeEntry | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    phone: "",
    password: "",
    nic: "",
    baseSalary: "",
  });
  const [employeeError, setEmployeeError] = useState("");

  // Attendance state
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(
    staffList.map((staff) => {
      const existing = initialAttendance.find((a) => a.employeeId === staff.id);
      return {
        employeeId: staff.id,
        employeeName: staff.name,
        status: existing ? existing.status : ("ABSENT" as const),
        inTime: existing?.inTime,
        outTime: existing?.outTime,
        hoursWorked: existing?.hoursWorked,
        earnedPay: existing?.earnedPay,
      };
    })
  );
  const [attendanceMessage, setAttendanceMessage] = useState("");
  
  const [customAttendanceModal, setCustomAttendanceModal] = useState(false);
  const [selectedEmpForCustom, setSelectedEmpForCustom] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState({ in: "08:00", out: "17:00" });

  // Payroll state
  const [payroll, setPayroll] = useState(initialPayroll);
  const [advanceForm, setAdvanceForm] = useState({ id: "", amount: "" });
  const [bonusForm, setBonusForm] = useState({ id: "", amount: "", description: "" });
  const [payrollMessage, setPayrollMessage] = useState("");

  // Shared transition
  const [isPending, startTransition] = useTransition();

  // ===== Employee handlers =====
  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({ name: "", phone: "", password: "", nic: "", baseSalary: "" });
    setEmployeeError("");
    setEmployeeDialogOpen(true);
  };

  const openEditEmployee = (emp: EmployeeEntry) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      name: emp.name,
      phone: emp.phone || "",
      password: "", // do not populate password on edit
      nic: emp.nic || "",
      baseSalary: emp.baseSalary.toString(),
    });
    setEmployeeError("");
    setEmployeeDialogOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError("");

    const data = {
      name: employeeForm.name,
      phone: employeeForm.phone,
      password: employeeForm.password || undefined,
      nic: employeeForm.nic,
      baseSalary: parseFloat(employeeForm.baseSalary),
    };

    const validation = employeeSchema.safeParse(data);
    if (!validation.success) {
      setEmployeeError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        if (editingEmployee) {
          const result = await updateEmployee(editingEmployee.id, data);
          if (result.success) {
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === editingEmployee.id ? result.data : emp
              )
            );
            setEmployeeDialogOpen(false);
          }
        } else {
          const result = await createEmployee(data);
          if (result.success) {
            setEmployees((prev) => [...prev, result.data]);
            setEmployeeDialogOpen(false);
          }
        }
      } catch {
        setEmployeeError("Failed to save employee.");
      }
    });
  };

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      try {
        const result = await toggleEmployeeActive(id);
        if (result.success) {
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === id ? result.data : emp))
          );
        }
      } catch {
        // silently fail
      }
    });
  };

  // ===== Attendance handlers =====
  const handleFullDay = (employeeId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === employeeId
          ? { ...a, status: "PRESENT", hoursWorked: 12, inTime: null, outTime: null }
          : a
      )
    );
  };

  const openCustomModal = (employeeId: string) => {
    const existing = attendance.find(a => a.employeeId === employeeId);
    setCustomTime({ in: existing?.inTime || "08:00", out: existing?.outTime || "17:00" });
    setSelectedEmpForCustom(employeeId);
    setCustomAttendanceModal(true);
  };

  const handleSaveCustom = () => {
    if (!selectedEmpForCustom) return;
    
    // Calculate hours worked
    const [inH, inM] = customTime.in.split(":").map(Number);
    const [outH, outM] = customTime.out.split(":").map(Number);
    let hours = 0;
    if (!isNaN(inH) && !isNaN(outH)) {
      hours = (outH + outM / 60) - (inH + inM / 60);
      if (hours < 0) hours += 24; // Handle overnight
    }

    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === selectedEmpForCustom
          ? { 
              ...a, 
              status: "PRESENT", 
              inTime: customTime.in, 
              outTime: customTime.out, 
              hoursWorked: Number(hours.toFixed(2))
            }
          : a
      )
    );
    
    setCustomAttendanceModal(false);
    setSelectedEmpForCustom(null);
  };

  const handleMarkAbsent = (employeeId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === employeeId
          ? { ...a, status: "ABSENT", hoursWorked: null, inTime: null, outTime: null }
          : a
      )
    );
  };

  const handleSaveAttendance = () => {
    setAttendanceMessage("");
    const validation = attendanceSchema.safeParse({ entries: attendance });

    if (!validation.success) {
      setAttendanceMessage("Invalid attendance data.");
      return;
    }

    startTransition(async () => {
      try {
        await saveAttendance(attendance);
        setAttendanceMessage("Attendance saved successfully.");
      } catch {
        setAttendanceMessage("Failed to save attendance.");
      }
    });
  };

  // ===== Payroll handlers =====
  const handleUpdateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setPayrollMessage("");

    const amount = parseFloat(advanceForm.amount);
    const data = { id: advanceForm.id, advanceTaken: amount };
    const validation = payrollUpdateSchema.safeParse(data);

    if (!validation.success) {
      setPayrollMessage(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePayrollAdvance(data);

        if (result.success) {
          setPayroll((prev) =>
            prev.map((p) =>
              p.id === result.data.id
                ? {
                    ...p,
                    advanceTaken: result.data.advanceTaken,
                    balanceOwed: result.data.balanceOwed,
                  }
                : p
            )
          );
          setAdvanceForm({ id: "", amount: "" });
          setPayrollMessage("Advance updated & logged in daily expenses.");
        }
      } catch {
        setPayrollMessage("Failed to update advance.");
      }
    });
  };

  const handleUpdateBonus = (e: React.FormEvent) => {
    e.preventDefault();
    setPayrollMessage("");

    const amount = parseFloat(bonusForm.amount);
    const data = { employeeId: bonusForm.id, amount, description: bonusForm.description };

    startTransition(async () => {
      try {
        const result = await addPayrollBonus(data);

        if (result.success) {
          setBonusForm({ id: "", amount: "", description: "" });
          setPayrollMessage("Extra pay logged in daily expenses.");
        }
      } catch {
        setPayrollMessage("Failed to log extra pay.");
      }
    });
  };

  const handleReset = () => {
    if (
      !confirm(
        "Are you sure you want to reset all advances for a new pay period? This cannot be undone."
      )
    )
      return;

    startTransition(async () => {
      try {
        await resetPayrollAdvances();
        setPayroll((prev) =>
          prev.map((p) => ({
            ...p,
            advanceTaken: 0,
            balanceOwed: p.baseSalary,
          }))
        );
        setPayrollMessage("All advances reset for the new pay period.");
      } catch {
        setPayrollMessage("Failed to reset advances.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCog className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-800">
            Employee Management
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage staff, mark attendance, and handle payroll
        </p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg bg-white border border-slate-200/60 h-auto p-1 rounded-xl">
          <TabsTrigger
            value="employees"
            className="rounded-lg py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            Employee List
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="rounded-lg py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="payroll"
            className="rounded-lg py-2.5 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* ===== EMPLOYEE LIST TAB ===== */}
        <TabsContent value="employees" className="mt-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddEmployee}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      NIC
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Salary (LKR)
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-slate-400"
                      >
                        No employees found. Add your first employee to get
                        started.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700">
                              {emp.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {emp.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {emp.phone}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {emp.nic ? (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {emp.nic}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-700 font-medium">
                          {emp.baseSalary.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                              emp.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {emp.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEditEmployee(emp)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(emp.id)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all duration-200"
                              title={
                                emp.isActive ? "Deactivate" : "Reactivate"
                              }
                            >
                              {emp.isActive ? (
                                <ToggleRight className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== ATTENDANCE TAB ===== */}
        <TabsContent value="attendance" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-700">
                Mark Today&apos;s Attendance
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {attendance.filter((a) => a.status === "PRESENT").length + attendance.filter((a) => a.status === "HALF_DAY").length * 0.5} Present
              </span>
            </div>

            {attendanceMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm border ${
                  attendanceMessage.includes("success")
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {attendanceMessage}
              </div>
            )}

            {attendance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">
                  No active employees found. Add employees first.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {attendance.map((entry) => (
                    <div
                      key={entry.employeeId}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-200 gap-3 sm:gap-0 ${
                        entry.status === "PRESENT"
                          ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 text-sm">
                          {entry.employeeName}
                        </span>
                        {entry.status === "PRESENT" && (
                          <span className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {entry.hoursWorked === 12 
                              ? "Full Day (12h)" 
                              : `Custom (${entry.hoursWorked}h) ${entry.inTime ? `[${entry.inTime} - ${entry.outTime}]` : ''}`
                            }
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === "PRESENT" && (
                          <button
                            onClick={() => handleMarkAbsent(entry.employeeId)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-500 transition-colors"
                          >
                            Mark Absent
                          </button>
                        )}
                        <button
                          onClick={() => handleFullDay(entry.employeeId)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            entry.status === "PRESENT" && entry.hoursWorked === 12
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent"
                          }`}
                        >
                          Full Day
                        </button>
                        <button
                          onClick={() => openCustomModal(entry.employeeId)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            entry.status === "PRESENT" && entry.hoursWorked !== 12 && entry.hoursWorked !== null
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={isPending}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Attendance"
                  )}
                </button>
              </>
            )}
          </div>
        </TabsContent>

        {/* ===== PAYROLL TAB ===== */}
        <TabsContent value="payroll" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Staff Payroll
              </h2>
            </div>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Period
            </button>
          </div>

          {payrollMessage && (
            <div
              className={`mb-4 p-4 rounded-xl border text-sm ${
                payrollMessage.includes("success") ||
                payrollMessage.includes("reset") ||
                payrollMessage.includes("logged")
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {payrollMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Advance Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-500" />
                  Issue Advance Payment
                </h2>

                <form onSubmit={handleUpdateAdvance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Employee
                    </label>
                    <select
                      value={advanceForm.id}
                      onChange={(e) =>
                        setAdvanceForm({
                          ...advanceForm,
                          id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                    >
                      <option value="">Select employee...</option>
                      {payroll.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.employeeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Advance Amount (LKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={advanceForm.amount}
                      onChange={(e) =>
                        setAdvanceForm({
                          ...advanceForm,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      This will be added to existing advances &amp; logged as a daily expense.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 hover:from-rose-400 hover:to-pink-400 disabled:opacity-50 transition-all duration-200 flex justify-center items-center gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Issue Advance"
                    )}
                  </button>
                </form>
              </div>

              {/* Bonus Form */}
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 mt-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  Add Extra Pay / Bonus
                </h2>

                <form onSubmit={handleUpdateBonus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Employee
                    </label>
                    <select
                      value={bonusForm.id}
                      onChange={(e) =>
                        setBonusForm({
                          ...bonusForm,
                          id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                    >
                      <option value="">Select employee...</option>
                      {payroll.map((p) => (
                        <option key={p.id} value={p.employeeId}>
                          {p.employeeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      value={bonusForm.description}
                      onChange={(e) =>
                        setBonusForm({
                          ...bonusForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                      placeholder="E.g., Overtime, Good performance"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Amount (LKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bonusForm.amount}
                      onChange={(e) =>
                        setBonusForm({
                          ...bonusForm,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                      placeholder="0.00"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 transition-all duration-200 flex justify-center items-center gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Log Extra Pay"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Payroll Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Staff Ledger
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Employee Name
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Daily Rate (LKR)
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Earned Salary (LKR)
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Advances Taken (LKR)
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Bonus Earned (LKR)
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Balance Owed (LKR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payroll.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-8 text-center text-slate-400"
                          >
                            No staff records found. Add employees first.
                          </td>
                        </tr>
                      ) : (
                        payroll.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium text-slate-700">
                              {record.employeeName}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">
                              {record.baseSalary.toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-5 py-3 text-right text-emerald-600 font-medium">
                              {record.earnedSalary > 0
                                ? record.earnedSalary.toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                  })
                                : "—"}
                            </td>
                            <td className="px-5 py-3 text-right text-rose-600 font-medium">
                              {record.advanceTaken > 0
                                ? record.advanceTaken.toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                  })
                                : "—"}
                            </td>
                            <td className="px-5 py-3 text-right text-emerald-600 font-medium">
                              {record.bonusEarned > 0
                                ? record.bonusEarned.toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                  })
                                : "—"}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-800 font-semibold">
                              {record.balanceOwed.toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingEmployee ? (
                <Pencil className="w-5 h-5 text-indigo-500" />
              ) : (
                <UserPlus className="w-5 h-5 text-indigo-500" />
              )}
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>

          {employeeError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {employeeError}
            </div>
          )}

          <form onSubmit={handleSaveEmployee} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={employeeForm.name}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, name: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                placeholder="Employee name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Phone Number (Login ID)
              </label>
              <input
                type="text"
                value={employeeForm.phone}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, phone: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                placeholder="07X XXX XXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Password {editingEmployee && "(Leave blank to keep current)"}
              </label>
              <input
                type="text"
                value={employeeForm.password}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, password: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                placeholder="Password (min 6 chars)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                NIC Number
              </label>
              <input
                type="text"
                value={employeeForm.nic}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, nic: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                placeholder="XXXXXXXXX V or XXXXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Base Salary (LKR) *
              </label>
              <input
                type="number"
                step="0.01"
                value={employeeForm.baseSalary}
                onChange={(e) =>
                  setEmployeeForm({
                    ...employeeForm,
                    baseSalary: e.target.value,
                  })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeDialogOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingEmployee ? "Save Changes" : "Add Employee"}
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Attendance Dialog */}
      <Dialog open={customAttendanceModal} onOpenChange={setCustomAttendanceModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Custom Attendance Hours
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  In Time
                </label>
                <input
                  type="time"
                  value={customTime.in}
                  onChange={(e) => setCustomTime({ ...customTime, in: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Out Time
                </label>
                <input
                  type="time"
                  value={customTime.out}
                  onChange={(e) => setCustomTime({ ...customTime, out: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 mt-4">
              <button
                type="button"
                onClick={() => setCustomAttendanceModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Hours
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
