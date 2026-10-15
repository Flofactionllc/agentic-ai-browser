/**
 * Flo Eye View local API — proxies public feeds to avoid browser CORS friction.
 * Binds localhost only. No secrets required for keyless layers.
 */
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.FLO_EYE_API_PORT || 5181);
const HOST = process.env.FLO_EYE_API_HOST || '127.0.0.1';
const UA = { 'User-Agent': 'FloEyeView/0.2 (Flofaction; local-dev)' };

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
app.use(cors({ origin: [/localhost/, /127\.0\.0\.1/] }));
app.use(express.json({ limit: '32kb' }));

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
    version: '0.2.0',
    firmsConfigured: Boolean(process.env.FIRMS_MAP_KEY),
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

/** Optional FIRMS hotspots — only when FIRMS_MAP_KEY is in the environment. */
app.get('/api/firms', async (req, res) => {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    return res.status(501).json({
      error: 'FIRMS_MAP_KEY not configured',
      hint: 'Add FIRMS_MAP_KEY to flo-eye-view/.env (local only)',
    });
  }
  try {
    const source = String(req.query.source || 'VIIRS_SNPP_NRT');
    const data = await cached(`firms-${source}`, 30 * 60 * 1000, async () => {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/world/1`;
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`FIRMS ${r.status}`);
      return r.text();
    });
    res.type('text/csv').send(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.get('/api/cameras', (_req, res) => {
  try {
    const file = path.join(__dirname, '../src/data/floridaCameras.js');
    // Serve a JSON snapshot without importing ESM from CJS context
    const modPath = path.join(__dirname, '../src/data/floridaCameras.json');
    if (existsSync(modPath)) {
      return res.json(JSON.parse(readFileSync(modPath, 'utf8')));
    }
    // Fallback: parse exported array from the JS module text (dev convenience)
    const text = readFileSync(file, 'utf8');
    const match = text.match(/export const FLORIDA_CAMERAS = (\[[\s\S]*?\]);/);
    if (!match) throw new Error('camera catalog missing');
    // eslint-disable-next-line no-new-func
    const cams = Function(`return (${match[1]})`)();
    res.json({ cameras: cams, source: 'Flofaction curated FL corridor pack' });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Flo Eye View API on http://${HOST}:${PORT}`);
});
