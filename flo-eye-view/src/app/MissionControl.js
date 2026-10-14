import { DIVISIONS, getDivision, getScreen, layersFromScreen } from '../config/divisions.js';
import { FLORIDA_HOME } from '../config/florida.js';
import { createViewer, flyHome } from '../globe/createViewer.js';
import { LayerManager } from '../layers/LayerManager.js';
import { renderShell, bindShell } from '../ui/Shell.js';

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
    };
    this.viewer = null;
    this.layers = null;
  }

  async start() {
    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, this.state.screenId);
    this.state.screenId = screen.id;
    this.state.layers = layersFromScreen(screen);

    this.root.innerHTML = renderShell({
      divisions: DIVISIONS,
      division,
      screen,
      layers: this.state.layers,
    });

    const globeEl = this.root.querySelector('[data-globe]');
    this.viewer = await createViewer(globeEl, {
      home: FLORIDA_HOME,
      cesiumIonToken: this.options.cesiumIonToken,
    });
    this.layers = new LayerManager(this.viewer, { apiBase: this.apiBase });
    await this.layers.setLayers(this.state.layers);

    bindShell(this.root, {
      onDivision: (id) => this.setDivision(id),
      onScreen: (id) => this.setScreen(id),
      onLayerToggle: (id, on) => this.toggleLayer(id, on),
      onHome: () => flyHome(this.viewer, FLORIDA_HOME),
      onImageryMode: (mode) => this.layers?.layers?.imagery?.setMode?.(mode),
    });

    this._bindEmbedApi();
    this._syncUrl();
  }

  async setDivision(divisionId) {
    const division = getDivision(divisionId);
    this.state.divisionId = division.id;
    await this.setScreen(division.screens[0].id, { skipDivisionReset: true });
    this._rerenderChrome();
  }

  async setScreen(screenId, { skipDivisionReset } = {}) {
    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, screenId);
    this.state.screenId = screen.id;
    this.state.layers = layersFromScreen(screen);
    await this.layers.setLayers(this.state.layers);
    if (!skipDivisionReset) this._rerenderChrome();
    else this._rerenderChrome();
    this._syncUrl();
  }

  async toggleLayer(id, on) {
    this.state.layers = { ...this.state.layers, [id]: on };
    await this.layers.setLayers(this.state.layers);
    this._rerenderChrome();
  }

  _rerenderChrome() {
    const division = getDivision(this.state.divisionId);
    const screen = getScreen(division, this.state.screenId);
    const globeHost = this.root.querySelector('[data-globe-host]');
    const globeEl = this.root.querySelector('[data-globe]');
    // Preserve globe canvas: only refresh chrome regions.
    const html = renderShell({
      divisions: DIVISIONS,
      division,
      screen,
      layers: this.state.layers,
    });
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    for (const sel of ['[data-topbar]', '[data-screens]', '[data-layers]', '[data-status]', '[data-brand-rail]']) {
      const next = tmp.querySelector(sel);
      const cur = this.root.querySelector(sel);
      if (next && cur) cur.replaceWith(next);
    }
    // Keep existing globe element
    const newHost = this.root.querySelector('[data-globe-host]');
    if (newHost && globeEl && !newHost.contains(globeEl)) {
      newHost.innerHTML = '';
      newHost.appendChild(globeEl);
    }
    bindShell(this.root, {
      onDivision: (id) => this.setDivision(id),
      onScreen: (id) => this.setScreen(id),
      onLayerToggle: (id, on) => this.toggleLayer(id, on),
      onHome: () => flyHome(this.viewer, FLORIDA_HOME),
      onImageryMode: (mode) => this.layers?.layers?.imagery?.setMode?.(mode),
    });
    void globeHost;
  }

  _syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('division', this.state.divisionId);
    url.searchParams.set('screen', this.state.screenId);
    history.replaceState({}, '', url);
  }

  _bindEmbedApi() {
    window.FloEyeView = {
      setDivision: (id) => this.setDivision(id),
      setScreen: (id) => this.setScreen(id),
      flyHome: () => flyHome(this.viewer, FLORIDA_HOME),
      getState: () => ({ ...this.state }),
    };
    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object' || !String(msg.type || '').startsWith('flo-eye/')) return;
      if (msg.type === 'flo-eye/set-division') this.setDivision(msg.divisionId);
      if (msg.type === 'flo-eye/set-screen') this.setScreen(msg.screenId);
      if (msg.type === 'flo-eye/fly-home') flyHome(this.viewer, FLORIDA_HOME);
    });
  }

  destroy() {
    this.layers?.destroy();
    this.viewer?.destroy();
  }
}
