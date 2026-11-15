// Validates data, rules, and drawings without a browser: node tests/verify.mjs [--sheet out.svg]
import { writeFileSync, readFileSync } from 'node:fs';
import { TYPES, GROUPS, PRINCIPLES, checkFrame, frameOk, typeById, inGroup } from '../js/data.js';
import { FIG } from '../js/figures.js';
import { symbolIds, frame } from '../js/svg.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL:', msg); } };

// Well-formedness: every opened element is closed, no NaN/undefined in attributes
function wellFormed(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, close, tag, , self] = m;
    if (self) continue;
    if (close) { if (stack.pop() !== tag) return false; } else stack.push(tag);
  }
  return stack.length === 0;
}

// Data
ok(TYPES.length === 14, `expected 14 tolerance types, found ${TYPES.length}`);
ok(new Set(TYPES.map((t) => t.id)).size === 14, 'unique IDs');
ok(GROUPS.length === 4, 'four groups');
ok(PRINCIPLES.length === 13 && PRINCIPLES.every((p, i) => p.n === `5.${i + 1}`), '13 principles 5.1 … 5.13 in order');
ok(TYPES.every((t) => symbolIds.includes(t.id)), 'every tolerance type has a symbol');
const count = Object.fromEntries(GROUPS.map((g) => [g.id, TYPES.filter((t) => t.group === g.id).length]));
ok(count.form === 6 && count.richtung === 3 && count.ort === 3 && count.lauf === 2, `group sizes 6/3/3/2 (profiles under form): ${JSON.stringify(count)}`);
ok(inGroup('richtung').length === 5 && inGroup('ort').length === 5, 'profiles also appear under orientation and location');
ok(TYPES.filter((t) => t.group === 'form' && t.datum === 'ja').length === 0, 'no form tolerance requires a datum');
ok(TYPES.filter((t) => ['richtung', 'lauf'].includes(t.group)).every((t) => t.datum === 'ja'), 'orientation and run-out require a datum');

// Tolerance frame rules
const bad = (spec, msg) => ok(!frameOk(spec), `expected invalid: ${msg}`);
const good = (spec, msg) => ok(frameOk(spec), `expected valid: ${msg} → ${checkFrame(spec).map((r) => r.text).join(' ')}`);
bad({ type: 'eben', datums: ['A'] }, 'flatness with datum');
bad({ type: 'para', datums: [] }, 'parallelism without datum');
bad({ type: 'lauf', datums: [] }, 'circular run-out without datum');
bad({ type: 'eben', dia: true }, 'flatness with Ø');
bad({ type: 'lauf', mmr: true, datums: ['A-B'] }, 'circular run-out with Ⓜ');
bad({ type: 'pos', dia: true, datums: ['A', 'O'] }, 'datum letter O');
bad({ type: 'pos', dia: true, datums: ['A', 'A'] }, 'duplicate datum');
bad({ type: 'pos', dia: true, datums: ['A', 'B', 'C', 'D'] }, 'four datums');
good({ type: 'pos', dia: true, mmr: true, datums: ['A', 'B', 'C'] }, 'Position Ø Ⓜ A|B|C');
good({ type: 'gerad', dia: true }, 'straightness of an axis');
good({ type: 'lauf', datums: ['A-B'] }, 'Circular run-out A-B');
good({ type: 'flaeche' }, 'surface profile without datum');
good({ type: 'flaeche', datums: ['A', 'B', 'C'] }, 'surface profile with datum system');
good({ type: 'pos', dia: true }, 'position without datum (hole pattern) warning only');

// Drawings
let sheet = '';
TYPES.forEach((t, i) => {
  for (const k of ['draw', 'zone', 'dev']) {
    const svg = FIG[t.id]?.[k]?.();
    ok(typeof svg === 'string' && svg.startsWith('<svg'), `${t.id}.${k} returns SVG`);
    ok(!/NaN|undefined|Infinity/.test(svg), `${t.id}.${k} without NaN/undefined`);
    ok(wellFormed(svg), `${t.id}.${k} well-formed`);
    sheet += `<g transform="translate(${['draw', 'zone', 'dev'].indexOf(k) * 250 + 90} ${i * 160})">${svg.replace('<svg class="fig"', '<svg class="fig" width="240" height="150"')}</g>`;
  }
  sheet += `<text x="4" y="${i * 160 + 70}" style="font:bold 11px sans-serif">${t.name}</text>`;
});
const fr = frame(0, 0, { s: 'pos', value: '0.1', dia: true, mods: ['Ⓜ'], datums: ['A', 'B', 'C'] });
ok(fr.w > 100 && wellFormed(fr.svg), 'tolerance frame with 5 compartments');

// Preview sheet (light theme) for visual inspection
const out = process.argv.indexOf('--sheet');
if (out > 0) {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const vars = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')) + 1);
  const rules = css.slice(css.indexOf('.fig {')).replace(/body\.theme-blueprint[^}]*}/g, '');
  writeFileSync(process.argv[out + 1], `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="${TYPES.length * 160}"><style>${vars}${rules} .sym path,.sym circle{fill:none;stroke:#111;stroke-width:1.25}</style><rect width="100%" height="100%" fill="#fff"/>${sheet}</svg>`);
}

console.log(`${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
