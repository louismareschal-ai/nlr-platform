/**
 * Seed script — NLR 2026 accepted players
 *
 * Creates auth users + player rows + tournament points for all 24 accepted players.
 * Run once against the NLR 2026 tournament.
 *
 * Usage:
 *   node scripts/seed-nlr-players.mjs
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
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

const PZ = "https://playerzone.roundnetfrance.fr/players";
const IMG = "https://pstaassets.blob.core.windows.net/assets/players/";
const TEMP_PASSWORD = "NLR2026temp!";
const TOURNAMENT_SLUG = "nlr-2026";

// ─── Player roster ────────────────────────────────────────────────────────────

const PLAYERS = [
  // ── Open Men (14) ──────────────────────────────────────────────────────────
  {
    first_name: "Paul",      last_name: "Schirop",    gender: "man",
    nationality: "Germany",  email: "p.schirop@web.de",
    photo_url: IMG + "profile_PAU626-2022-06-17-05-35-22.jpg",
    playerzone_url: `${PZ}/626`,
    eura_points: 593,        rgx_points: 1867,
  },
  {
    first_name: "Andrea",    last_name: "Borsotti",   gender: "man",
    nationality: "Italy",    email: "borsaandy@gmail.com",
    photo_url: IMG + "profile_AND4697-2026-04-22-08-44-35.jpg",
    playerzone_url: `${PZ}/4697`,
    eura_points: 550,        rgx_points: 1710,
  },
  {
    first_name: "Lennart",   last_name: "Kühner",     gender: "man",
    nationality: "Germany",  email: "lkue2014@gmail.com",
    photo_url: IMG + "profile_LEN1375-2022-06-13-11-40-27.jpg",
    playerzone_url: `${PZ}/1375`,
    eura_points: 524,        rgx_points: 1796,
  },
  {
    first_name: "Lucas",     last_name: "Christiani", gender: "man",
    nationality: "Germany",  email: "lucas.christiani@web.de",
    photo_url: IMG + "profile_LUC2110-2023-06-26-15-22-24.jpg",
    playerzone_url: `${PZ}/2110`,
    eura_points: 375,        rgx_points: 1995,
  },
  {
    first_name: "Noah",      last_name: "Rohloff",    gender: "man",
    nationality: "Germany",  email: "noah.rohloff@web.de",
    photo_url: IMG + "profile_NOA3835-2025-08-31-10-44-47.jpg",
    playerzone_url: `${PZ}/3835`,
    eura_points: 190,        rgx_points: 1615,
  },
  {
    first_name: "Scott",     last_name: "Beeks",      gender: "man",
    nationality: "Great Britain", email: "sbeeks64@gmail.com",
    photo_url: IMG + "profile_SCO8738-2025-12-03-09-36-47.jpg",
    playerzone_url: `${PZ}/8738`,
    eura_points: 178,        rgx_points: null,
  },
  {
    first_name: "Julius",    last_name: "Hansen",     gender: "man",
    nationality: "Germany",  email: "juliushansen@freenet.de",
    photo_url: IMG + "profile_JUL3801-2022-10-21-08-42-51.jpg",
    playerzone_url: `${PZ}/3801`,
    eura_points: 167,        rgx_points: 1819,
  },
  {
    first_name: "Paul",      last_name: "Siemer",     gender: "man",
    nationality: "Germany",  email: "pf8.siemer@gmx.de",
    photo_url: IMG + "profile_PAULCHEN-2023-12-05-22-05-18.jpg",
    playerzone_url: `${PZ}/265`,
    eura_points: 165,        rgx_points: 1997,
  },
  {
    first_name: "Mattia",    last_name: "Pareschi",   gender: "man",
    nationality: "Italy",    email: "mattia.pareschi00@gmail.com",
    photo_url: IMG + "profile_MAT8594-2025-09-04-09-36-57.jpg",
    playerzone_url: `${PZ}/8594`,
    eura_points: 164,        rgx_points: null,
  },
  {
    first_name: "Robin",     last_name: "Florinda",   gender: "man",
    nationality: "France",   email: "robinflorinda@gmail.com",
    photo_url: IMG + "profile_ROB4924-2025-09-03-16-50-50.jpg",
    playerzone_url: `${PZ}/4924`,
    eura_points: 154,        rgx_points: null,
  },
  {
    first_name: "Matteo",    last_name: "Molli",      gender: "man",
    nationality: "Italy",    email: "Teobb2@gmail.com",
    photo_url: IMG + "profile_MAT8128-2025-09-30-10-56-35.jpg",
    playerzone_url: `${PZ}/8128`,
    eura_points: 150,        rgx_points: null,
  },
  {
    first_name: "Dorian",    last_name: "Améziane",   gender: "man",
    nationality: "France",   email: "ameziane.dorian@gmail.com",
    photo_url: IMG + "profile_DOR4907-2025-09-04-10-07-07.jpg",
    playerzone_url: `${PZ}/4907`,
    eura_points: 130,        rgx_points: null,
  },
  {
    first_name: "Thibaud",   last_name: "Brun",       gender: "man",
    nationality: "France",   email: "thibaud.brun.91@gmail.com",
    photo_url: IMG + "profile_THI7916-2026-04-22-06-54-31.jpg",
    playerzone_url: `${PZ}/7916`,
    eura_points: 69,         rgx_points: 1579,
  },
  {
    first_name: "Hugo",      last_name: "Lacombe",    gender: "man",
    nationality: "France",   email: "hugo.lacombe24@hotmail.com",
    photo_url: IMG + "profile_HUG4909-2026-04-18-08-46-01.jpg",
    playerzone_url: `${PZ}/4909`,
    eura_points: null,       rgx_points: 1709,
  },

  // ── Women (10) ─────────────────────────────────────────────────────────────
  {
    first_name: "Chiara",    last_name: "Pernigo",    gender: "woman",
    nationality: "Italy",    email: "chiara98.pernigo@gmail.com",
    photo_url: IMG + "profile_CHI6594-2026-04-22-08-43-08.jpg",
    playerzone_url: `${PZ}/6594`,
    eura_points: 700,        rgx_points: 1649,
  },
  {
    first_name: "Silvia",    last_name: "Zanella",    gender: "woman",
    nationality: "Italy",    email: "silviazanella1909@gmail.com",
    photo_url: IMG + "profile_SIL4776-2025-09-04-21-44-23.jpg",
    playerzone_url: `${PZ}/4776`,
    eura_points: 500,        rgx_points: 1760,
  },
  {
    first_name: "Laura",     last_name: "Kunzelmann", gender: "woman",
    nationality: "Switzerland", email: "Laura.kunzelman98@gmail.com",
    photo_url: IMG + "profile_LAU1768-2025-01-18-23-23-45.jpg",
    playerzone_url: `${PZ}/1768`,
    eura_points: 500,        rgx_points: 2111,
  },
  {
    first_name: "Lauma",     last_name: "Ernestsone", gender: "woman",
    nationality: "Latvia",   email: "lauma.ernestsone@gmail.com",
    photo_url: IMG + "profile_LAU6606-2025-10-14-13-00-00.jpg",
    playerzone_url: `${PZ}/6606`,
    eura_points: 362,        rgx_points: 1661,
  },
  {
    first_name: "Ronja",     last_name: "Lorenz",     gender: "woman",
    nationality: "Germany",  email: "ronjalorenz@yahoo.de",
    photo_url: IMG + "profile_RON2066-2023-10-27-13-09-56.jpg",
    playerzone_url: `${PZ}/2066`,
    eura_points: 282,        rgx_points: 1711,
  },
  {
    first_name: "Klara",     last_name: "Bauer",      gender: "woman",
    nationality: "Germany",  email: "klara@baueri.de",
    photo_url: IMG + "profile_KLA1251-2024-09-26-09-39-05.jpg",
    playerzone_url: `${PZ}/1251`,
    eura_points: 159,        rgx_points: 1779,
  },
  {
    first_name: "Sophia",    last_name: "Walter",     gender: "woman",
    nationality: "Germany",  email: "sophia.walt@web.de",
    photo_url: IMG + "profile_OPH-2025-07-25-09-52-12.jpg",
    playerzone_url: `${PZ}/243`,
    eura_points: 125,        rgx_points: 1645,
  },
  {
    first_name: "Jade",      last_name: "Lacombe",    gender: "woman",
    nationality: "France",   email: "jadelacombe30@icloud.com",
    photo_url: IMG + "profile_JAD8277-2025-09-25-07-39-39.jpg",
    playerzone_url: `${PZ}/8277`,
    eura_points: 440,        rgx_points: null,
  },
  {
    first_name: "Inès",      last_name: "Paysan",     gender: "woman",
    nationality: "France",   email: "inespaysan@gmail.com",
    photo_url: IMG + "profile_INE4896-2022-11-21-20-47-10.jpg",
    playerzone_url: `${PZ}/4896`,
    eura_points: 440,        rgx_points: null,
  },
  {
    first_name: "Natacha",   last_name: "Salvador",   gender: "woman",
    nationality: "France",   email: "natacha.alt@gmail.com",
    photo_url: IMG + "profile_NAT4895-2024-03-24-15-50-12.jpg",
    playerzone_url: `${PZ}/4895`,
    eura_points: 44,         rgx_points: 1710,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nNLR 2026 player seed — ${PLAYERS.length} players\n`);

  // Find tournament
  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("slug", TOURNAMENT_SLUG)
    .single();

  if (tErr || !tournament) {
    console.error(`Tournament "${TOURNAMENT_SLUG}" not found.`);
    console.error("Create it first in the app, then re-run this script.");
    process.exit(1);
  }
  console.log(`Tournament: ${tournament.name} (${tournament.id})\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of PLAYERS) {
    process.stdout.write(`  ${p.first_name} ${p.last_name} (${p.email})... `);

    // Try creating auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: p.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        console.log("SKIP (already exists)");
        skipped++;
        continue;
      }
      console.log(`FAIL — ${authErr.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

    // Insert player row
    const { error: playerErr } = await supabase.from("players").insert({
      id: userId,
      first_name: p.first_name,
      last_name: p.last_name,
      gender: p.gender,
      role: "player",
      temp_password_changed: false,
      playerzone_id: p.playerzone_url,
    });

    if (playerErr) {
      console.log(`FAIL (player row) — ${playerErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    // Insert tournament points
    // open_points = EURA points (for men), women_points = EURA points (for women)
    // mixed_points = RGX points if available, else EURA points
    const eura = p.eura_points ?? 0;
    const rgx = p.rgx_points ?? eura;

    const { error: pointsErr } = await supabase.from("player_tournament_points").insert({
      player_id: userId,
      tournament_id: tournament.id,
      mixed_points:  rgx,
      open_points:   p.gender === "man"   ? eura : 0,
      women_points:  p.gender === "woman" ? eura : 0,
    });

    if (pointsErr) {
      console.log(`WARN (points) — ${pointsErr.message}`);
    }

    console.log("OK");
    created++;
  }

  console.log(`
Done.
  Created : ${created}
  Skipped : ${skipped}
  Failed  : ${failed}

Temp password for all new accounts: "${TEMP_PASSWORD}"
Players will be prompted to change it on first login.
`);
}

main().catch(console.error);
