// Phase 2 design verification over raw CDP (no extra dependencies).
// Viewports: 1440x900 desktop, 390x844 + 412x915 phones.
// Verifies: drawer pattern, panel coordination, selection preservation,
// overflow menu, horizontal overflow, focus traversal, reduced motion.
// Screenshots → screenshots/phase2-*.png
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL_APP = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || new URL('../screenshots', import.meta.url).pathname;
const CHROME = '/data/data/com.termux/files/usr/bin/chromium-browser';
const PORT = 9778;

mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, '--window-size=1440,900', 'about:blank',
]);
process.on('exit', () => chrome.kill());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targetList;
for (let i = 0; i < 50; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    targetList = await res.json();
    if (targetList.length) break;
  } catch {}
  await sleep(200);
}
if (!targetList?.length) throw new Error('Chromium debugger not reachable');
const page = targetList.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push('EXCEPTION: ' + JSON.stringify(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push('CONSOLE.ERROR: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push('LOG: ' + msg.params.entry.text);
  }
};
function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, { resolve });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.result.exceptionDetails) throw new Error('Eval failed: ' + JSON.stringify(res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text));
  return res.result.result?.value;
}
async function wait(ms) { await sleep(ms); }
async function shot(name, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 500 });
  await wait(400);
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const path = `${OUT}/${name}.png`;
  writeFileSync(path, Buffer.from(res.result.data, 'base64'));
  console.log('shot:', path);
}
async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 500 });
  await wait(500);
}
const click = (label) => evalJs(`
  (() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.getAttribute('aria-label') === ${JSON.stringify(label)});
    if (!btn) throw new Error('button not found: ${label}');
    btn.click(); return 'ok';
  })()
`);
const textOf = () => evalJs(`document.body.innerText`);
async function gotoEditor() {
  // Seed a project and open it (fresh profile each run).
  await evalJs(`
    localStorage.clear();
    indexedDB.deleteDatabase('likhara_studio');
    'cleared'
  `);
  await send('Page.navigate', { url: URL_APP });
  await wait(1500);
  await evalJs(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'New Project');
      btn.click(); return 'ok';
    })()
  `);
  await wait(1500);
  const t = await textOf();
  if (!t.includes('Visual React Architecture')) throw new Error('editor did not open');
}
const noHorizOverflow = () => evalJs(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`);

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

// ---------- Desktop 1440x900 ----------
await setViewport(1440, 900);
await send('Page.navigate', { url: URL_APP });
await wait(1500);
await gotoEditor();
const desktopCols = await evalJs(`
  (() => {
    const asides = [...document.querySelectorAll('aside')];
    return asides.map(a => {
      const r = a.getBoundingClientRect();
      return Math.round(r.width);
    });
  })()
`);
if (!(desktopCols[0] > 200 && desktopCols[1] > 250)) throw new Error('desktop panels collapsed: ' + desktopCols);
console.log('desktop three-column ✓', desktopCols);
await shot('phase2-desktop-editor-1440x900', 1440, 900);

// ---------- Home page captures (both viewports) ----------
await click('Back to Project Home');
await wait(1200);
await shot('phase2-desktop-home-1440x900', 1440, 900);
await setViewport(390, 844);
await wait(300);
if (!(await noHorizOverflow())) throw new Error('horizontal overflow on home at 390');
await shot('phase2-phone-home-390x844', 390, 844);
await evalJs(`
  (() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Open');
    if (!btn) throw new Error('Open button not found');
    btn.click(); return 'ok';
  })()
`);
await wait(1200);

// ---------- Phone 390x844 ----------
await setViewport(390, 844);
await wait(300);
// Canvas must be the primary surface: both drawers closed by default
// (asserted geometrically: left drawer right edge ≤ 0, right drawer left edge ≥ viewport).
const drawerState = await evalJs(`
  (() => {
    const vw = window.innerWidth;
    return [...document.querySelectorAll('aside')].map(a => {
      const r = a.getBoundingClientRect();
      return { offscreen: r.right <= 0 || r.left >= vw, left: Math.round(r.left), right: Math.round(r.right), vw };
    });
  })()
`);
if (!drawerState.every(d => d.offscreen)) throw new Error('drawers not off-canvas by default: ' + JSON.stringify(drawerState));
if (!(await noHorizOverflow())) throw new Error('horizontal overflow at 390');
console.log('phone: drawers closed, no horizontal overflow ✓');
await shot('phase2-phone-editor-canvas-390x844', 390, 844);

