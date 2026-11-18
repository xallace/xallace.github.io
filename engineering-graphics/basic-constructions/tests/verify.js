// Verifies the geometric calculation core across all 6 basic compass-and-straightedge constructions:
// node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : `  (expected ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// 1. Number formatting & vector fundamentals
check('fmt 12.5', C.fmt(12.5, 1), '12.5');
check('fmt -3.25 with true minus sign', C.fmt(-3.25, 2), '−3.25');
check('parseNum "42,5 mm"', C.parseNum('42,5 mm'), 42.5);
check('dist (0,0)-(3,4) = 5', C.dist(C.pt(0, 0), C.pt(3, 4)), 5, 1e-9);
check('mid (2,4)-(6,8) = (4,6)', `${C.mid(C.pt(2, 4), C.pt(6, 8)).x};${C.mid(C.pt(2, 4), C.pt(6, 8)).y}`, '4;6');
check('angleVectorsDeg orthogonal = 90°', C.angleVectorsDeg(C.pt(1, 0), C.pt(0, 5)), 90, 1e-9);

// 2. Circle-circle & circle-line intersections
const ic = C.intersectCircles(C.pt(0, 0), 5, C.pt(6, 0), 5);
check('intersectCircles d=6, r=5 yields 2 points', ic.ok, true);
check('intersectCircles height h = 4 (3-4-5 triangle)', ic.h, 4, 1e-9);
check('intersectCircles S1 = (3, 4)', `${ic.points[0].x};${ic.points[0].y}`, '3;4');
check('intersectCircles S2 = (3, -4)', `${ic.points[1].x};${ic.points[1].y}`, '3;-4');
const icTooSmall = C.intersectCircles(C.pt(0, 0), 2.5, C.pt(6, 0), 2.5);
check('intersectCircles r = 1/2 d = 3 minus 0.5 does not intersect', icTooSmall.ok, false);

const cl = C.intersectCircleLine(C.pt(5, 3), 5, C.pt(0, 0), C.pt(10, 0));
check('intersectCircleLine dist 3, radius 5 gives chord 8', cl.chord, 8, 1e-9);
check('intersectCircleLine intersection A = (1, 0)', cl.points[0].x, 1, 1e-9);
check('intersectCircleLine intersection B = (9, 0)', cl.points[1].x, 9, 1e-9);

// 3. Construction 1: Parallel line to a segment (rhombus ACDP with radius r = |AP|)
const par = C.constructParallel(C.pt(0, 0), C.pt(120, 0), C.pt(36, 48));
check('Parallel: valid construction', par.ok, true);
check('Parallel: radius r = |AP| = 60 (36-48-60)', par.r, 60, 1e-6);
check('Parallel: intersection C on AB at (60, 0)', `${par.C.x};${par.C.y}`, '60;0');
check('Parallel: intersection D at (96, 48)', `${par.D.x};${par.D.y}`, '96;48');
check('Parallel: rhombus |AC| = |CD| = |DP| = |PA| = r', par.isRhombus && par.distCD === 60 && par.distPD === 60, true);
check('Parallel: angle deviation between AB and PD is 0°', par.angleDiffDeg, 0, 1e-6);
check('Parallel: perpendicular distance h = 48', par.distH, 48, 1e-6);
// Also test for oblique segment AB:
const parRot = C.constructParallel(C.pt(10, 20), C.pt(110, 70), C.pt(30, 80));
check('Parallel (oblique): PD exactly parallel to AB (0°)', parRot.angleDiffDeg, 0, 1e-5);
check('Parallel (oblique): |PD| = |AC| = r', Math.abs(parRot.distPD - parRot.r) < 1e-5, true);

// 4. Construction 2: Bisecting a segment (perpendicular bisector, r > 1/2 AB)
const bis = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 65);
check('Bisect segment: valid for r = 65 > 50', bis.ok, true);
check('Bisect segment: midpoint M at (50, 0)', `${bis.M.x};${bis.M.y}`, '50;0');
check('Bisect segment: |AM| = |MB| = 50', bis.distAM === 50 && bis.distMB === 50, true);
check('Bisect segment: perpendicular bisector meets AB at 90°', bis.perpAngleDeg, 90, 1e-6);
check('Bisect segment: symmetry |AS1| = |BS1| = r', C.dist(bis.A, bis.S1), 65, 1e-6);
const bisFail = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 48);
check('Bisect segment: r = 48 <= 1/2 AB detected as invalid', bisFail.ok, false);
const bisTangent = C.constructBisector(C.pt(0, 0), C.pt(100, 0), 50);
check('Bisect segment: r = 50 == 1/2 AB (tangent only) invalid', bisTangent.reason, 'tangent_equal_half');

