#!/usr/bin/env node
/**
 * Apply pending SQL migrations to Supabase.
 * Uses the pg session pooler with the service role JWT as password.
 *
 * Usage: node scripts/apply-migrations.mjs
 * Optional: node scripts/apply-migrations.mjs 003  (run only migration 003)
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
config({ path: join(root, ".env.local") });

const { Client } = pg;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Extract project ref from URL: https://zhcckxjfktaaetmgxcon.supabase.co
const ref = SUPABASE_URL.replace("https://", "").split(".")[0];

// Try direct DB connection (requires DB password via env var DB_PASSWORD)
// or pooler in multiple regions
const DB_PASSWORD = process.env.DB_PASSWORD;
const connectionConfig = DB_PASSWORD
  ? {
      host: `db.${ref}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    }
  : {
      // Pooler: try with JWT as password (works in some Supabase configs)
      host: `aws-0-eu-west-2.pooler.supabase.com`,
      port: 5432,
      database: "postgres",
      user: `postgres.${ref}`,
      password: SERVICE_ROLE_KEY,
      ssl: { rejectUnauthorized: false },
    };

const migrationsDir = join(root, "supabase", "migrations");
const filter = process.argv[2]; // optional: "003" to run only 003_*.sql

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && (!filter || f.startsWith(filter)))
  .sort();

console.log(`Connecting to Supabase project: ${ref}`);
console.log(`Migrations to run: ${files.join(", ") || "(none matching filter)"}\n`);

const client = new Client(connectionConfig);

try {
  await client.connect();
  console.log("Connected.\n");

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`▶ Applying ${file}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${file} applied successfully.\n`);
    } catch (err) {
      // IF_NOT_EXISTS catches make most errors non-fatal
      if (err.code === "42P07" || err.message.includes("already exists")) {
        console.log(`  (already applied — skipping)\n`);
      } else {
        console.error(`✗ Error in ${file}:`, err.message);
        throw err;
      }
    }
  }

  console.log("All migrations applied.");
} catch (err) {
  if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    console.error("\nCould not connect to Supabase pooler.");
    console.error("Try setting the region in this script (default: eu-central-1).");
    console.error("Or apply manually: paste the SQL files into Supabase Dashboard → SQL Editor.");
  } else {
    console.error("\nFailed:", err.message);
  }
  process.exit(1);
} finally {
  await client.end();
}
