// Prüft den geometrischen Rechenkern gegen alle 6 Grundkonstruktionen von Tabellenbuch Metall S. 60:
// node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FEHL'} ${name}: ${got}${ok ? '' : `  (erwartet ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// 1. Zahlenformat & Vektor-Grundlagen
check('fmt 12.5', C.fmt(12.5, 1), '12,5');
check('fmt -3.25 mit echtem Minuszeichen', C.fmt(-3.25, 2), '−3,25');
check('parseNum „42,5 mm“', C.parseNum('42,5 mm'), 42.5);
check('dist (0,0)-(3,4) = 5', C.dist(C.pt(0, 0), C.pt(3, 4)), 5, 1e-9);
check('mid (2,4)-(6,8) = (4,6)', `${C.mid(C.pt(2, 4), C.pt(6, 8)).x};${C.mid(C.pt(2, 4), C.pt(6, 8)).y}`, '4;6');
check('angleVectorsDeg orthogonal = 90°', C.angleVectorsDeg(C.pt(1, 0), C.pt(0, 5)), 90, 1e-9);

// 2. Kreisschnittpunkte & Kreis-Gerade-Schnitt
const ic = C.intersectCircles(C.pt(0, 0), 5, C.pt(6, 0), 5);
check('intersectCircles d=6, r=5 liefert 2 Punkte', ic.ok, true);
check('intersectCircles Höhe h = 4 (3-4-5-Dreieck)', ic.h, 4, 1e-9);
check('intersectCircles S1 = (3, 4)', `${ic.points[0].x};${ic.points[0].y}`, '3;4');
check('intersectCircles S2 = (3, -4)', `${ic.points[1].x};${ic.points[1].y}`, '3;-4');
const icTooSmall = C.intersectCircles(C.pt(0, 0), 2.5, C.pt(6, 0), 2.5);
check('intersectCircles r = 1/2 d = 3 minus 0.5 schneidet nicht', icTooSmall.ok, false);

const cl = C.intersectCircleLine(C.pt(5, 3), 5, C.pt(0, 0), C.pt(10, 0));
check('intersectCircleLine Abstand 3, Radius 5 liefert Sehne 8', cl.chord, 8, 1e-9);
check('intersectCircleLine Schnittpunkt A = (1, 0)', cl.points[0].x, 1, 1e-9);
check('intersectCircleLine Schnittpunkt B = (9, 0)', cl.points[1].x, 9, 1e-9);

// 3. Konstruktion 1: Parallele zu einer Strecke (Raute ACDP mit Radius r = |AP|)
const par = C.constructParallel(C.pt(0, 0), C.pt(120, 0), C.pt(36, 48));
check('Parallele: Konstruktion gültig', par.ok, true);
check('Parallele: Radius r = |AP| = 60 (36-48-60)', par.r, 60, 1e-6);
check('Parallele: Schnittpunkt C auf AB bei (60, 0)', `${par.C.x};${par.C.y}`, '60;0');
check('Parallele: Schnittpunkt D bei (96, 48)', `${par.D.x};${par.D.y}`, '96;48');
check('Parallele: Raute |AC| = |CD| = |DP| = |PA| = r', par.isRhombus && par.distCD === 60 && par.distPD === 60, true);
check('Parallele: Winkelabweichung zwischen AB und PD ist 0°', par.angleDiffDeg, 0, 1e-6);
check('Parallele: Lotabstand h = 48', par.distH, 48, 1e-6);
// Auch für schräge Strecke AB testen:
const parRot = C.constructParallel(C.pt(10, 20), C.pt(110, 70), C.pt(30, 80));
check('Parallele (schräg): PD exakt parallel zu AB (0°)', parRot.angleDiffDeg, 0, 1e-5);
check('Parallele (schräg): |PD| = |AC| = r', Math.abs(parRot.distPD - parRot.r) < 1e-5, true);

// 4. Konstruktion 2: Halbieren einer Strecke (Mittelsenkrechte, r > 1/2 AB)
const bis = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 65);
check('Strecke halbieren: gültig für r = 65 > 50', bis.ok, true);
check('Strecke halbieren: Mittelpunkt M bei (50, 0)', `${bis.M.x};${bis.M.y}`, '50;0');
check('Strecke halbieren: |AM| = |MB| = 50', bis.distAM === 50 && bis.distMB === 50, true);
check('Strecke halbieren: Mittelsenkrechte steht unter 90° auf AB', bis.perpAngleDeg, 90, 1e-6);
check('Strecke halbieren: Symmetrie |AS1| = |BS1| = r', C.dist(bis.A, bis.S1), 65, 1e-6);
const bisFail = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 48);
check('Strecke halbieren: r = 48 <= 1/2 AB wird als ungültig erkannt', bisFail.ok, false);
const bisTangent = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 50);
check('Strecke halbieren: r = 50 == 1/2 AB (nur Berührpunkt) ungültig', bisTangent.reason, 'tangent_equal_half');

