"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AttendanceEntry } from "@/types";

export async function getStaffList() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return employees.map((e) => ({ id: e.id, name: e.name }));
}

export async function getTodaysAttendance() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.staffAttendance.findMany({
    where: { date: today },
    include: { employee: { select: { name: true } } },
    orderBy: { employee: { name: "asc" } },
  });

  return attendance.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employee.name,
    status: a.status,
    inTime: a.inTime,
    outTime: a.outTime,
    hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
    earnedPay: a.earnedPay ? Number(a.earnedPay) : null,
  }));
}

export async function saveAttendance(entries: AttendanceEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert each attendance entry and update payroll
  let count = 0;
  for (const entry of entries) {
    // Get existing attendance and employee salary
    const existing = await prisma.staffAttendance.findUnique({
      where: {
        date_employeeId: {
          date: today,
          employeeId: entry.employeeId,
        },
      },
      include: {
        employee: { select: { baseSalary: true } }
      }
    });

    let baseSalary = 0;
    if (existing) {
      baseSalary = Number(existing.employee.baseSalary);
    } else {
      const emp = await prisma.employee.findUnique({ where: { id: entry.employeeId }, select: { baseSalary: true } });
      if (emp) baseSalary = Number(emp.baseSalary);
    }

    const newHours = entry.hoursWorked || 0;
    const newEarnedPay = baseSalary * (newHours / 12);
    const existingPay = existing?.earnedPay ? Number(existing.earnedPay) : 0;
    const payDelta = newEarnedPay - existingPay;

    await prisma.$transaction(async (tx) => {
      // Update or create attendance
      await tx.staffAttendance.upsert({
        where: {
          date_employeeId: {
            date: today,
            employeeId: entry.employeeId,
          },
        },
        update: { 
          status: entry.status,
          inTime: entry.inTime,
          outTime: entry.outTime,
          hoursWorked: newHours,
          earnedPay: newEarnedPay,
        },
        create: {
          date: today,
          employeeId: entry.employeeId,
          status: entry.status,
          inTime: entry.inTime,
          outTime: entry.outTime,
          hoursWorked: newHours,
          earnedPay: newEarnedPay,
        },
      });

      // Update payroll if pay changed
      if (payDelta !== 0) {
        const payroll = await tx.staffPayroll.findUnique({ where: { employeeId: entry.employeeId } });
        if (payroll) {
          await tx.staffPayroll.update({
            where: { employeeId: entry.employeeId },
            data: {
              earnedSalary: { increment: payDelta },
              balanceOwed: { increment: payDelta },
            }
          });
        }
      }
    });
    count++;
  }

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/daily-ops");
  return { success: true, count };
}
