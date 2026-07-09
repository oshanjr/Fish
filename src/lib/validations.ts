import { z } from "zod";

// Fish Intake form validation
export const fishIntakeSchema = z.object({
  fishType: z
    .string()
    .min(1, "Fish type is required")
    .max(100, "Fish type must be under 100 characters"),
  incomingWeight: z
    .number({ message: "Weight must be a number" })
    .positive("Weight must be greater than 0")
    .max(10000, "Weight seems too high"),
  buyingPricePerKg: z
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(100000, "Price seems too high"),
  sellingPricePerKg: z
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(100000, "Price seems too high"),
});

// Daily Expense form validation
export const expenseSchema = z.object({
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be under 50 characters"),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount seems too high"),
});

// Wastage form validation
export const wastageSchema = z.object({
  inventoryLogId: z.string().min(1, "Inventory log is required"),
  wastageWeight: z
    .number({ message: "Weight must be a number" })
    .min(0, "Weight cannot be negative")
    .max(10000, "Weight seems too high"),
});

// POS Sales form validation
export const posSalesSchema = z.object({
  totalPosSales: z
    .number({ message: "Sales amount must be a number" })
    .min(0, "Sales cannot be negative")
    .max(10000000, "Amount seems too high"),
});

// Staff attendance validation
export const attendanceSchema = z.object({
  entries: z.array(
    z.object({
      employeeId: z.string().min(1),
      employeeName: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT"]),
    })
  ),
});

// Payroll update validation
export const payrollUpdateSchema = z.object({
  id: z.string().min(1),
  advanceTaken: z
    .number({ message: "Amount must be a number" })
    .min(0, "Amount cannot be negative"),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Contact validation
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  phone: z
    .string()
    .max(20, "Phone must be under 20 characters")
    .optional()
    .or(z.literal("")),
  type: z.enum(["SUPPLIER", "BUYER"]),
});

// Contact transaction validation
export const contactTransactionSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be under 200 characters"),
  amount: z
    .number({ message: "Amount must be a number" })
    .refine((val) => val !== 0, "Amount cannot be zero"),
});

// Employee validation
export const employeeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  phone: z
    .string()
    .max(20, "Phone must be under 20 characters")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  nic: z
    .string()
    .max(20, "NIC must be under 20 characters")
    .optional()
    .or(z.literal("")),
  baseSalary: z
    .number({ message: "Salary must be a number" })
    .min(0, "Salary cannot be negative")
    .max(1000000, "Salary seems too high"),
});
