import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

export async function initDatabase() {
  const schemaPath = path.join(process.cwd(), "src/db/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Split schema by semicolons and execute each statement
  const statements = schema
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    await sql([statement] as any);
  }

  // Run migrations for existing databases
  await runMigrations();

  console.log("Database initialized successfully");
}

async function runMigrations() {
  // Check if dcm_impression_tag column exists, if not add it
  const tableInfo = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'qr_codes'
  `;

  const columns = tableInfo.map((col: any) => col.column_name);

  if (!columns.includes("dcm_impression_tag")) {
    await sql`ALTER TABLE qr_codes ADD COLUMN dcm_impression_tag TEXT`;
    console.log("Migration: Added dcm_impression_tag column to qr_codes table");
  }

  if (!columns.includes("name")) {
    await sql`ALTER TABLE qr_codes ADD COLUMN name VARCHAR(255)`;
    console.log("Migration: Added name column to qr_codes table");
  }
}

export { sql };
export default sql;
