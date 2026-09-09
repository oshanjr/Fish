const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const emps = await p.employee.findMany({
    select: { name: true, baseSalary: true, sundayPayment: true },
  });
  emps.forEach((x) =>
    console.log(x.name, "| base:", Number(x.baseSalary), "| sunday:", Number(x.sundayPayment))
  );
}

main().finally(() => p.$disconnect());
