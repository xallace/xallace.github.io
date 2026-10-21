// Prüft den Rechenkern gegen die Werte von Tabellenbuch Metall S. 58: node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FEHL'} ${name}: ${got}${ok ? '' : `  (erwartet ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// Zahlenformat
check('fmt 3.5', C.fmt(3.5), '3,5');
check('fmt -2 mit Minuszeichen', C.fmt(-2), '−2');
check('fmt -0.001 ergibt 0', C.fmt(-0.001), '0');
check('fmt ohne Minus (Fehlerbild)', C.fmt(-0.3, 1, { noMinus: true }), '0,3');
check('fmt 100000 gruppiert', C.fmt(100000, 0, { group: true }), '100 000');
check('fmt 1400 ungruppiert', C.fmt(1400, 0, { group: true }), '1400');
check('parseNum „−1,5“', C.parseNum('−1,5'), -1.5);
check('parseNum „abc“ ist NaN', Number.isNaN(C.parseNum('abc')), true);

// Schreibweisen der Punkte (Buch: P1(3,5; 1,5), P1(3,5 | 1,5), P1(3,5, 1,5); P2(−2; −1) …)
const pt = s => { const r = C.parsePoint(s); return r.error ? 'Fehler' : `${r.name}:${r.x};${r.y}`; };
check('parse P1(3,5; 1,5)', pt('P1(3,5; 1,5)'), 'P1:3.5;1.5');
check('parse P1(3,5|1,5)', pt('P1(3,5|1,5)'), 'P1:3.5;1.5');
check('parse P1(3,5, 1,5)', pt('P1(3,5, 1,5)'), 'P1:3.5;1.5');
check('parse P2(−2; −1)', pt('P2(−2; −1)'), 'P2:-2;-1');
check('parse P2(-2, -1)', pt('P2(-2, -1)'), 'P2:-2;-1');
check('parse (2,3) als Paar', pt('(2,3)'), ':2;3');
check('parse P(1,5,2) mehrdeutig', pt('P(1,5,2)'), 'Fehler');
check('pointText semi', C.pointText('P', 3.5, 1.5, 'semi'), 'P(3,5; 1,5)');
check('pointText bar', C.pointText('P', -2, -1, 'bar'), 'P(−2 | −1)');
check('pointText comma', C.pointText('P', 3.5, 1.5, 'comma'), 'P(3,5, 1,5)');
check('Quadrant P1', C.quadrant(3.5, 1.5), 'I. Quadrant');
check('Quadrant P2', C.quadrant(-2, -1), 'III. Quadrant');

// Skalen und Teilung
check('niceStep 1,3 mm', C.niceStep(1.3, 7), 0.2, 1e-12);
check('niceStep 1400 N', C.niceStep(1400, 7), 200, 1e-9);
check('decimalsFor 0,25', C.decimalsFor(0.25), 2);
check('ticks −0,4 … 0,4', C.ticks(-0.4, 0.4, 0.1).join(' '), '-0.4 -0.3 -0.2 -0.1 0 0.1 0.2 0.3 0.4');
check('logTicks Dekaden 1 … 1000', C.logTicks(1, 1000).major.join(' '), '1 10 100 1000');
check('logTicks Zwischenteilung', C.logTicks(1, 1000).minor.length, 24);
const ls = C.logScale(1, 1000, 0, 300);
check('logScale 10 liegt bei 1/3', ls(10), 100, 1e-9);
check('logScale Umkehrung', ls.inv(200), 100, 1e-9);

// Federkennlinie Tellerfeder (Buch: s = 0,9 mm → F ≈ 1250 N)
const s = [0, 0.3, 0.6, 1.0, 1.3], F = [0, 600, 1000, 1300, 1400];
const lin = C.linear(s, F), pc = C.pchip(s, F);
check('Polygonzug F(0,9)', lin(0.9), 1225, 1e-9);
check('glatt (PCHIP) F(0,9)', pc(0.9), 1245.9, 0.05);
check('glatt gerundet auf 10 N = Buchwert', Math.round(pc(0.9) / 10) * 10, 1250);
for (let i = 0; i < s.length; i++) check(`PCHIP durch Messpunkt ${i}`, pc(s[i]), F[i], 1e-9);
let mono = true;
for (let x = 0; x < 1.3; x += 0.001) if (pc(x + 0.001) < pc(x)) mono = false;
check('PCHIP monoton steigend', mono, true);
const h = 1e-6;
check('PCHIP Ableitung numerisch', pc.deriv(0.9), (pc(0.9 + h) - pc(0.9 - h)) / (2 * h), 1e-3);
check('Umkehrung s(1245,9 N)', C.invert(pc, pc(0.9), 0, 1.3), 0.9, 1e-9);
check('Umkehrung außerhalb ist NaN', Number.isNaN(C.invert(pc, 1500, 0, 1.3)), true);

// Drehzahl n = vc / (π · d)
check('n bei vc = 100 m/min, d = 20 mm', C.drehzahl(100, 20), 1591.55, 0.01);

console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
