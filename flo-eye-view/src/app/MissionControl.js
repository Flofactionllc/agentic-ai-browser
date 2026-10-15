import { Ion } from 'cesium';
import { DIVISIONS, getDivision, getScreen, layersFromScreen } from '../config/divisions.js';
import { FLORIDA_HOME } from '../config/florida.js';
import { FLORIDA_CAMERAS } from '../data/floridaCameras.js';
import { createViewer, flyHome } from '../globe/createViewer.js';
import { LayerManager } from '../layers/LayerManager.js';
import { renderShell, bindShell } from '../ui/Shell.js';
import { loadPowerUp } from '../ui/PowerUp.js';

/**
 * Top-level Flo Eye View controller: division ↔ screen ↔ layers ↔ globe.
 */
export class MissionControl {
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    this.apiBase = options.apiBase ?? '';
    this.state = {
      divisionId: options.divisionId ?? 'emergency',
      screenId: options.screenId ?? 'storm-ops',
      layers: {},
      selectedCamera: null,
      storms: [],
    };
    this.viewer = null;
    this.layers = null;
  }

  async start() {
    const power = loadPowerUp();
    const ion = this.options.cesiumIonToken || power.cesiumIonToken;
    if (ion) Ion.defaultAccessToken = ion;

    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, this.state.screenId);
    this.state.screenId = screen.id;
    this.state.layers = layersFromScreen(screen);

    this.root.innerHTML = renderShell(this._shellProps(division, screen));

    const globeEl = this.root.querySelector('[data-globe]');
    this.viewer = await createViewer(globeEl, {
      home: FLORIDA_HOME,
      cesiumIonToken: ion,
    });
    this.layers = new LayerManager(this.viewer, {
      apiBase: this.apiBase,
      onCameraSelect: (cam) => this.setSelectedCamera(cam),
      onStorms: (storms) => this.setStorms(storms),
    });
    await this.layers.setLayers(this.state.layers);
    this._bindChrome();
    this._bindEmbedApi();
    this._syncUrl();
    this._notifyParent();
  }

  _shellProps(division, screen) {
    return {
      divisions: DIVISIONS,
      division,
      screen,
      layers: this.state.layers,
      selectedCamera: this.state.selectedCamera,
      storms: this.state.storms,
    };
  }

  async setDivision(divisionId) {
    const division = getDivision(divisionId);
    this.state.divisionId = division.id;
    this.state.selectedCamera = null;
    await this.setScreen(division.screens[0].id);
  }

  async setScreen(screenId) {
    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, screenId);
    this.state.screenId = screen.id;
    this.state.layers = layersFromScreen(screen);
    if (!this.state.layers.cameras) this.state.selectedCamera = null;
    await this.layers.setLayers(this.state.layers);
    this._rerenderChrome();
    this._syncUrl();
    this._notifyParent();
  }

  async toggleLayer(id, on) {
    this.state.layers = { ...this.state.layers, [id]: on };
    if (id === 'cameras' && !on) this.state.selectedCamera = null;
    if (id === 'cyclones' && !on) this.state.storms = [];
    await this.layers.setLayers(this.state.layers);
    this._rerenderChrome();
  }

  setStorms(storms) {
    const next = storms || [];
    const prevKey = JSON.stringify(this.state.storms.map((s) => s.id + s.intensity));
    const nextKey = JSON.stringify(next.map((s) => s.id + s.intensity));
    this.state.storms = next;
    if (prevKey !== nextKey) this._rerenderChrome();
  }

  setSelectedCamera(camOrId) {
    const cam =
      typeof camOrId === 'string'
        ? FLORIDA_CAMERAS.find((c) => c.id === camOrId)
        : camOrId;
    if (!cam) return;
    if (this.state.selectedCamera?.id === cam.id) {
      this.layers?.selectCamera?.(cam.id);
      return;
    }
    this.state.selectedCamera = cam;
    this.layers?.selectCamera?.(cam.id);
    this._rerenderChrome();
  }

  flyToStorm(id) {
    this.layers?.layers?.cyclones?.flyToStorm?.(id);
  }

  _bindChrome() {
    bindShell(this.root, {
      onDivision: (id) => this.setDivision(id),
      onScreen: (id) => this.setScreen(id),
      onLayerToggle: (id, on) => this.toggleLayer(id, on),
      onHome: () => flyHome(this.viewer, FLORIDA_HOME),
      onImageryMode: (mode) => this.layers?.layers?.imagery?.setMode?.(mode),
      onCameraSelect: (id) => this.setSelectedCamera(id),
      onFlyStorm: (id) => this.flyToStorm(id),
      onPowerSave: (settings) => {
        if (settings.cesiumIonToken) {
          Ion.defaultAccessToken = settings.cesiumIonToken;
        }
        this._rerenderChrome();
      },
    });
  }

  _rerenderChrome() {
    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, this.state.screenId);
    const globeEl = this.root.querySelector('[data-globe]');
    const html = renderShell(this._shellProps(division, screen));
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    for (const sel of [
      '[data-topbar]',
      '[data-screens]',
      '[data-layers]',
      '[data-status]',
      '[data-brand-rail]',
      '[data-power-modal]',
    ]) {
      const next = tmp.querySelector(sel);
      const cur = this.root.querySelector(sel);
      if (next && cur) cur.replaceWith(next);
      else if (next && !cur) this.root.querySelector('.mc-root')?.appendChild(next);
    }
    const newHost = this.root.querySelector('[data-globe-host]');
    if (newHost && globeEl && !newHost.contains(globeEl)) {
      newHost.innerHTML = '';
      newHost.appendChild(globeEl);
    }
    this._bindChrome();
  }

  _syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('division', this.state.divisionId);
    url.searchParams.set('screen', this.state.screenId);
    history.replaceState({}, '', url);
  }

  _notifyParent() {
    try {
      window.parent?.postMessage(
        {
          type: 'flo-eye/state',
          divisionId: this.state.divisionId,
          screenId: this.state.screenId,
          stormCount: this.state.storms.length,
        },
        '*',
      );
    } catch {
      // ignore
    }
  }

  _bindEmbedApi() {
    window.FloEyeView = {
      setDivision: (id) => this.setDivision(id),
      setScreen: (id) => this.setScreen(id),
      flyHome: () => flyHome(this.viewer, FLORIDA_HOME),
      flyToStorm: (id) => this.flyToStorm(id),
      getState: () => ({ ...this.state }),
      selectCamera: (id) => this.setSelectedCamera(id),
    };
    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object' || !String(msg.type || '').startsWith('flo-eye/')) return;
      if (msg.type === 'flo-eye/set-division') this.setDivision(msg.divisionId);
      if (msg.type === 'flo-eye/set-screen') this.setScreen(msg.screenId);
      if (msg.type === 'flo-eye/fly-home') flyHome(this.viewer, FLORIDA_HOME);
      if (msg.type === 'flo-eye/fly-storm') this.flyToStorm(msg.stormId);
      if (msg.type === 'flo-eye/select-camera') this.setSelectedCamera(msg.cameraId);
    });
  }

  destroy() {
    this.layers?.destroy();
    this.viewer?.destroy();
  }
}
