"use server";

import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

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
  const session = await auth();
  if (session?.user?.role !== "MANAGER") {
    throw new Error("Forbidden: Only managers can manage employees");
  }

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
  const session = await auth();
  if (session?.user?.role !== "MANAGER") {
    throw new Error("Forbidden: Only managers can update employees");
  }

  const validated = employeeSchema.parse(data);

  let passwordHash = undefined;
  if (data.password) {
    const bcrypt = require("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { id },
    select: { baseSalary: true },
  });

  if (!currentEmployee) throw new Error("Employee not found");
  const oldBaseSalary = Number(currentEmployee.baseSalary);

  const employee = await prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id },
      data: {
        name: validated.name,
        phone: validated.phone || null,
        ...(passwordHash ? { passwordHash } : {}),
        nic: validated.nic || null,
        baseSalary: validated.baseSalary,
      },
    });

    if (oldBaseSalary !== validated.baseSalary) {
      const attendances = await tx.staffAttendance.findMany({
        where: { employeeId: id },
      });

      let totalPayDelta = 0;

      for (const record of attendances) {
        const hours = record.hoursWorked ? Number(record.hoursWorked) : 0;
        const oldEarnedPay = record.earnedPay ? Number(record.earnedPay) : 0;
        const newEarnedPay = validated.baseSalary * (hours / 12);

        const delta = newEarnedPay - oldEarnedPay;
        totalPayDelta += delta;

        if (delta !== 0) {
          await tx.staffAttendance.update({
            where: { id: record.id },
            data: { earnedPay: newEarnedPay },
          });
        }
      }

      if (totalPayDelta !== 0) {
        const payroll = await tx.staffPayroll.findUnique({
          where: { employeeId: id },
        });

        if (payroll) {
          await tx.staffPayroll.update({
            where: { employeeId: id },
            data: {
              earnedSalary: { increment: totalPayDelta },
              balanceOwed: { increment: totalPayDelta },
            },
          });
        }
      }
    }

    return updated;
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  return {
    success: true,
    data: { ...employee, baseSalary: Number(employee.baseSalary) },
  };
}

export async function toggleEmployeeActive(id: string) {
  const session = await auth();
  if (session?.user?.role !== "MANAGER") {
    throw new Error("Forbidden: Only managers can toggle employee status");
  }

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
