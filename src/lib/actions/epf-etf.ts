"use server";

import { prisma } from "@/lib/prisma";
import { epfEtfSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addEpfEtfRecord(data: {
  employeeId: string;
  month: string;
  epfAmount: number;
  etfAmount: number;
}) {
  const session = await auth();
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERVISOR") {
    throw new Error("Forbidden: Unauthorized");
  }

  const validated = epfEtfSchema.parse(data);

  // Use upsert to allow overwriting if they log the same month again
  const record = await prisma.epfEtfRecord.upsert({
    where: {
      employeeId_month: {
        employeeId: validated.employeeId,
        month: validated.month,
      },
    },
    update: {
      epfAmount: validated.epfAmount,
      etfAmount: validated.etfAmount,
      loggedBy: session.user.id,
    },
    create: {
      employeeId: validated.employeeId,
      month: validated.month,
      epfAmount: validated.epfAmount,
      etfAmount: validated.etfAmount,
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
  if (session?.user?.role !== "MANAGER") {
    throw new Error("Forbidden: Only managers can delete EPF/ETF records");
  }

  await prisma.epfEtfRecord.delete({ where: { id } });
  revalidatePath("/dashboard/epf-etf");
  return { success: true };
}
