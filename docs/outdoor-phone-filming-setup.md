# Outdoor Phone Filming Setup — NLR June 6 2026 (Mannheim)

Context: 12 courts in parallel, all filmed for stats data collection. 6 courts also streamed live to YouTube via Streamlabs Mobile. Outdoor venue, June daylight in Mannheim (~18-28°C, sun exposure variable).

The dataset is the whole point of the broadcast play: stats on how roundnet evolves with the larger ball + higher net. If a phone overheats and shuts down mid-day, the data for that court is lost. Thermal management is therefore as critical as the streaming itself.

---

## Heat sources per phone

1. Direct sunlight on the device chassis (largest factor outdoor).
2. Sustained video encoder load (continuous 1080p recording = high CPU).
3. Streamlabs RTMP encoder running on top of recording (streaming phones only).
4. Power bank in trickle-charge mode (sandwich effect: battery heated from current draw and recharge).
5. Lack of airflow.

## Phone categories

- **6 streaming phones**: 5 player phones (1 per squad, on courts with active matches) + 1 main camera operator phone. Streamlabs + recording = max heat.
- **6 recording-only phones**: courts not streamed, just local recording. Lower heat (no encoder).

---

## Equipment shopping list

Deadline to order: 4-5 days before event (Amazon DE Prime safety margin).

### Essential (~310 €)

| Item | Qty | Unit € | Total € | Amazon DE search |
|---|---|---|---|---|
| Mini white/silver parasol Ø100cm | 12 | 12 | 144 | `Strandschirm 100cm weiß` or `Tripod Sonnenschirm` |
| Phone Peltier cooler (clamp) | 6 | 22 | 132 | `Handy Kühler Peltier` or `Black Shark MagCooler 3` (iPhone MagSafe) |
| White microfiber towels (12-pack) | 1 | 15 | 15 | `Mikrofaser Handtuch weiß 12er` |
| Stakes / sandbags for parasols | 12 | 1.50 | 18 | `Sonnenschirm Halterung Erde` |

Notes on coolers:
- iPhone-heavy roster: prefer MagSafe magnetic clamp (Black Shark MagCooler 3 Pro, ~45 €). Works on Android via adhesive metal patch.
- Mixed iPhone/Android: universal clip coolers (~20 €). Risk: may obstruct rear camera depending on phone model. Verify in pre-test.

### Recommended (~50 €)

| Item | Qty | Unit € | Total € | Search |
|---|---|---|---|---|
| USB clip-on fan | 6 | 7 | 42 | `USB Mini Ventilator Clip` |
| Foam board A3 (backup shade) | 4 | 2 | 8 | `Foam Board weiß A3` |

### Variable (verify stock first)

| Item | Qty | Unit € | Total € | Note |
|---|---|---|---|---|
| Power bank 20000mAh USB-C PD | up to 12 | 25 | up to 300 | Anker / Baseus. Ask squads to bring their own to reduce. |
| USB-C cable 1m | up to 12 | 3 | up to 36 | For coolers + recharge |
| Phone tripod 1.5m+ | up to 12 | 18 | up to 216 | Ask players to bring theirs |

### Budget summary

- Essential only: **310 €**
- Essential + recommended: **~360 €**
- Worst case if you own nothing: **~900 €**

---

## Per-station setup (outdoor)

Every station identical. Build like a checklist when assembling.

1. Tripod with phone mount, height 1.5m+, oriented for the court framing.
2. Lest the tripod base (sandbag or backpack) against wind.
3. Parasol planted next to tripod, oriented to shade the phone (re-check at midday because sun moves).
4. White microfiber towel draped over phone + power bank, leaving the rear camera lens clear.
5. Power bank attached (do NOT plug in yet — see power management).
6. Streaming phones only: clip Peltier cooler on rear of phone, connect via USB-C to power bank.

## Power management (counterintuitive but critical)

- **Do NOT charge while recording.** Charging while recording stacks two heat sources (current draw to battery + active recording).
- Run on internal battery until phone reaches ~20%, then connect power bank for top-up. Disconnect once at ~80%.
- Plan 2 power banks per phone for hot-swap mid-day (one charging at HQ while the other is in use).

