import { LAYER_META } from '../config/divisions.js';
import { SKUS } from '../config/product.js';
import { FLORIDA_CAMERAS } from '../data/floridaCameras.js';
import {
  renderPowerUpButton,
  renderPowerUpModal,
  bindPowerUp,
  loadPowerUp,
} from './PowerUp.js';

export function renderShell({
  divisions,
  division,
  screen,
  layers,
  selectedCamera = null,
  storms = [],
  brand = { productName: 'Flo Eye View', company: 'Flofaction', shellName: 'Mission Control' },
  sku = null,
  trafficMode = null,
}) {
  const settings = loadPowerUp();
  const powered = Boolean(settings.cesiumIonToken || settings.firmsMapKey || settings.tomtomApiKey);
  const skuOptions = Object.values(SKUS)
    .map(
      (s) =>
        `<option value="${escapeHtml(s.id)}" ${sku?.id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`,
    )
    .join('');

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

  const stormPanel = layers.cyclones
    ? renderStormPanel(storms)
    : '';

  return `
    <div class="mc-root" style="--division-accent:${division.accent}">
      <aside class="brand-rail" data-brand-rail>
        <div class="brand-mark">
          <div class="brand-word">${escapeHtml(brand.productName)}</div>
          <div class="brand-sub">${escapeHtml(brand.company)} ${escapeHtml(brand.shellName || 'Mission Control')}</div>
        </div>
        <nav class="div-nav" aria-label="Divisions">${divisionButtons}</nav>
        <div class="sku-block" data-sku-block>
          <label class="sku-label">SKU
            <select data-sku-select aria-label="Product SKU">${skuOptions}</select>
          </label>
        </div>
        <div class="rail-actions">
          ${renderPowerUpButton(powered)}
          <button type="button" class="home-btn" data-share-url>Copy demo link</button>
          <button type="button" class="home-btn" data-home>Florida home</button>
          <a class="home-btn brief-link" href="/host/" target="_blank" rel="noopener">EMS host</a>
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
          ${sku ? `<span class="pill">${escapeHtml(sku.name || sku.id)}</span>` : ''}
          ${trafficMode ? `<span class="pill traffic-mode" data-traffic-mode>${escapeHtml(trafficMode)}</span>` : ''}
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
          ${stormPanel}
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

function renderStormPanel(storms) {
  if (!storms?.length) {
    return `<div class="storm-panel" data-storm-panel>
      <h3>Active storms</h3>
      <p class="cam-empty">No active NHC systems right now — radar still live.</p>
    </div>`;
  }
  const cards = storms
    .map(
      (s) => `
      <div class="storm-card">
        <div class="storm-head">
          <strong>${escapeHtml(s.name)}</strong>
          <span>${escapeHtml(s.classification || '')}${s.intensity ? ` · ${escapeHtml(String(s.intensity))}kt` : ''}</span>
        </div>
        <div class="storm-meta">${escapeHtml(s.binNumber || '')}${s.pressure ? ` · ${escapeHtml(String(s.pressure))} mb` : ''}</div>
        <div class="storm-actions">
          <button type="button" data-fly-storm="${escapeHtml(s.id)}">Fly to</button>
          ${s.advisoryUrl ? `<a href="${escapeHtml(s.advisoryUrl)}" target="_blank" rel="noopener noreferrer">Advisory</a>` : ''}
        </div>
      </div>`,
    )
    .join('');
  return `<div class="storm-panel" data-storm-panel>
    <h3>Active storms</h3>
    ${cards}
  </div>`;
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
  const share = root.querySelector('[data-share-url]');
  if (share) {
    share.onclick = async () => {
      try {
        await handlers.onShareUrl?.();
        const prev = share.textContent;
        share.textContent = 'Link copied';
        setTimeout(() => {
          share.textContent = prev;
        }, 1600);
      } catch {
        share.textContent = 'Copy failed';
      }
    };
  }
  const skuSelect = root.querySelector('[data-sku-select]');
  if (skuSelect) {
    skuSelect.onchange = () => handlers.onSku?.(skuSelect.value);
  }
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
  root.querySelectorAll('[data-fly-storm]').forEach((btn) => {
    btn.onclick = () => handlers.onFlyStorm?.(btn.getAttribute('data-fly-storm'));
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
