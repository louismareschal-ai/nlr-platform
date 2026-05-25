# NLR Open — Live Multi-View Plan (June 6, 2026)

12 simultaneous court streams on a single `/live` page on nlr-platform, with the score of each court burned into the corresponding stream feed (and also overlaid on the multi-view page itself).

This doc tracks setup, accounts, hardware, software, day-of ops, and post-tournament archival.

---

## Architecture (decided)

- **Hosting**: nlr-platform (Next.js, already on Railway, already on Supabase)
- **Streaming platform**: YouTube Live
  - One single channel under `nextlevelroundnet@gmail.com`
  - 12 concurrent unlisted live streams (one per court), each with its own RTMP key
  - VODs auto-archived on the channel, downloadable as MP4 1080p for post-tournament video analysis
- **Phone-side encoder**: Streamlabs Mobile (free, iOS + Android)
  - Pushes RTMP to YouTube with the per-court stream key
  - Includes a Browser Source widget pointing to `nlr-platform.app/overlay/court/[n]` so the court's live score is composited into the stream feed itself
  - Note: YouTube's 50-subscriber gate does NOT apply when using an external RTMP encoder like Streamlabs (it only applies to the YouTube app's "Go Live" button)
- **Scoreboard data**: pedal-driven scoreboard writes to an existing Firebase Realtime Database (already wired, tested, used by the pedal hardware project)
  - nlr-platform reads from Firebase RTDB only, never writes — single source of truth stays in Firebase
  - Per-court overlay page (composited into the stream) and the multi-view `/live` page both subscribe in realtime to the same Firebase path
  - Requires: Firebase web config in `.env.local` (`NEXT_PUBLIC_FIREBASE_*`), `firebase` SDK installed, RTDB read rules public (or anonymous token)
- **Page on nlr-platform**:
  - `/live` — 4x3 grid of all 12 streams, with score overlay per tile
  - `/live/court/[n]` — focus mode: one big stream + 11 small tiles around it (so a viewer can fully zoom on one court while still tracking the others)
  - `/overlay/court/[n]` — transparent score overlay served to the per-phone Streamlabs browser source
- **Network on D-day**: 1 Ubiquiti AP covers 3-4 nearby courts, others run on phone cellular data. Streamlabs allows per-stream resolution/bitrate (drop to 720p / 2 Mbps on cellular courts).

---

## Why YouTube (not Twitch)

| Criterion | YouTube Live | Twitch |
|---|---|---|
| VOD retention | Indefinite, downloadable MP4 | 14 days (60 for affiliate), then gone |
| Concurrent streams per account | Multiple from one channel | One per account (would need 12 accounts) |
| Quality cap | 1080p, no condition | 1080p partner-only |
| Embed setup | Plain iframe | Iframe + parent param |
| Mobile streaming via RTMP encoder | No sub gate | No sub gate |

Recording retention is the deciding factor — post-tournament video analysis is a hard requirement.

---

## Accounts

- Google account: `nextlevelroundnet@gmail.com` (already exists)
- YouTube channel: existing on that account (verify name + branding)
- No per-streamer accounts needed: streamers receive only an RTMP URL + stream key per court (printed card)

---

## Setup checklist (before June 6)

### YouTube
- [ ] Verify the YouTube channel by phone number (if not already done)
- [ ] Enable live streaming in YouTube Studio — **24h activation delay**, do this latest by 2026-05-30
- [ ] Create 12 scheduled unlisted live events in Live Control Room (Court 1 to Court 12)
  - For each: note the RTMP URL, the stream key, and the public video ID
  - Use a consistent title scheme: `NLR Open 2026 — Court N`
- [ ] Group the 12 events into an unlisted YouTube playlist for easy reference

### nlr-platform code
- [ ] Branch `feat/live-multiview` from `main`
- [ ] Install `firebase` SDK + add `NEXT_PUBLIC_FIREBASE_*` env vars from the existing Firebase project console
- [ ] Confirm the Firebase RTDB path/shape for the per-court live scores + that public read is enabled
- [ ] Config file `data/streams.json` with 12 entries `{court: 1, youtubeVideoId: "..."}` (filled later when YouTube events exist)
- [ ] Page `/live` — 4x3 grid of YouTube iframes + Firebase RTDB subscription for tile overlays
- [ ] Page `/live/court/[n]` — focus mode (1 big + 11 small)
- [ ] Page `/overlay/court/[n]` — transparent score overlay for the per-phone Streamlabs browser source (must render on transparent background, large readable font, branded NLR colors)
- [ ] Test on phone via `bash scripts/phone-access.sh`

