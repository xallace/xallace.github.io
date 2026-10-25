// Prüft den Rechenkern gegen die Werte von Tabellenbuch Metall S. 14: node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FEHL'} ${name}: ${got}${ok ? '' : `  (erwartet ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// Zahlenformat wie im Buch: Dezimalkomma, Tausender ab 10 000 mit schmalem Leerzeichen
check('fmt 395,84 mit Nullen', C.fmt(395.8406, 2, { keepZeros: true }), '395,84');
check('fmt 2,5', C.fmt(2.5), '2,5');
check('fmt 200 000 gruppiert', C.fmt(200000, 0, { group: true }), '200 000');
check('fmt 4000 ungruppiert', C.fmt(4000, 0, { group: true }), '4000');
check('fmt −200 000 mit Minuszeichen', C.fmt(-200000, 0, { group: true }), '−200 000');
check('fmt +100 000 mit Vorzeichen', C.fmt(100000, 0, { group: true, sign: true }), '+100 000');
check('fmt 0 ohne Vorzeichen', C.fmt(0.0001, 0, { sign: true }), '0');
check('parseNum „395,84“', C.parseNum('395,84'), 395.84);
check('parseNum „24.000“ (Tausenderpunkt)', C.parseNum('24.000'), 24000);
check('parseNum „24 000 €“', C.parseNum('24 000 €'), 24000);
check('parseNum „1.250,5“', C.parseNum('1.250,5'), 1250.5);
check('parseNum „0.5“ (Dezimalpunkt)', C.parseNum('0.5'), 0.5);
check('parseNum „−1,5“', C.parseNum('−1,5'), -1.5);
check('parseNum „abc“ ist NaN', Number.isNaN(C.parseNum('abc')), true);
check('niceUp 880 000 auf 200 000er-Teilung', C.niceUp(880000, C.niceStep(880000, 5)), 1000000);

// Formeln: Buchbeispiel vc = π · 200 mm · 1 m/1000 mm · 630 1/min = 395,84 m/min
const d = 200 * C.D_UNIT.mm, n = 630 * C.N_UNIT['1/min'];
check('200 mm in m', d, 0.2, 1e-12);
check('10,5 1/s in 1/min', 10.5 * C.N_UNIT['1/s'], 630, 1e-9);
const vc = C.schnittgeschwindigkeit(d, n);
check('vc Buchbeispiel', vc, 395.84, 0.005);
check('vc Buchbeispiel gerundet', C.fmt(vc, 2, { keepZeros: true }), '395,84');
check('n aus vc und d', C.drehzahlAusVc(vc, d), 630, 1e-9);
check('d aus vc und n', C.durchmesserAusVc(vc, n), 0.2, 1e-12);
check('Welle d = 80 mm, vc = 140 m/min → n', C.drehzahlAusVc(140, 0.08), 557.04, 0.01);
check('Fräser d = 16 mm, n = 6000/min → vc', C.schnittgeschwindigkeit(0.016, 6000), 301.59, 0.01);

// Zahlenwertgleichung: Buchbeispiel M = 9550 · 15 / 750 N·m = 191 N·m
check('M Buchbeispiel', C.moment(15, 750), 191, 1e-9);
check('P aus M und n', C.leistung(191, 750), 15, 1e-9);
check('n aus P und M', C.drehzahlAusMoment(15, 191), 750, 1e-9);
check('exakter Faktor 60 000/(2π)', C.K_EXAKT, 9549.2966, 1e-4);
check('Abweichung 9550 in %', (C.K_BUCH / C.K_EXAKT - 1) * 100, 0.0074, 0.00005);
check('M exakt Buchbeispiel', C.moment(15, 750, C.K_EXAKT), 190.986, 0.001);
check('Motor 7,5 kW, 1450/min → M', C.moment(7.5, 1450), 49.397, 0.001);
check('Welle 350 N·m, 120/min → P', C.leistung(350, 120), 4.398, 0.001);

// Lineare Funktion: 1. Beispiel y = 0,5 x + 1, Wertetabelle x = −2, 0, 2, 3 → y = 0, 1, 2, 2,5
[[-2, 0], [0, 1], [2, 2], [3, 2.5]].forEach(([x, y]) => check(`y(${x})`, C.linear(0.5, 1, x), y, 1e-12));
check('Nullstelle y = 0,5 x + 1', C.nullstelle(0.5, 1), -2, 1e-12);
check('Nullstelle bei m = 0 ist NaN', Number.isNaN(C.nullstelle(0, 1)), true);

// Kosten und Erlös: 2. Beispiel KG = 60 €/Stck · M + 200 000 €, E = 110 €/Stck · M
const Kf = 200000, Kv = 60, e = 110;
[[0, 200000, 0], [4000, 440000, 440000], [6000, 560000, 660000]].forEach(([M, kg, er]) => {
  check(`KG(${M})`, C.kosten(Kf, Kv, M), kg, 1e-9);
  check(`E(${M})`, C.erloes(e, M), er, 1e-9);
});
check('Gewinnschwelle Buchbeispiel', C.gewinnschwelle(Kf, Kv, e), 4000, 1e-9);
check('Gewinn bei 6000 Stück', C.gewinn(Kf, Kv, e, 6000), 100000, 1e-9);
check('Verlust bei 0 Stück', C.gewinn(Kf, Kv, e, 0), -200000, 1e-9);
check('keine Gewinnschwelle bei E/Stück ≤ Kv', Number.isNaN(C.gewinnschwelle(Kf, 110, 110)), true);
check('Ventilblock Gs (24 000 €, 35 €, 95 €)', C.gewinnschwelle(24000, 35, 95), 400, 1e-9);
check('Ventilblock Gewinn bei 1000 Stück', C.gewinn(24000, 35, 95, 1000), 36000, 1e-9);

console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
