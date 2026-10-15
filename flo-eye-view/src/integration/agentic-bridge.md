# Agentic AI Browser ↔ Flo Eye View

This repo already contains Playwright/LangChain automation. Flo Eye View is the Mission Control surface those agents (and humans) can drive.

## Open a division screen

```
http://127.0.0.1:5180/?division=emergency&screen=storm-ops
http://127.0.0.1:5180/?division=hq&screen=world-picture
http://127.0.0.1:5180/?division=insurance&screen=storm-exposure
```

## postMessage API (iframe host)

```js
iframe.contentWindow.postMessage({ type: 'flo-eye/set-division', divisionId: 'emergency' }, '*');
iframe.contentWindow.postMessage({ type: 'flo-eye/set-screen', screenId: 'fire-watch' }, '*');
iframe.contentWindow.postMessage({ type: 'flo-eye/fly-home' }, '*');
```

## window.FloEyeView (same origin)

```js
window.FloEyeView.setDivision('media');
window.FloEyeView.setScreen('story-scout');
window.FloEyeView.getState();
```

## Emergency Management host

Open the Flofaction EMS shell that embeds Mission Control:

```
http://127.0.0.1:5180/host/
```

Host buttons postMessage `flo-eye/set-division` + `flo-eye/set-screen` into the iframe.

## Suggested automation milestones

1. Navigate to Storm Ops, assert NHC credit visible (cones via `/api/cyclones/geometry`).
2. Switch to Deployment Map, count MARC site labels.
3. Switch Field View, select a FL camera, assert LIVE SLOT card.
4. Switch Insurance → Claims View, toggle imagery Before/After.
5. HQ World Picture enables multi-layer state.
6. Open `/host/`, click Deployment then Field View, assert iframe follows.
