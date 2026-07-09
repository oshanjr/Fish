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
  }));
}

export async function saveAttendance(entries: AttendanceEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert each attendance entry
  const results = await Promise.all(
    entries.map((entry) =>
      prisma.staffAttendance.upsert({
        where: {
          date_employeeId: {
            date: today,
            employeeId: entry.employeeId,
          },
        },
        update: { status: entry.status },
        create: {
          date: today,
          employeeId: entry.employeeId,
          status: entry.status,
        },
      })
    )
  );

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/daily-ops");
  return { success: true, count: results.length };
}
