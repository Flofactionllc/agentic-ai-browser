/**
 * Proxy TomTom relative traffic-flow raster tiles so the server key stays local.
 * Spec: https://developer.tomtom.com/traffic-api/documentation/traffic-flow/raster-flow-tiles
 */

export function createTomTomTileHandler({ getApiKey, userAgent }) {
  return async function tomtomTile(req, res) {
    const key = getApiKey(req);
    if (!key) {
      return res.status(501).json({
        error: 'TomTom not configured',
        hint: 'Set TOMTOM_API_KEY or send X-Flo-Eye-TomTom-Key',
      });
    }
    const z = String(req.params.z || '');
    const x = String(req.params.x || '');
    const y = String(req.params.y || '').replace(/\.png$/i, '');
    if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
      return res.status(400).json({ error: 'Invalid tile coords' });
    }
    const zi = Number(z);
    if (zi < 0 || zi > 22) return res.status(400).json({ error: 'z out of range' });

    const style = String(req.query.style || 'relative');
    const allowed = new Set(['absolute', 'relative', 'relative-delay', 'reduced-sensitivity']);
    const flowStyle = allowed.has(style) ? style : 'relative';

    const url = `https://api.tomtom.com/traffic/map/4/tile/flow/${flowStyle}/${z}/${x}/${y}.png?key=${encodeURIComponent(key)}&tileSize=256`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': userAgent || 'FloEyeView/0.5' } });
      if (!r.ok) {
        return res.status(r.status).json({ error: `TomTom tile ${r.status}` });
      }
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.send(buf);
    } catch (err) {
      res.status(502).json({ error: String(err.message || err) });
    }
  };
}

export function tomtomTileStatus(keyConfigured) {
  return {
    available: Boolean(keyConfigured),
    path: '/api/traffic/tiles/{z}/{x}/{y}.png',
    styleDefault: 'relative',
    attribution: 'TomTom Traffic',
  };
}
