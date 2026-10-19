import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
} from 'cesium';
import { MARC_SITES } from '../config/florida.js';

const KIND_COLOR = {
  hub: '#e85d4c',
  staging: '#f0a35a',
  command: '#c4a35a',
};

/** Flofaction MARC / deployment sites (demo dataset). */
export function createMarcLayer(viewer) {
  const entities = [];

  return {
    async enable() {
      if (entities.length) return;
      for (const site of MARC_SITES) {
        const color = Color.fromCssColorString(KIND_COLOR[site.kind] ?? '#e85d4c');
        const e = viewer.entities.add({
          id: site.id,
          name: site.name,
          position: Cartesian3.fromDegrees(site.lon, site.lat),
          point: {
            pixelSize: 12,
            color,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: site.name,
            font: '13px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(14, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          description: `<p><b>${site.name}</b></p><p>Kind: ${site.kind}</p><p>Division: Emergency Services</p>`,
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
