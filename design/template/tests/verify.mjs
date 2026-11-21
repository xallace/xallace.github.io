/* Model checks for the template app. Run: node tests/verify.mjs
   Test the app's own formulas against hand-calculated values. If the app shows a standard,
   say in the footer that these checks are not a conformity test against that standard. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const M = require(path.resolve(here, '..', 'model.js'));

let passed = 0;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
function check(name, fn) { fn(); passed++; console.log(`  [PASS] ${name}`); }

check('chord of a hexagon equals the radius: D=100, n=6 → s=50', () => {
  assert.ok(near(M.chord(100, 6), 50));
});
check('chord for n=4: s = D/√2', () => {
  assert.ok(near(M.chord(80, 4), 80 / Math.SQRT2));
});
check('first hole sits at the start angle on the pitch radius', () => {
  const c = M.holeCentres(120, 8, 0);
  assert.equal(c.length, 8);
  assert.ok(near(c[0].x, 60) && near(c[0].y, 0));
  assert.ok(near(c[2].x, 0, 1e-9) && near(c[2].y, 60));
});
check('all centres lie on the pitch circle', () => {
  for (const p of M.holeCentres(73.5, 7, 15)) assert.ok(near(Math.hypot(p.x, p.y), 73.5 / 2, 1e-9));
});
check('ligament and edge: D=100, n=6, d=20, Da=140 → 30 mm and 10 mm, both clear', () => {
  const r = M.evaluate({ D: 100, n: 6, d: 20, Da: 140, startDeg: 0 });
  assert.ok(near(r.ligament, 30) && near(r.edge, 10));
  assert.equal(r.holesClear, true);
  assert.equal(r.edgeClear, true);
});
check('overlapping holes are flagged: D=40, n=12, d=12 → s≈10.35 < d', () => {
  const r = M.evaluate({ D: 40, n: 12, d: 12, Da: 80, startDeg: 0 });
  assert.ok(near(r.chord, 40 * Math.sin(Math.PI / 12)));
  assert.equal(r.holesClear, false);
});

console.log(`\n${passed} checks passed.`);
