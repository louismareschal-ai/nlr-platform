#!/usr/bin/env node
/**
 * Seed test data for the NLR Open platform.
 *
 * Creates:
 * - 8 squads in the active/registration tournament
 * - 6 players per squad (4M + 2W) with auth accounts
 * - Player tournament points
 * - A set of quarterfinal encounters
 *
 * Run: node scripts/seed-test-data.mjs
 * Dry run: node scripts/seed-test-data.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const envLocal = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envLocal
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes("--dry-run");

function makePassword() {
  return randomBytes(12).toString("base64url").slice(0, 16);
}

// ─── Squad definitions ─────────────────────────────────────────────────────────

const SQUADS = [
  { name: "Frenchies Alpha", seed: 1 },
  { name: "Berlin Wall", seed: 2 },
  { name: "Swiss Precision", seed: 3 },
  { name: "Lyon Tigers", seed: 4 },
  { name: "Hamburg Kings", seed: 5 },
  { name: "Bordeaux Storm", seed: 6 },
  { name: "Vienna Wolves", seed: 7 },
  { name: "Paris Outlaws", seed: 8 },
];

// French + German roundnet player names (realistic but fictional for test)
const MEN_NAMES = [
  ["Louis", "Mareschal"], ["Thomas", "Bernard"], ["Antoine", "Dupont"],
  ["Pierre", "Martin"], ["Julien", "Leroy"], ["Alexandre", "Simon"],
  ["Nicolas", "Moreau"], ["François", "Petit"], ["Maxime", "Garnier"],
  ["Baptiste", "Roux"], ["Clément", "Blanc"], ["Romain", "Fontaine"],
  ["Victor", "Lambert"], ["Adrien", "Girard"], ["Hugo", "Richard"],
  ["Quentin", "Bonnet"], ["Etienne", "Vasseur"], ["Mathieu", "Chevalier"],
  ["Lucas", "Robin"], ["Thibault", "Guerin"], ["Léo", "David"],
  ["Arthur", "Morel"], ["Alexis", "Adam"], ["Paul", "Bertrand"],
  ["Théo", "Schmitt"], ["Florian", "Weber"], ["Lukas", "Müller"],
  ["Jan", "Braun"], ["Felix", "Koch"], ["Tobias", "Schulz"],
  ["Moritz", "Becker"], ["Philipp", "Richter"],
];

const WOMEN_NAMES = [
  ["Sophie", "Laurent"], ["Camille", "Thomas"], ["Marie", "Robert"],
  ["Léa", "Michel"], ["Charlotte", "Garcia"], ["Emma", "Martinez"],
  ["Chloé", "Fournier"], ["Manon", "Rousseau"], ["Inès", "Morel"],
  ["Julie", "Leclerc"], ["Lucie", "Perrin"], ["Pauline", "Clement"],
  ["Clara", "Brun"], ["Anaïs", "Renard"], ["Alice", "Meyer"],
  ["Zoé", "Fischer"], ["Laura", "Wagner"], ["Anna", "Bauer"],
];

// Point ranges by squad seed (higher seed = stronger squad = more points)
function generatePoints(seed) {
  const base = Math.max(0, 1000 - (seed - 1) * 100);
  const variance = 200;
  return {
    mixed_points: Math.max(0, base + Math.round((Math.random() - 0.5) * variance)),
    open_points: Math.max(0, base + Math.round((Math.random() - 0.5) * variance)),
    women_points: Math.max(0, base + Math.round((Math.random() - 0.5) * variance)),
  };
}

function toAsciiSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

async function createPlayerWithAuth(firstName, lastName, gender, squadId, tournamentId, seed) {
  const email = `test-${toAsciiSlug(firstName)}-${toAsciiSlug(lastName)}@nlr-test.internal`;
  const password = makePassword();

  // Check if exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let authUserId;

  if (existing) {
    authUserId = existing.id;
    console.log(`    Auth user exists: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error(`    Error creating auth user ${email}: ${error.message}`);
      return null;
    }
    authUserId = data.user.id;
    console.log(`    Created auth user: ${email} (${authUserId})`);
  }

  // Upsert player row
  const { error: playerError } = await supabase.from("players").upsert(
    {
      id: authUserId,
      first_name: firstName,
      last_name: lastName,
      gender,
      role: "player",
      temp_password_changed: true,
      squad_id: squadId,
    },
    { onConflict: "id" }
  );

  if (playerError) {
    console.error(`    Error upserting player: ${playerError.message}`);
    return null;
  }

  // Upsert points
  const pts = generatePoints(seed);
  await supabase.from("player_tournament_points").upsert(
    {
      player_id: authUserId,
      tournament_id: tournamentId,
      ...pts,
    },
    { onConflict: "player_id,tournament_id" }
  );

  return authUserId;
}

async function main() {
  console.log(`NLR Seed Test Data${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  // Find an active or registration tournament to seed into
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, status")
    .in("status", ["active", "registration", "setup"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (!tournaments || tournaments.length === 0) {
    console.error("No active/setup tournament found. Create one first.");
    process.exit(1);
  }

  const tournament = tournaments[0];
  console.log(`Using tournament: ${tournament.name} (${tournament.id})\n`);

  if (DRY_RUN) {
    console.log("Dry run — no writes to DB.");
    return;
  }

  // Check existing squads
  const { data: existingSquads } = await supabase
    .from("squads")
    .select("id, name")
    .eq("tournament_id", tournament.id);

  console.log(`Existing squads: ${existingSquads?.length ?? 0}\n`);

  const squadMap = new Map(); // name -> id
  for (const s of existingSquads ?? []) {
    squadMap.set(s.name, s.id);
  }

  let menIdx = 0;
  let womenIdx = 0;

  for (const squadDef of SQUADS) {
    console.log(`\n→ Squad: ${squadDef.name} (seed ${squadDef.seed})`);

    let squadId = squadMap.get(squadDef.name);

    if (!squadId) {
      const { data: newSquad, error } = await supabase
        .from("squads")
        .insert({
          tournament_id: tournament.id,
          name: squadDef.name,
          seed: squadDef.seed,
        })
        .select("id")
        .single();

      if (error) {
        console.error(`  Error creating squad: ${error.message}`);
        continue;
      }
      squadId = newSquad.id;
      console.log(`  Created squad: ${squadId}`);
    } else {
      // Update seed
      await supabase
        .from("squads")
        .update({ seed: squadDef.seed })
        .eq("id", squadId);
      console.log(`  Using existing squad: ${squadId}`);
    }

    // Create 4 men
    for (let i = 0; i < 4; i++) {
      const [fn, ln] = MEN_NAMES[menIdx % MEN_NAMES.length];
      menIdx++;
      console.log(`  Creating player: ${fn} ${ln} (man)`);
      await createPlayerWithAuth(fn, ln, "man", squadId, tournament.id, squadDef.seed);
    }

    // Create 2 women
    for (let i = 0; i < 2; i++) {
      const [fn, ln] = WOMEN_NAMES[womenIdx % WOMEN_NAMES.length];
      womenIdx++;
      console.log(`  Creating player: ${fn} ${ln} (woman)`);
      await createPlayerWithAuth(fn, ln, "woman", squadId, tournament.id, squadDef.seed);
    }
  }

  console.log("\n✓ Seed data created.");
  console.log("Next steps:");
  console.log("  1. Go to super-admin/tournaments and generate bracket");
  console.log("  2. Add courts and schedule rounds");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
