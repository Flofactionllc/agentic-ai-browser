/**
 * Flo Eye View local API — proxies public feeds to avoid browser CORS friction.
 * Binds localhost only. No secrets required for v1 keyless layers.
 */
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.FLO_EYE_API_PORT || 5181);
const HOST = process.env.FLO_EYE_API_HOST || '127.0.0.1';

const app = express();
app.use(cors({ origin: [/localhost/, /127\.0\.0\.1/] }));

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
  res.json({ ok: true, product: 'flo-eye-view', version: '0.1.0' });
});

app.get('/api/cyclones', async (_req, res) => {
  try {
    const data = await cached('cyclones', 5 * 60 * 1000, async () => {
      const r = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', {
        headers: { 'User-Agent': 'FloEyeView/0.1 (Flofaction; local-dev)' },
      });
      if (!r.ok) throw new Error(`NHC ${r.status}`);
      return r.json();
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
      const r = await fetch(url, {
        headers: { 'User-Agent': 'FloEyeView/0.1 (Flofaction; local-dev)' },
      });
      if (!r.ok) throw new Error(`WFIGS ${r.status}`);
      return r.json();
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Flo Eye View API on http://${HOST}:${PORT}`);
});
