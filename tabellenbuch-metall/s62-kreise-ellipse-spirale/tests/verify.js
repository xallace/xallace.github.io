/* Unit-Tests für Tabellenbuch Metall S. 62:
   „3.2 Geometrische Grundkonstruktionen – Inkreis, Umkreis, Kreismittelpunkt, Ellipse, Spirale“
   Ausführen mit: node tests/verify.js */
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

console.log('Starte Verifikation für Tabellenbuch Metall S. 62:');

// =========================================================================
// 1. Inkreis eines Dreiecks
// =========================================================================
console.log('\n--- 1. Inkreis eines Dreiecks ---');

test('Rechtwinkliges Dreieck (3-4-5): Inkreisradius r = 1,0', () => {
  const A = Core.pt(0, 0);
  const B = Core.pt(40, 0);
  const C = Core.pt(0, 30);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok, 'Konstruktion muss ok sein');
  assert.strictEqual(res.c, 40);
  assert.strictEqual(res.b, 30);
  assert.strictEqual(res.a, 50);
  assert.strictEqual(res.s, 60);
  assert.strictEqual(res.area, 600);
  // r = A / s = 600 / 60 = 10
  assert(Math.abs(res.inradius - 10) < 1e-9, `Inkreisradius muss 10 sein, ist ${res.inradius}`);
  // Inkreismittelpunkt bei (10, 10)
  assert(Math.abs(res.M.x - 10) < 1e-9);
  assert(Math.abs(res.M.y - 10) < 1e-9);
});

test('Inkreis berührt alle drei Dreiecksseiten tangential (Abstand = r)', () => {
  const A = Core.pt(120, 340);
  const B = Core.pt(480, 310);
  const C = Core.pt(260, 110);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);

  const dAB = Core.projectPointOnLine(res.M, A, B).dist;
  const dBC = Core.projectPointOnLine(res.M, B, C).dist;
  const dCA = Core.projectPointOnLine(res.M, C, A).dist;

  assert(Math.abs(dAB - res.inradius) < 1e-4, 'Abstand zu AB muss r sein');
  assert(Math.abs(dBC - res.inradius) < 1e-4, 'Abstand zu BC muss r sein');
  assert(Math.abs(dCA - res.inradius) < 1e-4, 'Abstand zu CA muss r sein');
});

test('Winkelhalbierende teilen die Innenwinkel exakt in zwei Hälften', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(400, 300);
  const C = Core.pt(220, 120);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);

  const uAB = Core.unit(Core.sub(B, A));
  const uAC = Core.unit(Core.sub(C, A));
  const angHalf1 = Core.angleVectorsDeg(uAB, res.bisectorA);
  const angHalf2 = Core.angleVectorsDeg(res.bisectorA, uAC);
  assert(Math.abs(angHalf1 - angHalf2) < 1e-4, 'Winkelhalbierende an A muss symmetrisch sein');
  assert(Math.abs((angHalf1 + angHalf2) - res.alphaDeg) < 1e-4);
});

test('Tangentenabschnitte erfüllen s - a, s - b, s - c', () => {
  const A = Core.pt(50, 50);
  const B = Core.pt(350, 80);
  const C = Core.pt(180, 260);
  const res = Core.constructIncircle(A, B, C);
  assert(res.ok);
  assert(Math.abs((res.segA + res.segB + res.segC) - res.s) < 1e-4);
  assert(Math.abs((res.segA + res.segB) - res.c) < 1e-4);
});

// =========================================================================
// 2. Umkreis eines Dreiecks
// =========================================================================
console.log('\n--- 2. Umkreis eines Dreiecks ---');

test('Umkreismittelpunkt hat zu allen 3 Ecken exakt den Abstand R', () => {
  const A = Core.pt(140, 320);
  const B = Core.pt(460, 340);
  const C = Core.pt(250, 120);
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);

  const dMA = Core.dist(res.M, A);
  const dMB = Core.dist(res.M, B);
  const dMC = Core.dist(res.M, C);

  assert(Math.abs(dMA - res.circumradius) < 1e-4, 'MA muss R sein');
  assert(Math.abs(dMB - res.circumradius) < 1e-4, 'MB muss R sein');
  assert(Math.abs(dMC - res.circumradius) < 1e-4, 'MC muss R sein');
});

