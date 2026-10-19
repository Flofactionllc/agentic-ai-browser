import { WebMapServiceImageryProvider } from 'cesium';

/** NOAA nowCOAST MRMS base reflectivity — keyless WMS. */
export function createRadarLayer(viewer) {
  let imageryLayer = null;

  return {
    async enable() {
      if (imageryLayer) return;
      const provider = new WebMapServiceImageryProvider({
        url: 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/ows',
        layers: 'base_reflectivity_mosaic',
        parameters: {
          transparent: true,
          format: 'image/png',
          styles: '',
        },
        enablePickFeatures: false,
        credit: 'NOAA nowCOAST · NWS/OAR MRMS radar',
      });
      imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
      imageryLayer.alpha = 0.65;
    },
    async disable() {
      if (!imageryLayer) return;
      viewer.imageryLayers.remove(imageryLayer, true);
      imageryLayer = null;
    },
    destroy() {
      this.disable();
    },
  };
}
