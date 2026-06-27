"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AttendanceEntry } from "@/types";

export async function getStaffList() {
  const staff = await prisma.staffPayroll.findMany({
    select: { employeeName: true },
    orderBy: { employeeName: "asc" },
  });
  return staff.map((s) => s.employeeName);
}

export async function getTodaysAttendance() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.staffAttendance.findMany({
    where: { date: today },
    orderBy: { employeeName: "asc" },
  });

  return attendance;
}

export async function saveAttendance(entries: AttendanceEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert each attendance entry
  const results = await Promise.all(
    entries.map((entry) =>
      prisma.staffAttendance.upsert({
        where: {
          date_employeeName: {
            date: today,
            employeeName: entry.employeeName,
          },
        },
        update: { status: entry.status },
        create: {
          date: today,
          employeeName: entry.employeeName,
          status: entry.status,
        },
      })
    )
  );

  revalidatePath("/dashboard/daily-ops");
  return { success: true, count: results.length };
}