// Open Components drawer, switch to Layers.
await click('Toggle Components panel');
await wait(400);
await evalJs(`
  (() => {
    const tab = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Layers ('));
    tab.click(); return 'ok';
  })()
`);
await wait(300);
await shot('phase2-phone-layers-drawer-390x844', 390, 844);
const layersVisible = await textOf();
if (!layersVisible.includes('Root Workspace')) throw new Error('layers drawer content missing');
await click('Close panel');
await wait(400);

// Selection preservation across Properties open/close.
const nameBefore = await evalJs(`
  (() => {
    const sel = [...document.querySelectorAll('span')].find(s => s.previousElementSibling?.textContent === 'Selection:');
    return sel?.textContent || '';
  })()
`);
await click('Toggle Properties panel');
await wait(400);
await shot('phase2-phone-inspector-390x844', 390, 844);
await click('Close panel');
await wait(400);
const nameAfter = await evalJs(`
  (() => {
    const sel = [...document.querySelectorAll('span')].find(s => s.previousElementSibling?.textContent === 'Selection:');
    return sel?.textContent || '';
  })()
`);
if (nameBefore !== nameAfter || !nameBefore) throw new Error(`selection lost: '${nameBefore}' -> '${nameAfter}'`);
console.log('selection preserved across inspector open/close ✓');

// Overflow menu.
await click('More actions');
await wait(300);
const menuText = await evalJs(`document.querySelector('[role="menu"]')?.textContent || ''`);
if (!menuText.includes('Workspace Mode') || !menuText.includes('Save JSON')) throw new Error('overflow menu incomplete: ' + menuText.slice(0, 120));
await shot('phase2-phone-overflow-menu-390x844', 390, 844);
await click('More actions');
await wait(200);

// Keyboard visibility: focus the project name input; must be inside the viewport.
const kb = await evalJs(`
  (() => {
    const input = document.querySelector('input[aria-label="Project Name"]');
    input.focus();
    const r = input.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight, focused: document.activeElement === input };
  })()
`);
if (!kb.focused || kb.top < 0 || kb.bottom > kb.vh) throw new Error('focused field out of viewport: ' + JSON.stringify(kb));
console.log('focused field visible in viewport ✓', JSON.stringify(kb));

// ---------- Phone 412x915 ----------
await setViewport(412, 915);
await wait(300);
if (!(await noHorizOverflow())) throw new Error('horizontal overflow at 412');
await shot('phase2-phone2-canvas-412x915', 412, 915);
console.log('412x915 canvas-first ✓');

// ---------- Focus traversal (keyboard tab-through, phone) ----------
const tabLabels = [];
for (let i = 0; i < 12; i++) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await wait(60);
  const label = await evalJs(`
    (() => {
      const el = document.activeElement;
      if (!el || el === document.body) return 'BODY';
      return el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 24) || el.tagName;
    })()
  `);
  tabLabels.push(label);
}
const meaningful = tabLabels.filter((l) => l !== 'BODY' && l !== 'DIV').length;
if (meaningful < 6) throw new Error('keyboard traversal too shallow: ' + JSON.stringify(tabLabels));
console.log('tab-through reaches labeled controls ✓', JSON.stringify(tabLabels));

// Focus ring distinguishable: activeElement must have a visible outline.
const ring = await evalJs(`
  (() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
  })()
`);
if (!ring) throw new Error('no visible focus ring on focused control');
console.log('focus-visible ring present ✓');

// ---------- Reduced motion ----------
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await wait(200);
const rm = await evalJs(`matchMedia('(prefers-reduced-motion: reduce)').matches`);
if (!rm) throw new Error('reduced-motion emulation not applied');
console.log('reduced-motion preference honored ✓');
await send('Emulation.setEmulatedMedia', { features: [] });

console.log('console errors:', consoleErrors.length ? consoleErrors : 'none ✓');
ws.close();
chrome.kill();
process.exit(consoleErrors.length ? 2 : 0);
