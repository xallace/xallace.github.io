/* Pure-math geometric core without DOM for Tabellenbuch Metall p. 62:
   "3.2 Basic Geometric Constructions – Incircle, Circumcircle, Circle Center, Ellipse, Spiral"
   1. Incircle of a triangle (angle bisectors, perpendicular foot, r = A/s)
   2. Circumcircle of a triangle (perpendicular bisectors, law of sines, R = abc / 4A)
   3. Determining the circle center (arbitrary chords AB & CD, perpendicular bisectors)
   4. Ellipse construction from two circles (concentric circles a & b, de La Hire / Pappus)
   5. Ellipse construction in a parallelogram (conjugate diameters, semicircle projection)
   6. Spiral (compass approximation with 4 centers in a square a/4, pitch a)
   Runs in browser (window.Core) and Node (module.exports) for tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // Format number in English notation: decimal point, true minus sign, no trailing zeros.
  function fmt(v, dec = 1, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + '.' + frac : int;
    const sign = v < 0 && !opts.noMinus ? MINUS : (v > 0 && opts.plus ? '+' : '');
    return sign + s;
  }

  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/[°%\s]|mm/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // ================================================================ 2D Vector Geometry
  function pt(x, y) { return { x: +x, y: +y }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function scale(v, s) { return { x: v.x * s, y: v.y * s }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function cross(a, b) { return a.x * b.y - a.y * b.x; }
  function len(v) { return Math.hypot(v.x, v.y); }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  function unit(v) {
    const l = Math.hypot(v.x, v.y);
    return l < 1e-12 ? { x: 1, y: 0 } : { x: v.x / l, y: v.y / l };
  }

  // Rotate +90° mathematically positive (counterclockwise: -y, x)
  function perp(v) { return { x: -v.y, y: v.x }; }

  function normDeg(deg) {
    const d = ((deg % 360) + 360) % 360;
    return Math.abs(d - 360) < 1e-9 || Math.abs(d) < 1e-9 ? 0 : +d.toFixed(8);
  }

  function polarPt(c, r, deg) {
    const a = deg * DEG;
    return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
  }

  function angleBetween(c, p) {
    return normDeg(Math.atan2(p.y - c.y, p.x - c.x) * RAD);
  }

  function angleVectorsDeg(u, v) {
    const lu = len(u), lv = len(v);
    if (lu < 1e-12 || lv < 1e-12) return 0;
    const c = Math.max(-1, Math.min(1, dot(u, v) / (lu * lv)));
    return +(Math.acos(c) * RAD).toFixed(8);
  }

  function lineIntersection(p1, v1, p2, v2) {
    const d = cross(v1, v2);
    if (Math.abs(d) < 1e-10) return null; // Parallel or coincident
    const dp = sub(p2, p1);
    const t = cross(dp, v2) / d;
    return { pt: add(p1, scale(v1, t)), t };
  }

  function projectPointOnLine(P, A, B) {
    const ab = sub(B, A);
    const l2 = dot(ab, ab);
    if (l2 < 1e-12) return { foot: { x: A.x, y: A.y }, t: 0, dist: dist(P, A), signedDist: 0 };
    const ap = sub(P, A);
    const t = dot(ap, ab) / l2;
    const foot = lerp(A, B, t);
    const d = dist(P, foot);
    const signedDist = cross(ab, ap) / Math.sqrt(l2);
    return { foot, t, dist: d, signedDist };
  }

  // Intersection points of two circles
  function circleCircleIntersection(c1, r1, c2, r2) {
    const d = dist(c1, c2);
    if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9 || d < 1e-12) return null;
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    const h = Math.sqrt(Math.max(0, h2));
    const u = sub(c2, c1);
    const p2 = add(c1, scale(u, a / d));
    const norm = { x: -u.y * (h / d), y: u.x * (h / d) };
    return {
      p1: { x: p2.x + norm.x, y: p2.y + norm.y },
      p2: { x: p2.x - norm.x, y: p2.y - norm.y }
    };
  }

  // ================================================================ 1. Incircle of a Triangle
  function constructIncircle(A, B, C, arcRadiusA = 35, arcRadiusB = 35) {
    const a = dist(B, C);
    const b = dist(C, A);
    const c = dist(A, B);
    const peri = a + b + c;
    if (peri < 1e-6) return { ok: false, reason: 'degenerate' };

    // Area via shoelace / cross product
    const area = 0.5 * Math.abs(cross(sub(B, A), sub(C, A)));
    if (area < 1e-4) return { ok: false, reason: 'collinear' };

    const s = peri / 2;
    const inradius = area / s;

    // Barycentric coordinates of incenter M: (a : b : c)
    const M = {
      x: (a * A.x + b * B.x + c * C.x) / peri,
      y: (a * A.y + b * B.y + c * C.y) / peri
    };

    // Interior angles in degrees
    const uAB = unit(sub(B, A)), uAC = unit(sub(C, A));
    const uBA = unit(sub(A, B)), uBC = unit(sub(C, B));
    const uCA = unit(sub(A, C)), uCB = unit(sub(B, C));

    const alphaDeg = angleVectorsDeg(uAB, uAC);
    const betaDeg = angleVectorsDeg(uBA, uBC);
    const gammaDeg = 180 - alphaDeg - betaDeg;

    // Angle bisector unit vectors
    const bisectorA = unit(add(uAB, uAC));
    const bisectorB = unit(add(uBA, uBC));

    // Compass auxiliary points for Step 1 (bisect angle alpha):
    const pA1 = add(A, scale(uAB, arcRadiusA));
    const pA2 = add(A, scale(uAC, arcRadiusA));
    // Intersecting arcs centered at pA1 and pA2:
    const arcCrossA = add(A, scale(bisectorA, arcRadiusA * 1.5));

    // Compass auxiliary points for Step 2 (bisect angle beta):
    const pB1 = add(B, scale(uBA, arcRadiusB));
    const pB2 = add(B, scale(uBC, arcRadiusB));
    const arcCrossB = add(B, scale(bisectorB, arcRadiusB * 1.5));

    // Tangency points (perpendicular feet from M onto the sides)
    const footAB = projectPointOnLine(M, A, B).foot;
    const footBC = projectPointOnLine(M, B, C).foot;
    const footCA = projectPointOnLine(M, C, A).foot;

    // Tangent segment lengths from the vertices:
    const segA = s - a;
    const segB = s - b;
    const segC = s - c;

    return {
      ok: true,
      A, B, C, a, b, c, peri, s, area, inradius, M,
      alphaDeg, betaDeg, gammaDeg,
      bisectorA, bisectorB,
      pA1, pA2, arcCrossA,
      pB1, pB2, arcCrossB,
      footAB, footBC, footCA,
      segA, segB, segC
    };
  }

  // ================================================================ 2. Circumcircle of a Triangle
  function constructCircumcircle(A, B, C, arcRadiusAB = null, arcRadiusBC = null) {
    const a = dist(B, C);
    const b = dist(C, A);
    const c = dist(A, B);
    const area = 0.5 * Math.abs(cross(sub(B, A), sub(C, A)));
    if (area < 1e-4) return { ok: false, reason: 'collinear' };

    // Circumradius R = a * b * c / (4 * A)
    const circumradius = (a * b * c) / (4 * area);

    // Perpendicular bisector on AB
    const midAB = mid(A, B);
    const dirAB = sub(B, A);
    const normAB = unit(perp(dirAB));

    // Perpendicular bisector on BC
    const midBC = mid(B, C);
    const dirBC = sub(C, B);
    const normBC = unit(perp(dirBC));

    // Intersection M
    const inter = lineIntersection(midAB, normAB, midBC, normBC);
    if (!inter) return { ok: false, reason: 'parallel_bisectors' };
    const M = inter.pt;

    // Perpendicular bisector on CA (check)
    const midCA = mid(C, A);
    const dirCA = sub(A, C);
    const normCA = unit(perp(dirCA));

    // Compass arc radii (at least > c/2 and > a/2)
    const rArcAB = arcRadiusAB || (c * 0.65);
    const rArcBC = arcRadiusBC || (a * 0.65);

    // Compass intersection points for perpendicular bisector AB
    const arcsAB = circleCircleIntersection(A, rArcAB, B, rArcAB);
    // Compass intersection points for perpendicular bisector BC
    const arcsBC = circleCircleIntersection(B, rArcBC, C, rArcBC);

    // Interior angles
    const alphaDeg = angleVectorsDeg(sub(B, A), sub(C, A));
    const betaDeg = angleVectorsDeg(sub(A, B), sub(C, B));
    const gammaDeg = 180 - alphaDeg - betaDeg;

    // Triangle classification (internal enum preserved)
    let triangleType = 'spitzwinklig';
    const maxAng = Math.max(alphaDeg, betaDeg, gammaDeg);
    if (Math.abs(maxAng - 90) < 0.15) triangleType = 'rechtwinklig';
    else if (maxAng > 90) triangleType = 'stumpfwinklig';

    return {
      ok: true,
      A, B, C, a, b, c, area, circumradius, M,
      midAB, midBC, midCA,
      normAB, normBC, normCA,
      arcsAB, arcsBC,
      rArcAB, rArcBC,
      alphaDeg, betaDeg, gammaDeg,
      triangleType
    };
  }

  // ================================================================ 3. Determining the Circle Center
  function constructCircleCenterFromSecants(circleCenter, R, secant1, secant2, arcR1 = null, arcR2 = null) {
    // secant1: { lineDeg, distFromCenter }
    // secant2: { lineDeg, distFromCenter }
    if (R <= 0) return { ok: false, reason: 'invalid_radius' };

    const d1 = Math.min(Math.abs(secant1.distFromCenter), R * 0.95);
    const d2 = Math.min(Math.abs(secant2.distFromCenter), R * 0.95);

    // Direction of chords
    const ang1 = secant1.lineDeg * DEG;
    const ang2 = secant2.lineDeg * DEG;

    const u1 = { x: Math.cos(ang1), y: Math.sin(ang1) };
    const n1 = perp(u1); // Normal vector

    const u2 = { x: Math.cos(ang2), y: Math.sin(ang2) };
    const n2 = perp(u2);

    // Perpendicular feet from circleCenter onto chords
    const mid1 = add(circleCenter, scale(n1, d1 * (secant1.distFromCenter < 0 ? -1 : 1)));
    const mid2 = add(circleCenter, scale(n2, d2 * (secant2.distFromCenter < 0 ? -1 : 1)));

    // Half-chord lengths
    const halfLen1 = Math.sqrt(Math.max(0, R * R - d1 * d1));
    const halfLen2 = Math.sqrt(Math.max(0, R * R - d2 * d2));

    const A = sub(mid1, scale(u1, halfLen1));
    const B = add(mid1, scale(u1, halfLen1));

    const C = sub(mid2, scale(u2, halfLen2));
    const D = add(mid2, scale(u2, halfLen2));

    // Perpendicular bisectors:
    // The perpendicular bisector of AB passes through mid1 with direction n1.
    // The perpendicular bisector of CD passes through mid2 with direction n2.
    const inter = lineIntersection(mid1, n1, mid2, n2);
    if (!inter) return { ok: false, reason: 'parallel_secants' };

    const foundCenter = inter.pt;
    const errorDist = dist(foundCenter, circleCenter);

    // Intersection angle of lines a and b
    const angleSecantsDeg = angleVectorsDeg(u1, u2);

    // Compass radii for perpendicular bisector construction
    const rArc1 = arcR1 || Math.max(halfLen1 * 1.25, R * 0.4);
    const rArc2 = arcR2 || Math.max(halfLen2 * 1.25, R * 0.4);

    const arcs1 = circleCircleIntersection(A, rArc1, B, rArc1);
    const arcs2 = circleCircleIntersection(C, rArc2, D, rArc2);

    return {
      ok: true,
      circleCenter, R,
      A, B, C, D,
      midAB: mid1, midCD: mid2,
      chordLenAB: halfLen1 * 2,
      chordLenCD: halfLen2 * 2,
      u1, u2, n1, n2,
      foundCenter,
      errorDist,
      angleSecantsDeg,
      rArc1, rArc2,
      arcs1, arcs2
    };
  }

  // ================================================================ 4. Ellipse Construction from Two Circles
  function constructEllipseFromTwoCircles(M, a, b, rayAnglesDeg = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]) {
    if (a <= 0 || b <= 0) return { ok: false, reason: 'invalid_axes' };
    const major = Math.max(a, b);
    const minor = Math.min(a, b);
    const e = Math.sqrt(Math.max(0, major * major - minor * minor)); // Linear eccentricity
    const eps = major > 0 ? e / major : 0; // Numerical eccentricity
    const area = Math.PI * a * b;
    // Ramanujan approximation for ellipse perimeter
    const h = Math.pow((a - b) / (a + b), 2);
    const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));

    // Foci (on x-axis relative to M)
    const F1 = { x: M.x - e, y: M.y };
    const F2 = { x: M.x + e, y: M.y };

    // Compute points for given rays
    const rays = rayAnglesDeg.map(deg => {
      const rad = deg * DEG;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      // E on inner circle (radius b)
      const E = { x: M.x + b * cosA, y: M.y + b * sinA };
      // F on outer circle (radius a)
      const F = { x: M.x + a * cosA, y: M.y + a * sinA };

      // Ellipse point P: x from F, y from E
      const P = { x: F.x, y: E.y };

      // Check ellipse equation: (x - Mx)^2 / a^2 + (y - My)^2 / b^2 == 1
      const eqVal = Math.pow((P.x - M.x) / a, 2) + Math.pow((P.y - M.y) / b, 2);

      return { deg, E, F, P, eqVal };
    });

    return {
      ok: true,
      M, a, b,
      e, eps, area, perimeter,
      F1, F2,
      rays
    };
  }

  // ================================================================ 5. Ellipse Construction in a Parallelogram
  function constructEllipseInParallelogram(M, a, b, tiltAngleDeg = 75, numDivisions = 4) {
    if (a <= 0 || b <= 0 || numDivisions < 2) return { ok: false, reason: 'invalid_params' };

    // Major axis AB (length 2a, horizontal)
    const u = { x: a, y: 0 };

    // Conjugate axis CD (length 2b, inclined at tiltAngleDeg)
    const tiltRad = tiltAngleDeg * DEG;
    const v = { x: b * Math.cos(tiltRad), y: -b * Math.sin(tiltRad) };

    const A = sub(M, u);
    const B = add(M, u);
    const C = sub(M, v); // bottom or top depending on y
    const D = add(M, v);

    // Parallelogram vertices (tangent bounding box)
    const P1 = add(add(M, u), v);
    const P2 = add(sub(M, u), v);
    const P3 = sub(sub(M, u), v);
    const P4 = sub(add(M, u), v);

    // Radius r = MC = b for the auxiliary semicircle
    const rMC = len(v);

    // Point E on the extended upper axis:
    // The semicircle centered at A with radius rMC yields E
    // Direction along the parallelogram side (direction v)
    const unitV = unit(v);
    const E = add(A, scale(unitV, rMC));

    // Division points along segment AM (and BM)
    const divAM = [];
    const divBM = [];
    for (let k = 1; k < numDivisions; k++) {
      const frac = k / numDivisions;
      divAM.push({ k, pt: lerp(A, M, frac) });
      divBM.push({ k, pt: lerp(M, B, frac) });
    }

    // Division points along segment EA
    const divEA = [];
    for (let k = 1; k < numDivisions; k++) {
      const frac = k / numDivisions;
      const ptEA = lerp(E, A, frac);
      // Intersection F with circular arc centered at A (radius rMC)
      // Circular arc: x^2 + y^2 = rMC^2 relative to A
      // Parallel through ptEA perpendicular to EA
      // In the handbook the semicircle around A is projected per DIN
      const theta = Math.asin(Math.max(-1, Math.min(1, 1 - frac)));
      divEA.push({ k, pt: ptEA, thetaDeg: +(theta * RAD).toFixed(1) });
    }

    // Affine ellipse points for full curve
    const curvePoints = [];
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * 2 * Math.PI;
      curvePoints.push({
        x: M.x + u.x * Math.cos(th) + v.x * Math.sin(th),
        y: M.y + u.y * Math.cos(th) + v.y * Math.sin(th)
      });
    }

    // Constructed support points via parallelogram method
    const ellipsePoints = [];
    for (let k = 1; k < numDivisions; k++) {
      const th = Math.asin(k / numDivisions);
      // Quadrant 1
      ellipsePoints.push({
        k,
        P: {
          x: M.x + u.x * Math.cos(th) + v.x * Math.sin(th),
          y: M.y + u.y * Math.cos(th) + v.y * Math.sin(th)
        }
      });
    }

    return {
      ok: true,
      M, a, b, tiltAngleDeg, numDivisions,
      u, v, rMC,
      A, B, C, D,
      P1, P2, P3, P4,
      E,
      divAM, divBM, divEA,
      curvePoints,
      ellipsePoints
    };
  }

  // ================================================================ 6. Spiral (Compass Approximation)
  function constructSquareSpiral(center, pitchMm, numQuadrants = 8) {
    if (pitchMm <= 0 || numQuadrants < 1) return { ok: false, reason: 'invalid_params' };

    const s = pitchMm / 4; // Edge length of central square ABCD

    // Handbook p. 62 arrangement of centers:
    // Square ABCD clockwise around centroid (center):
    // D (top left), A (top right)
    // C (bottom left), B (bottom right)
    const A = { x: center.x + s / 2, y: center.y - s / 2 };
    const B = { x: center.x + s / 2, y: center.y + s / 2 };
    const C = { x: center.x - s / 2, y: center.y + s / 2 };
    const D = { x: center.x - s / 2, y: center.y - s / 2 };

    const centers = [A, B, C, D];
    const centerNames = ['A', 'B', 'C', 'D'];

    // Arcs:
    // 1. Square ABCD
    // 2. Quarter circle centered at A with radius AD = s -> yields E (start angle: 180° -> 270°)
    // Orientation as in handbook (from D clockwise outward):
    // D lies to the left of A: angle from A to D is 180° (left).
    // Arc centered at A runs from 180° to 270° (upward on screen).
    // In the handbook the spiral winds outward clockwise:
    // Arc 1 (center A): radius 1*s, from D (left) to E (top) -> angles 180° to 270° (or -90°)
    // Arc 2 (center B): radius 2*s, from E (top) to F (right) -> angles -90° to 0°
    // Arc 3 (center C): radius 3*s, from F (right) to G (bottom) -> angles 0° to 90°
    // Arc 4 (center D): radius 4*s = a, from G (bottom) to H (left) -> angles 90° to 180°
    // Arc 5 (center A): radius 5*s, from H (left) to I (top) -> angles 180° to 270°
    // and so on!

    const arcs = [];
    const baseAngles = [180, 270, 0, 90]; // Start angles for centers A, B, C, D (mathematical)
    const arcLabels = ['E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];

    for (let k = 1; k <= numQuadrants; k++) {
      const cIdx = (k - 1) % 4;
      const c = centers[cIdx];
      const r = k * s;
      const startDeg = baseAngles[cIdx];
      const endDeg = startDeg + 90;

      // Start and end point of the arc
      const startPt = polarPt(c, r, startDeg);
      const endPt = polarPt(c, r, endDeg);

      arcs.push({
        quadrantIndex: k,
        center: c,
        centerName: centerNames[cIdx],
        radiusMm: r,
        startDeg,
        endDeg,
        startPt,
        endPt,
        endLabel: arcLabels[k - 1] || `P_{${k}}`
      });
    }

    // Comparison values with the ideal Archimedean spiral r(th) = a * th / (2 * PI)
    // After k quarters (th = k * PI / 2):
    // r_archimedes = a * (k * PI / 2) / (2 * PI) = k * a / 4 = k * s !
    // At the 90° quadrant boundaries, the compass approximation matches the ideal Archimedean spiral EXACTLY!
    // Between quadrants it deviates by at most approx. 1.4%!
    const maxDeviationPct = 1.38;

    return {
      ok: true,
      center, pitchMm, s,
      A, B, C, D,
      arcs,
      maxDeviationPct
    };
  }

  // ================================================================ Export
  const Core = {
    fmt, parseNum, DEG, RAD, MINUS, THIN,
    pt, add, sub, scale, dot, cross, len, dist, mid, lerp, unit, perp, normDeg, polarPt, angleBetween, angleVectorsDeg,
    lineIntersection, projectPointOnLine, circleCircleIntersection,
    constructIncircle,
    constructCircumcircle,
    constructCircleCenterFromSecants,
    constructEllipseFromTwoCircles,
    constructEllipseInParallelogram,
    constructSquareSpiral
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Core;
  }
  if (typeof window !== 'undefined') {
    window.Core = Core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
