// Verifies the calculation core for Plate I (Formulas, Equations & Break-Even): node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : `  (expected ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// Number formatting: decimal point, thousands grouping from 10 000 upward with thin space
check('fmt 314.16 with trailing zero option', C.fmt(314.1592, 2, { keepZeros: true }), '314.16');
check('fmt 2.5', C.fmt(2.5), '2.5');
check('fmt 120 000 grouped', C.fmt(120000, 0, { group: true }), '120 000');
check('fmt 2400 ungrouped', C.fmt(2400, 0, { group: true }), '2400');
check('fmt −120 000 with minus sign', C.fmt(-120000, 0, { group: true }), '−120 000');
check('fmt +60 000 with plus sign', C.fmt(60000, 0, { group: true, sign: true }), '+60 000');
check('fmt 0 without sign', C.fmt(0.0001, 0, { sign: true }), '0');
check('parseNum "314,16"', C.parseNum('314,16'), 314.16);
check('parseNum "24.000" (thousands dot)', C.parseNum('24.000'), 24000);
check('parseNum "24 000 €"', C.parseNum('24 000 €'), 24000);
check('parseNum "1.250,5"', C.parseNum('1.250,5'), 1250.5);
check('parseNum "0.5" (decimal point)', C.parseNum('0.5'), 0.5);
check('parseNum "−1,5"', C.parseNum('−1,5'), -1.5);
check('parseNum "abc" is NaN', Number.isNaN(C.parseNum('abc')), true);
check('niceUp 880 000 on 200 000 grid', C.niceUp(880000, C.niceStep(880000, 5)), 1000000);

// Quantity equation: turning bar Ø 125 mm at 800 1/min → vc = π · 0.125 · 800 = 314.16 m/min
const d = 125 * C.D_UNIT.mm, n = 800 * C.N_UNIT['1/min'];
check('125 mm in m', d, 0.125, 1e-12);
check('10.5 1/s in 1/min', 10.5 * C.N_UNIT['1/s'], 630, 1e-9);
const vc = C.schnittgeschwindigkeit(d, n);
check('vc turning reference', vc, 314.1593, 0.001);
check('vc formatted 314.16', C.fmt(vc, 2, { keepZeros: true }), '314.16');
check('n from vc and d', C.drehzahlAusVc(vc, d), 800, 1e-9);
check('d from vc and n', C.durchmesserAusVc(vc, n), 0.125, 1e-12);
check('Shaft d = 80 mm, vc = 140 m/min → n', C.drehzahlAusVc(140, 0.08), 557.04, 0.01);
check('Milling cutter d = 16 mm, n = 6000/min → vc', C.schnittgeschwindigkeit(0.016, 6000), 301.59, 0.01);

// Numerical-value equation: 11 kW induction motor at 1450 1/min → M = 9550 · 11 / 1450 ≈ 72.448 N·m
check('M 11 kW motor reference', C.moment(11, 1450), 72.4483, 0.001);
check('P from M and n', C.leistung(C.moment(11, 1450), 1450), 11, 1e-9);
check('n from P and M', C.drehzahlAusMoment(11, C.moment(11, 1450)), 1450, 1e-9);
check('exact factor 60 000/(2π)', C.K_EXAKT, 9549.2966, 1e-4);
check('9550 deviation in %', (C.K_CONST / C.K_EXAKT - 1) * 100, 0.0074, 0.00005);
check('M exact factor 11 kW / 1450', C.moment(11, 1450, C.K_EXAKT), 72.4429, 0.001);
check('Motor 7.5 kW, 1450/min → M', C.moment(7.5, 1450), 49.397, 0.001);
check('Shaft 350 N·m, 120/min → P', C.leistung(350, 120), 4.398, 0.001);

// Linear function: y = 0.75 x + 0.5, x = −2, 0, 2, 4 → y = −1, 0.5, 2, 3.5
[[-2, -1], [0, 0.5], [2, 2], [4, 3.5]].forEach(([x, y]) => check(`y(${x})`, C.linear(0.75, 0.5, x), y, 1e-12));
check('x-intercept y = 0.75 x + 0.5', C.nullstelle(0.75, 0.5), -2 / 3, 1e-12);
check('x-intercept at m = 0 is NaN', Number.isNaN(C.nullstelle(0, 1)), true);

// Cost and revenue: CNC housing scenario KG = 45 €/unit · M + 120 000 €, E = 95 €/unit · M
const Kf = 120000, Kv = 45, e = 95;
[[0, 120000, 0], [2400, 228000, 228000], [3600, 282000, 342000]].forEach(([M, kg, er]) => {
  check(`KG(${M})`, C.kosten(Kf, Kv, M), kg, 1e-9);
  check(`E(${M})`, C.erloes(e, M), er, 1e-9);
});
check('Break-even point CNC housing', C.gewinnschwelle(Kf, Kv, e), 2400, 1e-9);
check('Profit at 3600 units', C.gewinn(Kf, Kv, e, 3600), 60000, 1e-9);
check('Loss at 0 units', C.gewinn(Kf, Kv, e, 0), -120000, 1e-9);
check('no break-even when E/unit ≤ Kv', Number.isNaN(C.gewinnschwelle(Kf, 95, 95)), true);
check('Valve block BEP (24 000 €, 35 €, 95 €)', C.gewinnschwelle(24000, 35, 95), 400, 1e-9);
check('Valve block profit at 1000 units', C.gewinn(24000, 35, 95, 1000), 36000, 1e-9);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
