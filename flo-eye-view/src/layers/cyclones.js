import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
} from 'cesium';

/**
 * NOAA NHC active storms via Flo Eye View proxy (Vite → :5181).
 */
export function createCyclonesLayer(viewer, apiBase = '') {
  const entities = [];
  let pollTimer = null;

  async function refresh() {
    clearEntities();
    try {
      const url = `${apiBase}/api/cyclones`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`cyclones ${res.status}`);
      const data = await res.json();
      const storms = normalizeStorms(data);
      for (const storm of storms) plotStorm(storm);
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] cyclones layer:', err.message);
    }
  }

  function parseCoord(value, numeric) {
    if (Number.isFinite(Number(numeric))) return Number(numeric);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return NaN;
    const m = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/i);
    if (!m) return Number(value);
    let n = Number(m[1]);
    const hemi = (m[2] || '').toUpperCase();
    if (hemi === 'S' || hemi === 'W') n = -Math.abs(n);
    if (hemi === 'N' || hemi === 'E') n = Math.abs(n);
    return n;
  }

  function normalizeStorms(data) {
    const list = data.activeStorms ?? data.storms ?? (Array.isArray(data) ? data : []);
    return list
      .map((s) => {
        const lat = parseCoord(s.latitude ?? s.lat, s.latitudeNumeric);
        const lon = parseCoord(s.longitude ?? s.lon, s.longitudeNumeric);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          id: s.id ?? s.stormID ?? `${s.name}-${lat}`,
          name: s.name ?? s.stormName ?? 'Active storm',
          classification: s.classification ?? s.intensity ?? s.Status ?? '',
          lat,
          lon,
          track: Array.isArray(s.track) ? s.track : [],
        };
      })
      .filter(Boolean);
  }

  function plotStorm(storm) {
    const e = viewer.entities.add({
      id: `cyclone-${storm.id}`,
      name: storm.name,
      position: Cartesian3.fromDegrees(storm.lon, storm.lat),
      point: {
        pixelSize: 14,
        color: Color.fromCssColorString('#ff6b4a'),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.NONE,
      },
      label: {
        text: `${storm.name}${storm.classification ? `\n${storm.classification}` : ''}`,
        font: '14px "IBM Plex Sans", sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      description: `<p><b>${storm.name}</b></p><p>${storm.classification || 'Active tropical system'}</p><p>Source: NOAA/NWS NHC</p>`,
    });
    entities.push(e);

    if (storm.track.length > 1) {
      const positions = storm.track
        .map((p) => {
          const lat = parseCoord(p.lat ?? p.latitude, p.latitudeNumeric);
          const lon = parseCoord(p.lon ?? p.longitude, p.longitudeNumeric);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return Cartesian3.fromDegrees(lon, lat);
        })
        .filter(Boolean);
      if (positions.length > 1) {
        entities.push(
          viewer.entities.add({
            id: `cyclone-track-${storm.id}`,
            polyline: {
              positions,
              width: 3,
              material: Color.fromCssColorString('#ff6b4a').withAlpha(0.85),
            },
          }),
        );
      }
    }
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    async enable() {
      await refresh();
      pollTimer = setInterval(refresh, 5 * 60 * 1000);
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
