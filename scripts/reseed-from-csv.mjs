/**
 * Seeds NLR 2026 players from the accepted CSV files.
 * - Reads NLR2026_open_selection_w2 and NLR2026_women_selection_w2
 * - Filters: status === "accepted", valid email, has playerzone URL
 * - Fetches photo from playerzone public profile (og:image)
 * - Skips players already in DB (matched by playerzone_id)
 * - Creates auth user + player row + tournament points for new ones
 *
 * Safe to re-run: existing players are skipped, not duplicated.
 *
 * Usage: node scripts/reseed-from-csv.mjs
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

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(filePath, gender) {
  const rows = readFileSync(filePath, "utf8").split("\n").slice(1);
  return rows
    .filter((l) => l.trim())
    .map((line) => {
      const cols = [];
      let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      const [, , name, nationality, euraStr, rgxStr, , status, email, playerzoneUrl] = cols;
      return {
        name: name ?? "",
        nationality: nationality ?? "",
        eura: euraStr ? parseInt(euraStr) : null,
        rgx: rgxStr ? parseInt(rgxStr) : null,
        status: status ?? "",
        email: email ?? "",
        playerzoneUrl: playerzoneUrl ?? "",
        gender,
      };
    })
    .filter((r) => {
      if (r.status !== "accepted") return false;
      if (!r.playerzoneUrl.startsWith("https://")) return false;
      if (!r.email || r.email.startsWith("TODO") || !r.email.includes("@")) return false;
      return true;
    });
}

// ── Fetch photo from public playerzone profile ────────────────────────────────

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

// ── Name split ────────────────────────────────────────────────────────────────

function splitName(fullName) {
  const parts = fullName.trim().split(" ");
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts.at(-1),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dataDir = resolve(__dirname, "../data");
  const players = [
    ...parseCSV(resolve(dataDir, "NLR2026_open_selection_w2 (3).csv"), "man"),
    ...parseCSV(resolve(dataDir, "NLR2026_women_selection_w2 (2).csv"), "woman"),
  ];

  // Deduplicate by playerzone URL (in case someone appears in both lists)
  const unique = [...new Map(players.map((p) => [p.playerzoneUrl, p])).values()];
  console.log(`\n${unique.length} accepted players with valid email + playerzone URL\n`);

  // Find tournament
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("slug", TOURNAMENT_SLUG)
    .single();

  if (!tournament) {
    console.error(`Tournament "${TOURNAMENT_SLUG}" not found. Create it first.`);
    process.exit(1);
  }
  console.log(`Tournament: ${tournament.name} (${tournament.id})\n`);

  // Load existing playerzone_ids from DB to detect duplicates
  const { data: existing } = await supabase
    .from("players")
    .select("playerzone_id, id, first_name, last_name");
  const existingByPZ = new Map((existing ?? []).map((p) => [p.playerzone_id, p]));

  let created = 0, skipped = 0, noPhoto = 0, failed = 0;

  for (const p of unique) {
    const { first_name, last_name } = splitName(p.name);
    process.stdout.write(`  ${first_name} ${last_name} ... `);

    // Already in DB?
    if (existingByPZ.has(p.playerzoneUrl)) {
      console.log("already in DB — skip");
      skipped++;
      continue;
    }

    // Fetch photo
    const photo = await fetchPhoto(p.playerzoneUrl);
    if (!photo) noPhoto++;

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: p.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        // Email exists — try to find their player row and update playerzone_id
        const { data: authList } = await supabase.auth.admin.listUsers();
        const authUser = authList?.users.find(
          (u) => u.email?.toLowerCase() === p.email.toLowerCase()
        );
        if (authUser) {
          await supabase
            .from("players")
            .update({ playerzone_id: p.playerzoneUrl, photo_url: photo })
            .eq("id", authUser.id);
          console.log("email exists — linked playerzone_id");
          skipped++;
        } else {
          console.log(`SKIP — ${authErr.message}`);
          skipped++;
        }
        continue;
      }
      console.log(`FAIL (auth) — ${authErr.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

    // Insert player row
    const { error: playerErr } = await supabase.from("players").insert({
      id: userId,
      first_name,
      last_name,
      gender: p.gender,
      role: "player",
      temp_password_changed: false,
      playerzone_id: p.playerzoneUrl,
      photo_url: photo,
    });

    if (playerErr) {
      console.log(`FAIL (player) — ${playerErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    // Insert tournament points
    const eura = p.eura ?? 0;
    const rgx = p.rgx ?? eura;
    const { error: ptErr } = await supabase.from("player_tournament_points").insert({
      player_id: userId,
      tournament_id: tournament.id,
      mixed_points:  rgx,
      open_points:   p.gender === "man"   ? eura : 0,
      women_points:  p.gender === "woman" ? eura : 0,
    });
    if (ptErr) console.warn(`  WARN (points) — ${ptErr.message}`);

    console.log(`OK${photo ? "" : " (no photo)"}`);
    created++;
  }

  console.log(`
Done.
  Created : ${created}
  Skipped : ${skipped}  (already in DB or email taken)
  No photo: ${noPhoto}
  Failed  : ${failed}

Temp password: "${TEMP_PASSWORD}"
`);

  // Report players skipped due to missing email
  const allAccepted = [
    ...parseCSVRaw(resolve(dataDir, "NLR2026_open_selection_w2 (3).csv")),
    ...parseCSVRaw(resolve(dataDir, "NLR2026_women_selection_w2 (2).csv")),
  ].filter((r) => r.status === "accepted" && !r.email.includes("@"));

  if (allAccepted.length > 0) {
    console.log("Players skipped (no valid email — cannot create account):");
    for (const r of allAccepted) console.log(`  - ${r.name} (${r.playerzoneUrl || "no playerzone"})`);
  }
}

function parseCSVRaw(filePath) {
  return readFileSync(filePath, "utf8")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = [];
      let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return { name: cols[2] ?? "", status: cols[7] ?? "", email: cols[8] ?? "", playerzoneUrl: cols[9] ?? "" };
    });
}

main().catch(console.error);
