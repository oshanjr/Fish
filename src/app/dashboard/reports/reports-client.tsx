"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  DollarSign,
  ShoppingCart,
  Activity,
  Users,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowRight,
  RotateCcw,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  FileSpreadsheet,
  X,
  Layers,
  CalendarRange,
  Clock,
  Printer,
} from "lucide-react";

interface PastMonthSummary {
  year: number;
  month: number;
  monthKey: string;
  totalPosSales: number;
  totalBuyingCost: number;
  totalExpenses: number;
  totalNetProfit: number;
  daysCount: number;
}

interface ReportsClientProps {
  selectedYear: number;
  selectedMonth: number;
  financials: {
    totals: {
      totalPosSales: number;
      totalBuyingCost: number;
      totalExpenses: number;
      totalNetProfit: number;
    };
    summaries: any[];
    detailedExpenses: any[];
  };
  attendance: any[];
  pastMonths?: PastMonthSummary[];
}

const STORE_NAME = "Arthur & Sons Seafood Center";
const STORE_SUBTITLE = "Seafood Wholesale & Retail Operations";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function ReportsClient({
  selectedYear,
  selectedMonth,
  financials,
  attendance,
  pastMonths = [],
}: ReportsClientProps) {
  const router = useRouter();
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [pickerYear, setPickerYear] = useState(selectedYear);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Sync pickerYear when selectedYear changes
  useEffect(() => {
    setPickerYear(selectedYear);
  }, [selectedYear]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  // Month navigation labels
  const prevMonthIdx = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYearVal = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevLabel = `${SHORT_MONTHS[prevMonthIdx - 1]} ${prevYearVal}`;

  const nextMonthIdx = selectedMonth === 12 ? 1 : selectedMonth + 1;
  const nextYearVal = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
  const nextLabel = `${SHORT_MONTHS[nextMonthIdx - 1]} ${nextYearVal}`;

  const handlePrevMonth = () => {
    router.push(`/dashboard/reports?year=${prevYearVal}&month=${prevMonthIdx}`);
  };

  const handleNextMonth = () => {
    router.push(`/dashboard/reports?year=${nextYearVal}&month=${nextMonthIdx}`);
  };

  const handleJumpToCurrent = () => {
    router.push(`/dashboard/reports?year=${currentYear}&month=${currentMonth}`);
  };

  const handleSelectMonth = (monthIdx: number, yearVal: number = pickerYear) => {
    setIsMonthOpen(false);
    router.push(`/dashboard/reports?year=${yearVal}&month=${monthIdx}`);
  };

  const handleNativeMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split("-").map(Number);
    if (y && m) {
      setIsMonthOpen(false);
      router.push(`/dashboard/reports?year=${y}&month=${m}`);
    }
  };

  // ----------------------------------------------------
  // Date & Week helpers
  // ----------------------------------------------------
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Sorted list of all active dates in this month
  const availableDates = useMemo(() => {
    const dates = (financials.summaries || [])
      .map((s) => s.date.split("T")[0])
      .sort()
      .reverse();
    if (dates.length > 0) return dates;
    const todayStr = new Date().toISOString().split("T")[0];
    if (todayStr.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`)) {
      return [todayStr];
    }
    return [`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`];
  }, [financials.summaries, selectedYear, selectedMonth]);

  const [selectedDayDate, setSelectedDayDate] = useState<string>(availableDates[0] || "");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(0);

  // Sync selected day when month changes
  useEffect(() => {
    if (availableDates.length > 0) {
      setSelectedDayDate(availableDates[0]);
    }
  }, [availableDates]);

  // Standard 7-day week intervals for the selected month
  const monthWeeks = useMemo(() => {
    const weeks = [
      { id: 0, label: "Week 1", startDay: 1, endDay: 7 },
      { id: 1, label: "Week 2", startDay: 8, endDay: 14 },
      { id: 2, label: "Week 3", startDay: 15, endDay: 21 },
      { id: 3, label: "Week 4", startDay: 22, endDay: 28 },
    ];
    if (daysInSelectedMonth > 28) {
      weeks.push({
        id: 4,
        label: "Week 5",
        startDay: 29,
        endDay: daysInSelectedMonth,
      });
    }
    return weeks.map((w) => {
      const sStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(w.startDay).padStart(2, "0")}`;
      const eStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(w.endDay).padStart(2, "0")}`;
      return {
        ...w,
        startDate: sStr,
        endDate: eStr,
        displayRange: `${SHORT_MONTHS[selectedMonth - 1]} ${String(w.startDay).padStart(2, "0")} – ${SHORT_MONTHS[selectedMonth - 1]} ${String(w.endDay).padStart(2, "0")}`,
      };
    });
  }, [selectedYear, selectedMonth, daysInSelectedMonth]);

  // ----------------------------------------------------
  // Scope Summaries for Modal Preview
  // ----------------------------------------------------
  // 1. Daily scope summary
  const dailyScopeData = useMemo(() => {
    const summary = (financials.summaries || []).find((s) => s.date.startsWith(selectedDayDate));
    const expenses = (financials.detailedExpenses || []).filter((e) => e.date.startsWith(selectedDayDate));
    const staff = (attendance || []).filter((emp) => emp.dates?.includes(selectedDayDate));

    const posSales = Number(summary?.totalPosSales || 0);
    const cashSales = Number(summary?.cashSales || 0);
    const cardSales = Number(summary?.cardSales || 0);
    const buyingCost = Number(summary?.totalBuyingCost || 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    return {
      date: selectedDayDate,
      posSales,
      cashSales,
      cardSales,
      buyingCost,
      expensesTotal,
      netProfit,
      expenses,
      staff,
    };
  }, [financials.summaries, financials.detailedExpenses, attendance, selectedDayDate]);

  // 2. Weekly scope summary
  const weeklyScopeData = useMemo(() => {
    const activeWeek = monthWeeks[selectedWeekIdx] || monthWeeks[0];
    const summariesInWeek = (financials.summaries || []).filter((s) => {
      const d = s.date.split("T")[0];
      return d >= activeWeek.startDate && d <= activeWeek.endDate;
    });
    const expensesInWeek = (financials.detailedExpenses || []).filter((e) => {
      const d = e.date.split("T")[0];
      return d >= activeWeek.startDate && d <= activeWeek.endDate;
    });
    const staffInWeek = (attendance || []).filter((emp) =>
      emp.dates?.some((d: string) => d >= activeWeek.startDate && d <= activeWeek.endDate)
    );

    const posSales = summariesInWeek.reduce((s, d) => s + Number(d.totalPosSales || 0), 0);
    const buyingCost = summariesInWeek.reduce((s, d) => s + Number(d.totalBuyingCost || 0), 0);
    const expensesTotal = expensesInWeek.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    return {
      week: activeWeek,
      summaries: summariesInWeek,
      expenses: expensesInWeek,
      staff: staffInWeek,
      posSales,
      buyingCost,
      expensesTotal,
      netProfit,
    };
  }, [monthWeeks, selectedWeekIdx, financials.summaries, financials.detailedExpenses, attendance]);

  // ----------------------------------------------------
  // Bulletproof PDF Printing Engine (Hidden Iframe + Fallback)
  // ----------------------------------------------------
  const printHtmlDocument = (html: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    let printed = false;
    try {
      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            printed = true;
          } catch {
            // fallback below
          } finally {
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
            }, 4000);
          }
        }, 350);
      }
    } catch {
      // ignore
    }

    if (!printed) {
      setTimeout(() => {
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(html);
          win.document.close();
        }
      }, 500);
    }
  };

  // Helper currency formatters
  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtInt = (n: number) => Number(n || 0).toLocaleString("en-LK");

  // Base Printable HTML Shell
  const buildPrintableShell = (
    docTitle: string,
    badgeText: string,
    kpiCards: { label: string; value: string; isNetProfit?: boolean; isPos?: boolean }[],
    contentHtml: string
  ) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${STORE_NAME} - ${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .report-meta {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .report-date {
      font-size: 10px;
      color: #64748b;
      margin: 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .kpi-value {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-profit-pos { color: #059669; }
    .kpi-profit-neg { color: #e11d48; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-green { color: #059669; }
    .text-red { color: #dc2626; }
    .total-row {
      background: #f8fafc;
      font-weight: 700;
      border-top: 2px solid #94a3b8;
    }
    .verification-box {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #475569;
    }
    .sign-line {
      border-bottom: 1px solid #94a3b8;
      width: 180px;
      display: inline-block;
      margin-left: 6px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
    .print-banner {
      display: block;
      background: #0284c7;
      color: #ffffff;
      padding: 10px 14px;
      margin-bottom: 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #ffffff;
      color: #0284c7;
      border: none;
      padding: 5px 12px;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .print-banner { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-banner">
    <span>Ready to download as PDF. Destination: "Save as PDF".</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="brand-title">${STORE_NAME}</h1>
      <p class="brand-subtitle">${STORE_SUBTITLE}</p>
    </div>
    <div class="report-meta">
      <div class="report-badge">${badgeText}</div>
      <p class="report-date">Generated on: ${new Date().toLocaleString("en-LK")}</p>
    </div>
  </div>

  <div class="kpi-grid">
    ${kpiCards
      .map(
        (c) => `<div class="kpi-card">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value ${
        c.isNetProfit
          ? c.isPos
            ? "kpi-profit-pos"
            : "kpi-profit-neg"
          : ""
      }">${c.value}</div>
    </div>`
      )
      .join("")}
  </div>

  ${contentHtml}

  <div class="verification-box">
    <div>Prepared by: <span class="sign-line"></span></div>
    <div>Verified by Manager: <span class="sign-line"></span></div>
  </div>

  <div class="footer">
    <span>${STORE_NAME} &bull; Confidential Business Operations Report</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;
  };

  // ----------------------------------------------------
  // 1. DAILY REPORT PDF & CSV EXPORT
  // ----------------------------------------------------
  const handleExportDailyPdf = (dateStr: string = selectedDayDate) => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const summary = (financials.summaries || []).find((s) => s.date.startsWith(dateStr));
    const expenses = (financials.detailedExpenses || []).filter((e) => e.date.startsWith(dateStr));
    const staff = (attendance || []).filter((emp) => emp.dates?.includes(dateStr));

    const posSales = Number(summary?.totalPosSales || 0);
    const cashSales = Number(summary?.cashSales || 0);
    const cardSales = Number(summary?.cardSales || 0);
    const buyingCost = Number(summary?.totalBuyingCost || 0);
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    const formattedDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-LK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const kpiCards = [
      { label: "Total POS Sales", value: `LKR ${fmt(posSales)}` },
      { label: "Fish Buying Cost", value: `LKR ${fmt(buyingCost)}` },
      { label: "Daily Expenses", value: `LKR ${fmt(expensesTotal)}` },
      {
        label: "Daily Net Profit",
        value: `LKR ${fmt(netProfit)}`,
        isNetProfit: true,
        isPos: netProfit >= 0,
      },
    ];

    const contentHtml = `
  <!-- Payment Breakdown Note -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; margin-bottom: 12px; display: flex; gap: 20px; font-size: 10px;">
    <span><strong>POS Sales Breakdown:</strong></span>
    <span>Cash Sales: <strong>LKR ${fmt(cashSales)}</strong></span>
    <span>Card / Bank Sales: <strong>LKR ${fmt(cardSales)}</strong></span>
    ${summary?.calculatedWastageCost ? `<span>Wastage Cost: <strong class="text-red">LKR ${fmt(summary.calculatedWastageCost)}</strong></span>` : ""}
  </div>

  <!-- Detailed Expenses for the Day -->
  <div class="section-title">
    <span>Daily Expenses Log (${dateStr})</span>
    <span style="font-size: 10px; color: #64748b;">${expenses.length} Records</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Expense Category / Note</th>
        <th style="width: 25%;">Logged By</th>
        <th class="text-right" style="width: 25%;">Amount (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        expenses.length === 0
          ? `<tr><td colspan="3" class="text-center" style="color: #94a3b8; padding: 12px;">No expenses recorded for this day.</td></tr>`
          : expenses
              .map(
                (e) => `<tr>
            <td class="font-semibold">${e.category}</td>
            <td>${e.userName || "System"}</td>
            <td class="text-right text-red font-semibold">${fmt(e.amount)}</td>
          </tr>`
              )
              .join("")
      }
      <tr class="total-row">
        <td colspan="2">Total Daily Expenses</td>
        <td class="text-right text-red font-bold">LKR ${fmt(expensesTotal)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Staff on Duty -->
  <div class="section-title">
    <span>Staff On Duty (${dateStr})</span>
    <span style="font-size: 10px; color: #64748b;">${staff.length} Employees Present</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 60%;">Employee Name</th>
        <th class="text-center" style="width: 40%;">Attendance Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        staff.length === 0
          ? `<tr><td colspan="2" class="text-center" style="color: #94a3b8; padding: 10px;">No staff attendance shift recorded for this date.</td></tr>`
          : staff
              .map(
                (emp) => `<tr>
            <td class="font-semibold">${emp.name}</td>
            <td class="text-center text-green font-semibold">PRESENT / ON DUTY</td>
          </tr>`
              )
              .join("")
      }
    </tbody>
  </table>`;

    const html = buildPrintableShell(
      `Daily Report - ${dateStr}`,
      `DAILY CLOSING REPORT: ${formattedDate}`,
      kpiCards,
      contentHtml
    );

    printHtmlDocument(html);
  };

  const handleExportDailyCsv = (dateStr: string = selectedDayDate) => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const summary = (financials.summaries || []).find((s) => s.date.startsWith(dateStr));
    const expenses = (financials.detailedExpenses || []).filter((e) => e.date.startsWith(dateStr));
    const staff = (attendance || []).filter((emp) => emp.dates?.includes(dateStr));

    const posSales = Number(summary?.totalPosSales || 0);
    const buyingCost = Number(summary?.totalBuyingCost || 0);
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    const rows: string[][] = [];
    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const addRow = (cols: any[]) => rows.push(cols.map(escapeCsv));
    const addBlank = () => rows.push([]);

    addRow([STORE_NAME]);
    addRow([`DAILY STORE PERFORMANCE REPORT - ${dateStr}`]);
    addRow(["Generated On", new Date().toLocaleString("en-LK")]);
    addBlank();

    addRow(["1. DAILY FINANCIAL SUMMARY"]);
    addRow(["Metric", "Amount (LKR)"]);
    addRow(["Total POS Sales", posSales]);
    addRow(["Cash Sales", Number(summary?.cashSales || 0)]);
    addRow(["Card Sales", Number(summary?.cardSales || 0)]);
    addRow(["Fish Buying Cost", buyingCost]);
    addRow(["Daily Expenses", expensesTotal]);
    addRow(["Net Profit", netProfit]);
    addBlank();

    addRow(["2. DETAILED EXPENSES FOR THE DAY"]);
    addRow(["Category / Note", "Logged By", "Amount (LKR)"]);
    expenses.forEach((e) => addRow([e.category, e.userName || "System", e.amount]));
    addRow(["Total Expenses", "", expensesTotal]);
    addBlank();

    addRow(["3. STAFF ON DUTY"]);
    addRow(["Employee Name", "Status"]);
    staff.forEach((emp) => addRow([emp.name, "PRESENT"]));

    downloadCsvBlob(rows, `Arthur_Sons_Daily_Report_${dateStr}.csv`);
  };

  // ----------------------------------------------------
  // 2. WEEKLY REPORT PDF & CSV EXPORT
  // ----------------------------------------------------
  const handleExportWeeklyPdf = (weekIdx: number = selectedWeekIdx) => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const week = monthWeeks[weekIdx] || monthWeeks[0];
    const summaries = (financials.summaries || []).filter((s) => {
      const d = s.date.split("T")[0];
      return d >= week.startDate && d <= week.endDate;
    });
    const expenses = (financials.detailedExpenses || []).filter((e) => {
      const d = e.date.split("T")[0];
      return d >= week.startDate && d <= week.endDate;
    });
    const staff = (attendance || []).filter((emp) =>
      emp.dates?.some((d: string) => d >= week.startDate && d <= week.endDate)
    );

    const posSales = summaries.reduce((s, d) => s + Number(d.totalPosSales || 0), 0);
    const buyingCost = summaries.reduce((s, d) => s + Number(d.totalBuyingCost || 0), 0);
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    const kpiCards = [
      { label: `Weekly POS Sales`, value: `LKR ${fmt(posSales)}` },
      { label: `Weekly Buying Cost`, value: `LKR ${fmt(buyingCost)}` },
      { label: `Weekly Expenses`, value: `LKR ${fmt(expensesTotal)}` },
      {
        label: `Weekly Net Profit`,
        value: `LKR ${fmt(netProfit)}`,
        isNetProfit: true,
        isPos: netProfit >= 0,
      },
    ];

    const contentHtml = `
  <!-- Daily Breakdown in Week -->
  <div class="section-title">
    <span>Daily Performance in ${week.label} (${week.displayRange})</span>
    <span style="font-size: 10px; color: #64748b;">${summaries.length} Days Active</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Date</th>
        <th class="text-right" style="width: 20%;">POS Sales (LKR)</th>
        <th class="text-right" style="width: 20%;">Buying Cost (LKR)</th>
        <th class="text-right" style="width: 20%;">Expenses (LKR)</th>
        <th class="text-right" style="width: 20%;">Net Profit (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        summaries.length === 0
          ? `<tr><td colspan="5" class="text-center" style="color: #94a3b8; padding: 12px;">No daily records in this week.</td></tr>`
          : summaries
              .map(
                (d) => `<tr>
            <td>${new Date(d.date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" })}</td>
            <td class="text-right">${fmt(d.totalPosSales)}</td>
            <td class="text-right">${fmt(d.totalBuyingCost)}</td>
            <td class="text-right text-red">${fmt(d.calculatedExpenses)}</td>
            <td class="text-right font-semibold ${d.netProfit >= 0 ? "text-green" : "text-red"}">${fmt(d.netProfit)}</td>
          </tr>`
              )
              .join("")
      }
      <tr class="total-row">
        <td>Total for ${week.label}</td>
        <td class="text-right">LKR ${fmt(posSales)}</td>
        <td class="text-right">LKR ${fmt(buyingCost)}</td>
        <td class="text-right text-red">LKR ${fmt(expensesTotal)}</td>
        <td class="text-right font-bold ${netProfit >= 0 ? "text-green" : "text-red"}">LKR ${fmt(netProfit)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Detailed Expenses in Week -->
  <div class="section-title">
    <span>Detailed Expenses (${week.displayRange})</span>
    <span style="font-size: 10px; color: #64748b;">${expenses.length} Records</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Date</th>
        <th style="width: 45%;">Category / Note</th>
        <th style="width: 20%;">Logged By</th>
        <th class="text-right" style="width: 15%;">Amount (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        expenses.length === 0
          ? `<tr><td colspan="4" class="text-center" style="color: #94a3b8; padding: 10px;">No expenses recorded in this week.</td></tr>`
          : expenses
              .map(
                (e) => `<tr>
            <td>${new Date(e.date).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}</td>
            <td class="font-semibold">${e.category}</td>
            <td>${e.userName || "System"}</td>
            <td class="text-right text-red font-semibold">${fmt(e.amount)}</td>
          </tr>`
              )
              .join("")
      }
      <tr class="total-row">
        <td colspan="3">Total Weekly Expenses</td>
        <td class="text-right text-red font-bold">LKR ${fmt(expensesTotal)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Staff Active in Week -->
  <div class="section-title">
    <span>Staff Present (${week.displayRange})</span>
    <span style="font-size: 10px; color: #64748b;">${staff.length} Staff Members</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 60%;">Employee Name</th>
        <th class="text-center" style="width: 40%;">Shifts in this Week</th>
      </tr>
    </thead>
    <tbody>
      ${
        staff.length === 0
          ? `<tr><td colspan="2" class="text-center" style="color: #94a3b8; padding: 8px;">No staff attendance in this week.</td></tr>`
          : staff
              .map((emp) => {
                const shiftsCount = (emp.dates || []).filter(
                  (d: string) => d >= week.startDate && d <= week.endDate
                ).length;
                return `<tr>
            <td class="font-semibold">${emp.name}</td>
            <td class="text-center font-bold text-green">${shiftsCount} Shifts</td>
          </tr>`;
              })
              .join("")
      }
    </tbody>
  </table>`;

    const html = buildPrintableShell(
      `Weekly Report - ${week.label}`,
      `WEEKLY REPORT: ${week.label} (${week.displayRange}, ${selectedYear})`,
      kpiCards,
      contentHtml
    );

    printHtmlDocument(html);
  };

  const handleExportWeeklyCsv = (weekIdx: number = selectedWeekIdx) => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const week = monthWeeks[weekIdx] || monthWeeks[0];
    const summaries = (financials.summaries || []).filter((s) => {
      const d = s.date.split("T")[0];
      return d >= week.startDate && d <= week.endDate;
    });
    const expenses = (financials.detailedExpenses || []).filter((e) => {
      const d = e.date.split("T")[0];
      return d >= week.startDate && d <= week.endDate;
    });

    const posSales = summaries.reduce((s, d) => s + Number(d.totalPosSales || 0), 0);
    const buyingCost = summaries.reduce((s, d) => s + Number(d.totalBuyingCost || 0), 0);
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = posSales - buyingCost - expensesTotal;

    const rows: string[][] = [];
    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const addRow = (cols: any[]) => rows.push(cols.map(escapeCsv));
    const addBlank = () => rows.push([]);

    addRow([STORE_NAME]);
    addRow([`WEEKLY PERFORMANCE REPORT - ${week.label.toUpperCase()} (${week.displayRange}, ${selectedYear})`]);
    addRow(["Generated On", new Date().toLocaleString("en-LK")]);
    addBlank();

    addRow(["1. WEEKLY FINANCIAL OVERVIEW"]);
    addRow(["Metric", "Amount (LKR)"]);
    addRow(["Total POS Sales", posSales]);
    addRow(["Total Buying Cost", buyingCost]);
    addRow(["Total Expenses", expensesTotal]);
    addRow(["Net Profit", netProfit]);
    addBlank();

    addRow(["2. DAILY PERFORMANCE IN THIS WEEK"]);
    addRow(["Date", "POS Sales (LKR)", "Buying Cost (LKR)", "Expenses (LKR)", "Net Profit (LKR)"]);
    summaries.forEach((d) => {
      addRow([
        d.date.split("T")[0],
        d.totalPosSales,
        d.totalBuyingCost,
        d.calculatedExpenses,
        d.netProfit,
      ]);
    });
    addRow(["Total", posSales, buyingCost, expensesTotal, netProfit]);
    addBlank();

    addRow(["3. DETAILED EXPENSES IN THIS WEEK"]);
    addRow(["Date", "Category / Note", "Logged By", "Amount (LKR)"]);
    expenses.forEach((e) => addRow([e.date.split("T")[0], e.category, e.userName || "System", e.amount]));
    addRow(["Total Recorded Expenses", "", "", expensesTotal]);

    downloadCsvBlob(
      rows,
      `Arthur_Sons_Weekly_Report_${MONTHS[selectedMonth - 1]}_Week${weekIdx + 1}_${selectedYear}.csv`
    );
  };

  // ----------------------------------------------------
  // 3. MONTHLY REPORT PDF & CSV EXPORT
  // ----------------------------------------------------
  const handleExportMonthlyPdf = () => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const monthName = MONTHS[selectedMonth - 1];

    const payrollTotalEarned = attendance.reduce((s, e) => s + (e.earnedPay || 0), 0);
    const payrollTotalAdvances = attendance.reduce((s, e) => s + (e.advancesTaken || 0), 0);
    const payrollTotalPayout = attendance.reduce((s, e) => s + (e.finalPayout || 0), 0);
    const expensesTotal = financials.detailedExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    const summariesTotalPos = (financials.summaries || []).reduce((s, d) => s + (d.totalPosSales || 0), 0);
    const summariesTotalBuying = (financials.summaries || []).reduce((s, d) => s + (d.totalBuyingCost || 0), 0);
    const summariesTotalExpenses = (financials.summaries || []).reduce((s, d) => s + (d.calculatedExpenses || 0), 0);
    const summariesTotalNet = (financials.summaries || []).reduce((s, d) => s + (d.netProfit || 0), 0);

    const kpiCards = [
      { label: "Total POS Sales", value: `LKR ${fmt(financials.totals.totalPosSales)}` },
      { label: "Total Buying Cost", value: `LKR ${fmt(financials.totals.totalBuyingCost)}` },
      { label: "Total Expenses", value: `LKR ${fmt(financials.totals.totalExpenses)}` },
      {
        label: "Net Profit",
        value: `LKR ${fmt(financials.totals.totalNetProfit)}`,
        isNetProfit: true,
        isPos: financials.totals.totalNetProfit >= 0,
      },
    ];

    const contentHtml = `
  <!-- Staff Payroll & Attendance Table -->
  <div class="section-title">
    <span>Staff Attendance &amp; Payroll Summary</span>
    <span style="font-size: 10px; color: #64748b;">${attendance.length} Employees</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Employee Name</th>
        <th class="text-center" style="width: 16%;">Days Present</th>
        <th class="text-right" style="width: 16%;">Earned Wages</th>
        <th class="text-right" style="width: 16%;">Advances Taken</th>
        <th class="text-right" style="width: 20%;">Final Payout (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        attendance.length === 0
          ? `<tr><td colspan="5" class="text-center" style="color: #94a3b8; padding: 12px;">No employee payroll records found.</td></tr>`
          : attendance
              .map(
                (emp) => `<tr>
            <td class="font-semibold">${emp.name} ${!emp.isActive ? '<span style="font-size: 8px; color: #64748b;">(Past)</span>' : ""}</td>
            <td class="text-center">${emp.presentDays} / ${emp.daysInMonth}</td>
            <td class="text-right">${fmtInt(emp.earnedPay)}</td>
            <td class="text-right text-red">${emp.advancesTaken > 0 ? `-${fmtInt(emp.advancesTaken)}` : "0"}</td>
            <td class="text-right font-bold text-green">${fmtInt(emp.finalPayout)}</td>
          </tr>`
              )
              .join("")
      }
      ${
        attendance.length > 0
          ? `<tr class="total-row">
            <td>Total Payroll Payout</td>
            <td class="text-center">${attendance.reduce((s, e) => s + (e.presentDays || 0), 0)} shifts</td>
            <td class="text-right">${fmtInt(payrollTotalEarned)}</td>
            <td class="text-right text-red">-${fmtInt(payrollTotalAdvances)}</td>
            <td class="text-right font-bold text-green">LKR ${fmtInt(payrollTotalPayout)}</td>
          </tr>`
          : ""
      }
    </tbody>
  </table>

  <!-- Daily Store Summaries -->
  ${
    financials.summaries && financials.summaries.length > 0
      ? `
  <div class="section-title">
    <span>Daily Store Performance Breakdown</span>
    <span style="font-size: 10px; color: #64748b;">${financials.summaries.length} Days Active</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Date</th>
        <th class="text-right" style="width: 20%;">POS Sales (LKR)</th>
        <th class="text-right" style="width: 20%;">Buying Cost (LKR)</th>
        <th class="text-right" style="width: 20%;">Expenses (LKR)</th>
        <th class="text-right" style="width: 20%;">Net Profit (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${financials.summaries
        .map(
          (d) => `<tr>
        <td>${new Date(d.date).toLocaleDateString("en-LK", { month: "short", day: "numeric", year: "numeric" })}</td>
        <td class="text-right">${fmt(d.totalPosSales)}</td>
        <td class="text-right">${fmt(d.totalBuyingCost)}</td>
        <td class="text-right text-red">${fmt(d.calculatedExpenses)}</td>
        <td class="text-right font-semibold ${d.netProfit >= 0 ? "text-green" : "text-red"}">${fmt(d.netProfit)}</td>
      </tr>`
        )
        .join("")}
      <tr class="total-row">
        <td>Total Summary</td>
        <td class="text-right">LKR ${fmt(summariesTotalPos)}</td>
        <td class="text-right">LKR ${fmt(summariesTotalBuying)}</td>
        <td class="text-right text-red">LKR ${fmt(summariesTotalExpenses)}</td>
        <td class="text-right font-bold ${summariesTotalNet >= 0 ? "text-green" : "text-red"}">LKR ${fmt(summariesTotalNet)}</td>
      </tr>
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Detailed Expenses Log -->
  <div class="section-title">
    <span>Detailed Expenses Log</span>
    <span style="font-size: 10px; color: #64748b;">${financials.detailedExpenses.length} Records</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Date</th>
        <th style="width: 45%;">Category / Note</th>
        <th style="width: 20%;">Logged By</th>
        <th class="text-right" style="width: 15%;">Amount (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${
        financials.detailedExpenses.length === 0
          ? `<tr><td colspan="4" class="text-center" style="color: #94a3b8; padding: 12px;">No expenses recorded for this month.</td></tr>`
          : financials.detailedExpenses
              .map(
                (exp) => `<tr>
            <td>${new Date(exp.date).toLocaleDateString("en-LK", { month: "short", day: "numeric", year: "numeric" })}</td>
            <td class="font-semibold">${exp.category}</td>
            <td>${exp.userName || "System"}</td>
            <td class="text-right text-red font-semibold">${fmt(exp.amount)}</td>
          </tr>`
              )
              .join("")
      }
      ${
        financials.detailedExpenses.length > 0
          ? `<tr class="total-row">
            <td colspan="3">Total Recorded Expenses</td>
            <td class="text-right text-red font-bold">LKR ${fmt(expensesTotal)}</td>
          </tr>`
          : ""
      }
    </tbody>
  </table>`;

    const html = buildPrintableShell(
      `Monthly Report - ${monthName} ${selectedYear}`,
      `MONTHLY REPORT: ${monthName} ${selectedYear}`,
      kpiCards,
      contentHtml
    );

    printHtmlDocument(html);
  };

  const handleExportMonthlyCsv = () => {
    setIsExportOpen(false);
    setDownloadModalOpen(false);

    const monthName = MONTHS[selectedMonth - 1];
    const rows: string[][] = [];

    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const addRow = (cols: any[]) => rows.push(cols.map(escapeCsv));
    const addBlank = () => rows.push([]);

    addRow([STORE_NAME]);
    addRow([`MONTHLY BUSINESS & FINANCIAL REPORT - ${monthName.toUpperCase()} ${selectedYear}`]);
    addRow(["Generated On", new Date().toLocaleString("en-LK")]);
    addBlank();

    // Financial Overview
    addRow(["1. FINANCIAL OVERVIEW"]);
    addRow(["Metric", "Amount (LKR)"]);
    addRow(["Total POS Sales", financials.totals.totalPosSales]);
    addRow(["Total Buying Cost", financials.totals.totalBuyingCost]);
    addRow(["Total Expenses", financials.totals.totalExpenses]);
    addRow(["Net Profit", financials.totals.totalNetProfit]);
    addBlank();

    // Staff Payroll & Attendance
    addRow(["2. STAFF PAYROLL & ATTENDANCE"]);
    addRow([
      "Employee Name",
      "Status",
      "Days Present",
      "Days in Month",
      "Earned Wages (LKR)",
      "Salary Advances (LKR)",
      "Final Payout (LKR)",
    ]);
    attendance.forEach((emp) => {
      addRow([
        emp.name,
        emp.isActive ? "Active" : "Past Staff",
        emp.presentDays,
        emp.daysInMonth,
        emp.earnedPay,
        emp.advancesTaken,
        emp.finalPayout,
      ]);
    });
    const payrollTotalEarned = attendance.reduce((s, e) => s + (e.earnedPay || 0), 0);
    const payrollTotalAdvances = attendance.reduce((s, e) => s + (e.advancesTaken || 0), 0);
    const payrollTotalPayout = attendance.reduce((s, e) => s + (e.finalPayout || 0), 0);
    addRow([
      "Total",
      "",
      attendance.reduce((s, e) => s + (e.presentDays || 0), 0),
      "",
      payrollTotalEarned,
      payrollTotalAdvances,
      payrollTotalPayout,
    ]);
    addBlank();

    // Daily Summaries
    if (financials.summaries && financials.summaries.length > 0) {
      addRow(["3. DAILY STORE PERFORMANCE SUMMARIES"]);
      addRow([
        "Date",
        "POS Sales (LKR)",
        "Cash Sales (LKR)",
        "Card Sales (LKR)",
        "Buying Cost (LKR)",
        "Expenses (LKR)",
        "Net Profit (LKR)",
      ]);
      financials.summaries.forEach((d) => {
        addRow([
          d.date.split("T")[0],
          d.totalPosSales,
          d.cashSales || 0,
          d.cardSales || 0,
          d.totalBuyingCost,
          d.calculatedExpenses,
          d.netProfit,
        ]);
      });
      addBlank();
    }

    // Detailed Expenses
    addRow(["4. DETAILED EXPENSES LOG"]);
    addRow(["Date", "Category / Note", "Logged By", "Amount (LKR)"]);
    financials.detailedExpenses.forEach((exp) => {
      addRow([exp.date.split("T")[0], exp.category, exp.userName || "System", exp.amount]);
    });
    addRow([
      "Total Recorded Expenses",
      "",
      "",
      financials.detailedExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    ]);
    addBlank();

    // Historical archive
    if (pastMonths && pastMonths.length > 0) {
      addRow(["5. HISTORICAL MONTHS SUMMARY"]);
      addRow([
        "Month & Year",
        "POS Sales (LKR)",
        "Buying Cost (LKR)",
        "Expenses (LKR)",
        "Net Profit (LKR)",
        "Days Active",
      ]);
      pastMonths.forEach((pm) => {
        addRow([
          `${MONTHS[pm.month - 1]} ${pm.year}`,
          pm.totalPosSales,
          pm.totalBuyingCost,
          pm.totalExpenses,
          pm.totalNetProfit,
          pm.daysCount,
        ]);
      });
    }

    downloadCsvBlob(
      rows,
      `Arthur_Sons_Monthly_Report_${monthName}_${selectedYear}.csv`
    );
  };

  // Generic CSV Blob Downloader
  const downloadCsvBlob = (rows: string[][], filename: string) => {
    const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-fuchsia-500" />
            <h1 className="text-xl font-bold text-slate-800">
              {STORE_NAME} &bull; Reports
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            View aggregated financial and staff data for {MONTHS[selectedMonth - 1]} {selectedYear}. Download reports by Daily, Weekly, or Monthly.
          </p>
          {!isCurrentMonth && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 mt-1.5 shadow-xs">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Viewing Historical Report: <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong></span>
              <button
                onClick={handleJumpToCurrent}
                className="underline hover:text-amber-900 ml-1 font-semibold flex items-center gap-1 cursor-pointer"
                title="Return to current month"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Jump to Current Month
              </button>
            </div>
          )}
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Jump to Current Button (if in past) */}
          {!isCurrentMonth && (
            <button
              onClick={handleJumpToCurrent}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Return to this month's report"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Current Month
            </button>
          )}

          {/* Stepper: Previous Month Button */}
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title={`Go to previous month: ${prevLabel}`}
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{prevLabel}</span>
          </button>

          {/* Stepper: Main Month/Year Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white border rounded-lg text-sm font-semibold shadow-xs hover:bg-slate-50 transition-all cursor-pointer min-w-[170px] ${
                isMonthOpen ? "border-fuchsia-500 ring-2 ring-fuchsia-100" : "border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fuchsia-500" />
                <span>{MONTHS[selectedMonth - 1]} {selectedYear}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMonthOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Popover */}
            {isMonthOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Year Header Navigator */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Previous year"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                    <span>{pickerYear}</span>
                    {pickerYear === currentYear && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Current</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerYear(pickerYear + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Next year"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12-Month Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MONTHS.map((monthName, idx) => {
                    const mNum = idx + 1;
                    const isSelected = selectedYear === pickerYear && selectedMonth === mNum;
                    const isThisCurrent = currentYear === pickerYear && currentMonth === mNum;

                    return (
                      <button
                        key={monthName}
                        type="button"
                        onClick={() => handleSelectMonth(mNum, pickerYear)}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200 font-bold"
                            : isThisCurrent
                            ? "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {SHORT_MONTHS[idx]}
                      </button>
                    );
                  })}
                </div>

                {/* Native Month Picker Shortcut */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Specific Date:</span>
                  <div className="relative">
                    <input
                      type="month"
                      value={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`}
                      onChange={handleNativeMonthInput}
                      className="text-xs px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper: Next Month Button */}
          <button
            onClick={handleNextMonth}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title={`Go to next month: ${nextLabel}`}
          >
            <span className="hidden sm:inline">{nextLabel}</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>

          {/* Download Report Modal Trigger */}
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Download report by Daily, Weekly, or Monthly"
          >
            <Download className="w-3.5 h-3.5 text-rose-100" />
            <span>Download Report</span>
          </button>

          {/* Export Dropdown (Quick Options) */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Quick export options"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isExportOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Download (PDF &amp; CSV)
                </div>

                {/* Monthly */}
                <button
                  type="button"
                  onClick={handleExportMonthlyPdf}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Monthly Report (PDF)</p>
                    <p className="text-[10px] text-slate-400">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                </button>

                {/* Weekly */}
                <button
                  type="button"
                  onClick={() => handleExportWeeklyPdf(selectedWeekIdx)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Weekly Report (PDF)</p>
                    <p className="text-[10px] text-slate-400">{monthWeeks[selectedWeekIdx]?.label || "Week 1"}</p>
                  </div>
                </button>

                {/* Daily */}
                <button
                  type="button"
                  onClick={() => handleExportDailyPdf(selectedDayDate)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Daily Report (PDF)</p>
                    <p className="text-[10px] text-slate-400">{selectedDayDate || "Selected day"}</p>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Monthly CSV */}
                <button
                  type="button"
                  onClick={handleExportMonthlyCsv}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Monthly Excel / CSV</p>
                    <p className="text-[10px] text-slate-400">Complete spreadsheet</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setDownloadModalOpen(true);
                  }}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-center transition-colors cursor-pointer"
                >
                  More Download Options...
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financials Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Financial Overview</span>
            <span className="text-xs font-medium text-slate-400 font-normal">
              ({MONTHS[selectedMonth - 1]} {selectedYear})
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total POS Sales</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg shrink-0">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Buying Cost</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg shrink-0">
              <Activity className="w-6 h-6 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">
                LKR {financials.totals.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-fuchsia-100 rounded-lg shrink-0">
              <PieChart className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Profit</p>
              <h3 className={`text-xl font-bold truncate ${financials.totals.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                LKR {financials.totals.totalNetProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Store Performance Breakdown Table with Row-Level PDF Print */}
      {financials.summaries && financials.summaries.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-500" />
                Daily Store Performance Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Day-by-day revenue, procurement costs, and net margin. Click "Daily PDF" on any date to download its closing report.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
              {financials.summaries.length} Days Active in {MONTHS[selectedMonth - 1]}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">POS Sales</th>
                  <th className="px-4 py-3 font-semibold text-right">Buying Cost</th>
                  <th className="px-4 py-3 font-semibold text-right">Expenses</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Profit</th>
                  <th className="px-4 py-3 font-semibold text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials.summaries.map((d) => {
                  const dStr = d.date.split("T")[0];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>
                            {new Date(`${dStr}T12:00:00`).toLocaleDateString("en-LK", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {d.isClosed === false && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                              POS Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        LKR {Number(d.totalPosSales || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        LKR {Number(d.totalBuyingCost || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        LKR {Number(d.calculatedExpenses || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${d.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        LKR {Number(d.netProfit || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleExportDailyPdf(dStr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 shadow-2xs transition-all cursor-pointer"
                          title={`Download closing PDF for ${dStr}`}
                        >
                          <FileText className="w-3 h-3 text-rose-500" />
                          <span>Daily PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance, Payroll & Expenses Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance and Payroll Report */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Monthly Payroll &amp; Attendance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Calculated as Earned Wages (Standard Shift / Sunday Rate) - Salary Advances</p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          {attendance.length > 0 && attendance.every(e => e.presentDays === 0) && attendance.some(e => e.advancesTaken > 0) && (
            <div className="mx-4 mt-4 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
              <span className="font-semibold">Note:</span>
              <span>No attendance shifts have been logged for {MONTHS[selectedMonth - 1]} {selectedYear} yet. Advances are recorded, but staff attendance must be marked in the <strong>Attendance</strong> tab to calculate earned wages.</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium text-center">Days Present</th>
                  <th className="px-4 py-2.5 font-medium text-right">Earned (LKR)</th>
                  <th className="px-4 py-2.5 font-medium text-right">Advances (LKR)</th>
                  <th className="px-4 py-2.5 font-medium text-right text-emerald-600">Final Pay (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No employee data found for {MONTHS[selectedMonth - 1]} {selectedYear}.</td>
                  </tr>
                ) : (
                  attendance.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {emp.name}
                        {!emp.isActive && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">Past Staff</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">
                        {emp.presentDays} <span className="text-xs text-slate-400 font-normal">/ {emp.daysInMonth}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{emp.earnedPay.toLocaleString("en-LK")}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{emp.advancesTaken > 0 ? `-${emp.advancesTaken.toLocaleString("en-LK")}` : "0"}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{emp.finalPayout.toLocaleString("en-LK")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Expenses Report */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Detailed Expense Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">All expenses recorded during {MONTHS[selectedMonth - 1]} {selectedYear}.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
              <p className="text-sm font-bold text-rose-600">{financials.totals.totalExpenses.toLocaleString("en-LK")} LKR</p>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Category / Note</th>
                  <th className="px-4 py-2.5 font-medium">Logged By</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials.detailedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No expenses recorded for {MONTHS[selectedMonth - 1]} {selectedYear}.</td>
                  </tr>
                ) : (
                  financials.detailedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(exp.date).toLocaleDateString("en-LK", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{exp.category}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{exp.userName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">{exp.amount.toLocaleString("en-LK")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Months Archive Section */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-fuchsia-500" />
              Past Monthly Reports Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of recorded monthly financials. Click "View Report" to inspect any past month's full breakdown.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
            {pastMonths.length} {pastMonths.length === 1 ? "Month" : "Months"} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Month &amp; Year</th>
                <th className="px-4 py-3 font-semibold text-right">POS Sales</th>
                <th className="px-4 py-3 font-semibold text-right">Buying Cost</th>
                <th className="px-4 py-3 font-semibold text-right">Expenses</th>
                <th className="px-4 py-3 font-semibold text-right">Net Profit</th>
                <th className="px-4 py-3 font-semibold text-center">Days Active</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastMonths.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No historical monthly records found.
                  </td>
                </tr>
              ) : (
                pastMonths.map((pm) => {
                  const isViewing = pm.year === selectedYear && pm.month === selectedMonth;
                  const monthName = MONTHS[pm.month - 1];

                  return (
                    <tr
                      key={pm.monthKey}
                      className={`transition-colors ${
                        isViewing ? "bg-fuchsia-50/60 font-medium" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{monthName} {pm.year}</span>
                          {pm.year === currentYear && pm.month === currentMonth && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              Current Month
                            </span>
                          )}
                          {isViewing && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-fuchsia-600" />
                              Active View
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">
                        LKR {pm.totalPosSales.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        LKR {pm.totalBuyingCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        LKR {pm.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${pm.totalNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        LKR {pm.totalNetProfit.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs">
                        {pm.daysCount > 0 ? `${pm.daysCount} days` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isViewing ? (
                          <span className="text-xs font-bold text-fuchsia-600">
                            Viewing
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectMonth(pm.month, pm.year)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-300 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------
          DOWNLOAD REPORT MODAL (Daily, Weekly, Monthly)
      ----------------------------------------------------- */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Download Operations Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    {STORE_NAME} &bull; Choose your report scope
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDownloadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Navigation Tabs */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setReportScope("daily")}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportScope === "daily"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  <span>Daily</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportScope("weekly")}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportScope === "weekly"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Weekly</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportScope("monthly")}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportScope === "monthly"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-fuchsia-500" />
                  <span>Monthly</span>
                </button>
              </div>
            </div>

            {/* Modal Body Based on Active Tab */}
            <div className="p-5 space-y-4">
              {/* TAB 1: DAILY */}
              {reportScope === "daily" && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Date in {MONTHS[selectedMonth - 1]} {selectedYear}:
                    </label>
                    <select
                      value={selectedDayDate}
                      onChange={(e) => setSelectedDayDate(e.target.value)}
                      className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      {availableDates.map((dateStr) => (
                        <option key={dateStr} value={dateStr}>
                          {new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-LK", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Daily Live Preview Card */}
                  <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Daily POS Revenue:</span>
                      <strong className="text-slate-800">LKR {fmt(dailyScopeData.posSales)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Daily Buying Cost:</span>
                      <strong className="text-slate-800">LKR {fmt(dailyScopeData.buyingCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Expenses Recorded:</span>
                      <strong className="text-rose-600">LKR {fmt(dailyScopeData.expensesTotal)} ({dailyScopeData.expenses.length} logs)</strong>
                    </div>
                    <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">Estimated Net Margin:</span>
                      <strong className={dailyScopeData.netProfit >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        LKR {fmt(dailyScopeData.netProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExportDailyPdf(selectedDayDate)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Daily PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportDailyCsv(selectedDayDate)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: WEEKLY */}
              {reportScope === "weekly" && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Week Period:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {monthWeeks.map((w, idx) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWeekIdx(idx)}
                          className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            selectedWeekIdx === idx
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <p className="font-bold">{w.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{w.displayRange}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Live Preview Card */}
                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Active Days in Week:</span>
                      <strong className="text-slate-800">{weeklyScopeData.summaries.length} recorded days</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Weekly POS Sales:</span>
                      <strong className="text-slate-800">LKR {fmt(weeklyScopeData.posSales)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Weekly Buying Cost:</span>
                      <strong className="text-slate-800">LKR {fmt(weeklyScopeData.buyingCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Weekly Expenses:</span>
                      <strong className="text-rose-600">LKR {fmt(weeklyScopeData.expensesTotal)}</strong>
                    </div>
                    <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">Weekly Net Profit:</span>
                      <strong className={weeklyScopeData.netProfit >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        LKR {fmt(weeklyScopeData.netProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExportWeeklyPdf(selectedWeekIdx)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Weekly PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportWeeklyCsv(selectedWeekIdx)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: MONTHLY */}
              {reportScope === "monthly" && (
                <div className="space-y-4 animate-in fade-in duration-100">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {MONTHS[selectedMonth - 1]} {selectedYear} Report
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Complete financial audit, staff payroll, daily logs &amp; expenses
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700">
                      {isCurrentMonth ? "Active Month" : "Archive"}
                    </span>
                  </div>

                  {/* Monthly Summary Preview */}
                  <div className="p-4 bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Total POS Sales:</span>
                      <strong className="text-slate-800">LKR {fmt(financials.totals.totalPosSales)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Total Fish Buying:</span>
                      <strong className="text-slate-800">LKR {fmt(financials.totals.totalBuyingCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Total Expenses:</span>
                      <strong className="text-rose-600">LKR {fmt(financials.totals.totalExpenses)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Staff on Payroll:</span>
                      <strong className="text-indigo-600">{attendance.length} Staff Members</strong>
                    </div>
                    <div className="pt-2 border-t border-fuchsia-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">Monthly Net Profit:</span>
                      <strong className={financials.totals.totalNetProfit >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        LKR {fmt(financials.totals.totalNetProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleExportMonthlyPdf}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Monthly PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMonthlyCsv}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
              PDF reports are formatted for standard A4 printing and digital archiving.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
