"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addEpfEtfRecord(data: {
  employeeId: string;
  month: string;
  epfAmount: number;
  etfAmount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Use upsert to allow overwriting if they log the same month again
  const record = await prisma.epfEtfRecord.upsert({
    where: {
      employeeId_month: {
        employeeId: data.employeeId,
        month: data.month,
      },
    },
    update: {
      epfAmount: data.epfAmount,
      etfAmount: data.etfAmount,
      loggedBy: session.user.id,
    },
    create: {
      employeeId: data.employeeId,
      month: data.month,
      epfAmount: data.epfAmount,
      etfAmount: data.etfAmount,
      loggedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/epf-etf");
  return { success: true, data: { ...record, epfAmount: Number(record.epfAmount), etfAmount: Number(record.etfAmount) } };
}

export async function getEpfEtfRecordsByMonth(month: string) {
  const records = await prisma.epfEtfRecord.findMany({
    where: { month },
    include: {
      employee: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { employee: { name: "asc" } },
  });

  return records.map((record) => ({
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee.name,
    month: record.month,
    epfAmount: Number(record.epfAmount),
    etfAmount: Number(record.etfAmount),
    loggedByName: record.user.name,
    createdAt: record.createdAt.toISOString(),
  }));
}

export async function deleteEpfEtfRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.epfEtfRecord.delete({ where: { id } });
  revalidatePath("/dashboard/epf-etf");
  return { success: true };
}
