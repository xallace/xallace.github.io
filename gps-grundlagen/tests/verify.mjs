// Prüft Daten, Regeln und Zeichnungen ohne Browser: node tests/verify.mjs [--sheet out.svg]
import { writeFileSync, readFileSync } from 'node:fs';
import { TYPES, GROUPS, PRINCIPLES, checkFrame, frameOk, typeById, inGroup } from '../js/data.js';
import { FIG } from '../js/figures.js';
import { symbolIds, frame } from '../js/svg.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FEHLER:', msg); } };

// Wohlgeformtheit: jedes geöffnete Element wird geschlossen, keine NaN/undefined in Attributen
function wellFormed(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, close, tag, , self] = m;
    if (self) continue;
    if (close) { if (stack.pop() !== tag) return false; } else stack.push(tag);
  }
  return stack.length === 0;
}

// Daten
ok(TYPES.length === 14, `14 Toleranzarten erwartet, ${TYPES.length} gefunden`);
ok(new Set(TYPES.map((t) => t.id)).size === 14, 'IDs eindeutig');
ok(GROUPS.length === 4, 'vier Gruppen');
ok(PRINCIPLES.length === 13 && PRINCIPLES.every((p, i) => p.n === `5.${i + 1}`), '13 Grundsätze 5.1 … 5.13 in Reihenfolge');
ok(TYPES.every((t) => symbolIds.includes(t.id)), 'jede Toleranzart hat ein Symbol');
const count = Object.fromEntries(GROUPS.map((g) => [g.id, TYPES.filter((t) => t.group === g.id).length]));
ok(count.form === 6 && count.richtung === 3 && count.ort === 3 && count.lauf === 2, `Gruppengrößen 6/3/3/2 (Profile unter Form): ${JSON.stringify(count)}`);
ok(inGroup('richtung').length === 5 && inGroup('ort').length === 5, 'Profile erscheinen zusätzlich bei Richtung und Ort');
ok(TYPES.filter((t) => t.group === 'form' && t.datum === 'ja').length === 0, 'keine Formtoleranz verlangt einen Bezug');
ok(TYPES.filter((t) => ['richtung', 'lauf'].includes(t.group)).every((t) => t.datum === 'ja'), 'Richtung und Lauf verlangen Bezug');

// Regeln für den Toleranzrahmen
const bad = (spec, msg) => ok(!frameOk(spec), `unzulässig erwartet: ${msg}`);
const good = (spec, msg) => ok(frameOk(spec), `zulässig erwartet: ${msg} → ${checkFrame(spec).map((r) => r.text).join(' ')}`);
bad({ type: 'eben', datums: ['A'] }, 'Ebenheit mit Bezug');
bad({ type: 'para', datums: [] }, 'Parallelität ohne Bezug');
bad({ type: 'lauf', datums: [] }, 'Rundlauf ohne Bezug');
bad({ type: 'eben', dia: true }, 'Ebenheit mit Ø');
bad({ type: 'lauf', mmr: true, datums: ['A-B'] }, 'Rundlauf mit Ⓜ');
bad({ type: 'pos', dia: true, datums: ['A', 'O'] }, 'Bezugsbuchstabe O');
bad({ type: 'pos', dia: true, datums: ['A', 'A'] }, 'doppelter Bezug');
bad({ type: 'pos', dia: true, datums: ['A', 'B', 'C', 'D'] }, 'vier Bezüge');
good({ type: 'pos', dia: true, mmr: true, datums: ['A', 'B', 'C'] }, 'Position Ø Ⓜ A|B|C');
good({ type: 'gerad', dia: true }, 'Geradheit der Achse');
good({ type: 'lauf', datums: ['A-B'] }, 'Rundlauf A-B');
good({ type: 'flaeche' }, 'Flächenprofil ohne Bezug');
good({ type: 'flaeche', datums: ['A', 'B', 'C'] }, 'Flächenprofil mit Bezugssystem');
good({ type: 'pos', dia: true }, 'Position ohne Bezug (Lochbild) nur Warnung');

// Zeichnungen
let sheet = '';
TYPES.forEach((t, i) => {
  for (const k of ['draw', 'zone', 'dev']) {
    const svg = FIG[t.id]?.[k]?.();
    ok(typeof svg === 'string' && svg.startsWith('<svg'), `${t.id}.${k} liefert SVG`);
    ok(!/NaN|undefined|Infinity/.test(svg), `${t.id}.${k} ohne NaN/undefined`);
    ok(wellFormed(svg), `${t.id}.${k} wohlgeformt`);
    sheet += `<g transform="translate(${['draw', 'zone', 'dev'].indexOf(k) * 250 + 90} ${i * 160})">${svg.replace('<svg class="fig"', '<svg class="fig" width="240" height="150"')}</g>`;
  }
  sheet += `<text x="4" y="${i * 160 + 70}" style="font:bold 11px sans-serif">${t.name}</text>`;
});
const fr = frame(0, 0, { s: 'pos', value: '0,1', dia: true, mods: ['Ⓜ'], datums: ['A', 'B', 'C'] });
ok(fr.w > 100 && wellFormed(fr.svg), 'Toleranzrahmen mit 5 Feldern');

// Vorschaubogen (helles Design) für die Sichtprüfung
const out = process.argv.indexOf('--sheet');
if (out > 0) {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const vars = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')) + 1);
  const rules = css.slice(css.indexOf('.fig {')).replace(/body\.theme-blueprint[^}]*}/g, '');
  writeFileSync(process.argv[out + 1], `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="${TYPES.length * 160}"><style>${vars}${rules} .sym path,.sym circle{fill:none;stroke:#111;stroke-width:1.25}</style><rect width="100%" height="100%" fill="#fff"/>${sheet}</svg>`);
}

console.log(`${pass} Prüfungen bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
