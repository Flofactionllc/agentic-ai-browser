/**
 * Embed helpers for Flofaction emergency-management software and dashboards.
 *
 * Usage in a host app:
 *   import { floEyeUrl, postToFloEye } from '@flofaction/flo-eye-view/integration'
 *   iframe.src = floEyeUrl({ division: 'emergency', screen: 'storm-ops' })
 */

export function floEyeUrl({
  base = '/flo-eye-view/',
  division = 'emergency',
  screen = 'storm-ops',
} = {}) {
  const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1');
  u.searchParams.set('division', division);
  u.searchParams.set('screen', screen);
  return u.pathname + u.search;
}

export function postToFloEye(iframeWindow, message) {
  if (!iframeWindow) return;
  iframeWindow.postMessage(message, '*');
}

export const SCREENS = {
  emergency: ['storm-ops', 'deployment-map', 'damage-assessment', 'fire-watch', 'field-view'],
  insurance: ['storm-exposure', 'claims-view', 'territory-map'],
  media: ['director-mode', 'story-scout'],
  staffing: ['placement-map', 'coverage-view'],
  hq: ['world-picture', 'executive-brief', 'asset-pulse'],
  luap: ['light-map'],
  books: ['light-map'],
};
