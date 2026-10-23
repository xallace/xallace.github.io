/* Geometrischer Rechenkern ohne DOM für Tabellenbuch Metall S. 61:
   „3.2 Geometrische Grundkonstruktionen – Tangenten, Kreisbögen, Vielecke“
   1. Tangente durch Kreispunkt P
   2. Tangente von einem Punkt P an den Kreis (Satz des Thales)
   3. Rundung am Winkel (Ausrundung mit Radius r)
   4. Verbindung zweier Kreise durch Kreisbögen (Innenbogen Ri, Außenbogen Ra)
   5. Regelmäßiges Vieleck im Umkreis (z. B. Fünfeck, Universalkonstruktion nach Bion)
   6. Sechseck, Zwölfeck im Umkreis
   Läuft im Browser (window.Core) und in Node (module.exports) für tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // Zahl im deutschen Format: Dezimalkomma, echtes Minuszeichen, ohne überflüssige Nullen.
  function fmt(v, dec = 1, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + ',' + frac : int;
    const sign = v < 0 && !opts.noMinus ? MINUS : (v > 0 && opts.plus ? '+' : '');
    return sign + s;
  }

  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/[°%\s]|mm/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // ================================================================ Euklidische 2D-Vektorgeometrie
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

  // Drehung um +90° im mathematischen Sinn: (-y, x)
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

  // Schnittpunkte zweier Kreise (c1, r1) und (c2, r2)
  function intersectCircles(c1, r1, c2, r2) {
    const dVec = sub(c2, c1);
    const d = len(dVec);
    if (d < 1e-10) return { ok: false, reason: 'concentric', d };
    if (d > r1 + r2 + 1e-9) return { ok: false, reason: 'too_far', d, maxD: r1 + r2 };
    if (d < Math.abs(r1 - r2) - 1e-9) return { ok: false, reason: 'nested', d, minD: Math.abs(r1 - r2) };

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    const h = Math.sqrt(Math.max(0, h2));

    const u = scale(dVec, 1 / d);
    const pMid = add(c1, scale(u, a));
    const vPerp = perp(u);

    const pLeft = add(pMid, scale(vPerp, h));
    const pRight = sub(pMid, scale(vPerp, h));
    return { ok: true, d, a, h, points: [pLeft, pRight] };
  }

  // Schnittpunkt zweier Geraden (p1 -> p2) und (p3 -> p4)
  function intersectLines(p1, p2, p3, p4) {
    const d1 = sub(p2, p1);
    const d2 = sub(p4, p3);
    const denom = cross(d1, d2);
    if (Math.abs(denom) < 1e-10) return null;
    const num = cross(sub(p3, p1), d2);
    const t = num / denom;
    return add(p1, scale(d1, t));
  }

  // ================================================================ 1. Tangente durch Kreispunkt P
  // Gegeben: Kreis (M, R) und Punkt P auf dem Kreis.
  // 1. MP ziehen und verlängern.
  // 2. Kreis um P mit Radius r1 ergibt Schnittpunkte A und B auf Gerade MP.
  // 3. Kreisbögen um A und B mit Radius r2 > r1 ergeben Schnittpunkte C und D.
  // 4. CD ist Senkrechte zu PM (gesuchte Tangente).
  function constructTangentAtPoint(M, P, r1, r2) {
    const R = dist(M, P);
    if (R < 1e-6) return { ok: false, reason: 'p_equals_m' };
    const u = unit(sub(P, M));
    const extP = add(P, scale(u, r1 * 1.5)); // Verlängerter Strahl über P hinaus

    if (r1 <= 0) return { ok: false, reason: 'r1_nonpositive' };
    const A = sub(P, scale(u, r1));
    const B = add(P, scale(u, r1));

    if (r2 <= r1 + 1e-7) {
      return {
        ok: false,
        stepFailed: 3,
        reason: 'r2_too_small',
        M, P, R, u, A, B, r1, r2,
        minR2: r1
      };
    }

    const inter = intersectCircles(A, r2, B, r2);
    const [C, D] = inter.points; // C links der Geraden MP, D rechts
    const tangentDir = unit(sub(D, C));
    const perpAngle = angleVectorsDeg(u, tangentDir);

    return {
      ok: true,
      M, P, R: +R.toFixed(6),
      u, extP,
      A, B, C, D,
      r1: +r1.toFixed(6),
      r2: +r2.toFixed(6),
      halfAB: +r1.toFixed(6),
      heightCD: +inter.h.toFixed(6),
      perpAngleDeg: +perpAngle.toFixed(6),
      dotProduct: +(dot(u, tangentDir)).toFixed(6)
    };
  }

  // ================================================================ 2. Tangente von einem Punkt P an den Kreis
  // Gegeben: Kreis (M, R) und Punkt P außerhalb.
  // 1. MP halbieren. A ist Mittelpunkt.
  // 2. Kreis um A mit Radius r_A = |AM|. T ist Tangentenpunkt.
  // 3. T mit P verbinden.
  // 4. MT ist senkrecht zu PT (Satz des Thales).
  function constructTangentFromPoint(M, R, P) {
    const d = dist(M, P);
    if (d <= R + 1e-6) {
      return {
        ok: false,
        reason: 'p_inside_or_on_circle',
        M, R, P, d,
        minDist: R
      };
    }

    // 1. Mittelpunkt A von MP
    const A = mid(M, P);
    const rA = d / 2;

    // 2. Thaleskreis um A mit Radius rA schneidet Kreis (M, R) in T1 (oben) und T2 (unten)
    const inter = intersectCircles(M, R, A, rA);
    const [T1, T2] = inter.points;

    // Tangentenlänge L = sqrt(d^2 - R^2)
    const L = Math.sqrt(Math.max(0, d * d - R * R));
    const angleMTP1 = angleVectorsDeg(sub(T1, M), sub(P, T1));
    const angleMTP2 = angleVectorsDeg(sub(T2, M), sub(P, T2));
    const apexAngle = 2 * Math.asin(Math.min(1, R / d)) * RAD;

    return {
      ok: true,
      M, R: +R.toFixed(6),
      P, d: +d.toFixed(6),
      A, rA: +rA.toFixed(6),
      T1, T2,
      tangentLen: +L.toFixed(6),
      angleMTPDeg1: +angleMTP1.toFixed(6),
      angleMTPDeg2: +angleMTP2.toFixed(6),
      apexAngleDeg: +apexAngle.toFixed(6),
      halfApexDeg: +(apexAngle / 2).toFixed(6)
    };
  }

  // ================================================================ 3. Rundung am Winkel
  // Gegeben: Scheitelpunkt S, Schenkelpunkte A und B (Winkel ASB), Ausrundungsradius r.
  // 1. Parallelen zu AS und BS im Abstand r ziehen. Ihr Schnittpunkt M ist der Mittelpunkt.
  // 2. Lote von M auf AS und BS fällen -> Übergangspunkte C und D.
  // 3. Kreisbogen um M mit Radius r von C nach D.
  function constructFilletCorner(S, A, B, r) {
    const uA = unit(sub(A, S));
    const uB = unit(sub(B, S));
    const alphaDeg = angleVectorsDeg(uA, uB);

    if (alphaDeg < 5 || alphaDeg > 175) {
      return { ok: false, reason: 'angle_extreme', alphaDeg };
    }
    if (r <= 0) return { ok: false, reason: 'radius_nonpositive' };

    // Normalen nach innen gerichtet
    // Kreuzprodukt uA x uB bestimmt die Orientierung
    const orient = cross(uA, uB);
    const sign = orient >= 0 ? 1 : -1;
    const nA = scale(perp(uA), -sign);
    const nB = scale(perp(uB), sign);

    // Parallelen im Abstand r
    const pA1 = add(S, scale(nA, r));
    const pA2 = add(A, scale(nA, r));
    const pB1 = add(S, scale(nB, r));
    const pB2 = add(B, scale(nB, r));

    // Schnittpunkt M der Parallelen
    const M = intersectLines(pA1, pA2, pB1, pB2);
    if (!M) return { ok: false, reason: 'parallel_lines' };

    // Lote von M auf die Schenkel
    const prA = projectPointOnLine(M, S, A);
    const prB = projectPointOnLine(M, S, B);
    const C = prA.foot;
    const D = prB.foot;

    const tanLen = r / Math.tan((alphaDeg / 2) * DEG);
    const centerDist = r / Math.sin((alphaDeg / 2) * DEG);
    const arcLen = r * (180 - alphaDeg) * DEG;

    return {
      ok: true,
      S, A, B, r: +r.toFixed(6),
      alphaDeg: +alphaDeg.toFixed(6),
      uA, uB, nA, nB,
      pA1, pA2, pB1, pB2,
      M, C, D,
      tanLen: +tanLen.toFixed(6),
      centerDist: +centerDist.toFixed(6),
      arcLen: +arcLen.toFixed(6),
      distMC: +dist(M, C).toFixed(6),
      distMD: +dist(M, D).toFixed(6),
      distSC: +dist(S, C).toFixed(6),
      distSD: +dist(S, D).toFixed(6)
    };
  }

  // ================================================================ 4. Verbindung zweier Kreise durch Kreisbögen
  // Gegeben: Kreis 1 (M1, r1), Kreis 2 (M2, r2); Innenradius Ri, Außenradius Ra.
  // 1. Kreis um M1 mit Ri + r1.
  // 2. Kreis um M2 mit Ri + r2 -> Schnittpunkt A.
  // 3. A mit M1 und M2 verbinden -> Berührungspunkte B und C für Ri.
  // 4. Kreis um M1 mit Ra - r1.
  // 5. Kreis um M2 mit Ra - r2 -> Schnittpunkt D.
  // 6. D mit M1 und M2 verbinden und verlängern -> Berührungspunkte E und F für Ra.
  function constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra) {
    const a = dist(M1, M2);
    if (a < 1e-6) return { ok: false, reason: 'concentric_circles', a };

    // Innenradius Ri: Bögen mit R1 = Ri + r1, R2 = Ri + r2
    const R1i = Ri + r1;
    const R2i = Ri + r2;
    const interInner = intersectCircles(M1, R1i, M2, R2i);

    // Außenradius Ra: Bögen mit R1 = Ra - r1, R2 = Ra - r2
    if (Ra <= Math.max(r1, r2)) {
      return {
        ok: false,
        reason: 'ra_too_small_for_circles',
        minRa: Math.max(r1, r2),
        Ra, r1, r2
      };
    }
    const R1a = Ra - r1;
    const R2a = Ra - r2;
    const interOuter = intersectCircles(M1, R1a, M2, R2a);

    if (!interInner.ok) {
      return {
        ok: false,
        reason: 'inner_arcs_no_intersect',
        interInner, a, R1i, R2i
      };
    }
    if (!interOuter.ok) {
      return {
        ok: false,
        reason: 'outer_arcs_no_intersect',
        interOuter, a, R1a, R2a
      };
    }

    // A ist der Innenbogen-Mittelpunkt (oben)
    // D ist der Außenbogen-Mittelpunkt (unten)
    const A = interInner.points[0];
    const D = interOuter.points[1];

    // Berührpunkte für Ri:
    // B auf Kreis 1: von A durch M1 im Abstand r1 von M1
    const uAM1 = unit(sub(M1, A));
    const B = add(M1, scale(uAM1, -r1)); // = A + scale(uAM1, Ri)

    // C auf Kreis 2: von A durch M2 im Abstand r2 von M2
    const uAM2 = unit(sub(M2, A));
    const C = add(M2, scale(uAM2, -r2)); // = A + scale(uAM2, Ri)

    // Berührpunkte für Ra:
    // E auf Kreis 1: von D durch M1 verlängert um r1
    const uDM1 = unit(sub(M1, D));
    const E = add(M1, scale(uDM1, r1)); // = D + scale(uDM1, Ra)

    // F auf Kreis 2: von D durch M2 verlängert um r2
    const uDM2 = unit(sub(M2, D));
    const F = add(M2, scale(uDM2, r2)); // = D + scale(uDM2, Ra)

    return {
      ok: true,
      M1, r1: +r1.toFixed(6),
      M2, r2: +r2.toFixed(6),
      centerDist: +a.toFixed(6),
      Ri: +Ri.toFixed(6),
      Ra: +Ra.toFixed(6),
      R1i: +R1i.toFixed(6),
      R2i: +R2i.toFixed(6),
      R1a: +R1a.toFixed(6),
      R2a: +R2a.toFixed(6),
      A, B, C,
      D, E, F,
      distAB: +dist(A, B).toFixed(6),
      distAC: +dist(A, C).toFixed(6),
      distDE: +dist(D, E).toFixed(6),
      distDF: +dist(D, F).toFixed(6)
    };
  }

  // ================================================================ 5. Regelmäßiges Vieleck im Umkreis (z. B. Fünfeck)
  // Gegeben: Kreis mit Durchmesser d = 2R, vertikaler Durchmesser AB (A unten, B oben).
  // 1. AB in n gleiche Teile teilen (1..n-1).
  // 2. Kreisbogen mit Radius AB = 2R um A schlagen -> Polpunkte C und D auf Horizontalachse.
  //    Exakter Abstand: x = ± R * sqrt(3).
  // 3. C und D mit ungeraden Teilpunkten verbinden (bei ungeradem n), bzw. geraden (bei geradem n).
  //    Schnittpunkte mit Kreis ergeben die Ecken.
  function constructRegularPolygonApprox(M, R, n = 5) {
    if (R <= 0 || n < 3 || n > 12) return { ok: false, reason: 'invalid_params' };
    const d = 2 * R;

    // Im SVG: y nach unten. B ist oben (M.y - R), A ist unten (M.y + R).
    const A = { x: M.x, y: M.y + R };
    const B = { x: M.x, y: M.y - R };

    // 1. Teilpunkte auf AB (k = 0..n: k=0 ist A unten, k=n ist B oben)
    const divisionPoints = [];
    for (let k = 0; k <= n; k++) {
      divisionPoints.push({
        num: k,
        pt: lerp(A, B, k / n)
      });
    }

    // 2. Polpunkte C und D: Kreisbogen mit Radius 2R um A schneidet Horizontale durch M
    const poleDist = R * Math.sqrt(3);
    const C = { x: M.x - poleDist, y: M.y };
    const D = { x: M.x + poleDist, y: M.y };

    function rayCircleIntersect(Pk) {
      const Y = Pk.y - M.y;
      const a = 3 * R * R + Y * Y;
      const discr = 4 * R * R * (3 * R * R - 2 * Y * Y);
      const t = (6 * R * R + Math.sqrt(Math.max(0, discr))) / (2 * a);
      const dx = poleDist * (t - 1);
      const dy = t * Y;
      return {
        ptRight: { x: M.x + dx, y: M.y + dy },
        ptLeft: { x: M.x - dx, y: M.y + dy }
      };
    }

    const constructedVertices = [];
    const rays = [];

    if (n % 2 === 1) {
      // Ungerades Vieleck: B ist Scheitelecke
      constructedVertices.push({ idx: 0, pt: B, label: 'B' });

      const oddIndices = [];
      for (let k = n - 2; k >= 1; k -= 2) oddIndices.push(k);

      const rightPts = [];
      const leftPts = [];

      for (const k of oddIndices) {
        const Pk = divisionPoints[k].pt;
        const { ptRight, ptLeft } = rayCircleIntersect(Pk);

        rightPts.push({ pt: ptRight, k, from: C });
        leftPts.unshift({ pt: ptLeft, k, from: D });

        rays.push({ from: C, through: Pk, to: ptRight, k });
        rays.push({ from: D, through: Pk, to: ptLeft, k });
      }

      for (const r of rightPts) constructedVertices.push({ idx: constructedVertices.length, pt: r.pt, k: r.k });
      for (const l of leftPts) constructedVertices.push({ idx: constructedVertices.length, pt: l.pt, k: l.k });

    } else {
      // Gerades Vieleck: B (oben) und A (unten) sind Scheitelecken
      constructedVertices.push({ idx: 0, pt: B, label: 'B' });

      const evenIndices = [];
      for (let k = n - 2; k >= 2; k -= 2) evenIndices.push(k);

      const rightPts = [];
      const leftPts = [];

      for (const k of evenIndices) {
        const Pk = divisionPoints[k].pt;
        const { ptRight, ptLeft } = rayCircleIntersect(Pk);

        rightPts.push({ pt: ptRight, k, from: C });
        leftPts.unshift({ pt: ptLeft, k, from: D });

        rays.push({ from: C, through: Pk, to: ptRight, k });
        rays.push({ from: D, through: Pk, to: ptLeft, k });
      }

      for (const r of rightPts) constructedVertices.push({ idx: constructedVertices.length, pt: r.pt, k: r.k });
      constructedVertices.push({ idx: constructedVertices.length, pt: A, label: 'A' });
      for (const l of leftPts) constructedVertices.push({ idx: constructedVertices.length, pt: l.pt, k: l.k });
    }

    // Mathematisch exakte Ecken zum Vergleich:
    const exactVertices = [];
    for (let i = 0; i < n; i++) {
      const a = -90 + (i * 360) / n;
      exactVertices.push(polarPt(M, R, a));
    }

    // Kantenlängen und Genauigkeitsvergleich
    const edgeLengths = [];
    let maxEdgeDev = 0;
    const exactEdgeLen = 2 * R * Math.sin(Math.PI / n);

    for (let i = 0; i < n; i++) {
      const p1 = constructedVertices[i].pt;
      const p2 = constructedVertices[(i + 1) % n].pt;
      const elen = dist(p1, p2);
      edgeLengths.push(+elen.toFixed(4));
      const dev = Math.abs(elen - exactEdgeLen);
      if (dev > maxEdgeDev) maxEdgeDev = dev;
    }

    return {
      ok: true,
      M, R: +R.toFixed(6),
      d: +d.toFixed(6),
      n, A, B, C, D,
      poleDist: +poleDist.toFixed(6),
      divisionPoints,
      rays,
      vertices: constructedVertices,
      exactVertices,
      exactEdgeLen: +exactEdgeLen.toFixed(4),
      edgeLengths,
      maxEdgeDev: +maxEdgeDev.toFixed(4),
      relAccuracyPct: +(100 * (1 - maxEdgeDev / exactEdgeLen)).toFixed(2)
    };
  }

  // ================================================================ 6. Sechseck, Zwölfeck im Umkreis
  // Gegeben: Kreis mit Durchmesser d = 2r.
  // Sechseck:
  // 1. Kreisbögen mit Radius r = d/2 um A.
  // 2. Kreisbögen mit Radius r um B.
  // 3. Verbindungslinien ergeben Sechseck (Kantenlänge s = r).
  // Zwölfeck:
  // Einstiche zusätzlich in C und D (horizontale Achsendpunkte).
  function constructHexagonDodecagon(M, R, mode = 'hexagon') {
    if (R <= 0) return { ok: false, reason: 'radius_nonpositive' };
    const d = 2 * R;

    // A oben, B unten (oder A oben bei -90°, B unten bei +90°)
    const A = { x: M.x, y: M.y - R }; // 270° bzw. -90° (oben)
    const B = { x: M.x, y: M.y + R }; // 90° (unten)
    const C = { x: M.x - R, y: M.y }; // 180° (links)
    const D = { x: M.x + R, y: M.y }; // 0° (rechts)

    // Bögen um A mit Radius R schneiden Kreis bei 30° und 150° von oben (+/- 60°):
    // In Standardwinkeln: A ist bei -90°. -90° +/- 60° = -150° (210°) und -30° (330°).
    const pA1 = polarPt(M, R, -30);
    const pA2 = polarPt(M, R, -150);

    // Bögen um B mit Radius R schneiden Kreis bei 90° +/- 60° = 30° und 150°:
    const pB1 = polarPt(M, R, 30);
    const pB2 = polarPt(M, R, 150);

    // Die 6 Sechseckecken im Uhrzeigersinn ab A (oben):
    // A (-90°), pA1 (-30°), pB1 (30°), B (90°), pB2 (150°), pA2 (210°)
    const hexVertices = [A, pA1, pB1, B, pB2, pA2];

    // Zusätzliche Einstiche für Zwölfeck in C (-180°) und D (0°):
    // Bögen um D (0°) schneiden Kreis bei 0° +/- 60° = -60° und +60°.
    // Bögen um C (180°) schneiden Kreis bei 180° +/- 60° = 120° und 240°.
    const pD1 = polarPt(M, R, -60);
    const pD2 = polarPt(M, R, 60);
    const pC1 = polarPt(M, R, 120);
    const pC2 = polarPt(M, R, 240);

    // 12 Ecken alle 30° ab A (-90°):
    // -90°, -60°, -30°, 0° (D), 30°, 60°, 90° (B), 120°, 150°, 180° (C), 210°, 240°
    const dodecaVertices = [
      A, pD1, pA1, D, pB1, pD2, B, pC1, pB2, C, pA2, pC2
    ];

    // Kennwerte Maschinenbau:
    // Sechskant: Schlüsselweite SW = 2 * r_i = 2 * R * cos(30°) = R * sqrt(3) = d * sqrt(3) / 2
    const swHex = d * (Math.sqrt(3) / 2);
    const sHex = R; // Kantenlänge s = R
    const rInHex = R * (Math.sqrt(3) / 2);

    // Zwölfeck: Kantenlänge s12 = 2 * R * sin(15°) = R * sqrt(2 - sqrt(3))
    const sDodeca = 2 * R * Math.sin(15 * DEG);
    const rInDodeca = R * Math.cos(15 * DEG);

    return {
      ok: true,
      M, R: +R.toFixed(6),
      d: +d.toFixed(6),
      mode,
      A, B, C, D,
      pA1, pA2, pB1, pB2,
      pD1, pD2, pC1, pC2,
      hexVertices,
      dodecaVertices,
      sHex: +sHex.toFixed(4),
      swHex: +swHex.toFixed(4),
      rInHex: +rInHex.toFixed(4),
      sDodeca: +sDodeca.toFixed(4),
      rInDodeca: +rInDodeca.toFixed(4)
    };
  }

  const api = {
    DEG, RAD, MINUS, THIN,
    fmt, parseNum,
    pt, add, sub, scale, dot, cross, len, dist, mid, lerp, unit, perp, normDeg, polarPt,
    angleBetween, angleVectorsDeg, projectPointOnLine, intersectCircles, intersectLines,
    constructTangentAtPoint,
    constructTangentFromPoint,
    constructFilletCorner,
    constructTwoCircleBlend,
    constructRegularPolygonApprox,
    constructHexagonDodecagon
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Core = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