// 5. Construction 3: Dropping a perpendicular from P to line g
const drop = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 75, 65);
check('Drop perpendicular: valid for r1 = 75 > d = 60', drop.ok, true);
check('Drop perpendicular: foot F at (90, 0)', `${drop.foot.x};${drop.foot.y}`, '90;0');
check('Drop perpendicular: half-chord = sqrt(75² - 60²) = 45 -> A=(45,0), B=(135,0)', `${drop.A.x};${drop.B.x}`, '45;135');
check('Drop perpendicular: chord length AB = 90', drop.abLen, 90, 1e-6);
check('Drop perpendicular: intersection C lies directly below P (x = 90)', drop.C.x, 90, 1e-6);
check('Drop perpendicular: angle between PC and line g is exactly 90°', drop.perpAngleDeg, 90, 1e-6);
const dropFail1 = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 55, 65);
check('Drop perpendicular: r1 = 55 < d = 60 fails at step 1', dropFail1.stepFailed, 1);
const dropFail2 = C.constructDropPerp(C.pt(0, 0), C.pt(200, 0), C.pt(90, 60), 75, 40);
check('Drop perpendicular: r2 = 40 < 1/2 AB = 45 fails at step 2', dropFail2.stepFailed, 2);

// 6. Construction 4: Erecting a perpendicular at point P (60° arcs / Thales' theorem)
const erect = C.constructErectPerp(C.pt(100, 0), 0, 60, 'left', 1);
check('Erect perpendicular: valid construction', erect.ok, true);
check('Erect perpendicular: |PA| = r = 60', erect.distPA, 60, 1e-6);
check('Erect perpendicular: |AB| = r = 60 (equilateral triangle)', erect.distAB, 60, 1e-6);
check('Erect perpendicular: |BP| = r = 60 (equilateral triangle)', erect.distBP, 60, 1e-6);
check('Erect perpendicular: interior angle ∠PAB = 60°', erect.anglePAB, 60, 1e-6);
check('Erect perpendicular: |BC| = r = 60 (extension to arc 3)', erect.distBC, 60, 1e-6);
check('Erect perpendicular: hypotenuse |AC| = 2·r = 120 (Thales circle)', erect.distAC, 120, 1e-6);
check('Erect perpendicular: height |PC| = r·√3 ≈ 103.923', erect.distPC, 60 * Math.sqrt(3), 1e-5);
check('Erect perpendicular: C lies directly above P (x = 100)', erect.C.x, 100, 1e-6);
check('Erect perpendicular: angle ∠APC = 90°', erect.perpAngleDeg, 90, 1e-6);

// 7. Construction 5: Bisecting an angle α
const ang = C.constructAngleBisector(C.pt(0, 0), 0, 64, 80, 55);
check('Bisect angle: valid for α = 64°', ang.ok, true);
check('Bisect angle: half-angle α/2 = 32°', ang.halfAlphaDeg, 32, 1e-6);
check('Bisect angle: sub-angle 1 ∠BSC = 32°', ang.measuredHalf1, 32, 1e-6);
check('Bisect angle: sub-angle 2 ∠ASC = 32°', ang.measuredHalf2, 32, 1e-6);
check('Bisect angle: chord AB = 2·r1·sin(32°)', ang.abLen, 2 * 80 * Math.sin(32 * Math.PI / 180), 1e-5);
const angFail = C.constructAngleBisector(C.pt(0, 0), 0, 90, 80, 40);
check('Bisect angle: too-small radius r2 <= 1/2 AB detected', angFail.ok, false);

// 8. Construction 6: Dividing a segment into n = 5 equal parts (default intercept-theorem example)
const div5 = C.constructDivideSegment(C.pt(0, 0), C.pt(150, 0), 5, -35, 28);
check('Divide segment (n=5): valid', div5.ok, true);
check('Divide segment (n=5): part length Δl = 150 / 5 = 30', div5.partLen, 30, 1e-6);
check('Divide segment (n=5): 5 division points on AB and 5 helper points on ray', div5.divPts.length === 5 && div5.rayPts.length === 5, true);
check('Divide segment (n=5): point 1 at x = 30 (ratio 1/5 = 0.2)', div5.divPts[0].distFromA, 30, 1e-6);
check('Divide segment (n=5): point 3 at x = 90 (ratio 3/5 = 0.6)', div5.divPts[2].distFromA, 90, 1e-6);
check('Divide segment (n=5): point 5 coincides with B (x = 150)', div5.divPts[4].distFromA, 150, 1e-6);
check('Divide segment (n=5): helper ray total length 5 · 28 = 140', div5.totalRayLen, 140, 1e-6);
// Intercept theorem: all connecting lines k' -> k are parallel to each other
let allParallel = true;
for (let k = 0; k < 5; k++) {
  const degK = C.angleBetween(div5.rayPts[k].pt, div5.divPts[k].pt);
  if (Math.abs(degK - div5.parallelAngleDeg) > 1e-5) allParallel = false;
}
check('Divide segment (n=5): all parallels 1′1 … 5′B have exact same angle', allParallel, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
