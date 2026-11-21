#!/usr/bin/env node
/* ==========================================================================
   xallace design check · freeze v1.0 (21.11.2026) · rules: design/DESIGN.md
   Usage:
     node design/check.mjs <app folder> [--browser] [--depth N] [--json out.json]
                           [--root <xallace.github.io clone>] [--browser-path <exe>]
   <app folder>  repo root of an app, or a subfolder of the xallace.github.io clone
   --browser     also load every page in headless Edge/Chrome at 390 and 1440 px
                 (horizontal overflow, console errors, failed requests, rendered fonts)
   --depth N     only HTML files up to N folder levels below <app folder> (0 = top level)
   --root        clone of xallace.github.io that serves /fonts/ and /design/
                 (default: the folder above this script)
   Exit code 1 if there is at least one error. Needs Node 22+ (global WebSocket).
   ========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const flag = name => args.includes(name);
const appDir = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--depth', '--json', '--root', '--browser-path'].includes(args[i - 1])) || '.');
const root = path.resolve(opt('--root', path.join(HERE, '..')));
const maxDepth = opt('--depth') !== undefined ? Number(opt('--depth')) : Infinity;
if (!existsSync(appDir)) { console.error('No such folder: ' + appDir); process.exit(2); }

const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', 'lib', 'libs', 'tests', 'test', '_src', 'fonts', 'models', 'assets', 'audio-samples']);
const findings = [];
const add = (level, rule, file, msg) => findings.push({ level, rule, file: file ? path.relative(appDir, file) || '.' : '.', msg });

/* ---------- files ---------- */
function walk(dir, depth, out) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
      if (dir === root && path.resolve(appDir) === root && name === 'design') continue; // the hub check skips the design folder
      if (depth < maxDepth) walk(p, depth + 1, out);
    } else out.push(p);
  }
  return out;
}
const files = walk(appDir, 0, []);
const html = files.filter(f => /\.html?$/i.test(f));
const css = files.filter(f => /\.css$/i.test(f) && !/\.min\.css$/i.test(f));
const js = files.filter(f => /\.(m?js)$/i.test(f) && !/\.min\.js$/i.test(f) && path.basename(f) !== 'check.mjs');
const read = f => readFileSync(f, 'utf8');
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

