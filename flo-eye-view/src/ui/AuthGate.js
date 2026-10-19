/**
 * Client access-code gate. When server reports auth required and not unlocked,
 * show a Flofaction-branded unlock screen before Mission Control / EMS host.
 */

export async function ensureAuthenticated({ apiBase = '', brand } = {}) {
  let status;
  try {
    const res = await fetch(`${apiBase}/api/auth/status`, { credentials: 'include' });
    status = await res.json();
  } catch {
    // API down — allow UI boot; layers will fail soft
    return { required: false, authenticated: true, mode: 'api-unreachable' };
  }
  if (!status.required || status.authenticated) return status;

  await showLoginModal({ apiBase, brand, sku: status.sku });
  return { required: true, authenticated: true, mode: 'unlocked' };
}

function showLoginModal({ apiBase, brand, sku }) {
  return new Promise((resolve, reject) => {
    const overlay = document.createElement('div');
    overlay.className = 'auth-gate';
    overlay.innerHTML = `
      <form class="auth-card" data-auth-form>
        <div class="auth-brand">${escapeHtml(brand?.productName || 'Flo Eye View')}</div>
        <div class="auth-sub">${escapeHtml(brand?.company || 'Flofaction')} · access gate</div>
        <p>This demo is locked for commercial evaluation. Enter the Flofaction access code.</p>
        <label>Access code
          <input name="code" type="password" autocomplete="current-password" required autofocus />
        </label>
        <button type="submit">Unlock Mission Control</button>
        <p class="auth-err" data-auth-err hidden></p>
        <p class="auth-note">SKU: ${escapeHtml(sku || 'command')} · Local session cookie · no public deploy</p>
      </form>
    `;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('[data-auth-form]');
    const errEl = overlay.querySelector('[data-auth-err]');
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      errEl.hidden = true;
      const code = new FormData(form).get('code');
      try {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
        overlay.remove();
        resolve(data);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      }
    };
    // Keep promise pending until success; reject only if removed without login (rare)
    overlay.addEventListener('flo-eye-auth-cancel', () => {
      overlay.remove();
      reject(new Error('Login cancelled'));
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
