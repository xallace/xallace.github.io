// Screenshots der App im Headless-Edge über CDP: node tests/screenshots.js <outdir> [steps.json] [url]
// Ohne url wird index.html neben diesem Ordner geladen; ohne steps.json gilt tests/steps.json.
// steps.json: [{ "name": "...", "hash": "tab", "js": "...", "width": 1400, "clip": "#id" }]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [, , outDir, stepsArg, urlArg] = process.argv;
const stepsFile = stepsArg || path.join(__dirname, 'steps.json');
const url = urlArg || require('url').pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
const port = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(process.env.TEMP, 'edge-shot-' + port);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

spawn(edge, ['--headless=new', '--inprivate', '--disable-sync', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1400,1000', 'about:blank'], { detached: true, stdio: 'ignore' }).unref();

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
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else handlers.forEach((h) => h(m));
  };
  return new Promise((res) => {
    ws.onopen = () => res({
      send: (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
      on: (h) => handlers.push(h), close: () => ws.close(),
    });
  });
}

(async () => {
  const ver = await getJSON('/json/version');
  const page = (await getJSON('/json/list')).find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  const logs = [];
  c.on((m) => {
    if (m.method === 'Runtime.consoleAPICalled') logs.push(`console.${m.params.type}: ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Log.entryAdded' && m.params.entry.level !== 'verbose') logs.push(`log.${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  });
  await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width: steps[0].width || 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url: url + '#' + steps[0].hash });
  await sleep(2000);
  fs.mkdirSync(outDir, { recursive: true });
  for (const s of steps) {
    const width = s.width || 1400;
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await c.send('Runtime.evaluate', { expression: `location.hash = '${s.hash}'` });
    await sleep(600);
    if (s.js) {
      const ex = await c.send('Runtime.evaluate', { expression: s.js, returnByValue: true, replMode: true });
      const r = ex.result.result;
      logs.push(`[${s.name}] js → ${r.subtype === 'error' ? r.description : JSON.stringify(r.value)}`);
      await sleep(500);
    }
    const h = await c.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
    const H = Math.min(h.result.result.value, 7000);
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: H, deviceScaleFactor: 1, mobile: false });
    await sleep(700);
    const sw = await c.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth + "/" + document.documentElement.clientWidth', returnByValue: true });
    logs.push(`[${s.name}] scrollWidth/clientWidth = ${sw.result.result.value}, Höhe ${H}`);
    let params = { format: 'png' };
    if (s.clip) {
      const b = await c.send('Runtime.evaluate', { expression: `JSON.stringify(document.querySelector('${s.clip}').getBoundingClientRect())`, returnByValue: true });
      const r = JSON.parse(b.result.result.value);
      params.clip = { x: r.x, y: r.y + 0, width: r.width, height: r.height, scale: 1 };
    }
    const shot = await c.send('Page.captureScreenshot', params);
    fs.writeFileSync(path.join(outDir, `${s.name}.png`), Buffer.from(shot.result.data, 'base64'));
  }
  console.log(logs.join('\n') || '(keine Konsolenmeldungen)');
  c.close();
  const b = await connect(ver.webSocketDebuggerUrl);
  await b.send('Browser.close').catch(() => {});
  b.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
