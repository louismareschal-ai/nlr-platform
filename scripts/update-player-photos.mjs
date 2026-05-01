/**
 * Sets photo_url on all 24 NLR 2026 players.
 * Run AFTER 002_add_photo_url.sql has been applied.
 *
 * Usage: node scripts/update-player-photos.mjs
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

const IMG = "https://pstaassets.blob.core.windows.net/assets/players/";

const PHOTOS = [
  { email: "p.schirop@web.de",              photo: IMG + "profile_PAU626-2022-06-17-05-35-22.jpg" },
  { email: "borsaandy@gmail.com",           photo: IMG + "profile_AND4697-2026-04-22-08-44-35.jpg" },
  { email: "lkue2014@gmail.com",            photo: IMG + "profile_LEN1375-2022-06-13-11-40-27.jpg" },
  { email: "lucas.christiani@web.de",       photo: IMG + "profile_LUC2110-2023-06-26-15-22-24.jpg" },
  { email: "noah.rohloff@web.de",           photo: IMG + "profile_NOA3835-2025-08-31-10-44-47.jpg" },
  { email: "sbeeks64@gmail.com",            photo: IMG + "profile_SCO8738-2025-12-03-09-36-47.jpg" },
  { email: "juliushansen@freenet.de",       photo: IMG + "profile_JUL3801-2022-10-21-08-42-51.jpg" },
  { email: "pf8.siemer@gmx.de",            photo: IMG + "profile_PAULCHEN-2023-12-05-22-05-18.jpg" },
  { email: "mattia.pareschi00@gmail.com",   photo: IMG + "profile_MAT8594-2025-09-04-09-36-57.jpg" },
  { email: "robinflorinda@gmail.com",       photo: IMG + "profile_ROB4924-2025-09-03-16-50-50.jpg" },
  { email: "Teobb2@gmail.com",              photo: IMG + "profile_MAT8128-2025-09-30-10-56-35.jpg" },
  { email: "ameziane.dorian@gmail.com",     photo: IMG + "profile_DOR4907-2025-09-04-10-07-07.jpg" },
  { email: "thibaud.brun.91@gmail.com",     photo: IMG + "profile_THI7916-2026-04-22-06-54-31.jpg" },
  { email: "hugo.lacombe24@hotmail.com",    photo: IMG + "profile_HUG4909-2026-04-18-08-46-01.jpg" },
  { email: "chiara98.pernigo@gmail.com",    photo: IMG + "profile_CHI6594-2026-04-22-08-43-08.jpg" },
  { email: "silviazanella1909@gmail.com",   photo: IMG + "profile_SIL4776-2025-09-04-21-44-23.jpg" },
  { email: "Laura.kunzelman98@gmail.com",   photo: IMG + "profile_LAU1768-2025-01-18-23-23-45.jpg" },
  { email: "lauma.ernestsone@gmail.com",    photo: IMG + "profile_LAU6606-2025-10-14-13-00-00.jpg" },
  { email: "ronjalorenz@yahoo.de",          photo: IMG + "profile_RON2066-2023-10-27-13-09-56.jpg" },
  { email: "klara@baueri.de",              photo: IMG + "profile_KLA1251-2024-09-26-09-39-05.jpg" },
  { email: "sophia.walt@web.de",            photo: IMG + "profile_OPH-2025-07-25-09-52-12.jpg" },
  { email: "jadelacombe30@icloud.com",      photo: IMG + "profile_JAD8277-2025-09-25-07-39-39.jpg" },
  { email: "inespaysan@gmail.com",          photo: IMG + "profile_INE4896-2022-11-21-20-47-10.jpg" },
  { email: "natacha.alt@gmail.com",         photo: IMG + "profile_NAT4895-2024-03-24-15-50-12.jpg" },
];

async function main() {
  console.log(`\nUpdating photo_url for ${PHOTOS.length} players\n`);
  let ok = 0, fail = 0;

  for (const { email, photo } of PHOTOS) {
    // Resolve auth user id by email
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) { console.error("Cannot list users:", listErr.message); process.exit(1); }

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.log(`  SKIP — no auth user for ${email}`);
      fail++;
      continue;
    }

    const { error } = await supabase
      .from("players")
      .update({ photo_url: photo })
      .eq("id", user.id);

    if (error) {
      console.log(`  FAIL ${email} — ${error.message}`);
      fail++;
    } else {
      console.log(`  OK   ${email}`);
      ok++;
    }
  }

  console.log(`\nDone. OK: ${ok}  Fail: ${fail}\n`);
}

main().catch(console.error);
