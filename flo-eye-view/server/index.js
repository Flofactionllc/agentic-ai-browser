/**
 * Flo Eye View local API — proxies public feeds to avoid browser CORS friction.
 * Binds localhost only. No secrets required for keyless layers.
 */
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from './loadEnv.js';
import { createAuthRouter, requireAuth, accessCodeConfigured } from './auth.js';
import { enrichWithTomTom } from './tomtomTraffic.js';
import { createTomTomTileHandler, tomtomTileStatus } from './tomtomTiles.js';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.FLO_EYE_API_PORT || 5181);
const HOST = process.env.FLO_EYE_API_HOST || '127.0.0.1';
const UA = { 'User-Agent': 'FloEyeView/0.5 (Flofaction; local-dev)' };

function resolveTomTomKey(req) {
  const header = req?.headers?.['x-flo-eye-tomtom-key'];
  if (header && String(header).trim()) return String(header).trim();
  return process.env.TOMTOM_API_KEY || '';
}

const NHC_MAP =
  'https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather/MapServer';

/** Wallet EP1 → layer offsets matching NHC MapServer grouping. */
const WALLET_LAYERS = {
  // Atlantic AT1..AT5
  AT1: { points: 6, track: 7, cone: 8 },
  AT2: { points: 32, track: 33, cone: 34 },
  AT3: { points: 58, track: 59, cone: 60 },
  AT4: { points: 84, track: 85, cone: 86 },
  AT5: { points: 110, track: 111, cone: 112 },
  // East Pacific EP1..EP5
  EP1: { points: 136, track: 137, cone: 138 },
  EP2: { points: 162, track: 163, cone: 164 },
  EP3: { points: 188, track: 189, cone: 190 },
  EP4: { points: 214, track: 215, cone: 216 },
  EP5: { points: 240, track: 241, cone: 242 },
  // Central Pacific
  CP1: { points: 266, track: 267, cone: 268 },
  CP2: { points: 292, track: 293, cone: 294 },
  CP3: { points: 318, track: 319, cone: 320 },
  CP4: { points: 344, track: 345, cone: 346 },
  CP5: { points: 370, track: 371, cone: 372 },
};

const app = express();
app.use(
  cors({
    origin: [/localhost/, /127\.0\.0\.1/],
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Flo-Eye-TomTom-Key'],
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(createAuthRouter(express));
app.use(requireAuth);

const cache = new Map();
function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data);
  return loader().then((data) => {
    cache.set(key, { at: Date.now(), data });
    return data;
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    product: 'flo-eye-view',
    version: '0.5.0',
    firmsConfigured: Boolean(process.env.FIRMS_MAP_KEY),
    tomtomConfigured: Boolean(process.env.TOMTOM_API_KEY),
    authRequired: accessCodeConfigured(),
    sku: process.env.FLO_EYE_SKU || 'command',
    tiles: tomtomTileStatus(Boolean(process.env.TOMTOM_API_KEY)),
  });
});

const VALID_SKUS = ['emergency', 'insurance', 'media', 'staffing', 'command'];

app.get('/api/product', (req, res) => {
  const q = String(req.query.sku || '').toLowerCase();
  const sku = VALID_SKUS.includes(q) ? q : process.env.FLO_EYE_SKU || 'command';
  res.json({
    sku,
    brand: {
      productName: process.env.FLO_EYE_BRAND_NAME || 'Flo Eye View',
      company: process.env.FLO_EYE_BRAND_COMPANY || 'Flofaction',
      shellName: 'Mission Control',
      emsName: 'Emergency Management',
    },
    skus: VALID_SKUS,
  });
});

