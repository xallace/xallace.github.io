import { GROUPS, TYPES, typeById, inGroup, DATUM_TEXT, PRINCIPLES, checkFrame, frameOk } from './data.js';
import { FIG } from './figures.js';
import { symbolSvg, frame, line, rect, path, text, f1 } from './svg.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v, d = 2) => v.toFixed(d);

// ---------- Tabs (1967 Technical Book-Plate Aesthetic) ----------
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

// ---------- 1 Overview ----------
$('#overview').innerHTML = GROUPS.map((g) => `
  <div class="card group-card">
    <h3>${g.name}</h3>
    <div class="symgrid">${inGroup(g.id).map((t) => `
      <button class="symcard" data-id="${t.id}" title="${esc(t.name)} in detail">
        ${symbolSvg(t.id, 38)}<span class="sname">${esc(t.name)}</span>${badge(t.groups ? { datum: g.id === 'form' ? 'nein' : 'ja' } : t)}
      </button>`).join('')}</div>
    <p class="note">${esc(g.rule)}</p>
  </div>`).join('');
$$('.symcard').forEach((b) => b.addEventListener('click', () => { location.hash = `toleranzarten/${b.dataset.id}`; }));

// ---------- 2 Tolerance types in detail ----------
let curGroup = 'form';
function renderGroup(g, focus) {
  curGroup = g;
  $$('#grp-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === g));
  const grp = GROUPS.find((x) => x.id === g);
  const list = TYPES.filter((t) => t.group === g);
  const extra = g === 'richtung' || g === 'ort'
    ? `<p class="note">With a datum, line profile and surface profile also belong to this group (see Form tolerances).</p>` : '';
  $('#types').innerHTML = `
    <div class="rulebox"><b>Key rule — ${esc(grp.name)}:</b> ${esc(grp.rule)}</div>${extra}
    <div class="tolwrap"><table class="toltable">
      <thead><tr><th>Symbol</th><th>Drawing Callout</th><th>Tolerance Zone</th><th>Deviation</th></tr></thead>
      <tbody>${list.map((t) => `
        <tr id="row-${t.id}" class="${t.id === focus ? 'focus' : ''}">
          <td class="symcell">${symbolSvg(t.id, 34)}<b>${esc(t.name)}</b>${badge(t)}</td>
          <td>${FIG[t.id].draw()}</td><td>${FIG[t.id].zone()}</td><td>${FIG[t.id].dev()}</td>
        </tr>
        <tr class="info"><td colspan="4"><dl>
          <dt>Tolerated feature</dt><dd>${esc(t.element)}</dd>
          <dt>Tolerance zone</dt><dd>${esc(t.zone)}</dd>
          <dt>Also controls</dt><dd>${esc(t.includes)}</dd>
          <dt>Inspection</dt><dd>${esc(t.check)}</dd>
          <dt>Note</dt><dd>${esc(t.note)}</dd>
        </dl></td></tr>`).join('')}</tbody>
    </table></div>`;
  if (focus) $(`#row-${focus}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function showType(id) { const t = typeById[id]; if (t) renderGroup(t.group, id); }
$('#grp-seg').innerHTML = GROUPS.map((g) => `<button data-v="${g.id}">${esc(g.name)}</button>`).join('');
$$('#grp-seg button').forEach((b) => b.addEventListener('click', () => renderGroup(b.dataset.v)));
renderGroup('form');

// ---------- 3 Read and build tolerance frames ----------
$('#b-type').innerHTML = GROUPS.map((g) => `<optgroup label="${g.name}">${TYPES.filter((t) => t.group === g.id).map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</optgroup>`).join('');
function builder() {
  const spec = { type: $('#b-type').value, dia: $('#b-dia').checked, mmr: $('#b-mmr').checked, datums: ['#b-d1', '#b-d2', '#b-d3'].map((s) => $(s).value.trim().toUpperCase()).filter(Boolean) };
  const t = typeById[spec.type], val = $('#b-val').value.trim() || '0.1';
  const fr = frame(6, 6, { s: t.id, value: val, dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  $('#b-svg').setAttribute('viewBox', `0 0 ${f1(fr.w + 12)} 34`);
  $('#b-svg').innerHTML = fr.svg;
  const res = checkFrame(spec);
  $('#b-check').innerHTML = res.map((r) => `<li class="${r.level}">${esc(r.text)}</li>`).join('');
  const roles = ['primary', 'secondary', 'tertiary'];
  const ds = spec.datums.map((d, i) => `${roles[i]} datum ${d}${d.includes('-') ? ' (common axis)' : ''}`);
  $('#b-read').innerHTML = `<p><b>${esc(t.name)}</b> (${esc(GROUPS.find((g) => g.id === t.group).name.replace(/s$/, ''))}). Tolerance value <i>t</i> = ${esc((spec.dia ? 'Ø ' : '') + val)} mm.</p>
    <p>Zone: ${esc(t.zone)}.</p>
    <p>${ds.length ? `Oriented/located relative to ${esc(ds.join(', '))}. Order in the frame defines datum precedence.` : 'No datum: the tolerance zone floats freely.'}</p>
    ${spec.mmr ? '<p>Ⓜ: When the feature of size departs from Maximum Material Size, the tolerance increases by that bonus amount (ISO 2692).</p>' : ''}`;
}
$$('#tab-rahmen input, #tab-rahmen select').forEach((el) => el.addEventListener('input', builder));
$$('#b-examples button').forEach((b) => b.addEventListener('click', () => {
  const [type, val, dia, mmr, d1, d2, d3] = b.dataset.ex.split('|');
  Object.assign($('#b-type'), { value: type }); $('#b-val').value = val; $('#b-dia').checked = dia === '1'; $('#b-mmr').checked = mmr === '1';
  $('#b-d1').value = d1 || ''; $('#b-d2').value = d2 || ''; $('#b-d3').value = d3 || ''; builder();
}));
builder();

// ---------- 4 Principles ISO 8015 ----------
$('#principles').innerHTML = PRINCIPLES.map((p) => `
  <div class="pcard"><div class="pnum">${p.n}</div><div><b>${esc(p.name)}</b><p>${esc(p.text)}</p><p class="note">In practice: ${esc(p.exam)}</p></div></div>`).join('');

function envelope() {
  const d = +$('#e-d').value, f = +$('#e-f').value, E = $('#e-E').checked;
  $('#e-d-out').textContent = `${num(d)} mm`; $('#e-f-out').textContent = `${num(f)} mm`;
  const okSize = d >= 19.9 - 1e-9 && d <= 20.0 + 1e-9, hull = d + f, okHull = hull <= 20.0 + 1e-9;
  // Drawing: shaft with bow, heavily exaggerated (1 mm ≙ 400 px transverse)
  const k = 400, r = 30 + (d - 20) * k / 2, bow = f * k, mid = 70;
  const curve = (s) => `M30 ${f1(mid + s * r)} Q120 ${f1(mid + s * r - 2 * bow)} 210 ${f1(mid + s * r)}`;
  let svg = path(curve(-1), 'part') + path(curve(1), 'part') + line(30, mid - r, 30, mid + r) + line(210, mid - r, 210, mid + r) +
    path(`M20 ${mid} Q120 ${f1(mid - 2 * bow)} 220 ${mid}`, 'center');
  // Envelope cylinder Ø20.0 sits centered at half bow; touches shaft exactly at d + f = 20.0
  const c = mid - bow / 2;
  if (E) svg += line(20, c - 30, 220, c - 30, okHull ? 'zone' : 'warnline') + line(20, c + 30, 220, c + 30, okHull ? 'zone' : 'warnline') + text(120, 18, 'Envelope Ø20.0 (Maximum Material Size)', 'zonetxt');
  svg += text(120, 140, `Two-point size ${num(d)} · Axis bow ${num(f)} · Envelope ${num(hull)}`, 'small');
  $('#e-svg').innerHTML = svg;
  const verdict = (ok, s) => `<li class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${s}</li>`;
  $('#e-res').innerHTML = verdict(okSize, `Local two-point size ${num(d)} is ${okSize ? 'within' : 'outside'} 19.90 … 20.00`) +
    (E ? verdict(okHull, `Envelope ${num(d)} + ${num(f)} = ${num(hull)} ${okHull ? '≤' : '>'} 20.00`)
      : `<li class="warn">Without Ⓔ, size does not limit axis bow. A separate straightness tolerance or general tolerance is needed.</li>`);
}
$$('#e-d, #e-f, #e-E').forEach((el) => el.addEventListener('input', envelope));
envelope();

// ---------- 5 Practice ----------
let score = { ok: 0, n: 0 }, current = null;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const others = (t, n, key = 'name') => shuffle(TYPES.filter((x) => x[key] !== t[key])).slice(0, n).map((x) => x[key]);

export function makeQuestion(kind = pick(['sym', 'datum', 'group', 'frame', 'zone'])) {
  const t = pick(TYPES);
  if (kind === 'sym') return { q: 'Which tolerance type does this symbol represent?', svg: symbolSvg(t.id, 64), choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.zone}.` };
  if (kind === 'datum') return { q: `Does ${t.name} require a datum?`, choices: ['no datum', 'datum required', 'with or without datum'], answer: DATUM_TEXT[t.datum], why: GROUPS.find((g) => g.id === t.group).rule };
  if (kind === 'group') return { q: 'Which group does this symbol belong to?', svg: symbolSvg(t.id, 64), choices: GROUPS.map((g) => g.name), answer: GROUPS.find((g) => g.id === t.group).name, why: `${t.name} belongs to ${GROUPS.find((g) => g.id === t.group).name.toLowerCase()}.` };
  if (kind === 'zone') return { q: `Which tolerance type has this zone: ${t.zone}?`, choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.element}.` };
  // Check tolerance frame validity; roughly half of the questions contain a typical error
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
  const fr = frame(4, 4, { s: t.id, value: '0.05', dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  return { q: 'Is this tolerance frame valid?', svg: `<svg class="qframe" viewBox="0 0 ${f1(fr.w + 8)} 30">${fr.svg}</svg>`, choices: ['valid', 'not valid'], answer: ok ? 'valid' : 'not valid', why: ok ? `${t.name}: formally valid.` : r.map((x) => x.text).join(' ') };
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
  $('#q-feedback').textContent = `${ok ? 'Correct.' : `Not quite: ${current.answer}.`} ${current.why}`;
  $('#q-score').textContent = `${score.ok} / ${score.n}`;
}
$('#q-next').addEventListener('click', ask);
$('#q-kind').addEventListener('change', ask);
ask();

fromHash();