test('Rechtwinkliges Dreieck: Umkreismittelpunkt liegt exakt auf der Hypotenuse (Satz des Thales)', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(300, 300);
  const C = Core.pt(100, 150); // Rechter Winkel bei A
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'rechtwinklig');

  // Hypotenuse ist BC
  const midBC = Core.mid(B, C);
  assert(Math.abs(Core.dist(res.M, midBC)) < 1e-4, 'M muss Mittelpunkt von BC sein');
  assert(Math.abs(res.circumradius - Core.dist(B, C) / 2) < 1e-4);
});

test('Stumpfwinkliges Dreieck: Umkreismittelpunkt liegt außerhalb des Dreiecks', () => {
  const A = Core.pt(100, 200);
  const B = Core.pt(400, 200);
  const C = Core.pt(250, 180); // Sehr flaches Dreieck, gamma > 90°
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'stumpfwinklig');
  assert(res.gammaDeg > 90);
});

test('Euler-Gleichung: d^2 = R * (R - 2r) zwischen Umkreis- und Inkreismittelpunkt', () => {
  const A = Core.pt(150, 350);
  const B = Core.pt(420, 310);
  const C = Core.pt(270, 140);
  const inc = Core.constructIncircle(A, B, C);
  const cir = Core.constructCircumcircle(A, B, C);
  assert(inc.ok && cir.ok);

  const dActual2 = Math.pow(Core.dist(inc.M, cir.M), 2);
  const dEuler2 = cir.circumradius * (cir.circumradius - 2 * inc.inradius);
  assert(Math.abs(dActual2 - dEuler2) < 1e-2, `Euler-Gleichung muss erfüllt sein (${dActual2} vs ${dEuler2})`);
});

// =========================================================================
// 3. Bestimmung des Kreismittelpunktes
// =========================================================================
console.log('\n--- 3. Bestimmung des Kreismittelpunktes ---');

test('Kreismittelpunkt wird aus beliebigen Sehnen exakt rekonstruiert', () => {
  const trueCenter = Core.pt(280, 240);
  const R = 95;
  const sec1 = { lineDeg: 25, distFromCenter: 30 };
  const sec2 = { lineDeg: 110, distFromCenter: -20 };
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, sec1, sec2);
  assert(res.ok);
  assert(res.errorDist < 1e-4, `Abweichung muss 0 sein, ist ${res.errorDist}`);
  assert(Math.abs(Core.dist(res.foundCenter, res.A) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.B) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.C) - R) < 1e-4);
  assert(Math.abs(Core.dist(res.foundCenter, res.D) - R) < 1e-4);
});

test('Mittelsenkrechten stehen exakt senkrecht auf den Sehnen', () => {
  const trueCenter = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, { lineDeg: 0, distFromCenter: 25 }, { lineDeg: 90, distFromCenter: -15 });
  assert(res.ok);
  // Sehnenvektor AB * Normalenvektor n1 muss 0 sein
  assert(Math.abs(Core.dot(res.u1, res.n1)) < 1e-9);
  assert(Math.abs(Core.dot(res.u2, res.n2)) < 1e-9);
});

test('Fehlerbehandlung: Parallele Sehnen werden abgefangen', () => {
  const trueCenter = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructCircleCenterFromSecants(trueCenter, R, { lineDeg: 45, distFromCenter: 20 }, { lineDeg: 45, distFromCenter: -20 });
  assert(!res.ok);
  assert.strictEqual(res.reason, 'parallel_secants');
});

// =========================================================================
// 4. Ellipsenkonstruktion aus zwei Kreisen
// =========================================================================
console.log('\n--- 4. Ellipsenkonstruktion aus zwei Kreisen ---');

test('Konstruierte Ellipsenpunkte erfüllen exakt die Ellipsengleichung x^2/a^2 + y^2/b^2 = 1', () => {
  const M = Core.pt(300, 200);
  const a = 120;
  const b = 70;
  const angles = [15, 30, 45, 60, 90, 135, 180, 225, 270, 315];
  const res = Core.constructEllipseFromTwoCircles(M, a, b, angles);
  assert(res.ok);

  for (const ray of res.rays) {
    assert(Math.abs(ray.eqVal - 1.0) < 1e-4, `Punkt bei ${ray.deg}° muss auf Ellipse liegen, eqVal=${ray.eqVal}`);
    // E muss auf innerem Kreis mit Radius b liegen
    assert(Math.abs(Core.dist(M, ray.E) - b) < 1e-4);
    // F muss auf äußerem Kreis mit Radius a liegen
    assert(Math.abs(Core.dist(M, ray.F) - a) < 1e-4);
  }
});

