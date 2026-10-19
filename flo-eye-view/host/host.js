import { ensureAuthenticated } from '../src/ui/AuthGate.js';
import { BRAND } from '../src/config/product.js';

async function boot() {
  const iframe = document.getElementById('flo-eye');
  const statusEl = document.querySelector('[data-host-status]');
  const mods = [...document.querySelectorAll('.ems-mod')];

  await ensureAuthenticated({ apiBase: '', brand: BRAND });
  statusEl.textContent = 'Mission Control linking…';

  function showPanel(name) {
    document.querySelectorAll('[data-panel]').forEach((el) => {
      const on = el.getAttribute('data-panel') === name;
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function activate(btn) {
    mods.forEach((b) => b.classList.toggle('is-active', b === btn));
    const view = btn.getAttribute('data-host-view');
    if (view === 'eye') {
      showPanel('eye');
      const division = btn.getAttribute('data-division');
      const screen = btn.getAttribute('data-screen');
      const win = iframe.contentWindow;
      if (win) {
        win.postMessage({ type: 'flo-eye/set-division', divisionId: division }, '*');
        setTimeout(() => {
          win.postMessage({ type: 'flo-eye/set-screen', screenId: screen }, '*');
        }, 50);
      } else {
        iframe.src = `/?division=${encodeURIComponent(division)}&screen=${encodeURIComponent(screen)}`;
      }
      statusEl.textContent = `${division} · ${screen}`;
    } else {
      showPanel(view);
      statusEl.textContent = view === 'brief' ? 'Incident Brief' : 'Response Roster';
      if (view === 'brief') loadBrief();
      if (view === 'roster') loadRoster();
    }
  }

  mods.forEach((btn) => {
    btn.addEventListener('click', () => activate(btn));
  });

  window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || msg.type !== 'flo-eye/state') return;
    statusEl.textContent = `${msg.divisionId} · ${msg.screenId}${msg.stormCount ? ` · ${msg.stormCount} storm(s)` : ''}`;
  });

  iframe.addEventListener('load', () => {
    statusEl.textContent = 'Mission Control linked';
  });

  document.querySelector('[data-refresh-brief]')?.addEventListener('click', () => loadBrief());
  document.querySelector('[data-refresh-roster]')?.addEventListener('click', () => loadRoster());
  document.querySelector('[data-print-brief]')?.addEventListener('click', () => {
    showPanel('brief');
    window.print();
  });

  async function loadBrief() {
    const lede = document.querySelector('[data-brief-lede]');
    const kpis = document.querySelector('[data-brief-kpis]');
    const stormsEl = document.querySelector('[data-brief-storms]');
    const objectives = document.querySelector('[data-brief-objectives]');
    try {
      const res = await fetch('/api/brief', { credentials: 'include' });
      if (!res.ok) throw new Error(`brief ${res.status}`);
      const data = await res.json();
      lede.textContent = `Florida theater · generated ${new Date(data.generatedAt).toLocaleString()}`;
      kpis.innerHTML = `
      <div class="kpi"><span>Storms</span><strong>${data.storms?.length ?? 0}</strong></div>
      <div class="kpi"><span>Fire perimeters</span><strong>${data.firePerimeterCount ?? '—'}</strong></div>
      <div class="kpi"><span>MARC hubs</span><strong>${data.marcReady ?? '—'}</strong></div>
      <div class="kpi"><span>Staging</span><strong>${data.marcStaging ?? '—'}</strong></div>
    `;
      stormsEl.innerHTML = (data.storms || []).length
        ? data.storms
            .map(
              (s) => `
        <article class="brief-storm">
          <div><strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.classification || '')} ${escapeHtml(String(s.intensity || ''))}kt</div>
          <div class="muted">${escapeHtml(s.binNumber || '')} · ${escapeHtml(s.lastUpdate || '')}</div>
          <div class="brief-actions">
            <button type="button" data-brief-fly="${escapeHtml(s.id)}">Open Storm Ops / fly</button>
            ${s.advisoryUrl ? `<a href="${escapeHtml(s.advisoryUrl)}" target="_blank" rel="noopener">Advisory</a>` : ''}
          </div>
        </article>`,
            )
            .join('')
        : '<p class="muted">No active NHC systems.</p>';
      objectives.innerHTML = (data.objectives || []).map((o) => `<li>${escapeHtml(o)}</li>`).join('');
      stormsEl.querySelectorAll('[data-brief-fly]').forEach((btn) => {
        btn.onclick = () => {
          const stormId = btn.getAttribute('data-brief-fly');
          const stormBtn = mods.find((m) => m.getAttribute('data-screen') === 'storm-ops');
          if (stormBtn) activate(stormBtn);
          setTimeout(() => {
            iframe.contentWindow?.postMessage({ type: 'flo-eye/fly-storm', stormId }, '*');
          }, 400);
        };
      });
    } catch (err) {
      lede.textContent = `Brief unavailable: ${err.message}`;
    }
  }

  async function loadRoster() {
    const body = document.querySelector('[data-roster-body]');
    try {
      const res = await fetch('/api/roster', { credentials: 'include' });
      if (!res.ok) throw new Error(`roster ${res.status}`);
      const data = await res.json();
      body.innerHTML = (data.units || [])
        .map(
          (u) => `
      <tr>
        <td>${escapeHtml(u.unit)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${escapeHtml(u.status)}</td>
        <td><button type="button" class="linkish" data-roster-open="${escapeHtml(u.id)}">Map</button></td>
      </tr>`,
        )
        .join('');
      body.querySelectorAll('[data-roster-open]').forEach((btn) => {
        btn.onclick = () => {
          const dep = mods.find((m) => m.getAttribute('data-screen') === 'deployment-map');
          if (dep) activate(dep);
        };
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="4">Roster unavailable: ${escapeHtml(err.message)}</td></tr>`;
    }
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

boot().catch((err) => {
  console.error(err);
  const statusEl = document.querySelector('[data-host-status]');
  if (statusEl) statusEl.textContent = `Host failed: ${err.message}`;
});
