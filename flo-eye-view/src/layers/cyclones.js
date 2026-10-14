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
 * NOAA NHC active storms via Flo Eye View proxy (or direct CurrentStorms.json).
 */
export function createCyclonesLayer(viewer, apiBase = '') {
  const entities = [];
  let pollTimer = null;

  async function refresh() {
    clearEntities();
    try {
      const url = apiBase
        ? `${apiBase}/api/cyclones`
        : 'https://www.nhc.noaa.gov/CurrentStorms.json';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`cyclones ${res.status}`);
      const data = await res.json();
      const storms = normalizeStorms(data);
      for (const storm of storms) {
        plotStorm(storm);
      }
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] cyclones layer:', err.message);
    }
  }

  function normalizeStorms(data) {
    // CurrentStorms.json shape: { activeStorms: [ { id, name, ... basin fields } ] }
    const list = data.activeStorms ?? data.storms ?? (Array.isArray(data) ? data : []);
    return list
      .map((s) => {
        const lat = Number(s.latitude ?? s.lat ?? s.Lat);
        const lon = Number(s.longitude ?? s.lon ?? s.Lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          id: s.id ?? s.stormID ?? `${s.name}-${lat}`,
          name: s.name ?? s.stormName ?? 'Active storm',
          classification: s.classification ?? s.intensity ?? s.Status ?? '',
          movement: s.movementDir ?? s.movement ?? '',
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
          const lat = Number(p.lat ?? p.latitude);
          const lon = Number(p.lon ?? p.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return Cartesian3.fromDegrees(lon, lat);
        })
        .filter(Boolean);
      if (positions.length > 1) {
        const line = viewer.entities.add({
          id: `cyclone-track-${storm.id}`,
          polyline: {
            positions,
            width: 3,
            material: Color.fromCssColorString('#ff6b4a').withAlpha(0.85),
            clampToGround: false,
          },
        });
        entities.push(line);
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
