import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles/mission-control.css';
import { MissionControl } from './app/MissionControl.js';
import { BRAND, resolveSku } from './config/product.js';
import { ensureAuthenticated } from './ui/AuthGate.js';

function readQuery() {
  const q = new URLSearchParams(window.location.search);
  return {
    divisionId: q.get('division') || undefined,
    screenId: q.get('screen') || undefined,
    sku: q.get('sku') || undefined,
  };
}

async function resolveProduct() {
  const query = readQuery();
  let brand = { ...BRAND };
  let skuId = query.sku;

  if (!skuId) {
    try {
      skuId = localStorage.getItem('flo-eye-sku') || undefined;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch('/api/product', { credentials: 'include' });
    if (res.ok) {
      const product = await res.json();
      brand = { ...BRAND, ...(product.brand || {}) };
      if (!skuId && product.sku) skuId = product.sku;
    }
  } catch {
    // soft-fail
  }

  if (!skuId) skuId = import.meta.env.VITE_FLO_EYE_SKU || 'command';
  return { brand, sku: resolveSku(skuId), query };
}

async function boot() {
  const root = document.getElementById('app');
  await ensureAuthenticated({ apiBase: '', brand: BRAND });
  const { brand, sku, query } = await resolveProduct();

  const mc = new MissionControl(root, {
    divisionId: query.divisionId,
    screenId: query.screenId,
    apiBase: '',
    sku,
    brand,
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
