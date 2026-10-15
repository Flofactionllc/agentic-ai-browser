import { Credit, UrlTemplateImageryProvider } from 'cesium';

/**
 * NASA GIBS VIIRS true-color compare — "before" (~8 days ago) vs "after" (yesterday).
 * Keyless. Modes: before | after | both.
 */
export function createImageryCompareLayer(viewer) {
  let beforeLayer = null;
  let afterLayer = null;
  let mode = 'after';

  function dayStamp(offsetDays) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function addTemplate(time, alpha) {
    const provider = new UrlTemplateImageryProvider({
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      maximumLevel: 9,
      credit: new Credit('NASA GIBS / VIIRS Corrected Reflectance', true),
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.alpha = alpha;
    return layer;
  }

  function clear() {
    if (beforeLayer) {
      viewer.imageryLayers.remove(beforeLayer, true);
      beforeLayer = null;
    }
    if (afterLayer) {
      viewer.imageryLayers.remove(afterLayer, true);
      afterLayer = null;
    }
  }

  async function sync() {
    clear();
    const before = dayStamp(-8);
    const after = dayStamp(-1);
    if (mode === 'before') {
      beforeLayer = addTemplate(before, 0.95);
    } else if (mode === 'after') {
      afterLayer = addTemplate(after, 0.95);
    } else {
      beforeLayer = addTemplate(before, 0.5);
      afterLayer = addTemplate(after, 0.5);
    }
    viewer.scene.requestRender();
  }

  return {
    async enable() {
      mode = 'after';
      await sync();
    },
    async setMode(next) {
      mode = next;
      await sync();
    },
    async disable() {
      clear();
    },
    destroy() {
      clear();
    },
  };
}
