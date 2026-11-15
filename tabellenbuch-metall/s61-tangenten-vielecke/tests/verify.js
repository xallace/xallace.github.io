/* Unit Tests for Tabellenbuch Metall p. 61:
   "3.2 Basic Geometric Constructions – Tangents, Circular Arcs, Polygons"
   Run with: node tests/verify.js */
const assert = require('assert');
const Core = require('../js/core.js');

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('Starting verification for Tabellenbuch Metall p. 61:');

// =========================================================================
// 1. Tangent through circle point P
// =========================================================================
console.log('\n--- 1. Tangent through circle point P ---');

test('Tangent is exactly perpendicular to MP (angle = 90.0°)', () => {
  const M = Core.pt(200, 200);
  const P = Core.polarPt(M, 80, 40); // P on circle with R=80
  const res = Core.constructTangentAtPoint(M, P, 30, 45);
  assert(res.ok, 'Construction must be ok');
  assert.strictEqual(res.perpAngleDeg, 90);
  assert(Math.abs(res.dotProduct) < 1e-4, 'Dot product MP * tangent must be 0');
});

test('Distance from circle center to tangent equals radius R exactly', () => {
  const M = Core.pt(150, 180);
  const R = 75;
  const P = Core.polarPt(M, R, 125);
  const res = Core.constructTangentAtPoint(M, P, 35, 50);
  const pr = Core.projectPointOnLine(M, res.C, res.D);
  assert(Math.abs(pr.dist - R) < 1e-4, `Distance (${pr.dist}) must equal R (${R})`);
});

test('Auxiliary points A and B lie symmetrically around P on line MP', () => {
  const M = Core.pt(250, 250);
  const P = Core.pt(250, 150); // directly above, R=100
  const r1 = 40;
  const res = Core.constructTangentAtPoint(M, P, r1, 60);
  assert(Math.abs(Core.dist(P, res.A) - r1) < 1e-4);
  assert(Math.abs(Core.dist(P, res.B) - r1) < 1e-4);
  assert(Math.abs(Core.dist(res.A, res.B) - 2 * r1) < 1e-4);
});

test('Error handling: r2 <= r1 fails', () => {
  const M = Core.pt(200, 200);
  const P = Core.polarPt(M, 80, 0);
  const res = Core.constructTangentAtPoint(M, P, 40, 35);
  assert(!res.ok);
  assert.strictEqual(res.stepFailed, 3);
  assert.strictEqual(res.reason, 'r2_too_small');
});

// =========================================================================
// 2. Tangent from an external point P to a circle
// =========================================================================
console.log('\n--- 2. Tangent from external point P to circle ---');

test('Thales’ theorem: angle at tangency point is exactly 90.0°', () => {
  const M = Core.pt(180, 200);
  const R = 60;
  const P = Core.pt(380, 200); // d = 200 > R
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(res.ok);
  assert.strictEqual(res.angleMTPDeg1, 90);
  assert.strictEqual(res.angleMTPDeg2, 90);
});

test('Pythagoras: R^2 + tangentLength^2 = MP^2', () => {
  const M = Core.pt(100, 100);
  const R = 50;
  const P = Core.pt(220, 260); // d = sqrt(120^2 + 160^2) = 200
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(res.ok);
  const d = res.d; // 200
  const L = res.tangentLen; // sqrt(200^2 - 50^2) = sqrt(37500) ≈ 193.649
  assert(Math.abs(R * R + L * L - d * d) < 1e-3, 'Pythagoras must hold exactly');
});

test('Tangency points T1 and T2 lie exactly on the given circle', () => {
  const M = Core.pt(250, 250);
  const R = 70;
  const P = Core.pt(420, 300);
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(Math.abs(Core.dist(M, res.T1) - R) < 1e-4);
  assert(Math.abs(Core.dist(M, res.T2) - R) < 1e-4);
});

test('Error handling: P inside the circle fails', () => {
  const M = Core.pt(200, 200);
  const R = 80;
  const P = Core.pt(230, 210); // d ≈ 31.6 < 80
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(!res.ok);
  assert.strictEqual(res.reason, 'p_inside_or_on_circle');
});

// =========================================================================
// 3. Fillet arc in an angle
// =========================================================================
console.log('\n--- 3. Fillet arc in an angle ---');

test('90° angle: fillet center lies at distance r*sqrt(2) and t = r', () => {
  const S = Core.pt(100, 200);
  const A = Core.pt(250, 200); // side to the right
  const B = Core.pt(100, 50);  // side upward
  const r = 40;
  const res = Core.constructFilletCorner(S, A, B, r);
  assert(res.ok);
  assert.strictEqual(res.alphaDeg, 90);
  assert.strictEqual(res.tanLen, 40);
  assert(Math.abs(res.centerDist - 40 * Math.SQRT2) < 1e-3);
  assert(Math.abs(res.distMC - r) < 1e-4);
  assert(Math.abs(res.distMD - r) < 1e-4);
});

