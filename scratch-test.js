const { Client } = require('pg');

const url = process.env.DATABASE_URL || "postgresql://postgres.lkyqmvhjbxonhpiihvvs:nP5nfbzcagcagGur@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const client = new Client({
  connectionString: url,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully");
    await client.end();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

run();
