# God's Eye View — Inspection Verdict

**Source:** [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view)  
**Inspected for:** Flofaction commercial product **Flo Eye View**  
**Date:** 2026-10-14

## License verdict: fork-and-rebrand is legal; clean-room is preferred for IP we sell

| Asset | License | Flofaction commercial use |
|---|---|---|
| Application source code | **MIT** (Bilawal Sidhu, 2026) | ✅ Allowed — copy, modify, sell, rebrand with copyright notice retained |
| TeleGeography submarine cables | **CC BY-NC-SA 3.0** | ❌ Remove — NonCommercial |
| Bhote Koshi event imagery / flood path | **CC BY-NC 4.0** | ❌ Remove — NonCommercial |
| OpenSky Network flights API | Non-commercial research/education | ❌ Do not ship as default commercial flight feed — use adsb.lol / BYOK agreement |
| Google News RSS (cockpit headlines) | Personal / noncommercial | ❌ Disable in commercial builds — use GDELT or Flofaction news |
| Cesium ion Community (free) | Personal / non-commercial quotas | ⚠️ For sold products use paid Cesium ion or keyless Esri + Re:Earth terrain |
| Google Maps Photorealistic 3D | Google Maps Platform ToS + billing | ⚠️ Customer BYOK only; never ship Flofaction keys |
| Esri World Imagery (classic tiles) | Esri terms + attribution | ✅ Default keyless basemap for v1 |
| NOAA NHC / nowCOAST / GFS | U.S. public domain | ✅ Storm Ops cornerstone |
| NASA GIBS / FIRMS | U.S. public domain (FIRMS needs free MAP_KEY) | ✅ Damage / fire layers |
| NIFC WFIGS fire perimeters | U.S. public domain | ✅ Fire Watch |
| USGS earthquakes | U.S. public domain | ✅ HQ / env context |
| OSM-derived ODbL extracts | ODbL 1.0 | ✅ With attribution + share-alike on *data* |

**Decision for Flo Eye View v1:** build a **Flofaction-owned clean-room Mission Control** in the same product language (3D globe + live public layers + ops HUD), not a wholesale vendored clone of GEV. That keeps our sellable IP clean, avoids shipping NC datasets by accident, and lets us tailor division dashboards without carrying GEV’s full cockpit/voice surface on day one.

Inspiration and architecture patterns from God’s Eye View are acknowledged under MIT in `THIRD_PARTY_NOTICES.md`. Optional later: selective MIT-licensed module ports with Bilawal Sidhu copyright retained in file headers.

## What runs with no API keys (v1 target)

| Layer | Source | Key? |
|---|---|---|
| Satellite basemap | Esri World Imagery | No |
| Rain radar | NOAA nowCOAST WMS | No |
| Hurricane / tropical | NOAA NHC CurrentStorms + MapServer | No |
| Fire perimeters | NIFC WFIGS | No |
| Earthquakes | USGS FDSN | No |
| Recent imagery compare | NASA GIBS WMTS | No |
| Place search (basic) | Photon / Nominatim (rate-limited) | No |

## What needs customer / operator keys later

| Capability | Key | Notes |
|---|---|---|
| Photorealistic 3D buildings | Cesium ion **paid** or Google Maps BYOK | Do not use free ion for sold SaaS |
| Live worldwide flights | Prefer adsb.lol; OpenSky only under written commercial terms | |
| AIS ships | AISStream token (optional) | |
| Live traffic | TomTom BYOK | |
| Voice ops | OpenAI Realtime BYOK | |
| FIRMS hotspot density | Free NASA FIRMS MAP_KEY | Operator-supplied |

## Network posture

- GEV binds localhost and keeps most secrets server-side; browser-exposed keys (Google, Cesium, Mapillary) must be referrer-restricted.
- Flo Eye View v1 follows the same rule: **no keys in git**, `.env` local only, public deploy gated on explicit approval.
- Nothing in this PR deploys publicly or stores production credentials.

## Repo context

This workspace is `Flofactionllc/agentic-ai-browser`. There is not yet a separate emergency-management monorepo in the org checkout. Flo Eye View lands here as the **Mission Control product package** (`flo-eye-view/`) with integration hooks for the agentic browser and a documented embed contract for the emergency-management suite under development.
