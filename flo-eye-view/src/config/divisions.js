/**
 * Flofaction division catalog for Flo Eye View Mission Control.
 * Each division owns multiple screens; each screen owns default layers.
 */

export const DIVISIONS = [
  {
    id: 'hq',
    name: 'HQ Command',
    short: 'HQ',
    blurb: 'All-division world picture',
    accent: '#c4a35a',
    screens: [
      {
        id: 'world-picture',
        name: 'World Picture',
        description: 'Cross-division situational awareness over Florida and beyond.',
        layers: ['cyclones', 'radar', 'fires', 'firms', 'earthquakes', 'marc', 'staffing', 'traffic'],
      },
      {
        id: 'executive-brief',
        name: 'Executive Brief',
        description: 'Storm, fire, and quake highlights for leadership.',
        layers: ['cyclones', 'fires', 'earthquakes'],
      },
      {
        id: 'asset-pulse',
        name: 'Asset Pulse',
        description: 'MARC, staffing, and media interest pins.',
        layers: ['marc', 'staffing', 'insurance'],
      },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    short: 'EMS',
    blurb: 'Storm ops room in a browser',
    accent: '#e85d4c',
    flagship: true,
    screens: [
      {
        id: 'storm-ops',
        name: 'Storm Ops',
        description: 'NHC tracks + NOAA radar for hurricane response.',
        layers: ['cyclones', 'radar'],
      },
      {
        id: 'deployment-map',
        name: 'Deployment Map',
        description: 'MARC sites, staging yards, and response routes.',
        layers: ['marc', 'cyclones', 'radar', 'traffic'],
      },
      {
        id: 'damage-assessment',
        name: 'Damage Assessment',
        description: 'NASA GIBS satellite before/after compare.',
        layers: ['imagery', 'marc'],
      },
      {
        id: 'fire-watch',
        name: 'Fire Watch',
        description: 'NIFC perimeters + VIIRS/FIRMS hotspots.',
        layers: ['fires', 'firms'],
      },
      {
        id: 'field-view',
        name: 'Field View',
        description: 'Florida corridor cameras + traffic context.',
        layers: ['cameras', 'traffic', 'marc', 'radar'],
      },
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance Agency',
    short: 'INS',
    blurb: 'Storm exposure against the book',
    accent: '#4c8fe8',
    screens: [
      {
        id: 'storm-exposure',
        name: 'Storm Exposure',
        description: 'Storm paths against agency territory.',
        layers: ['cyclones', 'radar', 'insurance'],
      },
      {
        id: 'claims-view',
        name: 'Claims View',
        description: 'Before/after imagery over claim clusters.',
        layers: ['imagery', 'insurance'],
      },
      {
        id: 'territory-map',
        name: 'Territory Map',
        description: 'Book-of-business geography.',
        layers: ['insurance'],
      },
    ],
  },
  {
    id: 'media',
    name: 'Media / Flo TV',
    short: 'TV',
    blurb: 'Director mode + story scout',
    accent: '#c44ce8',
    screens: [
      {
        id: 'director-mode',
        name: 'Director Mode',
        description: 'Cinematic camera bookmarks for storytelling.',
        layers: ['cyclones', 'fires', 'marc'],
      },
      {
        id: 'story-scout',
        name: 'Story Scout',
        description: 'Live events worth covering.',
        layers: ['cyclones', 'fires', 'earthquakes', 'radar'],
      },
    ],
  },
  {
    id: 'staffing',
    name: 'Staffing',
    short: 'HR',
    blurb: 'Placement and coverage',
    accent: '#4ce8a0',
    screens: [
      {
        id: 'placement-map',
        name: 'Placement Map',
        description: 'Open roles and placed talent density.',
        layers: ['staffing', 'marc'],
      },
      {
        id: 'coverage-view',
        name: 'Coverage View',
        description: 'Shift coverage against incident geography.',
        layers: ['staffing', 'cyclones', 'fires'],
      },
    ],
  },
  {
    id: 'luap',
    name: 'LUAP',
    short: 'LUAP',
    blurb: 'Light map awareness',
    accent: '#8a9bb0',
    screens: [
      {
        id: 'light-map',
        name: 'Light Map',
        description: 'Territory awareness without full ops chrome.',
        layers: ['cyclones', 'fires'],
      },
    ],
  },
  {
    id: 'books',
    name: 'Books',
    short: 'Books',
    blurb: 'Finance exposure geography',
    accent: '#9aa38b',
    screens: [
      {
        id: 'light-map',
        name: 'Light Map',
        description: 'Finance-relevant exposure geography.',
        layers: ['cyclones', 'insurance'],
      },
    ],
  },
];

export const LAYER_META = {
  radar: { id: 'radar', label: 'NOAA Radar', credit: 'NOAA nowCOAST' },
  cyclones: { id: 'cyclones', label: 'NHC Tracks + Cones', credit: 'NOAA/NWS NHC' },
  fires: { id: 'fires', label: 'Fire Perimeters', credit: 'NIFC WFIGS' },
  firms: { id: 'firms', label: 'FIRMS / Thermal', credit: 'NASA GIBS / FIRMS' },
  earthquakes: { id: 'earthquakes', label: 'Earthquakes', credit: 'USGS' },
  imagery: { id: 'imagery', label: 'Satellite Compare', credit: 'NASA GIBS' },
  marc: { id: 'marc', label: 'MARC Sites', credit: 'Flofaction' },
  insurance: { id: 'insurance', label: 'Territories', credit: 'Flofaction' },
  staffing: { id: 'staffing', label: 'Staffing', credit: 'Flofaction' },
  cameras: { id: 'cameras', label: 'FL Cameras', credit: 'Flofaction FL Field View pack' },
  traffic: { id: 'traffic', label: 'FL Traffic', credit: 'Flofaction corridors · TomTom when keyed' },
};

export function getDivision(id) {
  return DIVISIONS.find((d) => d.id === id) ?? DIVISIONS[0];
}

export function getScreen(division, screenId) {
  const d = typeof division === 'string' ? getDivision(division) : division;
  return d.screens.find((s) => s.id === screenId) ?? d.screens[0];
}

export function layersFromScreen(screen) {
  const on = {};
  for (const id of Object.keys(LAYER_META)) on[id] = false;
  for (const id of screen.layers) on[id] = true;
  return on;
}
