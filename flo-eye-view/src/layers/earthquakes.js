import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
} from 'cesium';

/** USGS all-day earthquakes M2.5+ — keyless public GeoJSON. */
export function createEarthquakesLayer(viewer) {
  const entities = [];
  let pollTimer = null;

  async function refresh() {
    clearEntities();
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      );
      if (!res.ok) throw new Error(`quakes ${res.status}`);
      const geo = await res.json();
      for (const f of geo.features ?? []) {
        const [lon, lat, depth] = f.geometry?.coordinates ?? [];
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        const mag = f.properties?.mag ?? 0;
        const place = f.properties?.place ?? 'Earthquake';
        const size = Math.max(6, Math.min(22, mag * 4));
        const e = viewer.entities.add({
          name: `M${mag} — ${place}`,
          position: Cartesian3.fromDegrees(lon, lat, Math.max(0, -(depth ?? 0) * 1000)),
          point: {
            pixelSize: size,
            color: Color.fromCssColorString('#ffd166').withAlpha(0.9),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
            heightReference: HeightReference.NONE,
          },
          label: {
            text: `M${mag}`,
            font: '11px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
            pixelOffset: new Cartesian2(0, -12),
            show: mag >= 4.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          description: `<p><b>M${mag}</b> — ${place}</p><p>Source: USGS</p>`,
        });
        entities.push(e);
      }
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] earthquakes layer:', err.message);
    }
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    async enable() {
      await refresh();
      pollTimer = setInterval(refresh, 10 * 60 * 1000);
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
