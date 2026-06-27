import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🐟 Seeding Fish Store database...");

  // Seed Users
  const managerPassword = await bcrypt.hash("manager123", 12);
  const supervisorPassword = await bcrypt.hash("supervisor123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@fishstore.lk" },
    update: {},
    create: {
      name: "Nimal Perera",
      email: "manager@fishstore.lk",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@fishstore.lk" },
    update: {},
    create: {
      name: "Kamal Silva",
      email: "supervisor@fishstore.lk",
      passwordHash: supervisorPassword,
      role: "SUPERVISOR",
    },
  });

  console.log("✅ Users seeded:", { manager: manager.email, supervisor: supervisor.email });

  // Seed Staff Payroll (sample staff)
  const staffMembers = [
    { employeeName: "Sunil Fernando", baseSalary: 45000 },
    { employeeName: "Ruwan Jayasinghe", baseSalary: 40000 },
    { employeeName: "Chaminda Bandara", baseSalary: 38000 },
    { employeeName: "Amila Rathnayake", baseSalary: 42000 },
    { employeeName: "Dinesh Kumara", baseSalary: 35000 },
  ];

  for (const staff of staffMembers) {
    await prisma.staffPayroll.upsert({
      where: { employeeName: staff.employeeName },
      update: {},
      create: {
        employeeName: staff.employeeName,
        baseSalary: staff.baseSalary,
        advanceTaken: 0,
        balanceOwed: 0,
      },
    });
  }

  console.log("✅ Staff payroll seeded:", staffMembers.length, "members");
  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials:");
  console.log("   Manager:    manager@fishstore.lk / manager123");
  console.log("   Supervisor: supervisor@fishstore.lk / supervisor123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