### Phones (12x)
- [ ] Install Streamlabs Mobile on each phone (iOS or Android)
- [ ] Configure each phone with its court's RTMP URL + stream key
- [ ] Add Browser Source widget pointing to the corresponding `/overlay/court/[n]` URL
- [ ] Set resolution: 1080p 4 Mbps on courts with WiFi, 720p 2 Mbps on cellular-data courts
- [ ] Print 12 cards: `Court N | Streamlabs preset name | RTMP URL | Stream key | Overlay URL | QR code for the overlay page`

### Hardware
- [ ] Ubiquiti AP placement test (which 3-4 courts does it actually cover)
- [ ] Tripods or stable mounts for 12 phones
- [ ] Spare power banks for each phone
- [ ] Pedal scoreboard hardware confirmed (Daniel? someone else?) — and connectivity decided (HTTP POST direct vs phone relay)

### Rehearsal
- [ ] End-to-end test with 2-3 phones at least 5 days before tournament
- [ ] Test scoreboard pedal updates the overlay in <2 seconds
- [ ] Test what happens when one stream drops mid-game (Streamlabs auto-reconnect, page recovery)

---

## Day-of operations

- [ ] One person on-call (technical referent) who can restart streams, refresh overlays, debug WiFi
- [ ] Monitor dashboard: a simple admin page showing "12 streams: green/red status" so the referent sees instantly which court is down
- [ ] Designated "score keeper" per court (the person operating the pedal)
- [ ] Communicate the public URL `nlr.app/live` (or wherever) to viewers + on the teaser reel posted before

---

## Post-tournament

- [ ] Within 48h after the event: download all 12 VODs from YouTube Studio (Manage Videos → download MP4 1080p)
- [ ] Archive to NLR drive: `NLR 2026/streams/court_N.mp4`
- [ ] Keep YouTube unlisted streams up as long as useful for public re-watching
- [ ] Use the archived MP4s for stats validation + video analysis (Mission 1 — net height balance proof)

---

## Tournament structure (NLR June 6)

- 8 squads, single elimination with all placement games played
- 12 courts available, 4 simultaneous encounters per round, 3 rounds total
- Per encounter: 2 rounds, 5 games
  - Round 1: 2 Mixed games (uses 2 courts per encounter = 8 courts active, 4 idle)
  - Round 2: 2 Open + 1 Women games (uses 3 courts per encounter = 12 courts active)
- Total: 60 official games + 20 warm-up games (warm-up streaming optional)
- Court ↔ encounter mapping is fixed in advance (e.g. QF1 squads A vs B on courts 1, 2, 3)
- Composition validation by squad admins (in `/my-squad`) is the trigger that pushes player names to Firebase

## Firebase data flow

- **Court ↔ match-N mapping**: static (`court 1 ≡ match-X1`, ..., `court 12 ≡ match-X12`). Stored in `data/courts.json` for easy reconfiguration.
- **Range of match-N nodes used by NLR**: TBD — likely match-10 to match-23 (match-1 to match-9 may belong to other federations). MUST be confirmed with Roundnet Germany before any write goes out, otherwise risk of overwriting another tournament's live data.
- **Read** (nlr-platform → Firebase): `/overlay/court/[n]`, `/live`, `/admin/live` all subscribe in realtime to the relevant match-N node for live scores + teams_info.
- **Write** (nlr-platform → Firebase, hybrid): auto-push of `teams_info` (names, colors, logos, players) into the right match-N when a squad admin validates composition in `/my-squad`. Admin override button "Re-push composition" available on `/admin/live` per court.
- **Pedal-side write**: untouched. Pedal hardware keeps writing scores to Firebase exactly as today.

## Layout

- `/live`: adaptive grid — 8 tiles 2x4 during round 1 of each encounter, 12 tiles 4x3 during round 2. No placeholder tiles for idle courts.
- `/live/court/[n]`: focus mode — one big stream + 11 small around it.
- `/overlay/court/[n]`: transparent score overlay served to Streamlabs Browser Source on each phone (composited into the stream feed itself).
- `/admin/live`: 12 streams status (green/red) + Firebase scores + "force re-push composition" button per court.

## Open questions

- [ ] **CONFIRM match-N range for NLR with Roundnet Germany** (likely match-10 to match-23) — hard blocker for any write to Firebase
- [ ] Final decision on URL: `nlr.app/live` (NLR public site) vs `nlr-platform.app/live` — same code can live on either, the question is what URL the teaser reel points to
- [ ] Pedal scoreboard hardware: who builds, who tests, what protocol (HTTP direct vs Bluetooth-to-phone)
- [ ] How to gracefully degrade if Streamlabs Browser Source widget fails on a court (fallback: score still visible on `/live`, just not burned into that stream)
- [ ] Whether to also display the focus mode's "11 small tiles" on a separate auxiliary screen at the venue (production value for the event hall)
- [ ] Visual court-assignment plan per phase (QF1-4, SF1-2, F + placements) showing which encounter is on which 3 courts — to be drawn after code base is up
