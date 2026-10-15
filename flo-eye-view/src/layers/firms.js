import { Cartesian3, Color, HeightReference, UrlTemplateImageryProvider } from 'cesium';

/**
 * Active-fire awareness:
 * 1) Keyless NASA GIBS VIIRS thermal anomalies imagery
 * 2) Optional FIRMS CSV points when /api/firms has FIRMS_MAP_KEY
 */
export function createFirmsLayer(viewer, apiBase = '') {
  let imageryLayer = null;
  const entities = [];
  let status = 'idle';

  function dayStamp(offsetDays = 0) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  async function enableImagery() {
    if (imageryLayer) return;
    const time = dayStamp(0);
    const provider = new UrlTemplateImageryProvider({
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/${time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
      maximumLevel: 8,
      credit: 'NASA GIBS / VIIRS thermal anomalies',
    });
    imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
    imageryLayer.alpha = 0.85;
  }

  async function enablePoints() {
    try {
      const res = await fetch(`${apiBase}/api/firms?format=geojson`);
      if (res.status === 501) {
        status = 'imagery-only';
        return;
      }
      if (!res.ok) throw new Error(`firms ${res.status}`);
      const geo = await res.json();
      for (const f of geo.features ?? []) {
        const [lon, lat] = f.geometry?.coordinates ?? [];
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        const bright = Number(f.properties?.brightness || f.properties?.frp || 0);
        const size = Math.max(5, Math.min(14, 5 + bright / 80));
        entities.push(
          viewer.entities.add({
            position: Cartesian3.fromDegrees(lon, lat),
            point: {
              pixelSize: size,
              color: Color.fromCssColorString('#ff7a18').withAlpha(0.9),
              outlineColor: Color.fromCssColorString('#ffd166'),
              outlineWidth: 1,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
            description: `<p><b>FIRMS hotspot</b></p><p>FRP/brightness: ${bright || 'n/a'}</p><p>NASA FIRMS</p>`,
          }),
        );
      }
      status = entities.length ? 'points+imagery' : 'imagery-only';
    } catch (err) {
      console.warn('[flo-eye] firms points:', err.message);
      status = 'imagery-only';
    }
  }

  function clearPoints() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    getStatus: () => status,
    async enable() {
      await enableImagery();
      await enablePoints();
      viewer.scene.requestRender();
    },
    async disable() {
      if (imageryLayer) {
        viewer.imageryLayers.remove(imageryLayer, true);
        imageryLayer = null;
      }
      clearPoints();
      status = 'idle';
    },
    destroy() {
      this.disable();
    },
  };
}