// 5. Konstruktion 3: Fällen eines Lotes von P auf Gerade g
const drop = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 75, 65);
check('Lot fällen: gültig für r1 = 75 > d = 60', drop.ok, true);
check('Lot fällen: Lotfußpunkt F bei (90, 0)', `${drop.foot.x};${drop.foot.y}`, '90;0');
check('Lot fällen: Halbe Sehne = sqrt(75² - 60²) = 45 -> A=(45,0), B=(135,0)', `${drop.A.x};${drop.B.x}`, '45;135');
check('Lot fällen: Sehnenlänge AB = 90', drop.abLen, 90, 1e-6);
check('Lot fällen: Schnittpunkt C liegt senkrecht unter P (x = 90)', drop.C.x, 90, 1e-6);
check('Lot fällen: Winkel zwischen PC und Gerade g ist exakt 90°', drop.perpAngleDeg, 90, 1e-6);
const dropFail1 = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 55, 65);
check('Lot fällen: r1 = 55 < d = 60 scheitert in Schritt 1', dropFail1.stepFailed, 1);
const dropFail2 = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 75, 40);
check('Lot fällen: r2 = 40 < 1/2 AB = 45 scheitert in Schritt 2', dropFail2.stepFailed, 2);

// 6. Konstruktion 4: Errichten einer Senkrechten im Punkt P (60°-Bögen / Satz des Thales)
const erect = C.constructErectPerp(C.pt(100, 0), 0, 60, 'left', 1);
check('Senkrechte errichten: Konstruktion gültig', erect.ok, true);
check('Senkrechte errichten: |PA| = r = 60', erect.distPA, 60, 1e-6);
check('Senkrechte errichten: |AB| = r = 60 (gleichseitiges Dreieck)', erect.distAB, 60, 1e-6);
check('Senkrechte errichten: |BP| = r = 60 (gleichseitiges Dreieck)', erect.distBP, 60, 1e-6);
check('Senkrechte errichten: Innenwinkel ∠PAB = 60°', erect.anglePAB, 60, 1e-6);
check('Senkrechte errichten: |BC| = r = 60 (Verlängerung auf Bogen 3)', erect.distBC, 60, 1e-6);
check('Senkrechte errichten: Hypotenuse |AC| = 2·r = 120 (Thaleskreis)', erect.distAC, 120, 1e-6);
check('Senkrechte errichten: Höhe |PC| = r·√3 ≈ 103,923', erect.distPC, 60 * Math.sqrt(3), 1e-5);
check('Senkrechte errichten: C liegt exakt senkrecht über P (x = 100)', erect.C.x, 100, 1e-6);
check('Senkrechte errichten: Winkel ∠APC = 90°', erect.perpAngleDeg, 90, 1e-6);

// 7. Konstruktion 5: Halbieren eines Winkels α
const ang = C.constructAngleBisector(C.pt(0, 0), 0, 64, 80, 55);
check('Winkel halbieren: gültig für α = 64°', ang.ok, true);
check('Winkel halbieren: Halbwinkel α/2 = 32°', ang.halfAlphaDeg, 32, 1e-6);
check('Winkel halbieren: Teilwinkel 1 ∠BSC = 32°', ang.measuredHalf1, 32, 1e-6);
check('Winkel halbieren: Teilwinkel 2 ∠ASC = 32°', ang.measuredHalf2, 32, 1e-6);
check('Winkel halbieren: Sehne AB = 2·r1·sin(32°)', ang.abLen, 2 * 80 * Math.sin(32 * Math.PI / 180), 1e-5);
const angFail = C.constructAngleBisector(C.pt(0, 0), 0, 90, 80, 40);
check('Winkel halbieren: zu kleiner Radius r2 <= 1/2 AB wird erkannt', angFail.ok, false);

// 8. Konstruktion 6: Teilen einer Strecke in n = 5 gleiche Teile (Buchbeispiel S. 60 unten)
const div5 = C.constructDivideSegment(C.pt(0, 0), C.pt(150, 0), 5, -35, 28);
check('Strecke teilen (n=5): gültig', div5.ok, true);
check('Strecke teilen (n=5): Teillänge Δl = 150 / 5 = 30', div5.partLen, 30, 1e-6);
check('Strecke teilen (n=5): 5 Teilpunkte auf AB und 5 Hilfspunkte auf Strahl', div5.divPts.length === 5 && div5.rayPts.length === 5, true);
check('Strecke teilen (n=5): Punkt 1 bei x = 30 (Verhältnis 1/5 = 0,2)', div5.divPts[0].distFromA, 30, 1e-6);
check('Strecke teilen (n=5): Punkt 3 bei x = 90 (Verhältnis 3/5 = 0,6)', div5.divPts[2].distFromA, 90, 1e-6);
check('Strecke teilen (n=5): Punkt 5 fällt exakt auf B (x = 150)', div5.divPts[4].distFromA, 150, 1e-6);
check('Strecke teilen (n=5): Hilfsstrahl Gesamtlänge 5 · 28 = 140', div5.totalRayLen, 140, 1e-6);
// Strahlensatz: alle Verbindungsgeraden k' -> k sind zueinander parallel
let allParallel = true;
for (let k = 0; k < 5; k++) {
  const degK = C.angleBetween(div5.rayPts[k].pt, div5.divPts[k].pt);
  if (Math.abs(degK - div5.parallelAngleDeg) > 1e-5) allParallel = false;
}
check('Strecke teilen (n=5): Alle Parallelen 1′1 … 5′B haben exakt denselben Winkel', allParallel, true);

console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
