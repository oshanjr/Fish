"use server";

import { prisma } from "@/lib/prisma";
import { fishIntakeSchema, wastageSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createFishIntake(data: {
  fishType: string;
  incomingWeight: number;
  buyingPricePerKg: number;
  sellingPricePerKg: number;
}) {
  const validated = fishIntakeSchema.parse(data);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.fishInventoryLog.create({
    data: {
      date: today,
      fishType: validated.fishType,
      incomingWeight: validated.incomingWeight,
      buyingPricePerKg: validated.buyingPricePerKg,
      sellingPricePerKg: validated.sellingPricePerKg,
      wastageWeight: 0,
    },
  });

  revalidatePath("/dashboard/morning-intake");
  revalidatePath("/dashboard/evening-closing");
  return { success: true, data: log };
}

export async function getTodaysInventory() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await prisma.fishInventoryLog.findMany({
    where: { date: today },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    ...log,
    incomingWeight: Number(log.incomingWeight),
    buyingPricePerKg: Number(log.buyingPricePerKg),
    sellingPricePerKg: Number(log.sellingPricePerKg),
    wastageWeight: Number(log.wastageWeight),
  }));
}

export async function updateWastage(data: {
  inventoryLogId: string;
  wastageWeight: number;
}) {
  const validated = wastageSchema.parse(data);

  const log = await prisma.fishInventoryLog.update({
    where: { id: validated.inventoryLogId },
    data: { wastageWeight: validated.wastageWeight },
  });

  revalidatePath("/dashboard/evening-closing");
  return { success: true, data: log };
}

export async function deleteInventoryLog(id: string) {
  await prisma.fishInventoryLog.delete({ where: { id } });
  revalidatePath("/dashboard/morning-intake");
  revalidatePath("/dashboard/evening-closing");
  return { success: true };
}
