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
    sundayPayment: Number(e.sundayPayment),
  }));
}

export async function createEmployee(data: {
  name: string;
  phone?: string;
  password?: string;
  nic?: string;
  baseSalary: number;
  sundayPayment?: number;
}) {
  const session = await auth();
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERVISOR") {
    throw new Error("Forbidden: Unauthorized");
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
      sundayPayment: validated.sundayPayment ?? 0,
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
    data: { ...employee, baseSalary: Number(employee.baseSalary), sundayPayment: Number(employee.sundayPayment) },
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
    sundayPayment?: number;
  }
) {
  const session = await auth();
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERVISOR") {
    throw new Error("Forbidden: Unauthorized");
  }

  const validated = employeeSchema.parse(data);

  let passwordHash = undefined;
  if (data.password) {
    const bcrypt = require("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { id },
    select: { baseSalary: true, sundayPayment: true },
  });

  if (!currentEmployee) throw new Error("Employee not found");
  const oldBaseSalary = Number(currentEmployee.baseSalary);
  const oldSundayPayment = Number(currentEmployee.sundayPayment);

  const employee = await prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id },
      data: {
        name: validated.name,
        phone: validated.phone || null,
        ...(passwordHash ? { passwordHash } : {}),
        nic: validated.nic || null,
        baseSalary: validated.baseSalary,
        sundayPayment: validated.sundayPayment ?? 0,
      },
    });

    const newSundayPayment = validated.sundayPayment ?? 0;

    if (oldBaseSalary !== validated.baseSalary || oldSundayPayment !== newSundayPayment) {
      // Fetch all attendance records to compute the total pay delta
      const attendances = await tx.staffAttendance.findMany({
        where: { employeeId: id },
      });

      let totalPayDelta = 0;

      for (const record of attendances) {
        const hours = record.hoursWorked ? Number(record.hoursWorked) : 0;
        const oldEarnedPay = record.earnedPay ? Number(record.earnedPay) : 0;
        const isSunday = record.date.getDay() === 0;
        let newEarnedPay = 0;
        if (isSunday && hours > 0) {
          newEarnedPay = newSundayPayment;
        } else {
          newEarnedPay = validated.baseSalary * (hours / 12);
        }
        totalPayDelta += newEarnedPay - oldEarnedPay;
      }

      // Batch update: recalculate all attendance earnedPay using raw SQL
      // to avoid N individual update round-trips that cause transaction timeouts
      await tx.$executeRawUnsafe(
        `UPDATE "staff_attendance"
         SET "earnedPay" = CASE
           WHEN EXTRACT(DOW FROM "date") = 0 AND "hoursWorked" > 0
             THEN $1
           ELSE $2 * ("hoursWorked" / 12.0)
         END
         WHERE "employeeId" = $3`,
        newSundayPayment,
        validated.baseSalary,
        id
      );

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
  }, {
    maxWait: 10000,  // max time to acquire a connection (10s)
    timeout: 30000,  // max transaction duration (30s)
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  return {
    success: true,
    data: { ...employee, baseSalary: Number(employee.baseSalary), sundayPayment: Number(employee.sundayPayment) },
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
    data: { ...updated, baseSalary: Number(updated.baseSalary), sundayPayment: Number(updated.sundayPayment) },
  };
}
