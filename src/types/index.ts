// Type definitions for Fish Store Management System

export type UserRole = "MANAGER" | "SUPERVISOR";
export type AttendanceStatus = "PRESENT" | "ABSENT";

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
  employeeName: string;
  status: AttendanceStatus;
}

export interface PayrollEntry {
  id: string;
  employeeName: string;
  baseSalary: number;
  advanceTaken: number;
  balanceOwed: number;
}

export interface DailySummary {
  totalPosSales: number;
  totalBuyingCost: number;
  calculatedExpenses: number;
  calculatedWastageCost: number;
  netProfit: number;
  isSyncedWithHub: boolean;
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

// Common fish types in Sri Lankan markets
export const FISH_TYPES = [
  "Tuna (Kelawalla)",
  "Seer Fish (Thora)",
  "Prawns (Isso)",
  "Cuttlefish (Della)",
  "Sardine (Salaya)",
  "Mackerel (Kumbalawa)",
  "Red Snapper (Rathu Gal Malu)",
  "Mullet (Godaya)",
  "Herring (Hurulla)",
  "Skipjack (Balaya)",
  "Other",
] as const;

export type FishType = (typeof FISH_TYPES)[number];

// Navigation items for the sidebar
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}
