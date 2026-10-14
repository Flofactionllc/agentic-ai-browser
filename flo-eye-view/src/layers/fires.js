import { Cartesian3, Color } from 'cesium';

const WFIGS_URL =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query';

/** NIFC WFIGS current fire perimeters — keyless. */
export function createFiresLayer(viewer, apiBase = '') {
  const entities = [];

  async function refresh() {
    clearEntities();
    try {
      const url = apiBase
        ? `${apiBase}/api/fire-perimeters`
        : `${WFIGS_URL}?where=1%3D1&outFields=IncidentName,PercentContained,FeatureCategory,GISAcres&f=geojson&resultRecordCount=200`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fires ${res.status}`);
      const geo = await res.json();
      for (const feature of geo.features ?? []) {
        plotFeature(feature);
      }
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[flo-eye] fires layer:', err.message);
    }
  }

  function plotFeature(feature) {
    const props = feature.properties ?? {};
    const name = props.IncidentName ?? props.poly_IncidentName ?? 'Fire';
    const geom = feature.geometry;
    if (!geom) return;

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
      const e = viewer.entities.add({
        name,
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(flat),
          material: Color.fromCssColorString('#ff3b1f').withAlpha(0.35),
          outline: true,
          outlineColor: Color.fromCssColorString('#ffb4a8'),
        },
        description: `<p><b>${name}</b></p><p>Contained: ${props.PercentContained ?? 'n/a'}%</p><p>Acres: ${props.GISAcres ?? 'n/a'}</p><p>Source: NIFC WFIGS</p>`,
      });
      entities.push(e);
    }
  }

  function clearEntities() {
    for (const e of entities) viewer.entities.remove(e);
    entities.length = 0;
  }

  return {
    async enable() {
      await refresh();
    },
    async disable() {
      clearEntities();
    },
    destroy() {
      this.disable();
    },
  };
}