test('General angle: tangent distances to both tangency points are equal (t = SC = SD)', () => {
  const S = Core.pt(200, 250);
  const A = Core.polarPt(S, 140, 20);
  const B = Core.polarPt(S, 140, 85); // alpha = 65°
  const r = 35;
  const res = Core.constructFilletCorner(S, A, B, r);
  assert(res.ok);
  assert(Math.abs(res.distSC - res.distSD) < 1e-4, 'SC and SD must have equal length');
  assert(Math.abs(res.distMC - r) < 1e-4, 'MC must be exactly r');
  assert(Math.abs(res.distMD - r) < 1e-4, 'MD must be exactly r');
});

test('Tangency: perpendicular from M to side meets exactly at C or D', () => {
  const S = Core.pt(150, 180);
  const A = Core.pt(320, 140);
  const B = Core.pt(190, 320);
  const r = 30;
  const res = Core.constructFilletCorner(S, A, B, r);
  assert(res.ok);
  const prA = Core.projectPointOnLine(res.M, S, A);
  const prB = Core.projectPointOnLine(res.M, S, B);
  assert(Core.dist(prA.foot, res.C) < 1e-4);
  assert(Core.dist(prB.foot, res.D) < 1e-4);
});

// =========================================================================
// 4. Connecting two circles with circular arcs
// =========================================================================
console.log('\n--- 4. Connecting two circles with circular arcs ---');

test('Inner arc Ri touches both circles tangentially (distances AB = AC = Ri)', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  assert(res.ok);
  // Distance from arc center A to M1 must be Ri + r1
  assert(Math.abs(Core.dist(res.A, M1) - (Ri + r1)) < 1e-4);
  // Distance from arc center A to M2 must be Ri + r2
  assert(Math.abs(Core.dist(res.A, M2) - (Ri + r2)) < 1e-4);
  // Tangency points B and C must lie at distance Ri from A
  assert(Math.abs(res.distAB - Ri) < 1e-4);
  assert(Math.abs(res.distAC - Ri) < 1e-4);
  // B must lie on Circle 1
  assert(Math.abs(Core.dist(M1, res.B) - r1) < 1e-4);
  // C must lie on Circle 2
  assert(Math.abs(Core.dist(M2, res.C) - r2) < 1e-4);
});

test('Outer arc Ra encloses both circles tangentially (distances DE = DF = Ra)', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  assert(res.ok);
  // Distance from outer center D to M1 must be Ra - r1
  assert(Math.abs(Core.dist(res.D, M1) - (Ra - r1)) < 1e-4);
  // Distance from outer center D to M2 must be Ra - r2
  assert(Math.abs(Core.dist(res.D, M2) - (Ra - r2)) < 1e-4);
  // Tangency points E and F must lie at distance Ra from D
  assert(Math.abs(res.distDE - Ra) < 1e-4);
  assert(Math.abs(res.distDF - Ra) < 1e-4);
  // E on Circle 1, F on Circle 2
  assert(Math.abs(Core.dist(M1, res.E) - r1) < 1e-4);
  assert(Math.abs(Core.dist(M2, res.F) - r2) < 1e-4);
});

test('Error handling: Ra smaller than circle radii fails', () => {
  const M1 = Core.pt(150, 200);
  const M2 = Core.pt(350, 200);
  const res = Core.constructTwoCircleBlend(M1, 40, M2, 60, 50, 55);
  assert(!res.ok);
  assert.strictEqual(res.reason, 'ra_too_small_for_circles');
});

// =========================================================================
// 5. Regular polygon in circumcircle (e.g., pentagon)
// =========================================================================
console.log('\n--- 5. Regular polygon in circumcircle ---');

test('Pentagon: 5 vertices lie exactly on circumcircle with radius R', () => {
  const M = Core.pt(250, 250);
  const R = 90;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert.strictEqual(res.vertices.length, 5);
  for (let i = 0; i < 5; i++) {
    const d = Core.dist(M, res.vertices[i].pt);
    assert(Math.abs(d - R) < 1e-4, `Vertex ${i} must lie on circumcircle (|dist - R| < 1e-4)`);
  }
});

test('Pentagon (Bion approximation): edge-length accuracy exceeds 99% (analytical 99.15%)', () => {
  const M = Core.pt(250, 250);
  const R = 100;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert(res.relAccuracyPct > 99.0, `Accuracy (${res.relAccuracyPct}%) must be > 99.0%`);
});

