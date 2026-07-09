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

  console.log("✅ Users seeded:", {
    manager: manager.email,
    supervisor: supervisor.email,
  });

  // Seed Employees
  const staffMembers = [
    { name: "Sunil Fernando", baseSalary: 45000, phone: "0771234567" },
    { name: "Ruwan Jayasinghe", baseSalary: 40000, phone: "0779876543" },
    { name: "Chaminda Bandara", baseSalary: 38000, phone: null },
    { name: "Amila Rathnayake", baseSalary: 42000, phone: "0765551234" },
    { name: "Dinesh Kumara", baseSalary: 35000, phone: null },
  ];

  for (const staff of staffMembers) {
    const employee = await prisma.employee.upsert({
      where: { name: staff.name },
      update: {},
      create: {
        name: staff.name,
        phone: staff.phone,
        baseSalary: staff.baseSalary,
        isActive: true,
      },
    });

    // Create payroll record for this employee
    const existingPayroll = await prisma.staffPayroll.findUnique({
      where: { employeeId: employee.id },
    });

    if (!existingPayroll) {
      await prisma.staffPayroll.create({
        data: {
          employeeId: employee.id,
          advanceTaken: 0,
          balanceOwed: 0,
        },
      });
    }
  }

  console.log("✅ Employees seeded:", staffMembers.length, "members");

  // Seed Contacts (Suppliers & Buyers)
  const contacts = [
    {
      name: "Negombo Fish Market - Saman",
      phone: "0712345678",
      type: "SUPPLIER" as const,
    },
    {
      name: "Chilaw Harbour - Pradeep",
      phone: "0778765432",
      type: "SUPPLIER" as const,
    },
    {
      name: "Hotel Grand Palace",
      phone: "0115556789",
      type: "BUYER" as const,
    },
    {
      name: "Lakma Restaurant",
      phone: "0769991234",
      type: "BUYER" as const,
    },
  ];

  for (const contact of contacts) {
    const existing = await prisma.contact.findFirst({
      where: { name: contact.name, type: contact.type },
    });

    if (!existing) {
      await prisma.contact.create({
        data: {
          name: contact.name,
          phone: contact.phone,
          type: contact.type,
          totalBalance: 0,
        },
      });
    }
  }

  console.log("✅ Contacts seeded:", contacts.length, "contacts");

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
