# Flo Eye View

**Flofaction Mission Control** — a sellable, division-aware 3D situational awareness console.

Inspired by [God’s Eye View](https://github.com/bilawalsidhu/gods-eye-view) (MIT, Bilawal Sidhu). Flo Eye View is a **clean-room Flofaction product**: same ops-room energy, our brand, our divisions, commercial-safe data defaults.

> Inspection before anything public: see [`docs/INSPECTION.md`](docs/INSPECTION.md).  
> Design: [`docs/DESIGN.md`](docs/DESIGN.md) · Sell checklist: [`docs/COMMERCIAL.md`](docs/COMMERCIAL.md)

## What you get in v1

- **One Mission Control shell** with Flofaction branding
- **Dashboard per division:** HQ · Emergency Services · Insurance · Media/Flo TV · Staffing · LUAP · Books
- **Multiple screens per division** (Storm Ops, Deployment Map, Damage Assessment, Fire Watch, …)
- **Florida-centered globe** (Esri World Imagery, keyless)
- **Live keyless layers:** NOAA radar, NHC cyclones, NIFC fires, USGS quakes, NASA GIBS compare
- **Flofaction layers:** MARC sites, insurance territories, staffing pins (demo data)
- **Embed + agentic browser bridge** (`src/integration/`)

No public deploy. No API keys required to start. Optional Cesium ion only if you supply a **commercial** token.

## Quick start

```bash
cd flo-eye-view
npm install
npm run doctor
npm run server   # terminal A — localhost API proxies
npm run dev      # terminal B — http://127.0.0.1:5180
```

Open:

- Emergency Storm Ops: http://127.0.0.1:5180/?division=emergency&screen=storm-ops
- Field View (FL cameras): http://127.0.0.1:5180/?division=emergency&screen=field-view
- HQ World Picture: http://127.0.0.1:5180/?division=hq&screen=world-picture
- Insurance Exposure: http://127.0.0.1:5180/?division=insurance&screen=storm-exposure
- **Emergency Management host shell (embeds Flo Eye View):** http://127.0.0.1:5180/host/
- Fire Watch (perimeters + thermal): http://127.0.0.1:5180/?division=emergency&screen=fire-watch

## Division → screens

| Division | Screens |
|---|---|
| Emergency Services | Storm Ops · Deployment Map · Damage Assessment · Fire Watch · Field View |
| Insurance Agency | Storm Exposure · Claims View · Territory Map |
| Media / Flo TV | Director Mode · Story Scout |
| Staffing | Placement Map · Coverage View |
| HQ Command | World Picture · Executive Brief · Asset Pulse |
| LUAP / Books | Light Map |

## Sell path

SKU matrix and must-not-ship list live in [`docs/COMMERCIAL.md`](docs/COMMERCIAL.md). Summary: MIT code we own, no TeleGeography/Bhote Koshi NC payloads, OpenSky not default, customer BYOK for Google/Cesium paid/TomTom/voice.

```bash
# Lock a prospect demo
echo 'FLO_EYE_ACCESS_CODE=your-demo-code' >> .env
echo 'FLO_EYE_SKU=emergency' >> .env

# Optional live traffic
echo 'TOMTOM_API_KEY=...' >> .env
```

SKU via URL or rail picker: `http://127.0.0.1:5180/?sku=emergency&division=emergency&screen=storm-ops`

Use **Copy demo link** in the brand rail to hand a prospect the exact SKU + screen. Power Up accepts a TomTom key for live Flow Segment + relative-flow tiles.

## Integrate into emergency management software

```js
iframe.src = '/flo-eye-view/?division=emergency&screen=deployment-map';
iframe.contentWindow.postMessage({ type: 'flo-eye/set-screen', screenId: 'storm-ops' }, '*');
```

See `src/integration/embed.js` and `src/integration/agentic-bridge.md`.

## License

MIT © Flofaction LLC — with third-party data carve-outs documented in `THIRD_PARTY_NOTICES.md`.
