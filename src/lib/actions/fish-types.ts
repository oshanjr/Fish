"use server";

import { prisma } from "@/lib/prisma";
import { fishTypeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getFishTypes() {
  const types = await prisma.fishType.findMany({
    orderBy: { name: "asc" },
  });
  return types;
}

export async function addFishType(name: string) {
  const validated = fishTypeSchema.parse({ name });

  const newType = await prisma.fishType.create({
    data: { name: validated.name },
  });

  revalidatePath("/dashboard/morning-intake");
  return { success: true, data: newType };
}
