"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFishTypes() {
  const types = await prisma.fishType.findMany({
    orderBy: { name: "asc" },
  });
  return types;
}

export async function addFishType(name: string) {
  if (!name || name.trim().length === 0) {
    throw new Error("Fish type name cannot be empty");
  }

  const newType = await prisma.fishType.create({
    data: { name: name.trim() },
  });

  revalidatePath("/dashboard/morning-intake");
  return { success: true, data: newType };
}
