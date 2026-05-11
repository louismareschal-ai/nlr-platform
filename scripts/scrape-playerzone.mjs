#!/usr/bin/env node
/**
 * Playerzone scraper — fetches player profiles and tournament history.
 *
 * Usage:
 *   node scripts/scrape-playerzone.mjs
 *   node scripts/scrape-playerzone.mjs --dry-run      (no writes to DB)
 *   node scripts/scrape-playerzone.mjs --rankings     (also scrape top rankings)
 *
 * Reads .env.local for SUPABASE credentials.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env
const envLocal = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envLocal
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes("--dry-run");
const SCRAPE_RANKINGS = process.argv.includes("--rankings");

const SOURCES = [
  { key: "playerzone_fr", base: "https://playerzone.roundnetfrance.fr", country: "FR" },
  { key: "playerzone_de", base: "https://playerzone.roundnetgermany.de", country: "DE" },
];

// ─── HTML parsing helpers ──────────────────────────────────────────────────────

function extractText(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

async function fetchPage(url) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "NLR-Open-Scraper/1.0 (contact: louismareschal2000@gmail.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch (e) {
    console.warn(`  Fetch failed for ${url}: ${e.message}`);
    return null;
  }
}

/**
 * Try to find a player's profile URL on a playerzone instance.
 * Playerzone URLs follow: /players/{id}-{firstname}-{initials}
 * We fetch a search or the player list to find the slug.
 */
async function findPlayerUrl(base, numericId) {
  // First try bare numeric ID — some instances redirect to the slug
  for (const prefix of ["", "/en"]) {
    const url = `${base}${prefix}/players/${numericId}`;
    const html = await fetchPage(url);
    if (html && (html.includes("player-profile") || html.includes("win-rate") || html.includes("og:title"))) {
      return { url, html };
    }
  }

  // Playerzone requires the full slug (e.g. /players/3835-noah-rohloff).
  // Fetch the player listing page and look for a link starting with /players/{numericId}-
  const listingHtml = await fetchPage(`${base}/players`);
  if (listingHtml) {
    const slugMatch = listingHtml.match(
      new RegExp(`href="(/(?:en/)?players/${numericId}-[^"]+)"`)
    );
    if (slugMatch) {
      const profileUrl = base + slugMatch[1];
      const profileHtml = await fetchPage(profileUrl);
      if (profileHtml) return { url: profileUrl, html: profileHtml };
    }
  }

  return null;
}

/**
 * Parse a playerzone profile HTML page.
 * Structure confirmed against playerzone.roundnetfrance.fr live HTML.
 */
