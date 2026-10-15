# Flo Eye View — Design

**Working name:** Flo Eye View  
**Product shell:** Mission Control  
**Owner:** Flofaction LLC  
**v1 scope:** Division switcher · HQ Command · Emergency Services (Florida) · sellable architecture

## Product thesis

God’s Eye View proved that a photorealistic globe + live public data feels like a forbidden ops room. Flo Eye View turns that into a **division-aware commercial console** Flofaction can sell and embed:

1. **One Mission Control shell** — brand, auth boundary, globe, layer runtime, attribution.
2. **A dashboard per division** — presets, screens, default layers, Florida home camera.
3. **Multiple screens inside each division** — toggleable ops modes (Storm Ops, Claims View, Director Mode, …).
4. **Sellable packaging** — clean licenses, customer BYOK for paid feeds, white-label ready chrome.

## Divisions & screens (v1 catalog)

### HQ Command
- **World Picture** — all-division overlay summary
- **Executive Brief** — storm / fire / quake highlights for leadership
- **Asset Pulse** — MARC + staffing + media interest pins (sample data in v1)

### Emergency Services (flagship)
- **Storm Ops** — NHC tracks + NOAA radar
- **Deployment Map** — MARC sites, staging, routes (sample FL sites)
- **Damage Assessment** — NASA GIBS before/after compare
- **Fire Watch** — NIFC perimeters
- **Field View** — camera / traffic slots (stubs in v1; Fla DOT packs next)

### Insurance Agency
- **Storm Exposure** — storm paths vs territory polygons
- **Claims View** — imagery compare over claim clusters
- **Territory Map** — agency book of business geography

### Media / Flo TV
- **Director Mode** — cinematic camera bookmarks for storytelling
- **Story Scout** — live events worth covering (storm / fire / traffic)

### Staffing
- **Placement Map** — open roles / placed talent density
- **Coverage View** — shift coverage against incident geography

### LUAP
- **Light Map** — territory awareness without full ops chrome

### Books / Back Office
- **Light Map** — finance-relevant exposure geography

## UX principles

- **Brand first:** “Flo Eye View” and Flofaction mark dominate the shell; the globe is the hero visual, not a dashboard card grid.
- **One composition:** first viewport = brand + active division + active screen + globe. No stat strips in the hero.
- **Screen tabs, not nested dashboards:** every division exposes 2–5 screens as a horizontal rail.
- **Layer chips:** each screen declares default layers; operators can override without leaving the screen.
- **Florida home:** default camera centers on Florida peninsula (~27.8°N, 81.7°W) at storm-ops altitude.
- **Attribution always on:** NOAA / NASA / NIFC / USGS / Esri credits stay visible.

## Architecture

```
flo-eye-view/
  src/config/divisions.js   # division + screen catalog
  src/globe/                # Cesium viewer + Florida home
  src/layers/               # radar, cyclones, fires, quakes, imagery, marc
  src/ui/                   # Mission Control shell
  src/app/                  # state machine: division ↔ screen ↔ layers
  server/                   # localhost proxies (NHC, NIFC, FIRMS later)
  src/integration/          # embed + agentic-browser bridge
```

### Runtime state

```js
{
  divisionId: 'emergency',
  screenId: 'storm-ops',
  layers: { radar: true, cyclones: true, fires: false, ... },
  camera: { lon, lat, height, heading, pitch },
  home: 'florida'
}
```

### Embed contract (emergency management software)

Host apps mount Flo Eye View via:

- iframe: `/flo-eye-view/?division=emergency&screen=storm-ops`
- or ES module: `createFloEyeView(el, { division, screen, home: 'florida' })`
- postMessage API: `{ type: 'flo-eye/set-screen', screenId }` / `{ type: 'flo-eye/fly-to', lon, lat }`

The agentic browser can open these URLs as automation targets for “show Storm Ops over Orlando” workflows.

## Commercial packaging (sell)

| SKU | Includes |
|---|---|
| **Flo Eye View — Emergency** | Storm Ops, Deployment, Damage, Fire Watch |
| **Flo Eye View — Insurance** | Exposure, Claims, Territory |
| **Flo Eye View — Media** | Director + Story Scout |
| **Flo Eye View — Command Suite** | All divisions + HQ World Picture |
| **White-label** | Customer mark, domain, BYOK vault |

Pricing and contracts live outside this repo; the code paths are license-clean for commercial distribution.

## v0.2 additions

- NHC forecast **cones + tracks + points** via MapServer wallet layers
- **Field View** Florida corridor camera pack (pins + ops metadata; still redistribution gated)
- **Power Up** local BYOK panel (Cesium ion / FIRMS / TomTom placeholders)
- **Emergency Management host shell** at `/host/` embedding Mission Control

## Out of scope for current milestone

- Voice control / OpenAI Realtime
- Google Photorealistic 3D (BYOK later)
- Live FL511 still redistribution (needs operator agreement)
- TeleGeography cables / Nepal flood scene (NC — never ship)
- Public internet deploy / production keys

## Muse / Meta app linkage

Operator-facing “screens to toggle” mirror the Muse briefing: Storm Ops, Deployment Map, Damage Assessment, Fire Watch, Field View, plus Insurance / Media / Staffing / HQ / LUAP / Books. Additional Flofaction screens can be registered in `divisions.js` without touching the globe runtime.
