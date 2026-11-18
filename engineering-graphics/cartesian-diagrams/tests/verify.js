// Verifies the calculation core for Plate II (Cartesian Diagrams & Scales): node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : `  (expected ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// Number formatting
check('fmt 2.5', C.fmt(2.5), '2.5');
check('fmt -3 with minus sign', C.fmt(-3), '−3');
check('fmt -0.001 gives 0', C.fmt(-0.001), '0');
check('fmt without minus (error demo)', C.fmt(-0.3, 1, { noMinus: true }), '0.3');
check('fmt 100000 grouped', C.fmt(100000, 0, { group: true }), '100 000');
check('fmt 1400 ungrouped', C.fmt(1400, 0, { group: true }), '1400');
check('parseNum "−1,5"', C.parseNum('−1,5'), -1.5);
check('parseNum "abc" is NaN', Number.isNaN(C.parseNum('abc')), true);

// Point notations (P1(2.5; 2), P2(−3; −1.5))
const pt = s => { const r = C.parsePoint(s); return r.error ? 'Error' : `${r.name}:${r.x};${r.y}`; };
check('parse P1(2,5; 2)', pt('P1(2,5; 2)'), 'P1:2.5;2');
check('parse P1(2,5|2)', pt('P1(2,5|2)'), 'P1:2.5;2');
check('parse P1(2,5, 2)', pt('P1(2,5, 2)'), 'P1:2.5;2');
check('parse P2(−3; −1.5)', pt('P2(−3; −1.5)'), 'P2:-3;-1.5');
check('parse P2(-3, -1.5)', pt('P2(-3, -1.5)'), 'P2:-3;-1.5');
check('parse (2,3) as pair', pt('(2,3)'), ':2;3');
check('parse P(1,5,2) ambiguous', pt('P(1,5,2)'), 'Error');
check('pointText semi', C.pointText('P', 2.5, 2, 'semi'), 'P(2.5; 2)');
check('pointText bar', C.pointText('P', -3, -1.5, 'bar'), 'P(−3 | −1.5)');
check('pointText comma', C.pointText('P', 2.5, 2, 'comma'), 'P(2.5, 2)');
check('Quadrant P1', C.quadrant(2.5, 2), 'Quadrant I');
check('Quadrant P2', C.quadrant(-3, -1.5), 'Quadrant III');

// Scales and ticks
check('niceStep 1.6 mm', C.niceStep(1.6, 7), 0.2, 1e-12);
check('niceStep 1820 N', C.niceStep(1820, 7), 200, 1e-9);
check('decimalsFor 0.25', C.decimalsFor(0.25), 2);
check('ticks −0.4 … 0.4', C.ticks(-0.4, 0.4, 0.1).join(' '), '-0.4 -0.3 -0.2 -0.1 0 0.1 0.2 0.3 0.4');
check('logTicks decades 1 … 1000', C.logTicks(1, 1000).major.join(' '), '1 10 100 1000');
check('logTicks minor subdivisions', C.logTicks(1, 1000).minor.length, 24);
const ls = C.logScale(1, 1000, 0, 300);
check('logScale 10 lies at 1/3', ls(10), 100, 1e-9);
check('logScale inverse', ls.inv(200), 100, 1e-9);

// Disc-spring characteristic (reference curve s=[0,0.4,0.8,1.2,1.6], F=[0,720,1280,1640,1820])
const s = [0, 0.4, 0.8, 1.2, 1.6], F = [0, 720, 1280, 1640, 1820];
const lin = C.linear(s, F), pc = C.pchip(s, F);
check('Polyline F(1.0)', lin(1.0), 1460, 1e-9);
check('Smooth (PCHIP) F(1.0) between 1460 and 1500 N', pc(1.0) > 1460 && pc(1.0) < 1500, true);
for (let i = 0; i < s.length; i++) check(`PCHIP through data point ${i}`, pc(s[i]), F[i], 1e-9);
let mono = true;
for (let x = 0; x < 1.6; x += 0.001) if (pc(x + 0.001) < pc(x)) mono = false;
check('PCHIP monotonically increasing', mono, true);
const h = 1e-6;
check('PCHIP derivative numerical', pc.deriv(1.0), (pc(1.0 + h) - pc(1.0 - h)) / (2 * h), 1e-3);
check('Inverse s(pc(1.0))', C.invert(pc, pc(1.0), 0, 1.6), 1.0, 1e-9);
check('Inverse out of bounds is NaN', Number.isNaN(C.invert(pc, 2000, 0, 1.6)), true);

// Rotational speed n = vc / (π · d)
check('n at vc = 100 m/min, d = 20 mm', C.drehzahl(100, 20), 1591.55, 0.01);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
