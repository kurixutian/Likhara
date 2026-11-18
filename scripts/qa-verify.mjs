// Phase 5 & 6 QA verification over raw CDP (no extra dependencies).
// Viewports: 320x720, 390x844, 768x1024, 1024x768, 1440x900.
// Checks: horizontal overflow, console errors, accessible button names,
// standalone HTML export interactivity, and captures screenshots/phase6-*.png.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL_APP = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || new URL('../screenshots', import.meta.url).pathname;
const CHROME = '/data/data/com.termux/files/usr/bin/chromium-browser';
const PORT = 9779;

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
async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 600 });
  await wait(400);
}
async function shot(name, width, height) {
  await setViewport(width, height);
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const path = `${OUT}/${name}.png`;
  writeFileSync(path, Buffer.from(res.result.data, 'base64'));
  console.log('shot:', path);
}
const noHorizOverflow = () => evalJs(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`);
const checkButtonsAccessible = () => evalJs(`
  (() => {
    const unlabeled = [...document.querySelectorAll('button')].filter(b => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const text = (b.textContent || '').trim();
      const aria = (b.getAttribute('aria-label') || '').trim();
      return !text && !aria;
    });
    return unlabeled.length;
  })()
`);

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

// Seed and open a project
await setViewport(1440, 900);
await send('Page.navigate', { url: URL_APP });
await wait(1200);
await evalJs(`localStorage.clear(); indexedDB.deleteDatabase('likhara_studio'); 'ok'`);
await send('Page.navigate', { url: URL_APP });
await wait(1200);

// Check Home at 320x720 and 1440x900
await setViewport(320, 720);
if (!(await noHorizOverflow())) throw new Error('Horizontal overflow on Home at 320x720');
if ((await checkButtonsAccessible()) > 0) throw new Error('Unlabeled visible buttons on Home at 320x720');
await shot('phase6-home-320x720', 320, 720);

await setViewport(1440, 900);
await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('New'))?.click()`);
await wait(1200);

const viewports = [
  [320, 720],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
];

for (const [w, h] of viewports) {
  await setViewport(w, h);
  const okOverflow = await noHorizOverflow();
  if (!okOverflow) throw new Error(`Horizontal overflow on Editor at ${w}x${h}`);
  const unlabeled = await checkButtonsAccessible();
  if (unlabeled > 0) throw new Error(`${unlabeled} unlabeled button(s) on Editor at ${w}x${h}`);
  await shot(`phase6-editor-${w}x${h}`, w, h);
  console.log(`viewport ${w}x${h}: overflow=ok, a11y-buttons=ok ✓`);
}

// Phase 5: verify standalone HTML export works cleanly in Chromium
await evalJs(`
  (() => {
    const htmlTab = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Standalone HTML'));
    htmlTab?.click();
    return 'clicked';
  })()
`);
await wait(300);
const exportedHtml = await evalJs(`document.querySelector('pre')?.textContent || ''`);
if (!exportedHtml.includes('<!DOCTYPE html>') || !exportedHtml.includes('data-likhara-form-status')) {
  throw new Error('Standalone HTML export missing expected structure or runtime validation script');
}

const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(exportedHtml);
await send('Page.navigate', { url: dataUrl });
await wait(1200);
const htmlSubmitText = await evalJs(`
  (() => {
    const form = document.querySelector('form');
    const input = form?.querySelector('input');
    if (input) input.value = 'qa@likhara.dev';
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return document.body.innerText;
  })()
`);
if (!htmlSubmitText.includes('Form validated and submitted.')) {
  throw new Error('Standalone HTML export form submission did not render status banner');
}
console.log('standalone HTML export execution in Chromium ✓');

console.log('console errors:', consoleErrors.length ? consoleErrors : 'none ✓');
ws.close();
chrome.kill();
process.exit(consoleErrors.length ? 2 : 0);
