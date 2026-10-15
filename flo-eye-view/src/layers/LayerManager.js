import { Credit } from 'cesium';
import { LAYER_META } from '../config/divisions.js';
import { createRadarLayer } from './radar.js';
import { createCyclonesLayer } from './cyclones.js';
import { createFiresLayer } from './fires.js';
import { createEarthquakesLayer } from './earthquakes.js';
import { createImageryCompareLayer } from './imageryCompare.js';
import { createMarcLayer } from './marc.js';
import { createInsuranceLayer } from './insurance.js';
import { createStaffingLayer } from './staffing.js';
import { createCamerasLayer } from './cameras.js';

/**
 * Owns enable/disable for all Flo Eye View layers and attribution credits.
 */
export class LayerManager {
  constructor(viewer, { apiBase = '', onCameraSelect } = {}) {
    this.viewer = viewer;
    this.apiBase = apiBase;
    this.layers = {
      radar: createRadarLayer(viewer),
      cyclones: createCyclonesLayer(viewer, apiBase),
      fires: createFiresLayer(viewer, apiBase),
      earthquakes: createEarthquakesLayer(viewer),
      imagery: createImageryCompareLayer(viewer),
      marc: createMarcLayer(viewer),
      insurance: createInsuranceLayer(viewer),
      staffing: createStaffingLayer(viewer),
      cameras: createCamerasLayer(viewer, { onSelect: onCameraSelect }),
    };
    this.state = Object.fromEntries(Object.keys(this.layers).map((k) => [k, false]));
    this._credits = new Map();
  }

  async setLayers(next) {
    for (const [id, enabled] of Object.entries(next)) {
      if (!(id in this.layers)) continue;
      if (this.state[id] === enabled) continue;
      this.state[id] = enabled;
      const layer = this.layers[id];
      if (enabled) {
        await layer.enable();
        this._addCredit(id);
      } else {
        await layer.disable();
        this._removeCredit(id);
      }
    }
    this.viewer.scene.requestRender();
  }

  selectCamera(id) {
    this.layers.cameras?.select?.(id);
  }

  getActiveCredits() {
    return Object.entries(this.state)
      .filter(([, on]) => on)
      .map(([id]) => LAYER_META[id]?.credit)
      .filter(Boolean);
  }

  destroy() {
    for (const layer of Object.values(this.layers)) {
      layer.disable?.();
      layer.destroy?.();
    }
  }

  _addCredit(id) {
    const text = LAYER_META[id]?.credit;
    if (!text || this._credits.has(id)) return;
    const credit = new Credit(text, true);
    this.viewer.creditDisplay.addStaticCredit(credit);
    this._credits.set(id, credit);
  }

  _removeCredit(id) {
    this._credits.delete(id);
  }
}
