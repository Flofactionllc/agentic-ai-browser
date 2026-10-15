import { Cartesian3, Color } from 'cesium';

const LEVEL_COLOR = {
  free: '#4ce8a0',
  moderate: '#ffd166',
  heavy: '#ff6b4a',
  severe: '#c44ce8',
};

/**
 * Florida corridor traffic — simulated congestion by default.
 * When Power Up has a TomTom key, server may mark mode=tomtom later.
 */
export function createTrafficLayer(viewer, apiBase = '') {
  const entities = [];
  let pollTimer = null;
  let mode = 'simulated';

  async function refresh() {
    clearEntities();
    try {
      const res = await fetch(`${apiBase}/api/traffic`);
      if (!res.ok) throw new Error(`traffic ${res.status}`);
      const data = await res.json();
      mode = data.mode || 'simulated';
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
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] traffic layer:', err.message);
    }
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    getMode: () => mode,
    async enable() {
      await refresh();
      pollTimer = setInterval(refresh, 2 * 60 * 1000);
    },
    async disable() {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      clearEntities();
    },
    destroy() {
      this.disable();
    },
  };
}
