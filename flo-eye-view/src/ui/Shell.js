import { LAYER_META } from '../config/divisions.js';
import { FLORIDA_CAMERAS } from '../data/floridaCameras.js';
import {
  renderPowerUpButton,
  renderPowerUpModal,
  bindPowerUp,
  loadPowerUp,
} from './PowerUp.js';

export function renderShell({ divisions, division, screen, layers, selectedCamera = null }) {
  const settings = loadPowerUp();
  const powered = Boolean(settings.cesiumIonToken || settings.firmsMapKey || settings.tomtomApiKey);

  const divisionButtons = divisions
    .map(
      (d) => `
      <button type="button" class="div-btn ${d.id === division.id ? 'is-active' : ''}" data-division="${d.id}" style="--accent:${d.accent}">
        <span class="div-short">${escapeHtml(d.short)}</span>
        <span class="div-name">${escapeHtml(d.name)}</span>
      </button>`,
    )
    .join('');

  const screenTabs = division.screens
    .map(
      (s) => `
      <button type="button" class="screen-tab ${s.id === screen.id ? 'is-active' : ''}" data-screen="${s.id}">
        ${escapeHtml(s.name)}
      </button>`,
    )
    .join('');

  const layerChips = Object.keys(LAYER_META)
    .map((id) => {
      const meta = LAYER_META[id];
      const on = !!layers[id];
      return `
        <label class="layer-chip ${on ? 'is-on' : ''}">
          <input type="checkbox" data-layer="${id}" ${on ? 'checked' : ''} />
          <span>${escapeHtml(meta.label)}</span>
        </label>`;
    })
    .join('');

  const activeCredits = Object.entries(layers)
    .filter(([, on]) => on)
    .map(([id]) => LAYER_META[id]?.credit)
    .filter(Boolean);

  const imageryControls = layers.imagery
    ? `<div class="imagery-modes" data-imagery-modes>
         <button type="button" data-imagery-mode="before">Before</button>
         <button type="button" data-imagery-mode="after" class="is-active">After</button>
         <button type="button" data-imagery-mode="both">Both</button>
       </div>`
    : '';

  const cameraPanel = layers.cameras
    ? renderCameraPanel(selectedCamera)
    : '';

  return `
    <div class="mc-root" style="--division-accent:${division.accent}">
      <aside class="brand-rail" data-brand-rail>
        <div class="brand-mark">
          <div class="brand-word">Flo Eye View</div>
          <div class="brand-sub">Flofaction Mission Control</div>
        </div>
        <nav class="div-nav" aria-label="Divisions">${divisionButtons}</nav>
        <div class="rail-actions">
          ${renderPowerUpButton(powered)}
          <button type="button" class="home-btn" data-home>Florida home</button>
        </div>
      </aside>

      <header class="topbar" data-topbar>
        <div class="topbar-title">
          <h1>${escapeHtml(division.name)}</h1>
          <p>${escapeHtml(screen.description)}</p>
        </div>
        <div class="topbar-meta">
          <span class="pill">${division.flagship ? 'Flagship' : 'Division'}</span>
          <span class="pill">Florida theater</span>
        </div>
      </header>

      <div class="screens" data-screens>${screenTabs}</div>

      <main class="stage">
        <div class="globe-host" data-globe-host>
          <div class="globe" data-globe></div>
          <div class="globe-veil"></div>
        </div>
        <aside class="layers-panel" data-layers>
          <h2>Layers</h2>
          <div class="layer-list">${layerChips}</div>
          ${imageryControls}
          ${cameraPanel}
          <p class="layer-hint">Screen <strong>${escapeHtml(screen.name)}</strong> presets these layers. Toggle freely.</p>
        </aside>
      </main>

      <footer class="status" data-status>
        <span>Screen: ${escapeHtml(screen.name)}</span>
        <span class="credits">${activeCredits.length ? escapeHtml(activeCredits.join(' · ')) : 'Esri World Imagery'}</span>
        <span>Local only · no public deploy</span>
      </footer>
      ${renderPowerUpModal(settings)}
    </div>
  `;
}

function renderCameraPanel(selectedCamera) {
  const list = FLORIDA_CAMERAS.map(
    (cam) => `
      <button type="button" class="cam-item ${selectedCamera?.id === cam.id ? 'is-active' : ''}" data-camera="${cam.id}">
        <span class="cam-road">${escapeHtml(cam.roadway)}</span>
        <span class="cam-name">${escapeHtml(cam.name)}</span>
      </button>`,
  ).join('');

  const detail = selectedCamera
    ? `<div class="cam-detail" data-cam-detail>
         <div class="cam-still" aria-hidden="true">
           <div class="cam-still-label">LIVE SLOT</div>
           <div class="cam-still-meta">${escapeHtml(selectedCamera.roadway)} · ${escapeHtml(selectedCamera.facing || '')}</div>
         </div>
         <h3>${escapeHtml(selectedCamera.name)}</h3>
         <p>${escapeHtml(selectedCamera.region)} · ${escapeHtml(selectedCamera.kind)}</p>
         <p class="cam-note">Still frames require an FL511 / FDOT redistribution agreement for production. Pins + metadata ship keyless for ops planning.</p>
       </div>`
    : `<p class="cam-empty">Select a Florida corridor camera on the globe or list.</p>`;

  return `
    <div class="cam-panel" data-cam-panel>
      <h3>Field View cameras</h3>
      <div class="cam-list">${list}</div>
      ${detail}
    </div>`;
}

export function bindShell(root, handlers) {
  root.querySelectorAll('[data-division]').forEach((btn) => {
    btn.onclick = () => handlers.onDivision(btn.getAttribute('data-division'));
  });
  root.querySelectorAll('[data-screen]').forEach((btn) => {
    btn.onclick = () => handlers.onScreen(btn.getAttribute('data-screen'));
  });
  root.querySelectorAll('[data-layer]').forEach((input) => {
    input.onchange = () => handlers.onLayerToggle(input.getAttribute('data-layer'), input.checked);
  });
  const home = root.querySelector('[data-home]');
  if (home) home.onclick = () => handlers.onHome();
  root.querySelectorAll('[data-imagery-mode]').forEach((btn) => {
    btn.onclick = () => {
      root.querySelectorAll('[data-imagery-mode]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      handlers.onImageryMode?.(btn.getAttribute('data-imagery-mode'));
    };
  });
  root.querySelectorAll('[data-camera]').forEach((btn) => {
    btn.onclick = () => handlers.onCameraSelect?.(btn.getAttribute('data-camera'));
  });
  bindPowerUp(root, { onSave: handlers.onPowerSave });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
