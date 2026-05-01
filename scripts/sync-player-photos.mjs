/**
 * Reads accepted players from the NLR CSVs, fetches their photo from their
 * public playerzone profile (og:image), and updates photo_url in Supabase.
 *
 * Matches players by playerzone_id (stored as the full profile URL).
 *
 * Usage: node scripts/sync-player-photos.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
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

function parseCSV(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .slice(1) // skip header
    .filter((l) => l.trim())
    .map((line) => {
      // Handle quoted fields
      const cols = [];
      let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return {
        status: cols[7] ?? "",
        playerzoneUrl: cols[9] ?? "",
      };
    })
    .filter((r) => r.status === "accepted" && r.playerzoneUrl.startsWith("https://"));
}

async function fetchPhoto(profileUrl) {
  try {
    const res = await fetch(profileUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/og:image[^>]+content="([^"]+)"/);
    if (!m) return null;
    const url = m[1];
    // Skip default placeholder images
    if (url.includes("profile_f.jpg") || url.includes("profile_m.jpg")) return null;
    return url;
  } catch {
    return null;
  }
}

async function main() {
  const dataDir = resolve(__dirname, "../data");
  const openCSV = resolve(dataDir, "NLR2026_open_selection_w2 (3).csv");
  const womenCSV = resolve(dataDir, "NLR2026_women_selection_w2 (2).csv");

  const accepted = [
    ...parseCSV(openCSV),
    ...parseCSV(womenCSV),
  ];

  // Deduplicate by playerzone URL
  const unique = [...new Map(accepted.map((p) => [p.playerzoneUrl, p])).values()];
  console.log(`\n${unique.length} accepted players with playerzone profiles\n`);

  let updated = 0, skipped = 0, notFound = 0;

  for (const { playerzoneUrl } of unique) {
    process.stdout.write(`  ${playerzoneUrl} ... `);

    // Find player in DB by playerzone_id
    const { data: players } = await supabase
      .from("players")
      .select("id, first_name, last_name, photo_url")
      .eq("playerzone_id", playerzoneUrl);

    if (!players || players.length === 0) {
      console.log("not in DB — skip");
      notFound++;
      continue;
    }

    const photo = await fetchPhoto(playerzoneUrl);
    if (!photo) {
      console.log("no photo on playerzone — skip");
      skipped++;
      continue;
    }

    for (const player of players) {
      await supabase
        .from("players")
        .update({ photo_url: photo })
        .eq("id", player.id);
    }

    console.log(`OK  ${players[0].first_name} ${players[0].last_name}`);
    updated++;
  }

  console.log(`
Done.
  Updated  : ${updated}
  No photo : ${skipped}
  Not in DB: ${notFound}
`);
}

main().catch(console.error);
