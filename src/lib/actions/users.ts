"use server";

import { prisma } from "@/lib/prisma";
import { systemUserSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSystemUsers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "MANAGER") throw new Error("Forbidden");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return users;
}

export async function addSystemUser(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "MANAGER") throw new Error("Forbidden");

  const validated = systemUserSchema.parse(data);

  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(validated.password, 12);

  const newUser = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      role: validated.role,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  });

  revalidatePath("/dashboard/users");
  return { success: true, data: newUser };
}

export async function deleteSystemUser(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "MANAGER") throw new Error("Forbidden");
  if (session.user.id === id) throw new Error("You cannot delete yourself");

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}
