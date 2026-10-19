/**
 * Florida corridor centerlines for Field View traffic simulation.
 * Approximate polylines for ops demos — not survey-grade geometry.
 * Congestion is regenerated server-side each poll (deterministic seed by hour).
 */

export const FLORIDA_CORRIDORS = [
  {
    id: 'i4-cfl',
    name: 'I-4 Central Florida',
    roadway: 'I-4',
    coords: [
      [-81.65, 28.25],
      [-81.5, 28.4],
      [-81.38, 28.54],
      [-81.25, 28.6],
      [-81.1, 28.7],
    ],
  },
  {
    id: 'i75-tampa',
    name: 'I-75 Tampa Bay',
    roadway: 'I-75',
    coords: [
      [-82.55, 27.7],
      [-82.4, 27.9],
      [-82.3, 28.05],
      [-82.2, 28.2],
    ],
  },
  {
    id: 'i95-sfl',
    name: 'I-95 South Florida',
    roadway: 'I-95',
    coords: [
      [-80.19, 25.77],
      [-80.15, 26.1],
      [-80.1, 26.4],
      [-80.05, 26.7],
      [-80.05, 26.9],
    ],
  },
  {
    id: 'i95-jax',
    name: 'I-95 Jacksonville',
    roadway: 'I-95',
    coords: [
      [-81.65, 30.15],
      [-81.66, 30.33],
      [-81.55, 30.45],
    ],
  },
  {
    id: 'i10-panhandle',
    name: 'I-10 Panhandle',
    roadway: 'I-10',
    coords: [
      [-87.2, 30.42],
      [-86.5, 30.45],
      [-85.5, 30.45],
      [-84.28, 30.44],
      [-83.5, 30.4],
      [-82.0, 30.35],
      [-81.72, 30.33],
    ],
  },
  {
    id: 'turnpike-sfl',
    name: 'Florida Turnpike South',
    roadway: 'Turnpike',
    coords: [
      [-80.35, 25.9],
      [-80.35, 26.2],
      [-80.35, 26.5],
      [-80.4, 26.8],
      [-80.5, 27.2],
      [-80.7, 27.6],
      [-81.0, 28.0],
      [-81.3, 28.4],
    ],
  },
  {
    id: 'i75-swfl',
    name: 'I-75 Southwest Florida',
    roadway: 'I-75',
    coords: [
      [-81.87, 26.4],
      [-81.85, 26.65],
      [-81.8, 26.9],
      [-81.7, 27.2],
      [-82.0, 27.5],
      [-82.3, 27.8],
    ],
  },
];
