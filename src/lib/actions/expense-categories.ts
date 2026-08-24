"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExpenseCategories() {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: [
      { isSystem: 'desc' }, // System categories first
      { name: 'asc' },
    ],
  });
  return categories;
}

export async function addExpenseCategory(name: string) {
  try {
    if (!name || name.trim() === "") {
      throw new Error("Category name is required");
    }

    const trimmedName = name.trim();

    // Check if it already exists
    const existing = await prisma.expenseCategory.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      throw new Error("Category already exists");
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: trimmedName,
        isSystem: false,
      },
    });

    revalidatePath("/dashboard/daily-ops");
    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add category" };
  }
}

export async function deleteExpenseCategory(id: string) {
  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.isSystem) {
      throw new Error("Cannot delete a system category");
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    revalidatePath("/dashboard/daily-ops");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category" };
  }
}
