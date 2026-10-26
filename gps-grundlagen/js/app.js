import { GROUPS, TYPES, typeById, inGroup, DATUM_TEXT, PRINCIPLES, checkFrame, frameOk } from './data.js';
import { FIG } from './figures.js';
import { symbolSvg, frame, line, rect, path, text, f1 } from './svg.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v, d = 2) => v.toFixed(d).replace('.', ',');

// ---------- Design und Reiter ----------
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } }
function setTheme(dark) {
  document.body.classList.toggle('theme-blueprint', dark);
  $('#theme-label').textContent = dark ? 'Heller Modus' : 'Blueprint';
  store('gps-theme', dark ? 'dark' : 'light');
}
setTheme(store('gps-theme') !== 'light');
$('#btn-theme').addEventListener('click', () => setTheme(!document.body.classList.contains('theme-blueprint')));

function showTab(id, sub) {
  if (!$(`#tab-${id}`)) id = 'uebersicht';
  $$('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
  $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${id}`));
  if (id === 'toleranzarten' && sub) showType(sub);
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => { history.replaceState(null, '', `#${b.dataset.tab}`); showTab(b.dataset.tab); }));
const fromHash = () => { const [a, b] = location.hash.slice(1).split('/'); showTab(a || 'uebersicht', b); };
window.addEventListener('hashchange', fromHash);

const badge = (t) => `<span class="dbadge d-${t.datum}">${DATUM_TEXT[t.datum]}</span>`;

// ---------- 1 Übersicht ----------
$('#overview').innerHTML = GROUPS.map((g) => `
  <div class="card group-card">
    <h3>${g.name}</h3>
    <div class="symgrid">${inGroup(g.id).map((t) => `
      <button class="symcard" data-id="${t.id}" title="${esc(t.name)} im Detail">
        ${symbolSvg(t.id, 38)}<span class="sname">${esc(t.name)}</span>${badge(t.groups ? { datum: g.id === "form" ? "nein" : "ja" } : t)}
      </button>`).join('')}</div>
    <p class="note">${esc(g.rule)}</p>
  </div>`).join('');
$$('.symcard').forEach((b) => b.addEventListener('click', () => { location.hash = `toleranzarten/${b.dataset.id}`; }));

// ---------- 2 Toleranzarten im Detail ----------
let curGroup = 'form';
function renderGroup(g, focus) {
  curGroup = g;
  $$('#grp-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === g));
  const grp = GROUPS.find((x) => x.id === g);
  const list = TYPES.filter((t) => t.group === g);
  const extra = g === 'richtung' || g === 'ort'
    ? `<p class="note">Linien- und Flächenprofil gehören mit Bezug ebenfalls zu dieser Gruppe, siehe Formtoleranzen.</p>` : '';
  $('#types').innerHTML = `
    <div class="rulebox"><b>Merksatz ${esc(grp.name)}:</b> ${esc(grp.rule)}</div>${extra}
    <div class="tolwrap"><table class="toltable">
      <thead><tr><th>Symbol</th><th>Zeichnung</th><th>Toleranzzone</th><th>Abweichung</th></tr></thead>
      <tbody>${list.map((t) => `
        <tr id="row-${t.id}" class="${t.id === focus ? 'focus' : ''}">
          <td class="symcell">${symbolSvg(t.id, 34)}<b>${esc(t.name)}</b><span class="en">${esc(t.en)}</span>${badge(t)}</td>
          <td>${FIG[t.id].draw()}</td><td>${FIG[t.id].zone()}</td><td>${FIG[t.id].dev()}</td>
        </tr>
        <tr class="info"><td colspan="4"><dl>
          <dt>Toleriertes Element</dt><dd>${esc(t.element)}</dd>
          <dt>Toleranzzone</dt><dd>${esc(t.zone)}</dd>
          <dt>Begrenzt gleich mit</dt><dd>${esc(t.includes)}</dd>
          <dt>Prüfung</dt><dd>${esc(t.check)}</dd>
          <dt>Hinweis</dt><dd>${esc(t.note)}</dd>
        </dl></td></tr>`).join('')}</tbody>
    </table></div>`;
  if (focus) $(`#row-${focus}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function showType(id) { const t = typeById[id]; if (t) renderGroup(t.group, id); }
$('#grp-seg').innerHTML = GROUPS.map((g) => `<button data-v="${g.id}">${esc(g.name)}</button>`).join('');
$$('#grp-seg button').forEach((b) => b.addEventListener('click', () => renderGroup(b.dataset.v)));
renderGroup('form');

// ---------- 3 Toleranzrahmen lesen und bauen ----------
$('#b-type').innerHTML = GROUPS.map((g) => `<optgroup label="${g.name}">${TYPES.filter((t) => t.group === g.id).map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</optgroup>`).join('');
function builder() {
  const spec = { type: $('#b-type').value, dia: $('#b-dia').checked, mmr: $('#b-mmr').checked, datums: ['#b-d1', '#b-d2', '#b-d3'].map((s) => $(s).value.trim().toUpperCase()).filter(Boolean) };
  const t = typeById[spec.type], val = $('#b-val').value.trim() || '0,1';
  const fr = frame(6, 6, { s: t.id, value: val, dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  $('#b-svg').setAttribute('viewBox', `0 0 ${f1(fr.w + 12)} 34`);
  $('#b-svg').innerHTML = fr.svg;
  const res = checkFrame(spec);
  $('#b-check').innerHTML = res.map((r) => `<li class="${r.level}">${esc(r.text)}</li>`).join('');
  const roles = ['primärer', 'sekundärer', 'tertiärer'];
  const ds = spec.datums.map((d, i) => `${roles[i]} Bezug ${d}${d.includes('-') ? ' (gemeinsame Achse)' : ''}`);
  $('#b-read').innerHTML = `<p><b>${esc(t.name)}</b> (${GROUPS.find((g) => g.id === t.group).name.replace(/en$/, '')}). Toleranzwert t = ${esc((spec.dia ? 'Ø ' : '') + val)} mm.</p>
    <p>Die Zone: ${esc(t.zone)}.</p>
    <p>${ds.length ? `Ausgerichtet bzw. festgelegt über ${esc(ds.join(', '))}. Die Reihenfolge im Rahmen ist die Reihenfolge beim Ausrichten.` : 'Ohne Bezug: die Zone darf beliebig liegen.'}</p>
    ${spec.mmr ? '<p>Ⓜ: Weicht das Maßelement vom Maximum-Material-Maß ab, wird die Toleranz um diesen Betrag größer (ISO 2692).</p>' : ''}`;
}
$$('#tab-rahmen input, #tab-rahmen select').forEach((el) => el.addEventListener('input', builder));
$$('#b-examples button').forEach((b) => b.addEventListener('click', () => {
  const [type, val, dia, mmr, d1, d2, d3] = b.dataset.ex.split('|');
  Object.assign($('#b-type'), { value: type }); $('#b-val').value = val; $('#b-dia').checked = dia === '1'; $('#b-mmr').checked = mmr === '1';
  $('#b-d1').value = d1 || ''; $('#b-d2').value = d2 || ''; $('#b-d3').value = d3 || ''; builder();
}));
builder();

// ---------- 4 Grundsätze ISO 8015 ----------
$('#principles').innerHTML = PRINCIPLES.map((p) => `
  <div class="pcard"><div class="pnum">${p.n}</div><div><b>${esc(p.name)}</b><p>${esc(p.text)}</p><p class="note">Praxis: ${esc(p.exam)}</p></div></div>`).join('');

function envelope() {
  const d = +$('#e-d').value, f = +$('#e-f').value, E = $('#e-E').checked;
  $('#e-d-out').textContent = `${num(d)} mm`; $('#e-f-out').textContent = `${num(f)} mm`;
  const okSize = d >= 19.9 - 1e-9 && d <= 20.0 + 1e-9, hull = d + f, okHull = hull <= 20.0 + 1e-9;
  // Zeichnung: Welle mit Durchbiegung, stark überhöht (1 mm ≙ 400 px quer)
  const k = 400, r = 30 + (d - 20) * k / 2, bow = f * k, mid = 70;
  const curve = (s) => `M30 ${f1(mid + s * r)} Q120 ${f1(mid + s * r - 2 * bow)} 210 ${f1(mid + s * r)}`;
  let svg = path(curve(-1), 'part') + path(curve(1), 'part') + line(30, mid - r, 30, mid + r) + line(210, mid - r, 210, mid + r) +
    path(`M20 ${mid} Q120 ${f1(mid - 2 * bow)} 220 ${mid}`, 'center');
  // Hüllzylinder Ø20,0 liegt mittig zur halben Durchbiegung; berührt die Welle genau bei d + f = 20,0
  const c = mid - bow / 2;
  if (E) svg += line(20, c - 30, 220, c - 30, okHull ? 'zone' : 'warnline') + line(20, c + 30, 220, c + 30, okHull ? 'zone' : 'warnline') + text(120, 18, 'Hülle Ø20,0 (Maximum-Material-Maß)', 'zonetxt');
  svg += text(120, 140, `Zweipunktmaß ${num(d)} · Krümmung ${num(f)} · Hülle ${num(hull)}`, 'small');
  $('#e-svg').innerHTML = svg;
  const verdict = (ok, s) => `<li class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${s}</li>`;
  $('#e-res').innerHTML = verdict(okSize, `Örtliches Zweipunktmaß ${num(d)} liegt ${okSize ? 'in' : 'außerhalb'} 19,90 … 20,00`) +
    (E ? verdict(okHull, `Hülle ${num(d)} + ${num(f)} = ${num(hull)} ${okHull ? '≤' : '>'} 20,00`)
      : `<li class="warn">Ohne Ⓔ begrenzt das Maß die Krümmung nicht. Dafür braucht es eine eigene Geradheitstoleranz oder die Allgemeintoleranz.</li>`);
}
$$('#e-d, #e-f, #e-E').forEach((el) => el.addEventListener('input', envelope));
envelope();

// ---------- 5 Übung ----------
let score = { ok: 0, n: 0 }, current = null;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const others = (t, n, key = 'name') => shuffle(TYPES.filter((x) => x[key] !== t[key])).slice(0, n).map((x) => x[key]);

export function makeQuestion(kind = pick(['sym', 'datum', 'group', 'frame', 'zone'])) {
  const t = pick(TYPES);
  if (kind === 'sym') return { q: 'Welche Toleranzart hat dieses Symbol?', svg: symbolSvg(t.id, 64), choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.zone}.` };
  if (kind === 'datum') return { q: `Braucht ${t.name} einen Bezug?`, choices: ['kein Bezug', 'Bezug erforderlich', 'mit oder ohne Bezug'], answer: DATUM_TEXT[t.datum], why: GROUPS.find((g) => g.id === t.group).rule };
  if (kind === 'group') return { q: 'Zu welcher Gruppe gehört dieses Symbol?', svg: symbolSvg(t.id, 64), choices: GROUPS.map((g) => g.name), answer: GROUPS.find((g) => g.id === t.group).name, why: `${t.name} ist eine ${GROUPS.find((g) => g.id === t.group).name.replace(/en$/, '')}.` };
  if (kind === 'zone') return { q: `Welche Toleranzart hat diese Zone: ${t.zone}?`, choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.element}.` };
  // Toleranzrahmen auf Zulässigkeit prüfen; die Hälfte der Aufgaben enthält einen typischen Fehler
  const bad = Math.random() < 0.55;
  let spec = { type: t.id, dia: t.dia && Math.random() < 0.5, mmr: false, datums: t.datum === 'nein' ? [] : ['A', 'B'].slice(0, t.datum === 'optional' ? Math.round(Math.random()) : 1) };
  if (['lauf', 'gesamt'].includes(t.id)) spec.datums = ['A-B'];
  if (bad) {
    const errs = [];
    if (t.datum === 'nein') errs.push({ datums: ['A'] });
    if (t.datum === 'ja') errs.push({ datums: [] });
    if (!t.dia) errs.push({ dia: true });
    if (!t.mmr) errs.push({ mmr: true });
    errs.push({ datums: [pick(['I', 'O', 'Q'])] });
    spec = { ...spec, ...pick(errs) };
  }
  const ok = frameOk(spec), r = checkFrame(spec).filter((x) => x.level === 'bad');
  const fr = frame(4, 4, { s: t.id, value: '0,05', dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  return { q: 'Ist dieser Toleranzrahmen zulässig?', svg: `<svg class="qframe" viewBox="0 0 ${f1(fr.w + 8)} 30">${fr.svg}</svg>`, choices: ['zulässig', 'nicht zulässig'], answer: ok ? 'zulässig' : 'nicht zulässig', why: ok ? `${t.name}: formal zulässig.` : r.map((x) => x.text).join(' ') };
}

function ask() {
  current = makeQuestion($('#q-kind').value || undefined);
  $('#q-text').textContent = current.q;
  $('#q-svg').innerHTML = current.svg || '';
  $('#q-feedback').textContent = ''; $('#q-feedback').className = 'feedback';
  $('#q-choices').innerHTML = current.choices.map((c) => `<button class="btn ghost choice">${esc(c)}</button>`).join('');
  $$('#q-choices .choice').forEach((b) => b.addEventListener('click', () => answer(b)));
}
function answer(b) {
  if (!current || current.done) return;
  current.done = true; score.n++;
  const ok = b.textContent === current.answer;
  if (ok) score.ok++;
  $$('#q-choices .choice').forEach((x) => { x.disabled = true; if (x.textContent === current.answer) x.classList.add('right'); });
  if (!ok) b.classList.add('wrong');
  $('#q-feedback').className = `feedback ${ok ? 'ok' : 'bad'}`;
  $('#q-feedback').textContent = `${ok ? 'Richtig.' : `Nicht ganz: ${current.answer}.`} ${current.why}`;
  $('#q-score').textContent = `${score.ok} / ${score.n}`;
}
$('#q-next').addEventListener('click', ask);
$('#q-kind').addEventListener('change', ask);
ask();

fromHash();
