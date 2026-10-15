/**
 * Local-only BYOK / Power Up panel.
 * Keys stay in localStorage or .env — never committed. Cesium ion applies at runtime.
 */

const STORAGE_KEY = 'flo-eye-powerup-v1';

export function loadPowerUp() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function savePowerUp( partial ) {
  const next = { ...loadPowerUp(), ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function renderPowerUpButton(powered) {
  return `<button type="button" class="power-btn ${powered ? 'is-on' : ''}" data-power-open>
    ${powered ? 'Powered Up' : 'Power Up'}
  </button>`;
}

export function renderPowerUpModal(settings = {}) {
  const cesium = settings.cesiumIonToken ? '••••••••' : '';
  const firms = settings.firmsMapKey ? '••••••••' : '';
  const tomtom = settings.tomtomApiKey ? '••••••••' : '';
  return `
    <div class="power-modal" data-power-modal hidden>
      <div class="power-card" role="dialog" aria-label="Power Up">
        <header>
          <h2>Power Up</h2>
          <p>Optional keys for this machine only. Nothing is sent to Flofaction. Commercial Cesium ion only — not the free Community plan for SaaS.</p>
          <button type="button" class="power-close" data-power-close aria-label="Close">×</button>
        </header>
        <label>Cesium ion token (commercial)
          <input data-power-field="cesiumIonToken" type="password" autocomplete="off" placeholder="${cesium || 'paste token'}" />
        </label>
        <label>NASA FIRMS MAP_KEY
          <input data-power-field="firmsMapKey" type="password" autocomplete="off" placeholder="${firms || 'optional'}" />
        </label>
        <label>TomTom API key (traffic — later)
          <input data-power-field="tomtomApiKey" type="password" autocomplete="off" placeholder="${tomtom || 'optional'}" />
        </label>
        <div class="power-actions">
          <button type="button" data-power-save>Save locally</button>
          <button type="button" data-power-clear class="ghost">Clear</button>
        </div>
        <p class="power-note">Saved keys live in <code>localStorage</code>. Prefer <code>.env</code> for server-side FIRMS. Restart Terrain after Cesium save.</p>
      </div>
    </div>
  `;
}

export function bindPowerUp(root, { onSave } = {}) {
  const open = root.querySelector('[data-power-open]');
  const modal = root.querySelector('[data-power-modal]');
  const close = root.querySelector('[data-power-close]');
  const save = root.querySelector('[data-power-save]');
  const clear = root.querySelector('[data-power-clear]');
  if (open && modal) open.onclick = () => modal.removeAttribute('hidden');
  if (close && modal) close.onclick = () => modal.setAttribute('hidden', '');
  if (modal) {
    modal.onclick = (ev) => {
      if (ev.target === modal) modal.setAttribute('hidden', '');
    };
  }
  if (save) {
    save.onclick = () => {
      const payload = {};
      root.querySelectorAll('[data-power-field]').forEach((input) => {
        const key = input.getAttribute('data-power-field');
        const val = input.value.trim();
        if (val && !val.startsWith('•')) payload[key] = val;
      });
      const next = savePowerUp(payload);
      onSave?.(next);
      modal?.setAttribute('hidden', '');
    };
  }
  if (clear) {
    clear.onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      root.querySelectorAll('[data-power-field]').forEach((input) => {
        input.value = '';
      });
      onSave?.({});
    };
  }
}
