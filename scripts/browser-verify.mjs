// Phase 1 browser verification over raw CDP (no extra dependencies).
// Drives the real app in installed headless Chromium: screenshots + console
// errors + interaction flows (new project, open, back home).
//
// Usage: node scripts/browser-verify.mjs <url> <outdir>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL_APP = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || '/data/data/com.termux/files/usr/tmp/opencode/likhara-baseline';
const CHROME = '/data/data/com.termux/files/usr/bin/chromium-browser';
const PORT = 9777;

mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`,
  '--window-size=1440,900',
  'about:blank',
]);
process.on('exit', () => chrome.kill());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait for the debugger endpoint.
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

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, { resolve });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function wait(ms) { await sleep(ms); }

async function shot(name, width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 2, mobile: width < 500,
  });
  await wait(400);
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const path = `${OUT}/${name}.png`;
  writeFileSync(path, Buffer.from(res.result.data, 'base64'));
  console.log('shot:', path);
}

async function evalJs(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.result.exceptionDetails) throw new Error('Eval failed: ' + JSON.stringify(res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text));
  return res.result.result?.value;
}

const click = (label) => evalJs(`
  (() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.getAttribute('aria-label') === ${JSON.stringify(label)} || b.textContent.trim() === ${JSON.stringify(label)});
    if (!btn) throw new Error('button not found: ${label}');
    btn.click();
    return 'clicked';
  })()
`);

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

// ---- Flow 1: project home (fresh) ----
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: URL_APP });
await wait(1500);

const homeText = await evalJs(`document.body.innerText`);
if (!homeText.includes('Likhara Studio') || !homeText.includes('New Project')) {
  throw new Error('Home failed to render: ' + homeText.slice(0, 200));
}
console.log('home renders ✓');

// ---- Flow 2: create project → editor opens ----
await click('New Project');
await wait(1200);
const editorText = await evalJs(`document.body.innerText`);
if (!editorText.includes('Visual React Architecture')) {
  throw new Error('Editor did not open: ' + editorText.slice(0, 200));
}
console.log('new project → editor ✓');

// Rename the project through the editor (autofills autosave).
await evalJs(`
  (() => {
    const input = document.querySelector('input[aria-label="Project Name"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Phone Draft');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()
`);
await wait(800);
await shot('phase1-mobile-editor-390x844', 390, 844);

// ---- Flow 3: back home → project listed ----
await click('Back to Project Home');
await wait(1200);
const homeText2 = await evalJs(`document.body.innerText`);
if (!homeText2.includes('Phone Draft')) {
  throw new Error('Renamed project missing on home: ' + homeText2.slice(0, 300));
}
console.log('autosave + home listing ✓');
await shot('phase1-mobile-home-390x844', 390, 844);

// ---- Flow 4: reopen project from home ----
await click('Open');
await wait(1200);
const reopened = await evalJs(`document.querySelector('input[aria-label="Project Name"]')?.value`);
if (reopened !== 'Phone Draft') throw new Error('Reopen failed, name=' + reopened);
console.log('reopen restores project ✓');

// ---- Desktop viewport ----
await click('Back to Project Home');
await wait(1000);
await shot('phase1-desktop-home-1440x900', 1440, 900);
await click('Open');
await wait(1200);
await shot('phase1-desktop-editor-1440x900', 1440, 900);

// ---- Flow 5: legacy Canvix migration in the real browser ----
await click('Back to Project Home');
await wait(1000);
// Simulate a genuine upgrade: clear the app state (incl. migration marker),
// seed a legacy Canvix workspace (retired tokens), reset IDB, reload.
await evalJs(`
  (() => {
    localStorage.clear();
    localStorage.setItem('canvix_studio_v4_workspace', JSON.stringify({
      name: 'Browser Legacy Canvix',
      tag: 'div', isContainer: true,
      extraClassName: 'shell-legacy',
      style: { layout: 'flex-row', widthMode: 'fit' },
      children: [{ tag: 'h1', text: 'Browser migration marker', style: {}, children: [] }],
    }));
    indexedDB.deleteDatabase('likhara_studio');
    return 'seeded';
  })()
`);
await send('Page.navigate', { url: URL_APP });
await wait(1800);
const migText = await evalJs(`document.body.innerText`);
if (!migText.includes('Browser Legacy Canvix') || !migText.includes('legacy workspace')) {
  throw new Error('Browser migration failed: ' + migText.slice(0, 300));
}
// Legacy key preserved + idempotency: reload again, exactly one card.
const legacyKeyKept = await evalJs(`localStorage.getItem('canvix_studio_v4_workspace') !== null`);
if (!legacyKeyKept) throw new Error('Legacy key was deleted during migration');
await send('Page.navigate', { url: URL_APP });
await wait(1500);
const migText2 = await evalJs(`document.body.innerText`);
const markerCount = (migText2.match(/Browser Legacy Canvix/g) || []).length;
if (markerCount !== 1) throw new Error('Migration not idempotent, cards=' + markerCount);
console.log('legacy canvix migration + preservation + idempotency ✓');

console.log('console errors:', consoleErrors.length ? consoleErrors : 'none ✓');
ws.close();
chrome.kill();
process.exit(consoleErrors.length ? 2 : 0);