/* ---------- palette from xallace-ui.css ---------- */
const uiCss = path.join(root, 'design', 'xallace-ui.css');
const palette = new Set();
if (existsSync(uiCss)) {
  const t = read(uiCss);
  for (const m of t.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) palette.add(m[0].toLowerCase());
  for (const m of t.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) palette.add(`${m[1]},${m[2]},${m[3]}`);
  for (const m of t.matchAll(/--accent-rgb:\s*(\d+),\s*(\d+),\s*(\d+)/g)) palette.add(`${m[1]},${m[2]},${m[3]}`);
}
['#000', '#000000', '#fff', '#ffffff', '0,0,0', '255,255,255'].forEach(c => palette.add(c)); // black/white: shadows, print/export
const hexToTriplet = h => { h = h.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(','); };
function offPalette(text) {
  const bad = new Map();
  for (const m of stripComments(text).matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi)) {
    const v = m[0].toLowerCase();
    let key;
    if (v.startsWith('#')) key = palette.has(v) || palette.has(hexToTriplet(v)) ? null : v;
    else { const t = v.replace(/rgba?\(\s*/, '').replace(/\s+/g, ''); key = palette.has(t) ? null : 'rgb(' + t + ')'; }
    if (key) bad.set(key, (bad.get(key) || 0) + 1);
  }
  return bad;
}
const topList = m => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k}×${n}`).join(', ');

/* ---------- static rules ---------- */
const BANNED_FONTS = ['Inter', 'JetBrains Mono', 'Outfit', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Space Grotesk', 'Fira Code', 'Source Code Pro'];
const bannedRe = new RegExp(`(font-family\\s*:[^;{}]*|font\\s*=\\s*[^;\\n]*|fontFamily\\s*[:=][^;\\n]*|["'])\\b(${BANNED_FONTS.join('|')})\\b(?![-\\w])`, 'g');
const LIGHT_RE = /prefers-color-scheme\s*:\s*light|data-theme\s*=\s*["']light|\blight-mode\b|\btheme-toggle\b|\blight-theme\b/i;
const BOOKPLATE_RE = /1967[\s-]*(technical[\s-]*)?book[\s-]*plate/i;
let usesUiCss = false, hasColorScheme = false;

for (const f of html) {
  const t = read(f);
  if (!/<head[\s>]/i.test(t)) continue; // fragment
  const live = stripComments(t);
  if (/<meta[^>]+http-equiv=["']refresh/i.test(live)) { add('note', 'redirect', f, 'redirect stub, skipped'); continue; }
  if (!live.includes('/fonts/xallace-type.css')) add('error', 'fonts', f, 'does not link /fonts/xallace-type.css');
  if (!live.includes('/fonts/xallace-type.js')) add('error', 'fonts', f, 'does not load /fonts/xallace-type.js (canvas redraw after webfonts)');
  if (live.includes('/design/xallace-ui.css')) usesUiCss = true;
  else add('note', 'ui-css', f, 'not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)');
  if (!/<meta[^>]+name=["']viewport/i.test(live)) add('error', 'viewport', f, 'no viewport meta');
  if (!/<html[^>]*\blang=["']en/i.test(live)) add('warn', 'lang', f, '<html lang="en"> missing (UI language is English)');
  const inHubRoot = path.dirname(path.resolve(appDir, f)) === root;
  if (!/href=["']https:\/\/xallace\.github\.io|href=["']\/(#[^"']*)?["']|href=["']\.\.\/(index\.html)?(#[^"']*)?["']/i.test(live)
      && !(inHubRoot && /href=["'](\.\/)?index\.html(#[^"']*)?["']/i.test(live))) add('warn', 'back-link', f, 'no link back to the portfolio');
  if (/color-scheme\s*:\s*dark|name=["']color-scheme["'][^>]*dark/i.test(live)) hasColorScheme = true;
  if (BOOKPLATE_RE.test(t)) add(BOOKPLATE_RE.test(live) ? 'error' : 'warn', 'wording', f, '"1967 Book Plate" wording' + (BOOKPLATE_RE.test(live) ? ' in page text or meta' : ' in an HTML comment'));
  if (/fonts\.(googleapis|gstatic)\.com/i.test(live)) add('error', 'fonts', f, 'loads Google Fonts (fonts are self-hosted under /fonts/)');
  if (/font-family=["'][^"']*VT323/i.test(live)) add('error', 'vt323', f, 'VT323 inside SVG');
}
for (const f of [...html, ...css, ...js]) {
  const t = read(f), live = stripComments(t);
  if (LIGHT_RE.test(live)) add('error', 'dark-only', f, 'light mode / theme toggle code (' + live.match(LIGHT_RE)[0] + ')');
  const banned = new Set([...live.matchAll(bannedRe)].map(m => m[2]));
  if (banned.size) add('error', 'fonts', f, 'banned font(s): ' + [...banned].join(', '));
}
for (const f of css) {
  const t = read(f), live = stripComments(t);
  if (/color-scheme\s*:\s*dark/i.test(live)) hasColorScheme = true;
  if (/fonts\.(googleapis|gstatic)\.com/i.test(live)) add('error', 'fonts', f, 'imports Google Fonts');
  if (BOOKPLATE_RE.test(t)) add('warn', 'wording', f, '"1967 Book Plate" in a comment');
  const bad = offPalette(t);
  const n = [...bad.values()].reduce((a, b) => a + b, 0);
  if (n) add('warn', 'palette', f, `${n} colour value(s) outside the frozen palette: ${topList(bad)}`);
  // VT323 role above 0.70rem
  for (const m of live.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    if (!/font-family\s*:[^;]*(--xt-small|--font-small|VT323)/i.test(body)) continue;
    const fs = body.match(/font-size\s*:\s*([\d.]+)(rem|px|em)/i);
    if (!fs) continue;
    const px = fs[2].toLowerCase() === 'px' ? Number(fs[1]) : Number(fs[1]) * 16;
    if (px > 11.2 + 1e-6) add('warn', 'vt323', f, `VT323 role at ${fs[1]}${fs[2]} (max 0.70rem): ${m[1].trim().slice(0, 60)}`);
  }
}
for (const f of js) {
  const t = read(f), live = stripComments(t);
  if (/VT323/.test(live)) add('error', 'vt323', f, 'VT323 named in script (canvas/SVG text uses Iosevka Charon)');
  if (/outputEncoding|sRGBEncoding/.test(live)) add('error', 'three', f, 'three.js outputEncoding/sRGBEncoding (washes out the dark scene)');
  if (BOOKPLATE_RE.test(t)) add('warn', 'wording', f, '"1967 Book Plate" in a comment or string');
  const bad = offPalette(t);
  const n = [...bad.values()].reduce((a, b) => a + b, 0);
  if (n) add('note', 'palette', f, `${n} hard-coded colour(s) outside the palette (prefer tokens): ${topList(bad)}`);
}
if (!usesUiCss && !hasColorScheme) add('warn', 'dark-only', null, 'no color-scheme: dark (form controls and scrollbars render light)');
const testsDir = (dir, depth) => existsSync(path.join(dir, 'tests')) || (depth > 0 && readdirSync(dir).some(n =>
  !n.startsWith('.') && !SKIP_DIRS.has(n) && statSync(path.join(dir, n)).isDirectory() && testsDir(path.join(dir, n), depth - 1)));
const hasTests = testsDir(appDir, 2) || files.some(f => /(^|[\\/])(verify|test)[^\\/]*\.m?js$/i.test(f));
if (!hasTests) add('warn', 'tests', null, 'no tests/ folder (model checks: node tests/verify.mjs)');
if (!html.length) add('error', 'pages', null, 'no HTML page found');

/* ---------- browser checks ---------- */
async function browserChecks() {
  const pages = html.filter(f => /<head[\s>]/i.test(read(f)) && !/<meta[^>]+http-equiv=["']refresh/i.test(stripComments(read(f))));
  const inRoot = !path.relative(root, appDir).startsWith('..') && !path.isAbsolute(path.relative(root, appDir));
  const mount = inRoot ? '/' + path.relative(root, appDir).split(path.sep).filter(Boolean).join('/') : '/' + path.basename(appDir);
  const mountDir = inRoot ? root : appDir;
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
    '.woff': 'font/woff', '.ttf': 'font/ttf', '.stl': 'model/stl', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.txt': 'text/plain' };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let base = root, rel = u;
    if (!inRoot && (u === mount || u.startsWith(mount + '/'))) { base = mountDir; rel = u.slice(mount.length) || '/'; }
    let p = path.join(base, rel);
    if (!p.startsWith(base)) { res.writeHead(403).end(); return; }
    if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const httpPort = server.address().port;

  const exe = opt('--browser-path') || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
  const profile = mkdtempSync(path.join(os.tmpdir(), 'xallace-check-'));
  const cdpPort = 9400 + Math.floor(Math.random() * 400);
  const isEdge = /msedge/i.test(exe);
  spawn(exe, ['--headless=new', isEdge ? '--inprivate' : '--incognito', '--disable-sync', '--disable-extensions', '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore', detached: true }).unref();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let ver;
  for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json(); } catch { await sleep(300); } }
  if (!ver) { add('error', 'browser', null, 'browser did not start: ' + exe); server.close(); return; }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const logs = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    const L = logs.get(m.sessionId); if (!L) return;
    if (m.method === 'Runtime.exceptionThrown') L.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0].slice(0, 200));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') L.push('console.error: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') L.push((m.params.entry.text + ' ' + (m.params.entry.url || '').replace(`http://127.0.0.1:${httpPort}`, '')).slice(0, 220));
  };
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}, sessionId) => new Promise(res => {
    const msg = { id: ++id, method, params }; if (sessionId) msg.sessionId = sessionId;
    pending.set(msg.id, res); ws.send(JSON.stringify(msg));
  });
  const PROBE = `(() => {
    const iw = innerWidth, sw = document.documentElement.scrollWidth;
    const wide = [];
    if (sw > iw + 1) {
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= iw + 1) continue;
        let clipped = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = getComputedStyle(a).overflowX; if (o !== 'visible') { clipped = true; break; }
        }
        if (!clipped) wide.push((el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList[0] ? '.' + el.classList[0] : '')) + ' →' + Math.round(r.right));
        if (wide.length >= 4) break;
      }
    }
    const bg = getComputedStyle(document.body).backgroundColor.match(/[\\d.]+/g) || [0, 0, 0];
    const lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
    const h = document.querySelector('h1');
    return { iw, sw, wide, lum: (bg[3] !== undefined && Number(bg[3]) === 0) ? null : lum,
      body: getComputedStyle(document.body).fontFamily, h1: h ? getComputedStyle(h).fontFamily : null };
  })()`;
  for (const f of pages) {
    const rel = path.relative(appDir, f).split(path.sep).join('/');
    const url = `http://127.0.0.1:${httpPort}${mount === '/' ? '' : mount}/${rel}`.replace(/\/index\.html$/, '/');
    for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
      const { result } = await send('Target.createTarget', { url: 'about:blank' });
      const sid = (await send('Target.attachToTarget', { targetId: result.targetId, flatten: true })).result.sessionId;
      logs.set(sid, []);
      await send('Runtime.enable', {}, sid); await send('Log.enable', {}, sid); await send('Page.enable', {}, sid);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile }, sid);
      await send('Page.navigate', { url }, sid);
      await sleep(3500);
      const r = (await send('Runtime.evaluate', { expression: PROBE, returnByValue: true }, sid)).result?.result?.value;
      if (r) {
        if (r.sw > r.iw + 1) add('error', 'overflow', f, `horizontal scroll at ${w} px: page ${r.sw} px wide${r.wide.length ? ' (' + r.wide.join(', ') + ')' : ''}`);
        if (w === 1440) {
          if (r.lum !== null && r.lum > 0.45) add('error', 'dark-only', f, 'light page background');
          if (!/Libre Caslon/i.test(r.body) && !usesUiCss) add('note', 'type', f, 'body text is not Libre Caslon Text (' + r.body.split(',')[0] + ')');
          if (r.h1 && !/GFS Didot/i.test(r.h1)) add('note', 'type', f, 'h1 is not GFS Didot (' + r.h1.split(',')[0] + ')');
        }
      }
      for (const l of new Set(logs.get(sid))) {
        if (/\/favicon\.ico\b/.test(l)) add('note', 'favicon', f, 'no <link rel="icon">: the browser asks for /favicon.ico (404)');
        else add('error', 'console', f, `${w} px: ${l}`);
      }
      logs.delete(sid);
      await send('Target.closeTarget', { targetId: result.targetId });
    }
  }
  await send('Browser.close');
  ws.close(); server.close();
  await sleep(800);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Edge may still hold files */ }
}
if (flag('--browser')) await browserChecks();

/* ---------- report ---------- */
const order = { error: 0, warn: 1, note: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file));
const count = l => findings.filter(x => x.level === l).length;
console.log(`xallace design check v1.0 · ${path.basename(appDir)} · ${html.length} page(s)${flag('--browser') ? ' · browser' : ''}`);
for (const x of findings) console.log(`  ${x.level.toUpperCase().padEnd(5)} [${x.rule}] ${x.file}: ${x.msg}`);
console.log(`  → ${count('error')} error(s), ${count('warn')} warning(s), ${count('note')} note(s)`);
if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify({ app: path.basename(appDir), findings }, null, 1));
process.exit(count('error') ? 1 : 0);
