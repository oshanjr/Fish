// Type definitions for Fish Store Management System

export type UserRole = "MANAGER" | "SUPERVISOR" | "EMPLOYEE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY";
export type ContactType = "SUPPLIER" | "BUYER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface FishIntakeFormData {
  fishType: string;
  incomingWeight: number;
  buyingPricePerKg: number;
  sellingPricePerKg: number;
}

export interface ExpenseFormData {
  category: string;
  amount: number;
}

export interface WastageFormData {
  inventoryLogId: string;
  wastageWeight: number;
}

export interface AttendanceEntry {
  id?: string;
  employeeId: string;
  employeeName: string;
  status: AttendanceStatus;
  inTime?: string | null;
  outTime?: string | null;
  hoursWorked?: number | null;
  earnedPay?: number | null;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  earnedSalary: number;
  advanceTaken: number;
  bonusEarned: number;
  balanceOwed: number;
}

export interface EmployeeEntry {
  id: string;
  name: string;
  phone: string | null;
  nic: string | null;
  baseSalary: number;
  isActive: boolean;
}

export interface ContactEntry {
  id: string;
  name: string;
  phone: string | null;
  type: ContactType;
  totalBalance: number;
}

export interface ContactTransactionEntry {
  id: string;
  contactId: string;
  date: string;
  description: string;
  amount: number;
}

export interface ContactDetailEntry extends ContactEntry {
  transactions: ContactTransactionEntry[];
}

export interface DailySummary {
  id?: string;
  date?: string;
  totalPosSales: number;
  cashSales?: number;
  cardSales?: number;
  weeklyTotalPosSales?: number;
  calculatedExpenses: number;
  calculatedWastageCost: number;
  totalBuyingCost: number;
  netProfit: number;
  isSyncedWithHub?: boolean;
}

export interface SyncHistoryEntry {
  id: string;
  date: Date;
  totalPosSales: number;
  netProfit: number;
  isSyncedWithHub: boolean;
}

// Expense categories available for logging
export const EXPENSE_CATEGORIES = [
  "Salary Advance",
  "Ice",
  "Transport",
  "Tea",
  "Fuel",
  "Meals",
  "Electricity",
  "Packaging",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];



// Navigation items for the sidebar
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}
