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

## Deploy gate

Nothing ships publicly until Flofaction explicitly approves host, domain, and key vault. Local `npm run dev` / `npm start` only for v1.