test('Lineare Exzentrizität und Brennpunkte: e = sqrt(a^2 - b^2)', () => {
  const M = Core.pt(0, 0);
  const a = 100;
  const b = 60; // 3-4-5 Dreieck -> e = 80
  const res = Core.constructEllipseFromTwoCircles(M, a, b);
  assert(res.ok);
  assert.strictEqual(res.e, 80);
  assert.strictEqual(res.eps, 0.8);
  assert.strictEqual(res.F1.x, -80);
  assert.strictEqual(res.F2.x, 80);

  // Brennpunkteigenschaft: r1 + r2 = 2 * a für jeden Ellipsenpunkt
  for (const ray of res.rays) {
    const d1 = Core.dist(ray.P, res.F1);
    const d2 = Core.dist(ray.P, res.F2);
    assert(Math.abs((d1 + d2) - 2 * a) < 1e-4, `Brennpunktsumme muss 2a sein, ist ${d1 + d2}`);
  }
});

test('Fläche der Ellipse entspricht pi * a * b', () => {
  const a = 80, b = 50;
  const res = Core.constructEllipseFromTwoCircles(Core.pt(0, 0), a, b);
  assert(res.ok);
  assert(Math.abs(res.area - (Math.PI * 80 * 50)) < 1e-4);
});

// =========================================================================
// 5. Ellipsenkonstruktion im Parallelogramm
// =========================================================================
console.log('\n--- 5. Ellipsenkonstruktion im Parallelogramm ---');

test('Parallelogramm-Halbkreisradius entspricht exakt der Halbachse b (MC)', () => {
  const M = Core.pt(250, 200);
  const a = 110;
  const b = 65;
  const res = Core.constructEllipseInParallelogram(M, a, b, 70, 4);
  assert(res.ok);
  assert(Math.abs(res.rMC - b) < 1e-4, 'rMC muss b sein');
});

test('Ellipsenkurve berührt die Parallelogrammseiten in den Mitten', () => {
  const M = Core.pt(300, 250);
  const a = 100;
  const b = 60;
  const res = Core.constructEllipseInParallelogram(M, a, b, 65, 4);
  assert(res.ok);

  // Mitten der Seiten sind M +/- u und M +/- v
  const midTop = Core.add(M, res.v);
  const midRight = Core.add(M, res.u);
  assert(Math.abs(Core.dist(midTop, Core.mid(res.P1, res.P2))) < 1e-4);
  assert(Math.abs(Core.dist(midRight, Core.mid(res.P1, res.P4))) < 1e-4);
});

test('Teilungspunkte divAM und divEA teilen Strecken gleichmäßig in N Teile', () => {
  const res = Core.constructEllipseInParallelogram(Core.pt(0, 0), 120, 60, 90, 4);
  assert(res.ok);
  assert.strictEqual(res.divAM.length, 3);
  assert.strictEqual(res.divEA.length, 3);
  // Bei k=2 (Halbierung)
  assert(Math.abs(res.divAM[1].pt.x - (-60)) < 1e-4);
});

// =========================================================================
// 6. Spirale (Zirkelnäherung)
// =========================================================================
console.log('\n--- 6. Spirale (Zirkelnäherung) ---');

test('Zentralquadrat hat Kantenlänge s = a / 4', () => {
  const pitch = 48; // a = 48 mm
  const res = Core.constructSquareSpiral(Core.pt(200, 200), pitch, 8);
  assert(res.ok);
  assert.strictEqual(res.s, 12);
  assert(Math.abs(Core.dist(res.A, res.B) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.B, res.C) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.C, res.D) - 12) < 1e-4);
  assert(Math.abs(Core.dist(res.D, res.A) - 12) < 1e-4);
});

