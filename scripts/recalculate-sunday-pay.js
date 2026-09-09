// One-time migration script to recalculate all attendance earned pay
// Sundays: flat sundayPayment only
// Other days: baseSalary × (hours / 12)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Recalculating all attendance records...\n");

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, baseSalary: true, sundayPayment: true },
  });

  let totalUpdated = 0;

  for (const emp of employees) {
    const baseSalary = Number(emp.baseSalary);
    const sundayPayment = Number(emp.sundayPayment);

    const records = await prisma.staffAttendance.findMany({
      where: { employeeId: emp.id },
    });

    let totalPayDelta = 0;

    for (const record of records) {
      const hours = record.hoursWorked ? Number(record.hoursWorked) : 0;
      const oldPay = record.earnedPay ? Number(record.earnedPay) : 0;
      const isSunday = record.date.getDay() === 0;

      let newPay = 0;
      if (isSunday && hours > 0) {
        newPay = sundayPayment;
      } else {
        newPay = baseSalary * (hours / 12);
      }

      const delta = newPay - oldPay;

      if (Math.abs(delta) > 0.001) {
        await prisma.staffAttendance.update({
          where: { id: record.id },
          data: { earnedPay: newPay },
        });
        totalPayDelta += delta;
        totalUpdated++;

        const dayName = isSunday ? "SUN" : record.date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
        console.log(
          `  ${emp.name} | ${record.date.toISOString().split("T")[0]} (${dayName}) | ${oldPay.toFixed(2)} -> ${newPay.toFixed(2)} (${delta >= 0 ? "+" : ""}${delta.toFixed(2)})`
        );
      }
    }

    // Update payroll if there was any change
    if (Math.abs(totalPayDelta) > 0.001) {
      const payroll = await prisma.staffPayroll.findUnique({
        where: { employeeId: emp.id },
      });

      if (payroll) {
        const newEarned = Number(payroll.earnedSalary) + totalPayDelta;
        const newBalance = Number(payroll.balanceOwed) + totalPayDelta;
        await prisma.staffPayroll.update({
          where: { employeeId: emp.id },
          data: {
            earnedSalary: newEarned,
            balanceOwed: newBalance,
          },
        });
        console.log(
          `  >> ${emp.name} payroll adjusted: earned ${totalPayDelta >= 0 ? "+" : ""}${totalPayDelta.toFixed(2)}, balance ${totalPayDelta >= 0 ? "+" : ""}${totalPayDelta.toFixed(2)}`
        );
      }
    }
  }

  console.log(`\nDone! ${totalUpdated} attendance records updated.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
