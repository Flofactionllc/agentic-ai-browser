import { Cartesian3, Color } from 'cesium';
import { INSURANCE_TERRITORIES } from '../config/florida.js';

/** Sample insurance territory footprints. */
export function createInsuranceLayer(viewer) {
  const entities = [];

  return {
    async enable() {
      if (entities.length) return;
      for (const t of INSURANCE_TERRITORIES) {
        const e = viewer.entities.add({
          id: t.id,
          name: t.name,
          position: Cartesian3.fromDegrees(t.lon, t.lat),
          ellipse: {
            semiMajorAxis: t.radiusKm * 1000,
            semiMinorAxis: t.radiusKm * 1000,
            material: Color.fromCssColorString('#4c8fe8').withAlpha(0.22),
            outline: true,
            outlineColor: Color.fromCssColorString('#8eb8ff'),
          },
          label: {
            text: t.name,
            font: '12px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            showBackground: true,
            backgroundColor: Color.fromCssColorString('#0b1220').withAlpha(0.7),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        entities.push(e);
      }
      viewer.scene.requestRender();
    },
    async disable() {
      for (const e of entities) viewer.entities.remove(e);
      entities.length = 0;
    },
    destroy() {
      this.disable();
    },
  };
}
