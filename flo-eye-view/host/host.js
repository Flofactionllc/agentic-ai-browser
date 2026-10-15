const iframe = document.getElementById('flo-eye');
const statusEl = document.querySelector('[data-host-status]');
const mods = [...document.querySelectorAll('.ems-mod')];

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
      // Screen after division — division resets to first screen, so set screen next tick
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
  }
}

mods.forEach((btn) => {
  btn.addEventListener('click', () => activate(btn));
});

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg || msg.type !== 'flo-eye/state') return;
  statusEl.textContent = `${msg.divisionId} · ${msg.screenId}`;
});

iframe.addEventListener('load', () => {
  statusEl.textContent = 'Mission Control linked';
});
