/** Florida home camera and territory defaults for Flo Eye View. */

export const FLORIDA_HOME = {
  id: 'florida',
  label: 'Florida',
  longitude: -81.7,
  latitude: 27.8,
  height: 1_250_000,
  heading: 0,
  pitch: -75,
};

/** Approximate Florida bounding box for layer filters. */
export const FLORIDA_BBOX = {
  west: -87.6,
  south: 24.4,
  east: -79.9,
  north: 31.1,
};

/** Sample MARC / staging sites for Emergency Services Deployment Map (demo). */
export const MARC_SITES = [
  {
    id: 'marc-orlando',
    name: 'MARC Orlando Hub',
    lon: -81.3792,
    lat: 28.5383,
    kind: 'hub',
    division: 'emergency',
  },
  {
    id: 'marc-tampa',
    name: 'MARC Tampa Bay',
    lon: -82.4572,
    lat: 27.9506,
    kind: 'staging',
    division: 'emergency',
  },
  {
    id: 'marc-miami',
    name: 'MARC South Florida',
    lon: -80.1918,
    lat: 25.7617,
    kind: 'hub',
    division: 'emergency',
  },
  {
    id: 'marc-jacksonville',
    name: 'MARC Jacksonville',
    lon: -81.6557,
    lat: 30.3322,
    kind: 'staging',
    division: 'emergency',
  },
  {
    id: 'marc-tallahassee',
    name: 'MARC Capital Region',
    lon: -84.2807,
    lat: 30.4383,
    kind: 'command',
    division: 'emergency',
  },
  {
    id: 'marc-fort-myers',
    name: 'MARC SW Florida',
    lon: -81.8723,
    lat: 26.6406,
    kind: 'staging',
    division: 'emergency',
  },
];

/** Sample insurance territory centers (demo). */
export const INSURANCE_TERRITORIES = [
  { id: 'ins-cfl', name: 'Central FL Book', lon: -81.4, lat: 28.4, radiusKm: 90 },
  { id: 'ins-sfl', name: 'South FL Book', lon: -80.3, lat: 25.9, radiusKm: 70 },
  { id: 'ins-gulf', name: 'Gulf Coast Book', lon: -82.6, lat: 27.8, radiusKm: 80 },
];

/** Sample staffing coverage pins (demo). */
export const STAFFING_PINS = [
  { id: 'st-orl', name: 'Orlando placements', lon: -81.35, lat: 28.55, openRoles: 12 },
  { id: 'st-tpa', name: 'Tampa placements', lon: -82.5, lat: 27.98, openRoles: 8 },
  { id: 'st-mia', name: 'Miami placements', lon: -80.25, lat: 25.8, openRoles: 15 },
];
