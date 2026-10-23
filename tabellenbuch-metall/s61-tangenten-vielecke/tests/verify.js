/* Unit-Tests für Tabellenbuch Metall S. 61:
   „3.2 Geometrische Grundkonstruktionen – Tangenten, Kreisbögen, Vielecke“
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

console.log('Starte Verifikation für Tabellenbuch Metall S. 61:');

// =========================================================================
// 1. Tangente durch Kreispunkt P
// =========================================================================
console.log('\n--- 1. Tangente durch Kreispunkt P ---');

test('Tangente steht exakt senkrecht auf MP (Winkel = 90,0°)', () => {
  const M = Core.pt(200, 200);
  const P = Core.polarPt(M, 80, 40); // P auf Kreis mit R=80
  const res = Core.constructTangentAtPoint(M, P, 30, 45);
  assert(res.ok, 'Konstruktion muss ok sein');
  assert.strictEqual(res.perpAngleDeg, 90);
  assert(Math.abs(res.dotProduct) < 1e-4, 'Skalarprodukt MP * Tangente muss 0 sein');
});

test('Abstand des Kreismittelpunkts zur Tangente entspricht exakt dem Radius R', () => {
  const M = Core.pt(150, 180);
  const R = 75;
  const P = Core.polarPt(M, R, 125);
  const res = Core.constructTangentAtPoint(M, P, 35, 50);
  const pr = Core.projectPointOnLine(M, res.C, res.D);
  assert(Math.abs(pr.dist - R) < 1e-4, `Abstand (${pr.dist}) muss R (${R}) sein`);
});

test('Hilfspunkte A und B liegen symmetrisch um P auf der Geraden MP', () => {
  const M = Core.pt(250, 250);
  const P = Core.pt(250, 150); // senkrecht oben, R=100
  const r1 = 40;
  const res = Core.constructTangentAtPoint(M, P, r1, 60);
  assert(Math.abs(Core.dist(P, res.A) - r1) < 1e-4);
  assert(Math.abs(Core.dist(P, res.B) - r1) < 1e-4);
  assert(Math.abs(Core.dist(res.A, res.B) - 2 * r1) < 1e-4);
});

test('Fehlerbehandlung: r2 <= r1 schlägt fehl', () => {
  const M = Core.pt(200, 200);
  const P = Core.polarPt(M, 80, 0);
  const res = Core.constructTangentAtPoint(M, P, 40, 35);
  assert(!res.ok);
  assert.strictEqual(res.stepFailed, 3);
  assert.strictEqual(res.reason, 'r2_too_small');
});

// =========================================================================
// 2. Tangente von einem Punkt P an den Kreis
// =========================================================================
console.log('\n--- 2. Tangente von einem Punkt P an den Kreis ---');

test('Satz des Thales: Winkel am Berührpunkt ist exakt 90,0°', () => {
  const M = Core.pt(180, 200);
  const R = 60;
  const P = Core.pt(380, 200); // d = 200 > R
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(res.ok);
  assert.strictEqual(res.angleMTPDeg1, 90);
  assert.strictEqual(res.angleMTPDeg2, 90);
});

test('Pythagoras: R^2 + Tangentenlaenge^2 = MP^2', () => {
  const M = Core.pt(100, 100);
  const R = 50;
  const P = Core.pt(220, 260); // d = sqrt(120^2 + 160^2) = 200
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(res.ok);
  const d = res.d; // 200
  const L = res.tangentLen; // sqrt(200^2 - 50^2) = sqrt(37500) ≈ 193.649
  assert(Math.abs(R * R + L * L - d * d) < 1e-3, 'Pythagoras muss exakt erfüllt sein');
});

test('Berührpunkte T1 und T2 liegen exakt auf dem gegebenen Kreis', () => {
  const M = Core.pt(250, 250);
  const R = 70;
  const P = Core.pt(420, 300);
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(Math.abs(Core.dist(M, res.T1) - R) < 1e-4);
  assert(Math.abs(Core.dist(M, res.T2) - R) < 1e-4);
});

test('Fehlerbehandlung: P innerhalb des Kreises schlägt fehl', () => {
  const M = Core.pt(200, 200);
  const R = 80;
  const P = Core.pt(230, 210); // d ≈ 31.6 < 80
  const res = Core.constructTangentFromPoint(M, R, P);
  assert(!res.ok);
  assert.strictEqual(res.reason, 'p_inside_or_on_circle');
});

// =========================================================================
// 3. Rundung am Winkel
// =========================================================================
console.log('\n--- 3. Rundung am Winkel ---');

test('90°-Winkel: Ausrundungsmittelpunkt liegt im Abstand r*sqrt(2) und t = r', () => {
  const S = Core.pt(100, 200);
  const A = Core.pt(250, 200); // Schenkel nach rechts
  const B = Core.pt(100, 50);  // Schenkel nach oben
  const r = 40;
  const res = Core.constructFilletCorner(S, A, B, r);
  assert(res.ok);
  assert.strictEqual(res.alphaDeg, 90);
  assert.strictEqual(res.tanLen, 40);
  assert(Math.abs(res.centerDist - 40 * Math.SQRT2) < 1e-3);
  assert(Math.abs(res.distMC - r) < 1e-4);
  assert(Math.abs(res.distMD - r) < 1e-4);
});

test('Allgemeiner Winkel: Tangentenabstände zu beiden Berührpunkten sind gleich (t = SC = SD)', () => {
  const S = Core.pt(200, 250);
  const A = Core.polarPt(S, 140, 20);
  const B = Core.polarPt(S, 140, 85); // alpha = 65°
  const r = 35;
  const res = Core.constructFilletCorner(S, A, B, r);
  assert(res.ok);
  assert(Math.abs(res.distSC - res.distSD) < 1e-4, 'SC und SD müssen gleich lang sein');
  assert(Math.abs(res.distMC - r) < 1e-4, 'MC muss exakt r sein');
  assert(Math.abs(res.distMD - r) < 1e-4, 'MD muss exakt r sein');
});

test('Tangentialität: Lot von M auf Schenkel trifft genau in C bzw. D', () => {
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
// 4. Verbindung zweier Kreise durch Kreisbögen
// =========================================================================
console.log('\n--- 4. Verbindung zweier Kreise durch Kreisbögen ---');

test('Innenbogen Ri berührt beide Kreise tangential (Abstände AB = AC = Ri)', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  assert(res.ok);
  // Abstand vom Bogenmittelpunkt A zu M1 muss Ri + r1 sein
  assert(Math.abs(Core.dist(res.A, M1) - (Ri + r1)) < 1e-4);
  // Abstand vom Bogenmittelpunkt A zu M2 muss Ri + r2 sein
  assert(Math.abs(Core.dist(res.A, M2) - (Ri + r2)) < 1e-4);
  // Berührpunkte B und C müssen im Abstand Ri von A liegen
  assert(Math.abs(res.distAB - Ri) < 1e-4);
  assert(Math.abs(res.distAC - Ri) < 1e-4);
  // B muss auf Kreis 1 liegen
  assert(Math.abs(Core.dist(M1, res.B) - r1) < 1e-4);
  // C muss auf Kreis 2 liegen
  assert(Math.abs(Core.dist(M2, res.C) - r2) < 1e-4);
});

test('Außenbogen Ra umschließt beide Kreise tangential (Abstände DE = DF = Ra)', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  assert(res.ok);
  // Abstand vom Außenmittelpunkt D zu M1 muss Ra - r1 sein
  assert(Math.abs(Core.dist(res.D, M1) - (Ra - r1)) < 1e-4);
  // Abstand vom Außenmittelpunkt D zu M2 muss Ra - r2 sein
  assert(Math.abs(Core.dist(res.D, M2) - (Ra - r2)) < 1e-4);
  // Berührpunkte E und F müssen im Abstand Ra von D liegen
  assert(Math.abs(res.distDE - Ra) < 1e-4);
  assert(Math.abs(res.distDF - Ra) < 1e-4);
  // E auf Kreis 1, F auf Kreis 2
  assert(Math.abs(Core.dist(M1, res.E) - r1) < 1e-4);
  assert(Math.abs(Core.dist(M2, res.F) - r2) < 1e-4);
});

test('Fehlerbehandlung: Ra kleiner als Kreisradien schlägt fehl', () => {
  const M1 = Core.pt(150, 200);
  const M2 = Core.pt(350, 200);
  const res = Core.constructTwoCircleBlend(M1, 40, M2, 60, 50, 55);
  assert(!res.ok);
  assert.strictEqual(res.reason, 'ra_too_small_for_circles');
});

// =========================================================================
// 5. Regelmäßiges Vieleck im Umkreis (z. B. Fünfeck)
// =========================================================================
console.log('\n--- 5. Regelmäßiges Vieleck im Umkreis ---');

test('Fünfeck: 5 Ecken liegen exakt auf dem Umkreis mit Radius R', () => {
  const M = Core.pt(250, 250);
  const R = 90;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert.strictEqual(res.vertices.length, 5);
  for (let i = 0; i < 5; i++) {
    const d = Core.dist(M, res.vertices[i].pt);
    assert(Math.abs(d - R) < 1e-4, `Ecke ${i} muss auf Umkreis liegen (|dist - R| < 1e-4)`);
  }
});

test('Fünfeck (Bion-Näherung): Kantenlängengenauigkeit liegt über 99% (analytisch 99,15%)', () => {
  const M = Core.pt(250, 250);
  const R = 100;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert(res.relAccuracyPct > 99.0, `Genauigkeit (${res.relAccuracyPct}%) muss > 99.0% sein`);
});

test('Polpunkte C und D liegen im Abstand R*sqrt(3) vom Mittelpunkt', () => {
  const M = Core.pt(200, 200);
  const R = 80;
  const res = Core.constructRegularPolygonApprox(M, R, 5);
  assert(res.ok);
  assert(Math.abs(Core.dist(M, res.C) - 80 * Math.sqrt(3)) < 1e-4);
  assert(Math.abs(Core.dist(M, res.D) - 80 * Math.sqrt(3)) < 1e-4);
});

test('Gerades Vieleck (z. B. Sechseck n=6): liefert 6 Ecken auf dem Kreis', () => {
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
// 6. Sechseck, Zwölfeck im Umkreis
// =========================================================================
console.log('\n--- 6. Sechseck, Zwölfeck im Umkreis ---');

test('Sechseck: Kantenlänge entspricht exakt dem Radius (s = r = d/2)', () => {
  const M = Core.pt(200, 200);
  const R = 70;
  const res = Core.constructHexagonDodecagon(M, R, 'hexagon');
  assert(res.ok);
  assert.strictEqual(res.sHex, R);
  assert.strictEqual(res.hexVertices.length, 6);
  for (let i = 0; i < 6; i++) {
    const p1 = res.hexVertices[i];
    const p2 = res.hexVertices[(i + 1) % 6];
    assert(Math.abs(Core.dist(p1, p2) - R) < 1e-4, 'Jede Sechseck-Kante muss exakt r lang sein');
  }
});

test('Sechseck: Schlüsselweite SW = d * sqrt(3) / 2', () => {
  const M = Core.pt(200, 200);
  const R = 50; // d = 100
  const res = Core.constructHexagonDodecagon(M, R, 'hexagon');
  const expectedSW = 100 * Math.sqrt(3) / 2; // ≈ 86.6025
  assert(Math.abs(res.swHex - expectedSW) < 1e-3);
});

test('Zwölfeck: Liefert exakt 12 Ecken im 30°-Abstand auf dem Umkreis', () => {
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
    assert(Math.abs(Core.dist(p1, p2) - expectedS12) < 1e-3, 'Zwölfeck-Kanten müssen gleich lang sein');
  }
});

test('Tangentialität Beweis: A, B, M1 sowie A, C, M2 liegen auf einer Geraden (Kollinearität)', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  // Kollinearität: Kreuzprodukt (B - A) x (M1 - A) == 0
  const vAB = Core.sub(res.B, res.A);
  const vAM1 = Core.sub(M1, res.A);
  assert(Math.abs(Core.cross(vAB, vAM1)) < 1e-4, 'A, B und M1 müssen exakt kollinear sein');
  const vAC = Core.sub(res.C, res.A);
  const vAM2 = Core.sub(M2, res.A);
  assert(Math.abs(Core.cross(vAC, vAM2)) < 1e-4, 'A, C und M2 müssen exakt kollinear sein');
});

test('Tangentialität Beweis Außenbogen: D, M1, E sowie D, M2, F sind kollinear', () => {
  const M1 = Core.pt(180, 220);
  const r1 = 30;
  const M2 = Core.pt(380, 220);
  const r2 = 50;
  const Ri = 70;
  const Ra = 160;
  const res = Core.constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra);
  const vDM1 = Core.sub(M1, res.D);
  const vDE = Core.sub(res.E, res.D);
  assert(Math.abs(Core.cross(vDM1, vDE)) < 1e-4, 'D, M1 und E müssen kollinear sein');
  const vDM2 = Core.sub(M2, res.D);
  const vDF = Core.sub(res.F, res.D);
  assert(Math.abs(Core.cross(vDM2, vDF)) < 1e-4, 'D, M2 und F müssen kollinear sein');
});

test('Maschinenbau-Normgrößen: DIN EN ISO 4014 (Sechskantschraube M10 SW 17 -> e = 19,63 mm)', () => {
  // SW = 17 mm -> r_i = 8.5 mm -> R = SW / sqrt(3) = 9.81495 mm -> d = e = 19.6299 mm
  const sw = 17;
  const R = (sw / 2) / Math.cos(30 * Math.PI / 180);
  const res = Core.constructHexagonDodecagon(Core.pt(0, 0), R, 'hexagon');
  assert(Math.abs(res.swHex - sw) < 1e-3);
  assert(Math.abs(res.d - 19.63) < 0.01);
});

console.log(`\nErgebnis: ${passed} von ${total} Tests bestanden.`);
if (passed !== total) process.exit(1);
