import { Cartesian3, Color, UrlTemplateImageryProvider, ImageryLayer } from 'cesium';
import { apiFetch } from '../lib/apiFetch.js';
import { loadPowerUp } from '../ui/PowerUp.js';

const LEVEL_COLOR = {
  free: '#4ce8a0',
  moderate: '#ffd166',
  heavy: '#ff6b4a',
  severe: '#c44ce8',
};

/**
 * Florida corridor traffic — simulated congestion by default.
 * TomTom Flow Segment (+ optional relative-flow raster tiles) when keyed.
 */
export function createTrafficLayer(viewer, apiBase = '') {
  const entities = [];
  let pollTimer = null;
  let mode = 'simulated';
  let tileLayer = null;
  let note = '';

  async function refresh() {
    clearEntities();
    try {
      const res = await apiFetch('/api/traffic', { apiBase, tomtomByok: true });
      if (!res.ok) throw new Error(`traffic ${res.status}`);
      const data = await res.json();
      mode = data.mode || 'simulated';
      note = data.note || '';
      for (const seg of data.segments ?? []) {
        const positions = (seg.coords || [])
          .map(([lon, lat]) => {
            if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
            return Cartesian3.fromDegrees(lon, lat);
          })
          .filter(Boolean);
        if (positions.length < 2) continue;
        const color = Color.fromCssColorString(LEVEL_COLOR[seg.level] || LEVEL_COLOR.moderate);
        entities.push(
          viewer.entities.add({
            id: `traffic-${seg.id}`,
            name: `${seg.name} (${seg.level})`,
            polyline: {
              positions,
              width: seg.level === 'severe' || seg.level === 'heavy' ? 5 : 3.5,
              material: color.withAlpha(0.9),
              clampToGround: false,
            },
            description: `<p><b>${seg.name}</b></p><p>Congestion: ${seg.level}</p><p>Speed index: ${seg.speedIndex}</p><p>Mode: ${mode}</p>`,
          }),
        );
      }
      await ensureTileOverlay(data.tilesAvailable);
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] traffic layer:', err.message);
    }
  }

  async function ensureTileOverlay(serverTiles) {
    clearTiles();
    const byok = loadPowerUp().tomtomApiKey;
    let url;
    if (byok) {
      url = `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(byok)}&tileSize=256`;
    } else if (serverTiles) {
      url = `${apiBase || ''}/api/traffic/tiles/{z}/{x}/{y}.png`;
    } else {
      return;
    }
    try {
      const provider = new UrlTemplateImageryProvider({
        url,
        maximumLevel: 18,
        credit: 'TomTom Traffic',
      });
      tileLayer = viewer.imageryLayers.addImageryProvider(provider);
      if (tileLayer instanceof ImageryLayer) {
        tileLayer.alpha = 0.55;
      }
    } catch (err) {
      console.warn('[flo-eye] traffic tiles:', err.message);
    }
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  function clearTiles() {
    if (tileLayer) {
      viewer.imageryLayers.remove(tileLayer, true);
      tileLayer = null;
    }
  }

  return {
    getMode: () => mode,
    getNote: () => note,
    async enable() {
      await refresh();
      pollTimer = setInterval(refresh, 2 * 60 * 1000);
    },
    async disable() {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      clearEntities();
      clearTiles();
    },
    destroy() {
      this.disable();
    },
  };
}