test('Pole points C and D lie at distance R*sqrt(3) from center', () => {
  const M = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert(Math.abs(Core.dist(M, res.C) - 80 * Math.sqrt(3)) < 1e-4);
  assert(Math.abs(Core.dist(M, res.D) - 80 * Math.sqrt(3)) < 1e-4);
});

test('Even polygon (e.g. hexagon n=6): returns 6 vertices on the circle', () => {
  const M = Core.pt(200, 200);
  const R = 75;
  const res = Core.constructRegularPolygonApprox(M, R, 6);
  assert(res.ok);
  assert.strictEqual(res.vertices.length, 6);
  for (let i = 0; i < 6; i++) {
    assert(Math.abs(Core.dist(M, res.vertices[i].pt) - R) < 1e-4);
  }
});

// =========================================================================
// 6. Hexagon & dodecagon in circumcircle
// =========================================================================
console.log('\n--- 6. Hexagon & dodecagon in circumcircle ---');

test('Hexagon: edge length equals radius exactly (s = r = d/2)', () => {
  const M = Core.pt(200, 200);
  const R = 70;
  const res = Core.constructHexagonDodecagon(M, R, 'hexagon');
  assert(res.ok);
  assert.strictEqual(res.sHex, R);
  assert.strictEqual(res.hexVertices.length, 6);
  for (let i = 0; i < 6; i++) {
    const p1 = res.hexVertices[i];
    const p2 = res.hexVertices[(i + 1) % 6];
    assert(Math.abs(Core.dist(p1, p2) - R) < 1e-4, 'Each hexagon edge must be exactly r');
  }
});

test('Hexagon: width across flats AF = d * sqrt(3) / 2', () => {
  const M = Core.pt(200, 200);
  const R = 50; // d = 100
  const res = Core.constructHexagonDodecagon(M, R, 'hexagon');
  const expectedSW = 100 * Math.sqrt(3) / 2; // ≈ 86.6025
  assert(Math.abs(res.swHex - expectedSW) < 1e-3);
});

test('Dodecagon: returns exactly 12 vertices spaced 30° apart on circumcircle', () => {
  const M = Core.pt(250, 250);
  const R = 80;
  const res = Core.constructHexagonDodecagon(M, R, 'dodecagon');
  assert(res.ok);
  assert.strictEqual(res.dodecaVertices.length, 12);
  const expectedS12 = 2 * R * Math.sin(15 * Math.PI / 180); // ≈ 41.411
  assert(Math.abs(res.sDodeca - expectedS12) < 1e-3);
  for (let i = 0; i < 12; i++) {
    const p1 = res.dodecaVertices[i];
    const p2 = res.dodecaVertices[(i + 1) % 12];
    assert(Math.abs(Core.dist(p1, p2) - expectedS12) < 1e-3, 'Dodecagon edges must have equal length');
  }
});

test('Tangency proof: A, B, M1 as well as A, C, M2 are collinear', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  // Collinearity: cross product (B - A) x (M1 - A) == 0
  const vAB = Core.sub(res.B, res.A);
  const vAM1 = Core.sub(M1, res.A);
  assert(Math.abs(Core.cross(vAB, vAM1)) < 1e-4, 'A, B and M1 must be exactly collinear');
  const vAC = Core.sub(res.C, res.A);
  const vAM2 = Core.sub(M2, res.A);
  assert(Math.abs(Core.cross(vAC, vAM2)) < 1e-4, 'A, C and M2 must be exactly collinear');
});

test('Tangency proof outer arc: D, M1, E as well as D, M2, F are collinear', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  const vDM1 = Core.sub(M1, res.D);
  const vDE = Core.sub(res.E, res.D);
  assert(Math.abs(Core.cross(vDM1, vDE)) < 1e-4, 'D, M1 and E must be collinear');
  const vDM2 = Core.sub(M2, res.D);
  const vDF = Core.sub(res.F, res.D);
  assert(Math.abs(Core.cross(vDM2, vDF)) < 1e-4, 'D, M2 and F must be collinear');
});

test('Mechanical engineering standard sizes: DIN EN ISO 4014 (M10 hex bolt AF 17 -> e = 19.63 mm)', () => {
  // AF = 17 mm -> r_i = 8.5 mm -> R = AF / sqrt(3) = 9.81495 mm -> d = e = 19.6299 mm
  const sw = 17;
  const R = (sw / 2) / Math.cos(30 * Math.PI / 180);
  const res = Core.constructHexagonDodecagon(Core.pt(0, 0), R, 'hexagon');
  assert(Math.abs(res.swHex - sw) < 1e-3);
  assert(Math.abs(res.d - 19.63) < 0.01);
});

console.log(`\nResult: ${passed} of ${total} tests passed.`);
if (passed !== total) process.exit(1);
