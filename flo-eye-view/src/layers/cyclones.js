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
 * NOAA NHC active storms + forecast cone/track via Flo Eye View proxy.
 */
export function createCyclonesLayer(viewer, apiBase = '', { onStorms } = {}) {
  const entities = [];
  let pollTimer = null;
  let latestStorms = [];

  async function refresh() {
    clearEntities();
    try {
      const res = await fetch(`${apiBase}/api/cyclones`);
      if (!res.ok) throw new Error(`cyclones ${res.status}`);
      const data = await res.json();
      const storms = normalizeStorms(data);
      latestStorms = storms;
      for (const storm of storms) {
        plotStorm(storm);
        await plotGeometry(storm);
      }
      onStorms?.(storms);
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] cyclones layer:', err.message);
      latestStorms = [];
      onStorms?.([]);
    }
  }

  async function plotGeometry(storm) {
    if (!storm.binNumber) return;
    try {
      const res = await fetch(
        `${apiBase}/api/cyclones/geometry?bin=${encodeURIComponent(storm.binNumber)}`,
      );
      if (!res.ok) return;
      const geo = await res.json();
      if (geo.cone) drawPolygonCollection(geo.cone, storm, 'cone');
      if (geo.track) drawLineCollection(geo.track, storm, 'track');
      if (geo.points) drawForecastPoints(geo.points, storm);
    } catch (err) {
      console.warn('[flo-eye] cyclone geometry:', err.message);
    }
  }

  function drawPolygonCollection(fc, storm, kind) {
    for (const feature of fc.features ?? []) {
      const geom = feature.geometry;
      if (!geom) continue;
      const rings =
        geom.type === 'Polygon'
          ? [geom.coordinates[0]]
          : geom.type === 'MultiPolygon'
            ? geom.coordinates.map((p) => p[0])
            : [];
      for (const ring of rings) {
        const flat = [];
        for (const pt of ring) {
          const lon = Number(pt[0]);
          const lat = Number(pt[1]);
          if (Number.isFinite(lon) && Number.isFinite(lat)) flat.push(lon, lat);
        }
        if (flat.length < 6) continue;
        entities.push(
          viewer.entities.add({
            id: `cyclone-${kind}-${storm.id}-${entities.length}`,
            name: `${storm.name} forecast cone`,
            polygon: {
              hierarchy: Cartesian3.fromDegreesArray(flat),
              material: Color.fromCssColorString('#ff6b4a').withAlpha(0.22),
              outline: true,
              outlineColor: Color.fromCssColorString('#ffb4a8'),
            },
          }),
        );
      }
    }
  }

  function drawLineCollection(fc, storm, kind) {
    for (const feature of fc.features ?? []) {
      const geom = feature.geometry;
      if (!geom || geom.type !== 'LineString') continue;
      const positions = [];
      for (const pt of geom.coordinates) {
        const lon = Number(pt[0]);
        const lat = Number(pt[1]);
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
          positions.push(Cartesian3.fromDegrees(lon, lat));
        }
      }
      if (positions.length < 2) continue;
      entities.push(
        viewer.entities.add({
          id: `cyclone-${kind}-${storm.id}-${entities.length}`,
          polyline: {
            positions,
            width: 3,
            material: Color.fromCssColorString('#ffd166').withAlpha(0.95),
          },
        }),
      );
    }
  }

  function drawForecastPoints(fc, storm) {
    for (const feature of fc.features ?? []) {
      const coords = feature.geometry?.coordinates;
      if (!coords) continue;
      const [lon, lat] = coords;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      const props = feature.properties ?? {};
      const wind = props.maxwind ?? props.MAXWIND;
      const label = wind ? `${wind}kt` : props.dvlbl || '';
      entities.push(
        viewer.entities.add({
          position: Cartesian3.fromDegrees(lon, lat),
          point: {
            pixelSize: 7,
            color: Color.fromCssColorString('#ffd166'),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
          },
          label: {
            text: String(label),
            font: '11px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cartesian2(0, -14),
            show: Boolean(label),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          description: `<p><b>${storm.name}</b> forecast point</p><p>${props.advdate || ''}</p>`,
        }),
      );
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
          classification: s.classification ?? s.intensity ?? '',
          intensity: s.intensity,
          pressure: s.pressure,
          movementDir: s.movementDir,
          movementSpeed: s.movementSpeed,
          binNumber: s.binNumber ?? s.bin ?? null,
          advisoryUrl: s.publicAdvisory?.url || s.forecastAdvisory?.url || null,
          lat,
          lon,
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
        text: `${storm.name}${storm.classification ? `\n${storm.classification}` : ''}${storm.intensity ? ` ${storm.intensity}kt` : ''}`,
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
      description: `<p><b>${storm.name}</b></p><p>${storm.classification || 'Active tropical system'}</p><p>Wallet: ${storm.binNumber || 'n/a'}</p><p>Source: NOAA/NWS NHC</p>`,
    });
    entities.push(e);
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    getStorms: () => latestStorms,
    flyToStorm(stormId) {
      const storm = latestStorms.find((s) => s.id === stormId);
      if (!storm) return false;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(storm.lon, storm.lat, 1_800_000),
        duration: 1.4,
      });
      return true;
    },
    async enable() {
      await refresh();
      pollTimer = setInterval(refresh, 5 * 60 * 1000);
    },
    async disable() {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      clearEntities();
      latestStorms = [];
      onStorms?.([]);
    },
    destroy() {
      this.disable();
    },
  };
}
