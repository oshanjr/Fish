"use server";

import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getAllEmployees(activeOnly: boolean = false) {
  const employees = await prisma.employee.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });

  return employees.map((e) => ({
    ...e,
    baseSalary: Number(e.baseSalary),
  }));
}

export async function createEmployee(data: {
  name: string;
  phone?: string;
  password?: string;
  nic?: string;
  baseSalary: number;
}) {
  const validated = employeeSchema.parse(data);
  let passwordHash = null;

  if (data.password) {
    const bcrypt = require("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const employee = await prisma.employee.create({
    data: {
      name: validated.name,
      phone: validated.phone || null,
      passwordHash,
      nic: validated.nic || null,
      baseSalary: validated.baseSalary,
    },
  });

  // Also create a payroll record for this employee
  await prisma.staffPayroll.create({
    data: {
      employeeId: employee.id,
      advanceTaken: 0,
      balanceOwed: 0,
    },
  });

  revalidatePath("/dashboard/employees");
  return {
    success: true,
    data: { ...employee, baseSalary: Number(employee.baseSalary) },
  };
}

export async function updateEmployee(
  id: string,
  data: {
    name: string;
    phone?: string;
    password?: string;
    nic?: string;
    baseSalary: number;
  }
) {
  const validated = employeeSchema.parse(data);

  let passwordHash = undefined;
  if (data.password) {
    const bcrypt = require("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name: validated.name,
      phone: validated.phone || null,
      ...(passwordHash ? { passwordHash } : {}),
      nic: validated.nic || null,
      baseSalary: validated.baseSalary,
    },
  });

  revalidatePath("/dashboard/employees");
  return {
    success: true,
    data: { ...employee, baseSalary: Number(employee.baseSalary) },
  };
}

export async function toggleEmployeeActive(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new Error("Employee not found");

  const updated = await prisma.employee.update({
    where: { id },
    data: { isActive: !employee.isActive },
  });

  revalidatePath("/dashboard/employees");
  return {
    success: true,
    data: { ...updated, baseSalary: Number(updated.baseSalary) },
  };
}
