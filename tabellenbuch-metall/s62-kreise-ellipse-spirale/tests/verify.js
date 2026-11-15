/* Unit tests for Mechanical & Metal Trades Handbook (Tabellenbuch Metall) p. 62:
   "3.2 Basic Geometric Constructions – Incircle, Circumcircle, Circle Center, Ellipse, Spiral"
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

console.log('Starting verification for Mechanical & Metal Trades Handbook p. 62:');

// =========================================================================
// 1. Incircle of a Triangle
// =========================================================================
console.log('\n--- 1. Incircle of a Triangle ---');

test('Right triangle (3-4-5): incircle radius r = 10', () => {
  const A = Core.pt(0, 0);
  const B = Core.pt(40, 0);
  const C = Core.pt(0, 30);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok, 'Construction must succeed');
  assert.strictEqual(res.c, 40);
  assert.strictEqual(res.b, 30);
  assert.strictEqual(res.a, 50);
  assert.strictEqual(res.s, 60);
  assert.strictEqual(res.area, 600);
  // r = A / s = 600 / 60 = 10
  assert(Math.abs(res.inradius - 10) < 1e-9, `Incircle radius must be 10, got ${res.inradius}`);
  // Incenter at (10, 10)
  assert(Math.abs(res.M.x - 10) < 1e-9);
  assert(Math.abs(res.M.y - 10) < 1e-9);
});

test('Incircle touches all three triangle sides tangentially (distance = r)', () => {
  const A = Core.pt(120, 340);
  const B = Core.pt(480, 310);
  const C = Core.pt(260, 110);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);

  const dAB = Core.projectPointOnLine(res.M, A, B).dist;
  const dBC = Core.projectPointOnLine(res.M, B, C).dist;
  const dCA = Core.projectPointOnLine(res.M, C, A).dist;

  assert(Math.abs(dAB - res.inradius) < 1e-4, 'Distance to AB must be r');
  assert(Math.abs(dBC - res.inradius) < 1e-4, 'Distance to BC must be r');
  assert(Math.abs(dCA - res.inradius) < 1e-4, 'Distance to CA must be r');
});

test('Angle bisectors split interior angles into two equal halves', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(400, 300);
  const C = Core.pt(220, 120);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);

  const uAB = Core.unit(Core.sub(B, A));
  const uAC = Core.unit(Core.sub(C, A));
  const angHalf1 = Core.angleVectorsDeg(uAB, res.bisectorA);
  const angHalf2 = Core.angleVectorsDeg(res.bisectorA, uAC);
  assert(Math.abs(angHalf1 - angHalf2) < 1e-4, 'Angle bisector at A must be symmetric');
  assert(Math.abs((angHalf1 + angHalf2) - res.alphaDeg) < 1e-4);
});

test('Tangent segments satisfy s - a, s - b, s - c', () => {
  const A = Core.pt(50, 50);
  const B = Core.pt(350, 80);
  const C = Core.pt(180, 260);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);
  assert(Math.abs((res.segA + res.segB + res.segC) - res.s) < 1e-4);
  assert(Math.abs((res.segA + res.segB) - res.c) < 1e-4);
});

// =========================================================================
// 2. Circumcircle of a Triangle
// =========================================================================
console.log('\n--- 2. Circumcircle of a Triangle ---');

test('Circumcenter has exact distance R to all 3 vertices', () => {
  const A = Core.pt(140, 320);
  const B = Core.pt(460, 340);
  const C = Core.pt(250, 120);
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);

  const dMA = Core.dist(res.M, A);
  const dMB = Core.dist(res.M, B);
  const dMC = Core.dist(res.M, C);

  assert(Math.abs(dMA - res.circumradius) < 1e-4, 'MA must equal R');
  assert(Math.abs(dMB - res.circumradius) < 1e-4, 'MB must equal R');
  assert(Math.abs(dMC - res.circumradius) < 1e-4, 'MC must equal R');
});

test('Right triangle: circumcenter lies exactly on the hypotenuse (Thales theorem)', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(300, 300);
  const C = Core.pt(100, 150); // Right angle at A
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'rechtwinklig');

  // Hypotenuse is BC
  const midBC = Core.mid(B, C);
  assert(Math.abs(Core.dist(res.M, midBC)) < 1e-4, 'M must be the midpoint of BC');
  assert(Math.abs(res.circumradius - Core.dist(B, C) / 2) < 1e-4);
});

test('Obtuse triangle: circumcenter lies outside the triangle', () => {
  const A = Core.pt(100, 200);
  const B = Core.pt(400, 200);
  const C = Core.pt(250, 180); // Very shallow triangle, gamma > 90°
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'stumpfwinklig');
  assert(res.gammaDeg > 90);
});

test('Euler relation: d^2 = R * (R - 2r) between circumcenter and incenter', () => {
  const A = Core.pt(150, 350);
  const B = Core.pt(420, 310);
  const C = Core.pt(270, 140);
  const inc = Core.constructIncircle(A, B, C);
  const cir = Core.constructCircumcircle(A, B, C);
  assert(inc.ok && cir.ok);

  const dActual2 = Math.pow(Core.dist(inc.M, cir.M), 2);
  const dEuler2 = cir.circumradius * (cir.circumradius - 2 * inc.inradius);
  assert(Math.abs(dActual2 - dEuler2) < 1e-2, `Euler relation must hold (${dActual2} vs ${dEuler2})`);
});

// =========================================================================
// 3. Finding the Center of a Circle
// =========================================================================
console.log('\n--- 3. Finding the Center of a Circle ---');

test('Circle center is reconstructed accurately from arbitrary chords', () => {
  const trueCenter = Core.pt(280, 240);
  const R = 95;
  const sec1 = { lineDeg: 25, distFromCenter: 30 };
  const sec2 = { lineDeg: 110, distFromCenter: -20 };
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, sec1, sec2);
  assert(res.ok);
  assert(res.errorDist < 1e-4, `Deviation must be 0, got ${res.errorDist}`);
  assert(Math.abs(Core.dist(res.foundCenter, res.A) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.B) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.C) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.D) - R) < 1e-4);
});

test('Perpendicular bisectors are strictly orthogonal to the chords', () => {
  const trueCenter = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, { lineDeg: 0, distFromCenter: 25 }, { lineDeg: 90, distFromCenter: -15 });
  assert(res.ok);
  // Chord vector AB dot normal vector n1 must be 0
  assert(Math.abs(Core.dot(res.u1, res.n1)) < 1e-9);
  assert(Math.abs(Core.dot(res.u2, res.n2)) < 1e-9);
});

test('Error handling: parallel chords are rejected', () => {
  const trueCenter = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, { lineDeg: 45, distFromCenter: 20 }, { lineDeg: 45, distFromCenter: -20 });
  assert(!res.ok);
  assert.strictEqual(res.reason, 'parallel_secants');
});

// =========================================================================
// 4. Ellipse Construction from Two Circles
// =========================================================================
console.log('\n--- 4. Ellipse Construction from Two Circles ---');

test('Constructed ellipse points satisfy the ellipse equation x^2/a^2 + y^2/b^2 = 1', () => {
  const M = Core.pt(300, 200);
  const a = 120;
  const b = 70;
  const angles = [15, 30, 45, 60, 90, 135, 180, 225, 270, 315];
  const res = Core.constructEllipseFromTwoCircles(M, a, b, angles);
  assert(res.ok);

  for (const ray of res.rays) {
    assert(Math.abs(ray.eqVal - 1.0) < 1e-4, `Point at ${ray.deg}° must lie on the ellipse, eqVal=${ray.eqVal}`);
    // E must lie on the inner circle of radius b
    assert(Math.abs(Core.dist(M, ray.E) - b) < 1e-4);
    // F must lie on the outer circle of radius a
    assert(Math.abs(Core.dist(M, ray.F) - a) < 1e-4);
  }
});

test('Linear eccentricity and foci: e = sqrt(a^2 - b^2)', () => {
  const M = Core.pt(0, 0);
  const a = 100;
  const b = 60; // 3-4-5 triangle -> e = 80
  const res = Core.constructEllipseFromTwoCircles(M, a, b);
  assert(res.ok);
  assert.strictEqual(res.e, 80);
  assert.strictEqual(res.eps, 0.8);
  assert.strictEqual(res.F1.x, -80);
  assert.strictEqual(res.F2.x, 80);

  // Focal property: r1 + r2 = 2 * a for every ellipse point
  for (const ray of res.rays) {
    const d1 = Core.dist(ray.P, res.F1);
    const d2 = Core.dist(ray.P, res.F2);
    assert(Math.abs((d1 + d2) - 2 * a) < 1e-4, `Sum of focal distances must equal 2a, got ${d1 + d2}`);
  }
});

test('Area of the ellipse equals pi * a * b', () => {
  const a = 80, b = 50;
  const res = Core.constructEllipseFromTwoCircles(Core.pt(0, 0), a, b);
  assert(res.ok);
  assert(Math.abs(res.area - (Math.PI * 80 * 50)) < 1e-4);
});

// =========================================================================
// 5. Ellipse Construction in a Parallelogram
// =========================================================================
console.log('\n--- 5. Ellipse Construction in a Parallelogram ---');

test('Parallelogram semicircle radius matches semi-axis b (MC)', () => {
  const M = Core.pt(250, 200);
  const a = 110;
  const b = 65;
  const res = Core.constructEllipseInParallelogram(M, a, b, 70, 4);
  assert(res.ok);
  assert(Math.abs(res.rMC - b) < 1e-4, 'rMC must equal b');
});

test('Ellipse curve touches the parallelogram sides at their midpoints', () => {
  const M = Core.pt(300, 250);
  const a = 100;
  const b = 60;
  const res = Core.constructEllipseInParallelogram(M, a, b, 65, 4);
  assert(res.ok);

  // Side midpoints are M +/- u and M +/- v
  const midTop = Core.add(M, res.v);
  const midRight = Core.add(M, res.u);
  assert(Math.abs(Core.dist(midTop, Core.mid(res.P1, res.P2))) < 1e-4);
  assert(Math.abs(Core.dist(midRight, Core.mid(res.P1, res.P4))) < 1e-4);
});

test('Division points divAM and divEA divide segments evenly into N parts', () => {
  const res = Core.constructEllipseInParallelogram(Core.pt(0, 0), 120, 60, 90, 4);
  assert(res.ok);
  assert.strictEqual(res.divAM.length, 3);
  assert.strictEqual(res.divEA.length, 3);
  // At k=2 (midpoint)
  assert(Math.abs(res.divAM[1].pt.x - (-60)) < 1e-4);
});

// =========================================================================
// 6. Spiral (Compass Approximation)
// =========================================================================
console.log('\n--- 6. Spiral (Compass Approximation) ---');

test('Central square has side length s = a / 4', () => {
  const pitch = 48; // a = 48 mm
  const res = Core.constructSquareSpiral(Core.pt(200, 200), pitch, 8);
  assert(res.ok);
  assert.strictEqual(res.s, 12);
  assert(Math.abs(Core.dist(res.A, res.B) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.B, res.C) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.C, res.D) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.D, res.A) - 12) < 1e-4);
});

test('Radius sequence increases by a/4 per quadrant (r_k = k * a / 4)', () => {
  const pitch = 40;
  const res = Core.constructSquareSpiral(Core.pt(0, 0), pitch, 8);
  assert(res.ok);
  for (let k = 1; k <= 8; k++) {
    const arc = res.arcs[k - 1];
    assert.strictEqual(arc.radiusMm, k * 10);
  }
  // After 4 quadrants (1 full turn), radius equals pitch a
  assert.strictEqual(res.arcs[3].radiusMm, 40);
  // After 8 quadrants (2 full turns), radius equals 2 * a
  assert.strictEqual(res.arcs[7].radiusMm, 80);
});

test('Continuity (C1 transition): end point of arc k equals start point of arc k+1', () => {
  const pitch = 60;
  const res = Core.constructSquareSpiral(Core.pt(300, 300), pitch, 10);
  assert(res.ok);
  for (let k = 0; k < res.arcs.length - 1; k++) {
    const endCurrent = res.arcs[k].endPt;
    const startNext = res.arcs[k + 1].startPt;
    assert(Core.dist(endCurrent, startNext) < 1e-4,
      `Arc ${k + 1} and arc ${k + 2} must join seamlessly`);
  }
});

test('Archimedean spiral: radii at quadrant boundaries match analytically', () => {
  const pitch = 52;
  const res = Core.constructSquareSpiral(Core.pt(0, 0), pitch, 8);
  assert(res.ok);
  for (let k = 1; k <= 8; k++) {
    const theta = k * (Math.PI / 2);
    const rArchimedes = (pitch * theta) / (2 * Math.PI);
    assert(Math.abs(rArchimedes - res.arcs[k - 1].radiusMm) < 1e-9, `Radius must match (${rArchimedes} vs ${res.arcs[k - 1].radiusMm})`);
  }
  assert(res.maxDeviationPct < 1.5, 'Maximum shape deviation must be under 1.5%');
});

test('Error handling: collinear triangle points are rejected', () => {
  const A = Core.pt(0, 0);
  const B = Core.pt(50, 50);
  const C = Core.pt(100, 100);
  const resInc = Core.constructIncircle(A, B, C);
  const resCir = Core.constructCircumcircle(A, B, C);
  assert(!resInc.ok);
  assert(!resCir.ok);
  assert.strictEqual(resInc.reason, 'collinear');
  assert.strictEqual(resCir.reason, 'collinear');
});

test('Acute triangle: circumcenter lies strictly inside the triangle', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(300, 300);
  const C = Core.pt(200, 120); // Isosceles acute triangle
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'spitzwinklig');
  assert(res.M.y < 300 && res.M.y > 120);
});

test('Concentric auxiliary circles: outer circle d = AB, inner circle d = CD', () => {
  const M = Core.pt(200, 150);
  const a = 90;
  const b = 50;
  const res = Core.constructEllipseFromTwoCircles(M, a, b, [0, 90]);
  assert(res.ok);
  // At 0°, P lies on the major axis (x = M.x + a, y = M.y)
  assert(Math.abs(res.rays[0].P.x - (M.x + a)) < 1e-4);
  assert(Math.abs(res.rays[0].P.y - M.y) < 1e-4);
  // At 90°, P lies on the minor axis (x = M.x, y = M.y + b)
  assert(Math.abs(res.rays[1].P.x - M.x) < 1e-4);
  assert(Math.abs(res.rays[1].P.y - (M.y + b)) < 1e-4);
});

test('Sheared parallelogram (tilt = 60°): parallelogram sides are parallel to u and v', () => {
  const M = Core.pt(100, 100);
  const a = 80;
  const b = 40;
  const res = Core.constructEllipseInParallelogram(M, a, b, 60, 4);
  assert(res.ok);
  // Vector P1 -> P2 must be parallel to u (horizontal)
  const vP1P2 = Core.sub(res.P1, res.P2);
  assert(Math.abs(vP1P2.y) < 1e-4);
  assert(Math.abs(vP1P2.x - 2 * a) < 1e-4);
});

// =========================================================================
// Summary
// =========================================================================
console.log(`\nResult: ${passed} of ${total} tests passed.`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
