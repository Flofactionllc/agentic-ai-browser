import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles/mission-control.css';
import { MissionControl } from './app/MissionControl.js';

function readQuery() {
  const q = new URLSearchParams(window.location.search);
  return {
    divisionId: q.get('division') || 'emergency',
    screenId: q.get('screen') || 'storm-ops',
  };
}

async function boot() {
  const root = document.getElementById('app');
  const query = readQuery();
  const mc = new MissionControl(root, {
    ...query,
    apiBase: '',
    cesiumIonToken: import.meta.env.VITE_CESIUM_ION_TOKEN || undefined,
  });
  await mc.start();
}

boot().catch((err) => {
  console.error(err);
  const root = document.getElementById('app');
  if (root) {
    root.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#eef2f7;background:#070b14;height:100%">
      <h1>Flo Eye View failed to start</h1>
      <pre>${String(err?.stack || err)}</pre>
    </div>`;
  }
});
