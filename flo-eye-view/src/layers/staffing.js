import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
} from 'cesium';
import { STAFFING_PINS } from '../config/florida.js';

/** Sample staffing placement pins. */
export function createStaffingLayer(viewer) {
  const entities = [];

  return {
    async enable() {
      if (entities.length) return;
      for (const pin of STAFFING_PINS) {
        const e = viewer.entities.add({
          id: pin.id,
          name: pin.name,
          position: Cartesian3.fromDegrees(pin.lon, pin.lat),
          point: {
            pixelSize: 10,
            color: Color.fromCssColorString('#4ce8a0'),
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: `${pin.name}\n${pin.openRoles} open`,
            font: '12px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(12, 0),
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
