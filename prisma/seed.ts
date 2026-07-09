import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_FISH_TYPES = [
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
];

async function main() {
  console.log("🐟 Seeding Fish Store database (Clean Slate)...");

  // Seed default admin Manager user so you can log in
  const managerPassword = await bcrypt.hash("manager123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@fishstore.lk" },
    update: {},
    create: {
      name: "Store Manager",
      email: "manager@fishstore.lk",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  console.log("✅ Admin User seeded:", manager.email);

  // Seed initial Fish Types
  for (const type of DEFAULT_FISH_TYPES) {
    await prisma.fishType.upsert({
      where: { name: type },
      update: {},
      create: { name: type },
    });
  }

  console.log("✅ Default Fish Types seeded.");

  console.log("\n🎉 Seeding complete! Database is clean and ready.");
  console.log("\n📋 Login credentials:");
  console.log("   Manager: manager@fishstore.lk / manager123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
