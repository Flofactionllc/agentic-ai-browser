import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
} from 'cesium';
import { FLORIDA_CAMERAS } from '../data/floridaCameras.js';

/**
 * Florida Field View camera pins. Click selects a camera for the side panel.
 */
export function createCamerasLayer(viewer, { onSelect } = {}) {
  const entities = [];
  const byEntityId = new Map();
  let handler = null;
  let selectedId = null;

  function styleEntity(entity, selected) {
    if (!entity?.point) return;
    entity.point.pixelSize = selected ? 16 : 10;
    entity.point.color = Color.fromCssColorString(selected ? '#ffd166' : '#7ec8ff');
    entity.point.outlineColor = Color.WHITE;
    if (entity.label) entity.label.show = selected;
  }

  return {
    async enable() {
      if (entities.length) return;
      for (const cam of FLORIDA_CAMERAS) {
        const entityId = `cam-${cam.id}`;
        const e = viewer.entities.add({
          id: entityId,
          name: cam.name,
          position: Cartesian3.fromDegrees(cam.lon, cam.lat),
          point: {
            pixelSize: 10,
            color: Color.fromCssColorString('#7ec8ff'),
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: cam.roadway,
            font: '11px "IBM Plex Sans", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(12, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: false,
          },
          description: `<p><b>${cam.name}</b></p><p>${cam.roadway} · ${cam.region}</p>`,
        });
        byEntityId.set(entityId, cam);
        entities.push(e);
      }

      handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click) => {
        const picked = viewer.scene.pick(click.position);
        const entity = picked?.id;
        if (!entity?.id) return;
        const cam = byEntityId.get(String(entity.id));
        if (!cam) return;
        selectedId = cam.id;
        for (const e of entities) {
          styleEntity(e, String(e.id) === `cam-${selectedId}`);
        }
        onSelect?.(cam);
        viewer.scene.requestRender();
      }, ScreenSpaceEventType.LEFT_CLICK);

      viewer.scene.requestRender();
    },
    select(cameraId, { emit = false } = {}) {
      selectedId = cameraId;
      for (const e of entities) {
        styleEntity(e, String(e.id) === `cam-${selectedId}`);
      }
      const cam = FLORIDA_CAMERAS.find((c) => c.id === cameraId);
      if (emit && cam) onSelect?.(cam);
      viewer.scene.requestRender();
      return cam;
    },
    async disable() {
      if (handler) {
        handler.destroy();
        handler = null;
      }
      for (const e of entities) viewer.entities.remove(e);
      entities.length = 0;
      byEntityId.clear();
      selectedId = null;
    },
    destroy() {
      this.disable();
    },
  };
}