test('Radienfolge wächst exakt um a/4 pro Quadrant (r_k = k * a / 4)', () => {
  const pitch = 40;
  const res = Core.constructSquareSpiral(Core.pt(0, 0), pitch, 8);
  assert(res.ok);
  for (let k = 1; k <= 8; k++) {
    const arc = res.arcs[k - 1];
    assert.strictEqual(arc.radiusMm, k * 10);
  }
  // Nach 4 Quadranten (1 volle Umdrehung) ist Radius genau die Steigung a
  assert.strictEqual(res.arcs[3].radiusMm, 40);
  // Nach 8 Quadranten (2 volle Umdrehungen) ist Radius 2 * a
  assert.strictEqual(res.arcs[7].radiusMm, 80);
});

test('Stetigkeit (C1-Übergang): Endpunkt des k-ten Bogens ist exakt Startpunkt des (k+1)-ten Bogens', () => {
  const pitch = 60;
  const res = Core.constructSquareSpiral(Core.pt(300, 300), pitch, 10);
  assert(res.ok);
  for (let k = 0; k < res.arcs.length - 1; k++) {
    const endCurrent = res.arcs[k].endPt;
    const startNext = res.arcs[k + 1].startPt;
    assert(Core.dist(endCurrent, startNext) < 1e-4,
      `Bogen ${k + 1} und Bogen ${k + 2} müssen nahtlos anschließen`);
  }
});

test('Archimedische Spirale: Radien an Quadranten-Grenzen stimmen analytisch exakt überein', () => {
  const pitch = 52;
  const res = Core.constructSquareSpiral(Core.pt(0, 0), pitch, 8);
  assert(res.ok);
  for (let k = 1; k <= 8; k++) {
    const theta = k * (Math.PI / 2);
    const rArchimedes = (pitch * theta) / (2 * Math.PI);
    assert(Math.abs(rArchimedes - res.arcs[k - 1].radiusMm) < 1e-9, `Radius muss übereinstimmen (${rArchimedes} vs ${res.arcs[k - 1].radiusMm})`);
  }
  assert(res.maxDeviationPct < 1.5, 'Maximaler Formfehler muss unter 1,5% liegen');
});

test('Fehlerbehandlung: Kollineare Punkte beim Dreieck werden abgefangen', () => {
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

test('Spitzwinkliges Dreieck: Umkreismittelpunkt liegt strikt im Dreiecksinneren', () => {
  const A = Core.pt(100, 300);
  const B = Core.pt(300, 300);
  const C = Core.pt(200, 120); // Gleichschenklig-spitzwinklig
  const res = Core.constructCircumcircle(A, B, C);
  assert(res.ok);
  assert.strictEqual(res.triangleType, 'spitzwinklig');
  assert(res.M.y < 300 && res.M.y > 120);
});

test('Konzentrische Scheitelkreise: Äußerer Kreis d = AB, innerer Kreis d = CD', () => {
  const M = Core.pt(200, 150);
  const a = 90;
  const b = 50;
  const res = Core.constructEllipseFromTwoCircles(M, a, b, [0, 90]);
  assert(res.ok);
  // Bei 0° liegt P auf der Hauptachse (x = M.x + a, y = M.y)
  assert(Math.abs(res.rays[0].P.x - (M.x + a)) < 1e-4);
  assert(Math.abs(res.rays[0].P.y - M.y) < 1e-4);
  // Bei 90° liegt P auf der Nebenachse (x = M.x, y = M.y + b)
  assert(Math.abs(res.rays[1].P.x - M.x) < 1e-4);
  assert(Math.abs(res.rays[1].P.y - (M.y + b)) < 1e-4);
});

test('Parallelogramm mit Scherung (tilt = 60°): Parallelogrammseiten sind parallel zu u und v', () => {
  const M = Core.pt(100, 100);
  const a = 80;
  const b = 40;
  const res = Core.constructEllipseInParallelogram(M, a, b, 60, 4);
  assert(res.ok);
  // Vektor P1 -> P2 muss parallel zu u (horizontal) sein
  const vP1P2 = Core.sub(res.P1, res.P2);
  assert(Math.abs(vP1P2.y) < 1e-4);
  assert(Math.abs(vP1P2.x - 2 * a) < 1e-4);
});

// =========================================================================
// Zusammenfassung
// =========================================================================
console.log(`\nErgebnis: ${passed} von ${total} Tests bestanden.`);
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