function parseProfile(html, sourceKey, profileUrl) {
  if (!html) return null;

  // Name: og:title meta spans multiple lines, so use [\s\S]*?
  let fullName = decodeHtml(
    extractText(html, /property="og:title"[\s\S]{0,60}?content="([^"]+)"/) ||
    extractText(html, /content="([^"]+)"[\s\S]{0,60}?property="og:title"/) ||
    extractText(html, /<b>([^<]+)<\/b>/) ||
    ""
  ).trim();

  if (!fullName) return null;

  // Strip quoted nicknames: 'Firstname "Nickname" Lastname' → 'Firstname Lastname'
  fullName = fullName.replace(/\s+"[^"]*"\s*/, " ").trim();

  // Name split — playerzone uses "Firstname Lastname" in og:title
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  // Photo: <img class="player-img" src="..."> or og:image meta
  const photoUrl =
    extractText(html, /class="player-img"[^>]*src="([^"]+)"/) ||
    extractText(html, /property="og:image"[\s\S]{0,60}?content="([^"]+)"/) ||
    extractText(html, /content="(https:\/\/pstaassets[^"]+profile_[^"]+)"/) ||
    null;

  // Club: <p>ClubName&nbsp;</p> after the player card
  const club = decodeHtml(
    extractText(html, /<p>([^<]{3,50})&nbsp;<\/p>/) || ""
  ).trim() || null;

  // Country: flag img inside player card — filename encodes country
  // e.g. images/flags/germany.svg or images/flags/france.svg
  const flagMatch = html.match(/staticfiles\/ranking\/images\/flags\/([a-z-]+)\.svg/);
  const countryFromFlag = flagMatch ? flagMatch[1] : null;
  const COUNTRY_MAP = {
    germany: "DE", france: "FR", switzerland: "CH", austria: "AT",
    denmark: "DK", netherlands: "NL", italy: "IT", sweden: "SE",
    belgium: "BE", spain: "ES", poland: "PL", "united-kingdom": "GB",
    latvia: "LV", "czech-republic": "CZ",
  };
  const country = COUNTRY_MAP[countryFromFlag ?? ""] ?? null;

  // Stats badges: <div class="auto-badge wins ..."><div class="caption">4</div>
  const winsBadge = extractText(html, /auto-badge wins[^"]*"[^>]*>[\s\S]*?<div class="caption">(\d+)<\/div>/);
  const gamesBadge = extractText(html, /auto-badge games[^"]*"[^>]*>[\s\S]*?<div class="caption">(\d+)<\/div>/);
  const tournamentWins = winsBadge ? parseInt(winsBadge) : 0;
  const gamesPlayed = gamesBadge ? parseInt(gamesBadge) : 0;

  // Tournament results
  const results = parseTournamentResults(html, sourceKey, profileUrl);

  // Playerzone doesn't expose W/L split directly — derive placement-1 count as tournament wins
  const totalWins = tournamentWins; // tournament wins from badge
  const totalLosses = 0; // not available without loading each match

  return {
    firstName,
    lastName,
    photoUrl,
    club: club || null,
    country,
    gamesPlayed,
    totalWins,
    totalLosses,
    results,
  };
}

function parseTournamentResults(html, sourceKey, profileUrl) {
  const results = [];

  // Playerzone tournament list: <li class="year-YYYY year-item ...">
  // Each item has: .team-tournament-date, .tournament-name, .tournament-division,
  //                .tournament-team, .tournament-position
  const liPattern = /<li class="year-(\d{4}) year-item[^"]*">([\s\S]*?)<\/li>/g;
  let liMatch;

  while ((liMatch = liPattern.exec(html)) !== null) {
    const year = liMatch[1];
    const liHtml = liMatch[2];

    const name = decodeHtml(
      extractText(liHtml, /class="tournament-name"[^>]*>\s*(?:<a[^>]*>)?([^<]+)(?:<\/a>)?\s*<\/div>/) || ""
    ).trim();
    if (!name || name.length < 3) continue;

    const divisionRaw = decodeHtml(
      extractText(liHtml, /class="tournament-division"[^>]*>([^<]+)<\/div>/) || ""
    ).trim();

    const dateRaw = decodeHtml(
      extractText(liHtml, /class="team-tournament-date"[^>]*>\s*([^<]+)\s*<\/div>/) || ""
    ).trim();

    const placementRaw = decodeHtml(
      extractText(liHtml, /class="tournament-position"[^>]*>\s*([^<]+)\s*<\/div>/) || ""
    ).trim();

    const pointsRaw = decodeHtml(
      extractText(liHtml, /class="ranking-points[^"]*"[^>]*>\s*<[^>]+>\s*([\d.]+)\s*<\//) || ""
    ).trim();

    // Parse date: "11.06.22" or "11.06.2022" → YYYY-MM-DD
    let tournamentDate = null;
    const dateMatch = dateRaw.match(/^(\d{1,2})\.(\d{2})\.(\d{2,4})$/);
    if (dateMatch) {
      const [, d, m, y] = dateMatch;
      const fullYear = y.length === 2 ? `20${y}` : y;
      tournamentDate = `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // Placement: "15." → 15
    const placement = placementRaw ? parseInt(placementRaw) : null;

    // Points
    const points = pointsRaw ? parseFloat(pointsRaw) : null;

    // Division normalisation
    const divLower = divisionRaw.toLowerCase();
    let division = "open";
    if (divLower.includes("women") || divLower.includes("femme") || divLower.includes("frauen")) division = "women";
    else if (divLower.includes("mixed")) division = "mixed";

    results.push({
      tournament_name: name,
      tournament_date: tournamentDate,
      season: year,
      division,
      placement: Number.isNaN(placement) ? null : placement,
      points_earned: points,
      source: sourceKey,
      source_url: profileUrl,
    });
  }

  return results;
}

// ─── Main scraping logic ───────────────────────────────────────────────────────

async function scrapePlayer(playerzoneId, sourceOverride = null) {
  // playerzoneId may be a full URL (https://playerzone.roundnetfrance.fr/players/3835)
  // or a bare numeric ID. Normalise to { numericId, source }.
  let resolvedSources;
  let numericId = playerzoneId;

  if (playerzoneId.startsWith("http")) {
    const parsed = new URL(playerzoneId);
    const base = `${parsed.protocol}//${parsed.hostname}`;
    // Extract the numeric ID from the path segment (e.g. /players/3835 → "3835")
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const idPart = pathParts[pathParts.length - 1];
    numericId = idPart.split("-")[0]; // handles "3835-noah-rohloff" too

    const matchedSource = SOURCES.find((s) => s.base === base);
    resolvedSources = matchedSource
      ? [matchedSource]
      : [{ key: "playerzone_unknown", base, country: null }];
  } else {
    resolvedSources = sourceOverride ? [sourceOverride] : SOURCES;
  }

  for (const source of resolvedSources) {
    console.log(`  Trying ${source.base}...`);
    const result = await findPlayerUrl(source.base, numericId);
    if (!result) continue;

    const { url, html } = result;
    const profile = parseProfile(html, source.key, url);
    if (!profile) continue;

    return {
      ...profile,
      playerzoneUrl: url,
      // prefer country detected from flag in profile HTML, fall back to source default
      country: profile.country ?? source.country,
      source: source.key,
    };
  }

  return null;
}

async function upsertAthleteProfile(playerzoneId, data, linkedPlayerId = null) {
  if (DRY_RUN) {
    console.log(
      `  [DRY RUN] Would upsert: ${data.firstName} ${data.lastName} (${playerzoneId})`
    );
    return null;
  }

  const { data: profile, error } = await supabase
    .from("athlete_profiles")
    .upsert(
      {
        playerzone_id: playerzoneId,
        playerzone_url: data.playerzoneUrl,
        first_name: data.firstName,
        last_name: data.lastName,
        country: data.country,
        club: data.club,
        photo_url: data.photoUrl,
        total_wins: data.totalWins,
        total_losses: data.totalLosses,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "playerzone_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error(`  Error upserting profile: ${error.message}`);
    return null;
  }

  // Upsert tournament results
  if (data.results && data.results.length > 0) {
    for (const result of data.results) {
      await supabase.from("athlete_tournament_results").upsert(
        {
          athlete_id: profile.id,
          ...result,
        },
        { onConflict: "athlete_id,tournament_name,division,season" }
      );
    }
  }

  // Link to platform player if provided
  if (linkedPlayerId) {
    await supabase
      .from("players")
      .update({ athlete_profile_id: profile.id })
      .eq("id", linkedPlayerId);
  }

  return profile.id;
}

async function main() {
  console.log(`NLR Playerzone Scraper${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  // Check if athlete_profiles table exists
  const { error: tableCheck } = await supabase
    .from("athlete_profiles")
    .select("id")
    .limit(1);

  if (tableCheck && tableCheck.message.includes("does not exist")) {
    console.error(
      "athlete_profiles table does not exist. Apply migration 003 first.\n" +
      "See supabase/migrations/003_athlete_profiles.sql"
    );
    process.exit(1);
  }

  // 1. Scrape players in our DB that have playerzone_id
  console.log("=== Scraping DB players with playerzone_id ===\n");

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, playerzone_id")
    .not("playerzone_id", "is", null);

  console.log(`Found ${players?.length ?? 0} players with playerzone_id\n`);

  for (const player of players ?? []) {
    console.log(`→ ${player.first_name} ${player.last_name} (playerzone_id: ${player.playerzone_id})`);
    const data = await scrapePlayer(player.playerzone_id);

    if (!data) {
      console.log(`  Not found on any playerzone\n`);
      continue;
    }

    console.log(`  Found: ${data.firstName} ${data.lastName} at ${data.playerzoneUrl}`);
    console.log(`  Club: ${data.club ?? "—"}, Wins: ${data.totalWins}, Losses: ${data.totalLosses}`);
    console.log(`  Tournament results: ${data.results.length}`);

    const profileId = await upsertAthleteProfile(player.playerzone_id, data, player.id);
    if (profileId) console.log(`  Saved as athlete_profile ${profileId}`);
    console.log();

    // Rate limit
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 2. Optionally scrape top rankings
  if (SCRAPE_RANKINGS) {
    console.log("\n=== Scraping France rankings for top players ===\n");

    const rankingsUrl = "https://playerzone.roundnetfrance.fr/rankings";
    const html = await fetchPage(rankingsUrl);

    if (html) {
      // Extract player IDs from ranking links
      const playerLinks = [...html.matchAll(/href="\/players\/(\d+)-([^"]+)"/g)];
      const topPlayers = playerLinks.slice(0, 20);

      console.log(`Found ${topPlayers.length} players in rankings\n`);

      for (const [, pid, slug] of topPlayers) {
        const profileUrl = `https://playerzone.roundnetfrance.fr/players/${pid}-${slug}`;
        console.log(`→ Playerzone ID ${pid} (${slug})`);

        const html2 = await fetchPage(profileUrl);
        if (!html2) { console.log("  Failed to fetch\n"); continue; }

        const profile = parseProfile(html2, "playerzone_fr", profileUrl);
        if (!profile) { console.log("  Could not parse profile\n"); continue; }

        console.log(`  ${profile.firstName} ${profile.lastName}, club: ${profile.club ?? "—"}`);

        await upsertAthleteProfile(pid, {
          ...profile,
          playerzoneUrl: profileUrl,
          country: "FR",
        });

        console.log();
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.log("Scraping complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
