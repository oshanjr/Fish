/**
 * Script to backfill employee attendance for October and November 2026.
 *
 * Usage:
 *   node scripts/backfill-attendance.js --dry-run   (preview what will be inserted)
 *   node scripts/backfill-attendance.js             (apply changes to the database)
 */

const { PrismaClient } = require("../node_modules/.prisma/client");
const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  // Get active employees
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${employees.length} active employees:`);
  employees.forEach((e) => console.log(` - ${e.name} (Base: ${e.baseSalary}, Sunday: ${e.sundayPayment})`));
  console.log();

  // Date range to backfill: Sep 20, 2026 to Nov 6, 2026
  const startDate = new Date(2026, 8, 20); // Sep 20, 2026
  const endDate = new Date(2026, 10, 6);   // Nov 6, 2026

  // Fetch existing attendance in this range so we never duplicate
  const existing = await prisma.staffAttendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    select: { employeeId: true, date: true },
  });

  const existingSet = new Set(
    existing.map((e) => `${e.employeeId}_${e.date.toISOString().split("T")[0]}`)
  );

  let toInsert = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const dateStr = curr.toISOString().split("T")[0];
    const isSunday = curr.getDay() === 0;

    for (const emp of employees) {
      const key = `${emp.id}_${dateStr}`;
      if (existingSet.has(key)) continue;

      const baseSal = Number(emp.baseSalary);
      const sundayPay = Number(emp.sundayPayment);

      // Jayarathne has a monthly/different scheme (base 20000, 0 sunday pay)
      let earnedPay = baseSal;
      if (isSunday) {
        earnedPay = sundayPay > 0 ? sundayPay : baseSal;
      }

      toInsert.push({
        employeeId: emp.id,
        date: new Date(curr),
        status: "PRESENT",
        hoursWorked: 12,
        earnedPay,
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  console.log(`Total attendance records to insert: ${toInsert.length}`);

  if (dryRun) {
    console.log("=== DRY RUN MODE: No records created ===");
    return;
  }

  // Insert records in batches
  const batchSize = 100;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    await prisma.staffAttendance.createMany({
      data: batch,
    });
    console.log(`Inserted batch ${i + 1} to ${Math.min(i + batchSize, toInsert.length)}`);
  }

  console.log("Attendance backfill completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

