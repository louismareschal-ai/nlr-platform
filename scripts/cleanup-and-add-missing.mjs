/**
 * One-shot cleanup script:
 *   1. Removes all declined players from auth + DB
 *   2. Creates accounts for the 3 accepted women whose emails were missing
 *   3. Creates Emerson Dean with a placeholder email + uploads his photo
 *      to Supabase Storage (bucket: player-photos)
 *
 * Usage: node scripts/cleanup-and-add-missing.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .map(([k, ...v]) => [k, v.join("=")])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEMP_PASSWORD = "NLR2026temp!";
const TOURNAMENT_SLUG = "nlr-2026";

// ── Players to remove (declined invitation) ───────────────────────────────────

const DECLINED_EMAILS = [
  "borsaandy@gmail.com",       // Andrea Borsotti
  "ameziane.dorian@gmail.com", // Dorian Améziane
  "chiara98.pernigo@gmail.com",// Chiara Pernigo
  "silviazanella1909@gmail.com",// Silvia Zanella
];

// ── Players to add (accepted, emails found via playerzone) ────────────────────

const NEW_PLAYERS = [
  {
    first_name: "Saskia", last_name: "Schrader", gender: "woman",
    email: "saskia-benter@msn.com",
    playerzoneUrl: "https://playerzone.roundnetfrance.fr/players/950",
    eura: 150, rgx: 1645,
  },
  {
    first_name: "Lina", last_name: "Günther", gender: "woman",
    email: "lina12guenther@gmail.com",
    playerzoneUrl: "https://playerzone.roundnetfrance.fr/players/6458",
    eura: 100, rgx: 1593,
  },
  {
    first_name: "Elena", last_name: "Rossetto", gender: "woman",
    email: "ennibella@gmail.com",
    playerzoneUrl: "https://playerzone.roundnetfrance.fr/players/7690",
    eura: 121, rgx: null,
  },
  // NOTE: Emerson Dean — placeholder email, must be updated when his real email is known
  {
    first_name: "Emerson", last_name: "Dean", gender: "man",
    email: "emerson.dean.nlr2026@placeholder.com",
    playerzoneUrl: null,
    eura: null, rgx: null,
    localPhoto: resolve(__dirname, "../../NLR/public/defense/emerson.jpg"),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchPhoto(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/og:image[^>]+content="([^"]+)"/);
    if (!m) return null;
    const photo = m[1];
    if (photo.includes("profile_f.jpg") || photo.includes("profile_m.jpg")) return null;
    return photo;
  } catch { return null; }
}

async function uploadLocalPhoto(filePath, fileName) {
  const fileBuffer = readFileSync(filePath);

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "player-photos");
  if (!exists) {
    await supabase.storage.createBucket("player-photos", { public: true });
  }

  const { error } = await supabase.storage
    .from("player-photos")
    .upload(fileName, fileBuffer, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("player-photos").getPublicUrl(fileName);
  return data.publicUrl;
}

// ── Step 1: Remove declined players ──────────────────────────────────────────

async function removeDeclined() {
  console.log("\n── Removing declined players ──────────────────────────────");

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  for (const email of DECLINED_EMAILS) {
    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.log(`  ${email} — not found in auth, skip`);
      continue;
    }
    // Deleting the auth user cascades to players row + player_tournament_points
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.log(`  ${email} — FAIL: ${error.message}`);
    } else {
      console.log(`  ${email} — removed`);
    }
  }
}

// ── Step 2: Add missing players ───────────────────────────────────────────────

async function addMissing(tournament) {
  console.log("\n── Adding missing accepted players ────────────────────────");

  const { data: { users: existing } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set(existing.map((u) => u.email?.toLowerCase()));

  for (const p of NEW_PLAYERS) {
    process.stdout.write(`  ${p.first_name} ${p.last_name} ... `);

    if (existingEmails.has(p.email.toLowerCase())) {
      console.log("already exists — skip");
      continue;
    }

    // Get photo
    let photo = null;
    if (p.localPhoto) {
      try {
        photo = await uploadLocalPhoto(p.localPhoto, "emerson-dean.jpg");
      } catch (e) {
        console.log(`(photo upload failed: ${e.message})`);
      }
    } else if (p.playerzoneUrl) {
      photo = await fetchPhoto(p.playerzoneUrl);
    }

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: p.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });
    if (authErr) { console.log(`FAIL (auth): ${authErr.message}`); continue; }

    const userId = authData.user.id;

    // Insert player
    const { error: playerErr } = await supabase.from("players").insert({
      id: userId,
      first_name: p.first_name,
      last_name: p.last_name,
      gender: p.gender,
      role: "player",
      temp_password_changed: false,
      playerzone_id: p.playerzoneUrl,
      photo_url: photo,
    });
    if (playerErr) {
      console.log(`FAIL (player): ${playerErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      continue;
    }

    // Insert points
    const eura = p.eura ?? 0;
    const rgx = p.rgx ?? eura;
    await supabase.from("player_tournament_points").insert({
      player_id: userId,
      tournament_id: tournament.id,
      mixed_points:  rgx,
      open_points:   p.gender === "man"   ? eura : 0,
      women_points:  p.gender === "woman" ? eura : 0,
    });

    console.log(`OK${photo ? "" : " (no photo)"}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { data: tournament } = await supabase
    .from("tournaments").select("id, name").eq("slug", TOURNAMENT_SLUG).single();
  if (!tournament) { console.error(`Tournament "${TOURNAMENT_SLUG}" not found.`); process.exit(1); }
  console.log(`\nTournament: ${tournament.name}`);

  await removeDeclined();
  await addMissing(tournament);

  console.log(`
Done.

⚠ TODO: Emerson Dean's email is a placeholder (emerson.dean.nlr2026@placeholder.com).
  Update it once you have his real email — find him in Supabase Auth and change it there.
`);
}

main().catch(console.error);
