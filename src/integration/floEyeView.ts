/**
 * Bridge helpers so the agentic browser can open Flo Eye View Mission Control
 * screens as automation targets.
 */

export type FloEyeDivision =
  | 'hq'
  | 'emergency'
  | 'insurance'
  | 'media'
  | 'staffing'
  | 'luap'
  | 'books';

export interface FloEyeTarget {
  division?: FloEyeDivision;
  screen?: string;
  origin?: string;
}

export function floEyeViewUrl(target: FloEyeTarget = {}): string {
  const origin = target.origin ?? 'http://127.0.0.1:5180';
  const url = new URL(origin);
  url.searchParams.set('division', target.division ?? 'emergency');
  url.searchParams.set('screen', target.screen ?? 'storm-ops');
  return url.toString();
}

/** Suggested first-run targets for emergency-management demos. */
export const FLO_EYE_DEMO_TARGETS = [
  { division: 'emergency' as const, screen: 'storm-ops' },
  { division: 'emergency' as const, screen: 'deployment-map' },
  { division: 'emergency' as const, screen: 'damage-assessment' },
  { division: 'emergency' as const, screen: 'fire-watch' },
  { division: 'hq' as const, screen: 'world-picture' },
  { division: 'insurance' as const, screen: 'storm-exposure' },
];
