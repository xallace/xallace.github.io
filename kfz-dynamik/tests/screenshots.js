// Screenshots aller Reiter im Headless-Edge über CDP, sammelt Konsolenfehler und prüft horizontalen Überlauf.
// Aufruf (App vorher in einen Pfad ohne Leerzeichen kopieren, z. B. den Scratchpad):
//   node tests/screenshots.js file:///C:/pfad/kfz/index.html <ausgabeordner> 1400 reifen fahrleistung bremsung schwingung fahrverhalten pruefung
// OPEN_DETAILS=1 klappt die Formeln auf, EXTRA="<js>" läuft nach jedem Reiterwechsel.
// Das Testprofil liegt unter %TEMP%\edge-shot-<port> und wird nicht automatisch gelöscht.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [, , url, outDir, widthArg, ...tabs] = process.argv;
const width = Number(widthArg) || 1400;
const port = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(process.env.TEMP, 'edge-shot-' + port);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

spawn(edge, ['--headless=new', '--inprivate', '--disable-sync', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  `--window-size=${width},1000`, 'about:blank'], { detached: true, stdio: 'ignore' }).unref();

async function getJSON(p) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}${p}`); return await r.json(); } catch (e) { await sleep(150); }
  }
  throw new Error('CDP nicht erreichbar');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map(), handlers = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else handlers.forEach((h) => h(m));
  };
  return new Promise((res) => {
    ws.onopen = () => res({
      send: (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
      on: (h) => handlers.push(h),
      close: () => ws.close(),
    });
  });
}

(async () => {
  const ver = await getJSON('/json/version');
  const list = await getJSON('/json/list');
  const page = list.find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  const logs = [];
  c.on((m) => {
    if (m.method === 'Runtime.consoleAPICalled') logs.push(`console.${m.params.type}: ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Log.entryAdded' && m.params.entry.level !== 'verbose') logs.push(`log.${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  });
  await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: url + '#' + tabs[0] });
  await sleep(2500);
  fs.mkdirSync(outDir, { recursive: true });
  for (const tab of tabs) {
    const [name, scroll] = tab.split('@');
    await c.send('Runtime.evaluate', { expression: `location.hash = '${name}'` });
    await sleep(2500);
    if (process.env.OPEN_DETAILS) await c.send('Runtime.evaluate', { expression: `document.querySelectorAll('#tab-${name} details').forEach((d) => d.open = true)` });
    if (process.env.EXTRA) await c.send('Runtime.evaluate', { expression: process.env.EXTRA });
    if (process.env.OPEN_DETAILS || process.env.EXTRA) await sleep(800);
    const h = await c.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
    const H = Math.min(h.result.result.value, 7000);
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: H, deviceScaleFactor: 1, mobile: false });
    await sleep(1200);
    const sw = await c.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth + "/" + document.documentElement.clientWidth', returnByValue: true });
    logs.push(`[${name}] scrollWidth/clientWidth = ${sw.result.result.value}, Höhe ${H}`);
    const shot = await c.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, `${name}-${width}.png`), Buffer.from(shot.result.data, 'base64'));
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
  }
  console.log(logs.join('\n') || '(keine Konsolenmeldungen)');
  c.close();
  const b = await connect(ver.webSocketDebuggerUrl);
  await b.send('Browser.close').catch(() => {});
  b.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
