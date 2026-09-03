import { z } from "zod";

// === Shared validation patterns ===

// Phone: Only digits, +, -, spaces, parentheses. Min 9 chars when provided.
const phonePattern = /^[0-9+\-\s()]+$/;
const phoneValidator = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || (phonePattern.test(val) && val.replace(/\D/g, "").length >= 7),
    {
      message:
        "Phone must contain only digits, +, -, spaces, or parentheses and have at least 7 digits",
    }
  )
  .optional()
  .or(z.literal(""));

// Name: Only letters (including Unicode), spaces, dots, hyphens, apostrophes
const namePattern = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.\-']+$/;
const nameValidator = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(100, `${fieldName} must be under 100 characters`)
    .regex(namePattern, `${fieldName} must contain only letters, spaces, dots, hyphens, or apostrophes`);

// Sri Lankan NIC: old format (9 digits + V/X) or new format (12 digits)
const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const nicValidator = z
  .string()
  .trim()
  .refine((val) => val === "" || nicPattern.test(val), {
    message: "NIC must be 9 digits followed by V/X, or 12 digits",
  })
  .optional()
  .or(z.literal(""));

// === Schemas ===

// Fish Intake form validation
export const fishIntakeSchema = z.object({
  date: z.string().optional(),
  fishType: z
    .string()
    .trim()
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
    .trim()
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
  cashSales: z
    .number({ message: "Cash sales amount must be a number" })
    .min(0, "Sales cannot be negative")
    .max(10000000, "Amount seems too high"),
  cardSales: z
    .number({ message: "Card sales amount must be a number" })
    .min(0, "Sales cannot be negative")
    .max(10000000, "Amount seems too high"),
});

// Staff attendance validation
export const attendanceSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string().optional(),
      employeeId: z.string().min(1, "Employee ID is required"),
      employeeName: z.string().min(1, "Employee name is required"),
      status: z.enum(["PRESENT", "ABSENT", "HALF_DAY"]),
      inTime: z.string().nullable().optional(),
      outTime: z.string().nullable().optional(),
      hoursWorked: z.number().min(0, "Hours cannot be negative").max(24, "Hours cannot exceed 24").nullable().optional(),
      earnedPay: z.number().min(0, "Pay cannot be negative").nullable().optional(),
    })
  ),
});

// Payroll update validation
export const payrollUpdateSchema = z.object({
  id: z.string().min(1, "Payroll ID is required"),
  advanceTaken: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount seems too high"),
});

// Bonus validation
export const bonusUpdateSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount seems too high"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(100, "Description must be under 100 characters"),
});

// Login validation
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email or phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Contact validation
export const contactSchema = z.object({
  name: nameValidator("Name"),
  phone: phoneValidator,
  type: z.enum(["SUPPLIER", "BUYER"]),
});

// Contact update validation (no type field needed)
export const contactUpdateSchema = z.object({
  name: nameValidator("Name"),
  phone: phoneValidator,
});

// Contact transaction validation
export const contactTransactionSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be under 200 characters"),
  amount: z
    .number({ message: "Amount must be a number" })
    .refine((val) => val !== 0, "Amount cannot be zero"),
  date: z.string().optional(),
});

// Employee validation
export const employeeSchema = z.object({
  name: nameValidator("Name"),
  phone: phoneValidator,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  nic: nicValidator,
  baseSalary: z
    .number({ message: "Salary must be a number" })
    .min(0, "Salary cannot be negative")
    .max(1000000, "Salary seems too high"),
});

// EPF/ETF validation (NEW)
export const epfEtfSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z
    .string()
    .min(1, "Month is required")
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  epfAmount: z
    .number({ message: "EPF amount must be a number" })
    .min(0, "EPF amount cannot be negative")
    .max(1000000, "EPF amount seems too high"),
  etfAmount: z
    .number({ message: "ETF amount must be a number" })
    .min(0, "ETF amount cannot be negative")
    .max(1000000, "ETF amount seems too high"),
});

// Day Summary / POS save validation (NEW — reuses posSalesSchema fields + date)
export const daySummarySchema = z.object({
  cashSales: z
    .number({ message: "Cash sales must be a number" })
    .min(0, "Cash sales cannot be negative")
    .max(10000000, "Amount seems too high"),
  cardSales: z
    .number({ message: "Card sales must be a number" })
    .min(0, "Card sales cannot be negative")
    .max(10000000, "Amount seems too high"),
  date: z.string().optional(),
});

// Fish Type validation (NEW)
export const fishTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Fish type name is required")
    .max(100, "Fish type name must be under 100 characters"),
});

// Expense Category validation (NEW)
export const expenseCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(50, "Category name must be under 50 characters"),
});

// System User validation
export const systemUserSchema = z.object({
  name: nameValidator("Name"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MANAGER", "SUPERVISOR"]),
});