app.get('/api/cyclones', async (_req, res) => {
  try {
    const data = await cached('cyclones', 5 * 60 * 1000, async () => {
      const r = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: UA });
      if (!r.ok) throw new Error(`NHC ${r.status}`);
      return r.json();
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.get('/api/cyclones/geometry', async (req, res) => {
  try {
    const bin = String(req.query.bin || '').toUpperCase();
    const layers = WALLET_LAYERS[bin];
    if (!layers) return res.status(400).json({ error: `Unknown wallet ${bin}` });

    const data = await cached(`cyclone-geom-${bin}`, 5 * 60 * 1000, async () => {
      const [points, track, cone] = await Promise.all(
        ['points', 'track', 'cone'].map(async (kind) => {
          const id = layers[kind];
          const url = `${NHC_MAP}/${id}/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=50`;
          const r = await fetch(url, { headers: UA });
          if (!r.ok) throw new Error(`${kind} ${r.status}`);
          return r.json();
        }),
      );
      return { bin, points, track, cone };
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.get('/api/fire-perimeters', async (_req, res) => {
  try {
    const data = await cached('fires', 5 * 60 * 1000, async () => {
      const url =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=IncidentName,PercentContained,FeatureCategory,GISAcres&f=geojson&resultRecordCount=200';
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`WFIGS ${r.status}`);
      return r.json();
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

/**
 * Optional FIRMS CSV hotspots — requires FIRMS_MAP_KEY.
 * Without a key, clients should use the keyless GIBS thermal imagery layer.
 * ?format=geojson returns FeatureCollection (florida-ish bbox filtered).
 */
app.get('/api/firms', async (req, res) => {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    return res.status(501).json({
      error: 'FIRMS_MAP_KEY not configured',
      hint: 'Add FIRMS_MAP_KEY to flo-eye-view/.env (local only). Keyless NASA GIBS thermal still works in the firms layer.',
    });
  }
  try {
    const source = String(req.query.source || 'VIIRS_SNPP_NRT');
    const csv = await cached(`firms-${source}`, 30 * 60 * 1000, async () => {
      // Florida / SE US bbox for ops focus (west,south,east,north)
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/-90,23,-75,33/1`;
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`FIRMS ${r.status}`);
      return r.text();
    });
    if (String(req.query.format || '') === 'geojson') {
      return res.json(firmsCsvToGeoJson(csv));
    }
    res.type('text/csv').send(csv);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

function firmsCsvToGeoJson(csv) {
  const lines = String(csv).trim().split(/\r?\n/);
  if (lines.length < 2) return { type: 'FeatureCollection', features: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const brightIdx = headers.findIndex((h) => h.includes('bright'));
  const frpIdx = headers.indexOf('frp');
  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const lat = Number(cols[latIdx]);
    const lon = Number(cols[lonIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        brightness: brightIdx >= 0 ? Number(cols[brightIdx]) : null,
        frp: frpIdx >= 0 ? Number(cols[frpIdx]) : null,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

app.get('/api/cameras', (_req, res) => {
  try {
    const cams = readExportArray('../src/data/floridaCameras.js', 'FLORIDA_CAMERAS');
    res.json({ cameras: cams, source: 'Flofaction curated FL corridor pack' });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/traffic', async (req, res) => {
  try {
    const corridors = readExportArray('../src/data/floridaTraffic.js', 'FLORIDA_CORRIDORS');
    const hour = new Date().getUTCHours();
    const simulated = corridors.map((c, i) => {
      const seed = (hour * 17 + i * 13) % 100;
      let level = 'free';
      if (seed > 85) level = 'severe';
      else if (seed > 65) level = 'heavy';
      else if (seed > 40) level = 'moderate';
      const speedIndex = Math.max(0.2, 1 - seed / 120);
      return {
        id: c.id,
        name: c.name,
        roadway: c.roadway,
        coords: c.coords,
        level,
        speedIndex: Number(speedIndex.toFixed(2)),
        source: 'simulated',
      };
    });

    const key = resolveTomTomKey(req);
    const tilesAvailable = Boolean(key || process.env.TOMTOM_API_KEY);
    if (!key) {
      return res.json({
        mode: 'simulated',
        updatedAt: new Date().toISOString(),
        segments: simulated,
        tilesAvailable: false,
        note: 'Simulated FL corridor congestion — set TOMTOM_API_KEY or Power Up TomTom key for live data',
      });
    }

    const cacheKey = `traffic-tomtom-${hour}-${key.slice(0, 6)}`;
    const enriched = await cached(cacheKey, 2 * 60 * 1000, () =>
      enrichWithTomTom(simulated, key, { userAgent: UA['User-Agent'] }),
    );
    res.json({
      ...enriched,
      tilesAvailable,
      updatedAt: new Date().toISOString(),
      note:
        enriched.mode === 'tomtom'
          ? `TomTom Flow Segment Data on ${enriched.enriched}/${simulated.length} corridors`
          : 'TomTom key present but enrichment failed — simulated fallback',
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get(
  '/api/traffic/tiles/:z/:x/:y.png',
  createTomTomTileHandler({
    getApiKey: resolveTomTomKey,
    userAgent: UA['User-Agent'],
  }),
);

app.get('/api/brief', async (_req, res) => {
  try {
    const brief = await cached('ems-brief', 60 * 1000, async () => {
      let storms = [];
      try {
        const r = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: UA });
        if (r.ok) {
          const data = await r.json();
          storms = (data.activeStorms || []).map((s) => ({
            id: s.id,
            name: s.name,
            classification: s.classification,
            intensity: s.intensity,
            binNumber: s.binNumber,
            lat: s.latitudeNumeric,
            lon: s.longitudeNumeric,
            advisoryUrl: s.publicAdvisory?.url || null,
            lastUpdate: s.lastUpdate,
          }));
        }
      } catch {
        // keep empty
      }

      let fireCount = null;
      try {
        const r = await fetch(
          'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json',
          { headers: UA },
        );
        if (r.ok) {
          const data = await r.json();
          fireCount = data.count ?? null;
        }
      } catch {
        // keep null
      }

      const marc = readExportArray('../src/config/florida.js', 'MARC_SITES');
      return {
        theater: 'Florida',
        generatedAt: new Date().toISOString(),
        storms,
        firePerimeterCount: fireCount,
        marcReady: marc.filter((m) => m.kind === 'hub' || m.kind === 'command').length,
        marcStaging: marc.filter((m) => m.kind === 'staging').length,
        objectives: [
          'Monitor NHC wallets on Storm Ops',
          'Keep MARC hubs green on Deployment Map',
          'Use Damage Assessment GIBS before/after after landfall',
          'Field View corridors for evacuation / surge routes',
        ],
      };
    });
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/roster', (_req, res) => {
  try {
    const marc = readExportArray('../src/config/florida.js', 'MARC_SITES');
    const staffing = readExportArray('../src/config/florida.js', 'STAFFING_PINS');
    const units = marc.map((site) => ({
      id: site.id,
      unit: site.name,
      role: site.kind === 'hub' ? 'Hub / surge' : site.kind === 'command' ? 'Command' : 'Staging / logistics',
      status: site.kind === 'staging' ? 'Standby' : 'Ready',
      lon: site.lon,
      lat: site.lat,
      kind: site.kind,
    }));
    const placements = staffing.map((p) => ({
      id: p.id,
      unit: p.name,
      role: 'Staffing coverage',
      status: `${p.openRoles} open roles`,
      lon: p.lon,
      lat: p.lat,
    }));
    res.json({
      updatedAt: new Date().toISOString(),
      units: [...units, ...placements],
      note: 'Demo roster bound to Flofaction MARC + staffing pins',
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

function readExportArray(relPath, exportName) {
  const file = path.join(__dirname, relPath);
  if (existsSync(file.replace(/\.js$/, '.json'))) {
    const raw = JSON.parse(readFileSync(file.replace(/\.js$/, '.json'), 'utf8'));
    return raw[exportName] || raw.cameras || raw;
  }
  const text = readFileSync(file, 'utf8');
  const match = text.match(new RegExp(`export const ${exportName} = (\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`${exportName} missing in ${relPath}`);
  // eslint-disable-next-line no-new-func
  return Function(`return (${match[1]})`)();
}

app.listen(PORT, HOST, () => {
  console.log(`Flo Eye View API on http://${HOST}:${PORT}`);
  console.log(
    `  auth: ${accessCodeConfigured() ? 'ACCESS CODE REQUIRED' : 'open-dev (set FLO_EYE_ACCESS_CODE to lock)'}`,
  );
  console.log(`  sku: ${process.env.FLO_EYE_SKU || 'command'}`);
  console.log(
    `  tomtom: ${process.env.TOMTOM_API_KEY ? 'configured' : 'simulated traffic'}`,
  );
});
