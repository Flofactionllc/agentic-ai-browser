import {
  Cartesian3,
  Color,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
  createWorldTerrainAsync,
} from 'cesium';
import { FLORIDA_HOME } from '../config/florida.js';

/**
 * Create a keyless-first Cesium viewer.
 * Esri World Imagery by default; OSM fallback. No ion token required for v1.
 */
export async function createViewer(container, options = {}) {
  const home = options.home ?? FLORIDA_HOME;

  // Do not set Ion.defaultAccessToken unless a paid/commercial token is provided.
  if (options.cesiumIonToken) {
    Ion.defaultAccessToken = options.cesiumIonToken;
  }

  let baseLayer;
  try {
    const esri = new UrlTemplateImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 19,
      credit: 'Powered by Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    });
    baseLayer = new ImageryLayer(esri);
  } catch {
    baseLayer = ImageryLayer.fromProviderAsync(
      Promise.resolve(
        new OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        }),
      ),
    );
  }

  const viewer = new Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: true,
    selectionIndicator: true,
    baseLayer,
    terrain: undefined,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
  });

  viewer.scene.globe.baseColor = Color.fromCssColorString('#0b1220');
  viewer.scene.backgroundColor = Color.fromCssColorString('#05080f');
  viewer.scene.fog.enabled = true;
  viewer.scene.globe.enableLighting = false;
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;

  if (options.cesiumIonToken) {
    try {
      viewer.terrainProvider = await createWorldTerrainAsync();
    } catch {
      // flat ellipsoid is fine for v1
    }
  }

  flyHome(viewer, home);
  return viewer;
}

export function flyHome(viewer, home = FLORIDA_HOME) {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(home.longitude, home.latitude, home.height),
    orientation: {
      heading: CesiumMath.toRadians(home.heading ?? 0),
      pitch: CesiumMath.toRadians(home.pitch ?? -75),
      roll: 0,
    },
    duration: 1.6,
  });
}