## Camera settings

- Resolution: **1080p**, framerate **30 fps**. NOT 4K, NOT 60fps, NOT HDR.
- Storage: 1080p 30fps ~= 8 GB/h. A 6h day ~= 48 GB per phone. Verify each phone has >= 64 GB free.
- Brightness: 30% (preview screen heat).
- Airplane mode on recording-only phones (no network = less radio heat).
- Streaming phones keep wifi/cellular on; bitrate 1080p 4 Mbps on wifi courts, 720p 2 Mbps on cellular fallback.

## Wind handling

- Tripod base must be lested. Light phones + moderate wind = framing drift = stats data unusable.
- Re-check framing every hour (the wrangler role below).

---

## Day-of operations

### Phone wrangler role (1 dedicated person)

This is the most thankless and the most important operational role. Without a dedicated wrangler, 2-3 courts WILL lose data silently mid-afternoon.

Profile: someone with no critical role elsewhere (not a captain, not a referee, ideally not a player).

Checklist per round (every 45-60 min, ~10 min per full loop):
- Phone screen on, recording active (some apps stop on timer)
- No thermal warning displayed
- Battery > 20% (swap power bank if not)
- Parasol still shading correctly (re-orient if sun moved)
- Framing unchanged (tripod hasn't shifted)

Emergency contacts: Louis + Robin on speed dial.

### Storage transfer plan

- 6h of recording across 12 phones = ~576 GB of raw video.
- Easiest path: laptop + 12 USB-C cables + one folder per court. Transfer overnight after the event.
- Alternative: cards SD via USB-C OTG adapter, swap mid-day. Faster turnaround but moving parts.
- Cloud upload during the event: requires solid wifi + per-phone Google Drive / iCloud login. Only viable if wifi is rock-solid AND each phone has a personal cloud account. Probably not.

---

## Pre-test (mandatory, schedule before June 2)

A single sunny afternoon between now and event day, ideally 12h-15h (hottest window):
1. Assemble one full station outdoor: tripod + parasol + microfiber + phone + power bank + Peltier cooler.
2. Start 1080p 30fps recording.
3. Let it run 2 full hours under direct sun.
4. Check:
   - No thermal warning appeared
   - Recording is continuous (no silent stop)
   - Framing is unchanged (wind test)
   - Battery is still > 50% at the end

Pass = your rig is validated for 12 stations.
Fail = adjust before D-day (more shade, lower bitrate, different power strategy).

---

## What can go wrong (anticipated failure modes)

- **Sun moves between rounds → parasol no longer shades the phone.** Mitigation: wrangler re-orients hourly.
- **Player swaps streaming phone with a backup that wasn't pre-configured.** Mitigation: print Streamlabs preset name + RTMP key on a card taped to each tripod, identical setup info redundant.
- **Wifi saturation if all 5 streaming phones land on the same access point.** Mitigation: hybrid 5G + TP-Link wifi split; pre-assign which court uses which network.
- **One phone storage fills up.** Mitigation: verify >= 64 GB free per phone the day before; have 1-2 spare phones ready.
- **Streamlabs Browser Source widget fails to load.** Mitigation: the overlay also renders on `/live` page itself; the burned-in version is nice-to-have, not blocking.

---

## After the event

- Transfer all 12 recordings to a single drive: `NLR 2026/recordings/court_N.mp4`.
- Cross-reference with YouTube VODs for the 6 streamed courts (download MP4 1080p from YouTube Studio).
- The recordings feed the stats analysis (Mission 1: validate that larger ball + higher net = different rally patterns).

---

## Open questions to resolve before D-day

- [ ] Confirm venue is fully outdoor (no covered areas to use for shaded courts).
- [ ] Confirm phone roster: how many iPhone vs Android among the 6 streaming players? Drives the cooler choice (MagSafe vs clamp).
- [ ] Recruit the wrangler.
- [ ] Schedule the pre-test on a sunny afternoon.
- [ ] Verify each of the 12 phones has >= 64 GB free 48h before event.
