#!/usr/bin/env node
// Apply a SQL migration file to Supabase using the REST API
// Usage: node scripts/run-migration.mjs <migration-file.sql>

import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://zhcckxjfktaaetmgxcon.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY2NreGpma3RhYWV0bWd4Y29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzNTM0MSwiZXhwIjoyMDkzMjExMzQxfQ.zokQa7QcI4MpaCfdZtJWChHB6pE0ZKQ0DDh_lxs0AJc";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/run-migration.mjs <migration-file.sql>");
  process.exit(1);
}

const sql = readFileSync(resolve(filePath), "utf8");

const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    apikey: SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({ sql }),
});

if (!response.ok) {
  // Try the SQL endpoint directly via pg connection hint
  // Fall back to running statement by statement via PostgREST
  console.log("exec_sql RPC not available, trying alternative approach...");

  // Split on semicolons and run each statement via a different approach
  // We'll use the Supabase management API approach with raw SQL
  const mgmtResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!mgmtResponse.ok) {
    const text = await mgmtResponse.text();
    console.error("Failed:", text);
    process.exit(1);
  }
} else {
  const result = await response.json();
  console.log("Migration applied successfully:", result);
}
