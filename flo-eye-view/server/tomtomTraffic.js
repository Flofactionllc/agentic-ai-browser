/**
 * Enrich FL corridor segments with TomTom Flow Segment Data when a key is set.
 * Falls back to the provided simulated levels on any failure.
 *
 * API: https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data
 */

const LEVEL_FROM_INDEX = (ratio) => {
  if (ratio >= 0.85) return 'free';
  if (ratio >= 0.65) return 'moderate';
  if (ratio >= 0.4) return 'heavy';
  return 'severe';
};

export async function enrichWithTomTom(segments, apiKey, { userAgent } = {}) {
  if (!apiKey) return { mode: 'simulated', segments, enriched: 0 };

  let enriched = 0;
  const out = [];
  for (const seg of segments) {
    const mid = midpoint(seg.coords);
    if (!mid) {
      out.push(seg);
      continue;
    }
    try {
      const [lon, lat] = mid;
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${encodeURIComponent(apiKey)}&point=${lat},${lon}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': userAgent || 'FloEyeView/0.4 (Flofaction)' },
      });
      if (!r.ok) {
        out.push({ ...seg, tomtomError: r.status });
        continue;
      }
      const data = await r.json();
      const flow = data.flowSegmentData || {};
      const current = Number(flow.currentSpeed);
      const free = Number(flow.freeFlowSpeed);
      let speedIndex = seg.speedIndex;
      let level = seg.level;
      if (Number.isFinite(current) && Number.isFinite(free) && free > 0) {
        speedIndex = Number(Math.max(0, Math.min(1.2, current / free)).toFixed(2));
        level = LEVEL_FROM_INDEX(speedIndex);
        enriched += 1;
      }
      out.push({
        ...seg,
        level,
        speedIndex,
        currentSpeed: current,
        freeFlowSpeed: free,
        confidence: flow.confidence,
        source: 'tomtom-flow-segment',
      });
    } catch (err) {
      out.push({ ...seg, tomtomError: String(err.message || err) });
    }
  }

  return {
    mode: enriched ? 'tomtom' : 'simulated-fallback',
    segments: out,
    enriched,
  };
}

function midpoint(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const i = Math.floor(coords.length / 2);
  return coords[i];
}
