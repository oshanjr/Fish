import { PrismaClient } from '@prisma/client';

async function testConnection(url: string, name: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    console.log(`\nTesting ${name}...`);
    console.log(`URL: ${url}`);
    
    const count = await prisma.user.count();
    console.log(`✅ Success! Found ${count} users.`);
  } catch (error) {
    console.error(`❌ Failed:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const password = "nP5nfbzcagcagGur";
  const user = "postgres.lkyqmvhjbxonhpiihvvs";
  const host = "aws-1-ap-south-1.pooler.supabase.com";

  const urlsToTest = [
    {
      name: "Port 5432 (Session) no SSL explicit",
      url: `postgresql://${user}:${password}@${host}:5432/postgres`
    },
    {
      name: "Port 5432 (Session) WITH SSL",
      url: `postgresql://${user}:${password}@${host}:5432/postgres?sslmode=require`
    },
    {
      name: "Port 6543 (Transaction) pgbouncer",
      url: `postgresql://${user}:${password}@${host}:6543/postgres?pgbouncer=true`
    },
    {
      name: "Port 6543 (Transaction) pgbouncer + SSL",
      url: `postgresql://${user}:${password}@${host}:6543/postgres?pgbouncer=true&sslmode=require`
    }
  ];

  for (const test of urlsToTest) {
    await testConnection(test.url, test.name);
  }
}

main().catch(console.error);
