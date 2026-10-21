/* Prüft die Rechenkerne gegen Zahlenwerte aus Mitschke/Wallentowitz, Dynamik der Kraftfahrzeuge, 5. Aufl.
   Aufruf:  node tests/verify.js
   Die Prüfliste steht in js/engine/pruefung.js und erscheint auch im Reiter „Prüfung“ der App. */
'use strict';
const path = require('path');
for (const f of ['core', 'data', 'reifen', 'laengs', 'bremsung', 'schwingung', 'einspur', 'pruefung']) {
  require(path.join(__dirname, '..', 'js', 'engine', f + '.js'));
}
const rows = globalThis.KfzDyn.pruefung.run();
const p = (v) => Number(v).toPrecision(4).padStart(10);
let fails = 0, oks = 0, infos = 0;
for (const r of rows) {
  if (r.kind === 'sect') { console.log('\n— ' + r.label); continue; }
  if (r.kind === 'info') {
    infos++;
    const dev = (r.got - r.want) / r.want * 100;
    console.log(`info  ${r.label.padEnd(44)} ${p(r.got)}  Buch ${p(r.want)}  (${dev > 0 ? '+' : ''}${dev.toFixed(1)} %, ${r.ref})`);
    continue;
  }
  if (r.ok) oks++; else fails++;
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.label.padEnd(44)} ${p(r.got)}  Buch ${p(r.want)}  (±${+(r.tol * 100).toFixed(1)} %, ${r.ref})`);
}
console.log(`\n${oks} bestanden, ${fails} fehlgeschlagen, ${infos} bekannte Abweichungen.`);
process.exitCode = fails === 0 ? 0 : 1;
