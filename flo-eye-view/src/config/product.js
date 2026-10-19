/**
 * Sellable product SKUs + white-label brand for Flo Eye View.
 * Override via ?sku= or VITE_FLO_EYE_SKU / FLO_EYE_SKU.
 */

export const BRAND = {
  productName: 'Flo Eye View',
  company: 'Flofaction',
  shellName: 'Mission Control',
  emsName: 'Emergency Management',
  theaterDefault: 'Florida',
};

/** Commercial SKUs — which divisions unlock. */
export const SKUS = {
  emergency: {
    id: 'emergency',
    name: 'Flo Eye View — Emergency',
    blurb: 'Storm Ops, Deployment, Damage, Fire Watch, Field View',
    divisions: ['emergency', 'hq'],
    priceNote: 'Flagship ops console',
  },
  insurance: {
    id: 'insurance',
    name: 'Flo Eye View — Insurance',
    blurb: 'Storm Exposure, Claims View, Territory Map',
    divisions: ['insurance', 'hq'],
    priceNote: 'Agency book of business',
  },
  media: {
    id: 'media',
    name: 'Flo Eye View — Media',
    blurb: 'Director Mode + Story Scout',
    divisions: ['media', 'hq'],
    priceNote: 'Flo TV storytelling',
  },
  staffing: {
    id: 'staffing',
    name: 'Flo Eye View — Staffing',
    blurb: 'Placement Map + Coverage View',
    divisions: ['staffing', 'hq'],
    priceNote: 'Workforce geography',
  },
  command: {
    id: 'command',
    name: 'Flo Eye View — Command Suite',
    blurb: 'All divisions + HQ World Picture',
    divisions: ['hq', 'emergency', 'insurance', 'media', 'staffing', 'luap', 'books'],
    priceNote: 'Full Flofaction Mission Control',
  },
};

export function resolveSku(raw) {
  const id = String(raw || 'command').toLowerCase();
  return SKUS[id] || SKUS.command;
}

export function filterDivisions(allDivisions, sku) {
  const allowed = new Set(sku.divisions);
  return allDivisions.filter((d) => allowed.has(d.id));
}

export function readSkuFromEnvOrQuery() {
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('sku');
    if (q) return resolveSku(q);
    try {
      const stored = localStorage.getItem('flo-eye-sku');
      if (stored) return resolveSku(stored);
    } catch {
      // ignore
    }
  }
  const env =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FLO_EYE_SKU) ||
    undefined;
  return resolveSku(env || 'command');
}
