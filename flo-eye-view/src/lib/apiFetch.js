/**
 * Authenticated API helper for Flo Eye View layers.
 * Always sends session cookies; optionally forwards Power Up TomTom BYOK.
 */
import { loadPowerUp } from '../ui/PowerUp.js';

export function apiFetch(path, { apiBase = '', headers = {}, tomtomByok = false, ...init } = {}) {
  const h = { ...headers };
  if (tomtomByok) {
    const key = loadPowerUp().tomtomApiKey;
    if (key) h['X-Flo-Eye-TomTom-Key'] = key;
  }
  return fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...init,
    headers: h,
  });
}
