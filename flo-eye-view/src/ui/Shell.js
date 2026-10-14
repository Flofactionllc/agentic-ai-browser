import { LAYER_META } from '../config/divisions.js';

export function renderShell({ divisions, division, screen, layers }) {
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

  return `
    <div class="mc-root" style="--division-accent:${division.accent}">
      <aside class="brand-rail" data-brand-rail>
        <div class="brand-mark">
          <div class="brand-word">Flo Eye View</div>
          <div class="brand-sub">Flofaction Mission Control</div>
        </div>
        <nav class="div-nav" aria-label="Divisions">${divisionButtons}</nav>
        <button type="button" class="home-btn" data-home>Florida home</button>
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
          <p class="layer-hint">Screen <strong>${escapeHtml(screen.name)}</strong> presets these layers. Toggle freely.</p>
        </aside>
      </main>

      <footer class="status" data-status>
        <span>Screen: ${escapeHtml(screen.name)}</span>
        <span class="credits">${activeCredits.length ? escapeHtml(activeCredits.join(' · ')) : 'Esri World Imagery'}</span>
        <span>Local only · no public deploy</span>
      </footer>
    </div>
  `;
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
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
