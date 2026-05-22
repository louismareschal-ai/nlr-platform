// Sync nlr-platform athlete_profiles to the exact accepted NLR 2026 player list.
// Removes players not in the accepted list, adds new ones with data from NLR players.ts.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const IMG = "https://pstaassets.blob.core.windows.net/assets/players/";

const COUNTRY_CODES = {
  Germany: "DE",
  Switzerland: "CH",
  Italy: "IT",
  Canada: "CA",
  Belgium: "BE",
  France: "FR",
  Denmark: "DK",
  Latvia: "LV",
  Sweden: "SE",
  Austria: "AT",
  Spain: "ES",
  Netherlands: "NL",
  "Great Britain": "GB",
  USA: "US",
};

// Full list of accepted players with their data (from NLR players.ts)
const ACCEPTED = [
  // ── OPEN ──────────────────────────────────────────────────────────────────
  { slug: "robin-florinda",    firstName: "Robin",       lastName: "Florinda",    nationality: "Germany",     club: "Roundnet Heilbronn",      profileUrl: "https://playerzone.roundnetfrance.fr/players/4924",                photoUrl: IMG + "profile_ROB4924-2024-06-07-13-56-15.jpg", gender: "man" },
  { slug: "scott-beeks",       firstName: "Scott",       lastName: "Beeks",       nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/8738",                photoUrl: IMG + "profile_SCO8738-2025-05-07-17-57-41.jpg", gender: "man" },
  { slug: "noah-rohloff",      firstName: "Noah",        lastName: "Rohloff",     nationality: "Germany",     club: "Spikeball Dortmund",       profileUrl: "https://playerzone.roundnetfrance.fr/players/3835",                photoUrl: IMG + "profile_NOA3835-2022-06-24-19-52-59.jpg", gender: "man" },
  { slug: "lennart-kuhner",    firstName: "Lennart",     lastName: "Kühner",      nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/1375",                photoUrl: IMG + "profile_LEN1375-2024-01-29-14-02-59.jpg", gender: "man" },
  { slug: "paul-schirop",      firstName: "Paul",        lastName: "Schirop",     nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/626",                 photoUrl: IMG + "profile_PAU626-2022-06-18-22-57-00.jpg",  gender: "man" },
  { slug: "paul-siemer",       firstName: "Paul",        lastName: "Siemer",      nationality: "Germany",     club: "Roundnet Köln",            profileUrl: "https://playerzone.roundnetfrance.fr/players/265",                 photoUrl: IMG + "profile_PAU265-2024-01-14-21-43-04.jpg",  gender: "man" },
  { slug: "lucas-christiani",  firstName: "Lucas",       lastName: "Christiani",  nationality: "France",      club: "Roundnet Lyon",            profileUrl: "https://playerzone.roundnetfrance.fr/players/2110",                photoUrl: IMG + "profile_LUC2110-2023-03-16-10-23-29.jpg", gender: "man" },
  { slug: "matteo-molli",      firstName: "Matteo",      lastName: "Molli",       nationality: "Italy",       club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/8128",                photoUrl: IMG + "profile_MAT8128-2024-07-10-23-04-07.jpg", gender: "man" },
  { slug: "hugo-lacombe",      firstName: "Hugo",        lastName: "Lacombe",     nationality: "France",      club: "Roundnet Lyon",            profileUrl: "https://playerzone.roundnetfrance.fr/players/4909",                photoUrl: IMG + "profile_HUG4909-2023-03-12-14-42-07.jpg", gender: "man" },
  { slug: "julius-hansen",     firstName: "Julius",      lastName: "Hansen",      nationality: "Denmark",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/3801",                photoUrl: IMG + "profile_JUL3801-2024-07-12-10-09-40.jpg", gender: "man" },
  { slug: "thibaud-brun",      firstName: "Thibaud",     lastName: "Brun",        nationality: "France",      club: "Roundnet Lyon",            profileUrl: "https://playerzone.roundnetfrance.fr/players/7916",                photoUrl: IMG + "profile_THI7916-2024-10-30-10-42-20.jpg", gender: "man" },
  { slug: "mathis-hartling",   firstName: "Mathis",      lastName: "Härtling",    nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/1268",                photoUrl: IMG + "profile_MAT1268-2023-03-16-09-46-02.jpg", gender: "man" },
  { slug: "aleksandrs-juska",  firstName: "Aleksandrs",  lastName: "Juška",       nationality: "Latvia",      club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/2631",                photoUrl: IMG + "profile_ALE2631-2023-05-30-08-36-22.jpg", gender: "man" },
  { slug: "lars-rudorf",       firstName: "Lars",        lastName: "Rudorf",      nationality: "Germany",     club: "Roundnet Köln",            profileUrl: "https://playerzone.roundnetfrance.fr/players/1112",                photoUrl: IMG + "profile_LAR1112-2023-01-11-18-52-14.jpg", gender: "man" },
  { slug: "christoffer-sega",  firstName: "Christoffer", lastName: "Sega",        nationality: "Germany",     club: "Roundnet Sharks Kiel",    profileUrl: "https://playerzone.roundnetfrance.fr/players/5489-christoffer-kie", photoUrl: IMG + "profile_CHR5489-2024-07-10-23-38-47.jpg", gender: "man" },
  { slug: "karl-wolf",         firstName: "Karl",        lastName: "Wolf",        nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/2225",                photoUrl: IMG + "profile_KAR2225-2023-03-25-19-59-36.jpg", gender: "man" },
  { slug: "matteo-sacchini",   firstName: "Matteo",      lastName: "Sacchini",    nationality: "Italy",       club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6592",                photoUrl: IMG + "profile_MAT6592-2023-06-27-11-23-46.jpg", gender: "man" },
  { slug: "marcus-gauterin",   firstName: "Marcus",      lastName: "Gauterin",    nationality: "Germany",     club: "Roundnet Augsburg",        profileUrl: "https://playerzone.roundnetfrance.fr/players/96",                  photoUrl: IMG + "profile_MAR96-2023-03-10-18-00-50.jpg",   gender: "man" },
  { slug: "oussama-tchita",    firstName: "Oussama",     lastName: "Tchita",      nationality: "France",      club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/7584",                photoUrl: IMG + "profile_OUS7584-2024-01-21-12-32-23.jpg", gender: "man" },
  { slug: "max-jansson",       firstName: "Max",         lastName: "Jansson",     nationality: "Sweden",      club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6496",                photoUrl: IMG + "profile_MAX6496-2024-01-12-13-38-19.jpg", gender: "man" },
  { slug: "josha-lauterbach",  firstName: "Josha",       lastName: "Lauterbach",  nationality: "Germany",     club: "Roundnet Köln",            profileUrl: "https://playerzone.roundnetfrance.fr/players/506",                 photoUrl: IMG + "profile_JOS506-2022-06-17-20-32-40.jpg",  gender: "man" },
  { slug: "lucas-rohrbach",    firstName: "Lucas",       lastName: "Rohrbach",    nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/7512",                photoUrl: IMG + "profile_LUC7512-2024-01-18-18-04-05.jpg", gender: "man" },
  { slug: "sebastiano-guerra", firstName: "Sebastiano",  lastName: "Guerra",      nationality: "Italy",       club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/7692",                photoUrl: IMG + "profile_SEB7692-2024-01-22-11-11-48.jpg", gender: "man" },
  { slug: "jonas-tarnutzer",   firstName: "Jonas",       lastName: "Tarnutzer",   nationality: "Switzerland", club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6788",                photoUrl: IMG + "profile_JON6788-2024-01-18-14-03-43.jpg", gender: "man" },
  { slug: "jonas-eigenmann",   firstName: "Jonas",       lastName: "Eigenmann",   nationality: "Switzerland", club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/2539",                photoUrl: IMG + "profile_JON2539-2024-01-19-14-33-28.jpg", gender: "man" },
  { slug: "emerson-dean",      firstName: "Emerson",     lastName: "Dean",        nationality: "Canada",      club: null,                        profileUrl: null,                                                               photoUrl: null,                                             gender: "man" },
  { slug: "serafin-rieser",    firstName: "Serafin",     lastName: "Rieser",      nationality: "Switzerland", club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/5141",                photoUrl: IMG + "profile_SER5141-2023-11-06-21-40-00.jpg", gender: "man" },
  { slug: "giacomo-colliva",   firstName: "Giacomo",     lastName: "Colliva",     nationality: "Italy",       club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/9496-giacomo-rcb",  photoUrl: IMG + "profile_GIA9496-2025-08-10-02-27-52.jpg", gender: "man" },
  { slug: "furkan-erbas",      firstName: "Furkan",      lastName: "Erbas",       nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/2175-furkan-mrc",   photoUrl: IMG + "profile_FUR2175-2024-01-18-14-11-32.jpg", gender: "man" },
  { slug: "wout-thysens",      firstName: "Wout",        lastName: "Thysens",     nationality: "Belgium",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/8274-wout",          photoUrl: IMG + "profile_WOU8274-2025-06-20-13-40-22.jpg", gender: "man" },
  { slug: "francesco-mezzetti",firstName: "Francesco",   lastName: "Mezzetti",    nationality: "Italy",       club: "Milano Roundnet",          profileUrl: "https://playerzone.roundnetfrance.fr/players/9036-francesco-rmi", photoUrl: IMG + "profile_FRA9036-2025-04-30-13-01-30.jpg", gender: "man" },

  // ── WOMEN ─────────────────────────────────────────────────────────────────
  { slug: "laura-kunzelmann",  firstName: "Laura",       lastName: "Kunzelmann",  nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/1768",                photoUrl: IMG + "profile_LAU1768-2022-06-18-23-12-34.jpg", gender: "woman" },
  { slug: "natacha-salvador",  firstName: "Natacha",     lastName: "Salvador",    nationality: "France",      club: "Roundnet Lyon",            profileUrl: "https://playerzone.roundnetfrance.fr/players/4895",                photoUrl: IMG + "profile_NAT4895-2022-06-24-18-57-01.jpg", gender: "woman" },
  { slug: "lauma-ernestsone",  firstName: "Lauma",       lastName: "Ernestsone",  nationality: "Latvia",      club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6606",                photoUrl: IMG + "profile_LAU6606-2024-07-10-23-17-12.jpg", gender: "woman" },
  { slug: "klara-bauer",       firstName: "Klara",       lastName: "Bauer",       nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/1251",                photoUrl: IMG + "profile_KLA1251-2024-03-12-17-15-31.jpg", gender: "woman" },
  { slug: "sophia-walter",     firstName: "Sophia",      lastName: "Walter",      nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/243",                 photoUrl: IMG + "profile_SOP243-2022-06-17-23-12-41.jpg",  gender: "woman" },
  { slug: "ronja-lorenz",      firstName: "Ronja",       lastName: "Lorenz",      nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/2066",                photoUrl: IMG + "profile_RON2066-2022-06-18-08-54-54.jpg", gender: "woman" },
  { slug: "elena-rossetto",    firstName: "Elena",       lastName: "Rossetto",    nationality: "Italy",       club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/7690",                photoUrl: IMG + "profile_ELE7690-2024-01-22-11-08-14.jpg", gender: "woman" },
  { slug: "amely-joly",        firstName: "Amely",       lastName: "Joly",        nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/4935",                photoUrl: IMG + "profile_AME4935-2023-03-11-22-11-57.jpg", gender: "woman" },
  { slug: "mirjam-wiedmer",    firstName: "Mirjam",      lastName: "Wiedmer",     nationality: "Switzerland", club: "Roundnet Club Bern",       profileUrl: "https://playerzone.roundnetfrance.fr/players/6870",                photoUrl: IMG + "profile_MIR6870-2024-07-10-23-19-34.jpg", gender: "woman" },
  { slug: "lina-gunther",      firstName: "Lina",        lastName: "Günther",     nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6458",                photoUrl: IMG + "profile_LIN6458-2024-01-12-10-21-52.jpg", gender: "woman" },
  { slug: "carole-gassner",    firstName: "Carole",      lastName: "Gassner",     nationality: "Switzerland", club: "Roundnet Club Bern",       profileUrl: "https://playerzone.roundnetfrance.fr/players/2584-carole-rcb",    photoUrl: IMG + "profile_CAR2584-2024-03-11-19-55-40.jpg", gender: "woman" },
  { slug: "larissa-haas",      firstName: "Larissa",     lastName: "Haas",        nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/1428",                photoUrl: IMG + "profile_LAR1428-2023-03-16-08-37-29.jpg", gender: "woman" },
  { slug: "rici-barschke",     firstName: "Rici",        lastName: "Barschke",    nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/132",                 photoUrl: IMG + "profile_RIC132-2025-03-03-16-52-52.jpg",  gender: "woman" },
  { slug: "selina-amsler",     firstName: "Selina",      lastName: "Amsler",      nationality: "Switzerland", club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/6866",                photoUrl: IMG + "profile_SEL6866-2026-05-05-17-09-50.jpg", gender: "woman" },
  { slug: "eline-meijer",      firstName: "Eline",       lastName: "Meijer",      nationality: "Switzerland", club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/4783",                photoUrl: IMG + "profile_ELI4783-2024-01-19-14-41-31.jpg", gender: "woman" },
  { slug: "svenja-kuhner",     firstName: "Svenja",      lastName: "Kühner",      nationality: "Germany",     club: null,                        profileUrl: "https://playerzone.roundnetfrance.fr/players/5059",                photoUrl: IMG + "profile_SVE5059-2024-07-24-13-50-35.jpg", gender: "woman" },
];

const ACCEPTED_SLUGS = new Set(ACCEPTED.map(p => p.slug));

async function run() {
  // 1. Fetch current DB state
  const { data: current, error: fetchErr } = await sb
    .from("athlete_profiles")
    .select("id, first_name, last_name, playerzone_id");
  if (fetchErr) { console.error("Fetch error:", fetchErr); process.exit(1); }

  console.log(`Current DB: ${current.length} players`);

  // 2. Build slug from name for existing players (normalize: lowercase, remove accents, replace non-alpha with -)
  function nameToSlug(first, last) {
    return `${first}-${last}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Map existing rows to slug
  const existingBySlug = {};
  for (const row of current) {
    const slug = nameToSlug(row.first_name, row.last_name);
    existingBySlug[slug] = row;
  }

  // 3. Find players to remove (not in accepted list)
  const toRemove = current.filter(row => {
    const slug = nameToSlug(row.first_name, row.last_name);
    return !ACCEPTED_SLUGS.has(slug);
  });

  if (toRemove.length > 0) {
    console.log(`\nRemoving ${toRemove.length} players:`);
    for (const p of toRemove) {
      console.log(`  - ${p.first_name} ${p.last_name}`);
      const { error } = await sb.from("athlete_profiles").delete().eq("id", p.id);
      if (error) console.error(`    ERROR removing ${p.first_name} ${p.last_name}:`, error);
      else console.log(`    OK`);
    }
  } else {
    console.log("\nNo players to remove.");
  }

  // 4. Add missing players (in accepted but not in DB)
  const toAdd = ACCEPTED.filter(p => !existingBySlug[p.slug]);

  if (toAdd.length > 0) {
    console.log(`\nAdding ${toAdd.length} players:`);
    for (const p of toAdd) {
      const countryCode = COUNTRY_CODES[p.nationality] ?? null;
      const pzId = p.profileUrl
        ? p.profileUrl.replace("https://playerzone.roundnetfrance.fr/players/", "")
        : null;

      const { error } = await sb.from("athlete_profiles").insert({
        first_name: p.firstName,
        last_name: p.lastName,
        country: countryCode,
        club: p.club ?? null,
        gender: p.gender,
        photo_url: p.photoUrl ?? null,
        playerzone_id: pzId,
        playerzone_url: p.profileUrl ?? null,
      });
      if (error) console.error(`  ERROR adding ${p.firstName} ${p.lastName}:`, error);
      else console.log(`  + ${p.firstName} ${p.lastName} (${countryCode})`);
    }
  } else {
    console.log("\nNo players to add.");
  }

  // 5. Summary
  const { data: final } = await sb.from("athlete_profiles").select("id");
  console.log(`\nDone. DB now has ${final?.length ?? "?"} players.`);
}

run();
