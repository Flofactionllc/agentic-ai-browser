# Flo Eye View — Commercial & sellability checklist

## Why this is sellable

1. **Code we own** — clean-room Mission Control under Flofaction MIT (or proprietary dual-license later).
2. **No NC payloads** — TeleGeography and Bhote Koshi never included.
3. **Keyless demo path** — prospects can run Storm Ops on Florida with public NOAA/NASA/NIFC/USGS + Esri.
4. **BYOK for premium** — Cesium ion paid, Google Maps, TomTom, OpenAI, FIRMS MAP_KEY supplied by customer.
5. **Division SKUs** — sell Emergency alone or Command Suite.

## Must-not-ship list (commercial builds)

- `telegeography_submarine_cables` (CC BY-NC-SA)
- Bhote Koshi / Vantor / GeoPera NC imagery
- OpenSky as default flight provider without written commercial terms
- Google News RSS as default headlines
- Flofaction production API keys in client bundles or git
- Free Cesium ion Community token for multi-tenant SaaS

## Attribution (keep visible)

- Esri World Imagery credit line
- NOAA/NWS NHC · nowCOAST
- NASA GIBS / FIRMS (when enabled)
- NIFC WFIGS
- USGS
- OpenStreetMap / ODbL when OSM data is shown
- Inspiration notice: God’s Eye View (MIT) — Bilawal Sidhu

## SKUs (v0.4)

| SKU id | Unlocks |
|---|---|
| `emergency` | Emergency Services + HQ |
| `insurance` | Insurance + HQ |
| `media` | Media / Flo TV + HQ |
| `staffing` | Staffing + HQ |
| `command` | All divisions (default) |

Set `FLO_EYE_SKU` / `VITE_FLO_EYE_SKU` or `?sku=emergency`. Clients can also `localStorage.flo-eye-sku`.

## Access gate (sell demos)

Set `FLO_EYE_ACCESS_CODE` in `.env`. Mission Control and the EMS host prompt for the code; session is an HttpOnly cookie (`flo_eye_session`, 24h). With no code configured the API stays **open-dev** for local work.

## TomTom

With `TOMTOM_API_KEY`, `/api/traffic` enriches FL corridor midpoints via TomTom Flow Segment Data. Without it, simulated congestion remains.

## Deploy gate

Nothing ships publicly until Flofaction explicitly approves host, domain, and key vault. Local `npm run dev` / `npm start` only until then.
