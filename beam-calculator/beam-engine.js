/* ==========================================================================
   beam-engine.js — Euler-Bernoulli Mechanics Core, Cross-Section Calculator,
                    Real-World Scenario Presets, Guided Tour & Concept Notes
   Reference: StructX Beam Formulas 001 / Eurocode 3 / DIN 1025 / AISC
   ========================================================================== */
(function (global) {
  'use strict';

  const MATERIALS = {
    steel_s235: {
      name: 'Structural Steel (S235 / A36)',
      shortName: 'Steel S235',
      E_metric: 210,      // GPa
      E_imperial: 30450,  // ksi
      yield_metric: 235,  // MPa
      yield_imperial: 36, // ksi
      density_metric: 7850, // kg/m³
      note: 'Standard ductile structural steel. Linear elastic up to fy = 235 MPa.',
    },
    steel_s355: {
      name: 'High-Strength Steel (S355 / A572)',
      shortName: 'Steel S355',
      E_metric: 210,
      E_imperial: 30450,
      yield_metric: 355,
      yield_imperial: 50,
      density_metric: 7850,
      note: '51% higher yield strength than S235, but identical stiffness E = 210 GPa (same deflection!).',
    },
    stainless_304: {
      name: 'Stainless Steel (1.4301 / 304)',
      shortName: 'Stainless 304',
      E_metric: 195,
      E_imperial: 28300,
      yield_metric: 210,
      yield_imperial: 30,
      density_metric: 7900,
      note: 'Corrosion-resistant austenitic steel with slightly lower stiffness than carbon steel.',
    },
    aluminum_6082: {
      name: 'Aluminum (EN AW-6082 T6 / 6061-T6)',
      shortName: 'Alu 6082-T6',
      E_metric: 70,
      E_imperial: 10150,
      yield_metric: 260,
      yield_imperial: 35,
      density_metric: 2700,
      note: 'One-third the weight and one-third the stiffness of steel — deflection often governs over strength.',
    },
    timber_c24: {
      name: 'Structural Timber (C24 Softwood)',
      shortName: 'Timber C24',
      E_metric: 11,
      E_imperial: 1600,
      yield_metric: 24,
      yield_imperial: 3.5,
      density_metric: 420,
      note: 'Common European spruce/pine joist grade (characteristic bending strength fm,k = 24 MPa).',
    },
    concrete_c25: {
      name: 'Reinforced Concrete (C25/30, uncracked)',
      shortName: 'Concrete C25',
      E_metric: 31,
      E_imperial: 4500,
      yield_metric: 25,
      yield_imperial: 3.6,
      density_metric: 2400,
      note: 'Uncracked elastic reference (real RC beams rely on steel rebar in the tension zone).',
    },
    custom: {
      name: 'Custom Material...',
      shortName: 'Custom',
      E_metric: 210,
      E_imperial: 30450,
      yield_metric: 250,
      yield_imperial: 36,
      density_metric: 7850,
      note: 'User-defined Young’s modulus E.',
    },
  };

  // Standard European IPE & HEB steel profiles (DIN 1025 / EN 10365)
  // Dimensions in mm; Iy in cm⁴, Wy in cm³, A in cm²
  const STANDARD_PROFILES = {
    IPE100: { name: 'IPE 100', h: 100, b: 55,  tw: 4.1, tf: 5.7,  Iy: 171,   Wy: 34.2,  A: 10.3 },
    IPE160: { name: 'IPE 160', h: 160, b: 82,  tw: 5.0, tf: 7.4,  Iy: 869,   Wy: 109,   A: 20.1 },
    IPE200: { name: 'IPE 200', h: 200, b: 100, tw: 5.6, tf: 8.5,  Iy: 1940,  Wy: 194,   A: 28.5 },
    IPE240: { name: 'IPE 240', h: 240, b: 120, tw: 6.2, tf: 9.8,  Iy: 3890,  Wy: 324,   A: 39.1 },
    IPE300: { name: 'IPE 300', h: 300, b: 150, tw: 7.1, tf: 10.7, Iy: 8360,  Wy: 557,   A: 53.8 },
    HEB100: { name: 'HEB 100', h: 100, b: 100, tw: 6.0, tf: 10.0, Iy: 450,   Wy: 89.9,  A: 26.0 },
    HEB160: { name: 'HEB 160', h: 160, b: 160, tw: 8.0, tf: 13.0, Iy: 2490,  Wy: 311,   A: 54.3 },
    HEB200: { name: 'HEB 200', h: 200, b: 200, tw: 9.0, tf: 15.0, Iy: 5700,  Wy: 570,   A: 78.1 },
    HEB240: { name: 'HEB 240', h: 240, b: 240, tw: 10.0, tf: 17.0, Iy: 11260, Wy: 938,  A: 106.0 },
  };

  // Real-world engineering presets (all stored in Metric SI; auto-converted if Imperial active)
  const SCENARIO_PRESETS = {
    office_safe: {
      id: 'office_safe',
      label: 'Office Girder (Safe)',
      shortLabel: 'Office Girder',
      kicker: 'BALANCED STEEL DESIGN · PASS',
      summary: 'A typical 6 m secondary floor girder (IPE 240, S235) carrying 8 kN/m. Both bending stress (111.1 MPa, 47% fy) and midspan sag (16.53 mm, L/363) pass Eurocode ULS & SLS limits.',
      L: 6.0,
      w: 8.0,
      xFrac: 0.5,
      materialKey: 'steel_s235',
      sectionType: 'standard',
      standardProfileKey: 'IPE240',
    },
    overloaded: {
      id: 'overloaded',
      label: 'Overloaded Girder',
      shortLabel: 'Overloaded (Fail!)',
      kicker: 'ULS & SLS FAILURE DEMO · STRUCTX',
      summary: 'A 6 m IPE 200 (S235) pushed to 15 kN/m reaches 347.9 MPa outer-fiber stress (148% of S235 yield) and 62.13 mm sag (L/97) — failing both strength and stiffness checks.',
      L: 6.0,
      w: 15.0,
      xFrac: 0.5,
      materialKey: 'steel_s235',
      sectionType: 'standard',
      standardProfileKey: 'IPE200',
    },
    timber_joist: {
      id: 'timber_joist',
      label: 'Timber Floor Joist',
      shortLabel: 'Timber Joist',
      kicker: 'STIFFNESS-GOVERNED · TIMBER C24',
      summary: 'A 4 m solid spruce joist (80 × 200 mm, C24) at 3.5 kN/m. Bending stress is safe (13.1 MPa, 55% fm), yet low stiffness (E = 11 GPa) drives sag to 19.89 mm (L/201) — failing L/300 serviceability.',
      L: 4.0,
      w: 3.5,
      xFrac: 0.5,
      materialKey: 'timber_c24',
      sectionType: 'rect',
      sectionParams: { b: 80, h: 200 },
    },
    bridge_span: {
      id: 'bridge_span',
      label: '8m Heavy Girder',
      shortLabel: '8m HEB 240',
      kicker: 'LONG-SPAN HEAVY LOAD · S355',
      summary: 'An 8 m wide-flange girder (HEB 240, S355) carrying 10 kN/m. Even with Iy = 11,260 cm⁴, the L⁴ law drives sag to 22.55 mm (L/355) while stress sits at just 24% of S355 yield.',
      L: 8.0,
      w: 10.0,
      xFrac: 0.25,
      materialKey: 'steel_s355',
      sectionType: 'standard',
      standardProfileKey: 'HEB240',
    },
    alu_box: {
      id: 'alu_box',
      label: 'Aluminum Box Frame',
      shortLabel: 'Alu RHS Box',
      kicker: 'LIGHTWEIGHT TUBE · LOW E DEMO',
      summary: 'A 3.5 m hollow aluminum box (100 × 140 × 6 mm, 6082-T6) at 5 kN/m. Stress is only 28% of yield (71.6 MPa), yet 3× lower Young’s modulus E = 70 GPa pushes sag to 18.64 mm (L/188).',
      L: 3.5,
      w: 5.0,
      xFrac: 0.5,
      materialKey: 'aluminum_6082',
      sectionType: 'hollow_rect',
      sectionParams: { b: 100, h: 140, t: 6 },
    },
  };

  // Guided Tour Stops (matching road-intersections pedagogical storytelling)
  const TOUR_STOPS = [
    {
      badge: 'Stop 1 of 7',
      title: 'What Is a Simply Supported Beam with UDL?',
      summary: 'A beam rests on a Pin support at A (stops horizontal & vertical motion, allows rotation) and a Roller support at B (only stops vertical motion, so the beam can expand and contract freely). A Uniformly Distributed Load (UDL) spreads weight w evenly along every meter.',
      takeaway: 'Why one Pin and one Roller? If both ends were pinned, thermal expansion would jam the beam into axial compression. Pin + Roller makes it statically determinate.',
      preset: 'office_safe',
      xFrac: 0.5,
      focusDiagram: 'fbd',
      showCallouts: true,
    },
    {
      badge: 'Stop 2 of 7',
      title: 'Support Reactions: Splitting the Weight Equally',
      summary: 'Total downward load is W = w · L. Because the UDL is symmetric, vertical equilibrium (ΣFy = 0) and moment balance (ΣMA = 0) guarantee each support pushes back with exactly half: RA = RB = wL / 2.',
      takeaway: 'For 8 kN/m over 6 m, total load is 48 kN — so Pin A carries 24 kN and Roller B carries 24 kN.',
      preset: 'office_safe',
      xFrac: 0.0,
      focusDiagram: 'fbd',
      showCallouts: true,
    },
    {
      badge: 'Stop 3 of 7',
      title: 'Shear Force V(x) — The Internal Slicing Force',
      summary: 'Imagine cutting the beam near support A (at x = 0.90 m). The left piece is pushed UP by RA = 24 kN and DOWN by only a small slice of load (w·x = 7.2 kN). The right half must pull DOWN with V(x) = +16.8 kN to keep it in balance!',
      takeaway: 'Look at the Method-of-Sections Cut below left: shear is largest at the supports (±wL/2) and decreases linearly at slope −w until it hits zero at midspan.',
      preset: 'office_safe',
      xFrac: 0.15,
      focusDiagram: 'sfd',
      showCallouts: false,
    },
    {
      badge: 'Stop 4 of 7',
      title: 'Bending Moment M(x) — Peak Where Shear Is Zero',
      summary: 'Because dM/dx = V(x), the bending moment climbs wherever shear is positive and drops wherever shear is negative. That means bending ALWAYS peaks where the shear line crosses zero — at midspan x = L/2!',
      takeaway: 'Notice the Eurocode convention (Tension Down): the parabola hangs downward to visually match the sagging tension zone on the bottom of the beam.',
      preset: 'office_safe',
      xFrac: 0.5,
      focusDiagram: 'bmd',
      showCallouts: false,
    },
    {
      badge: 'Stop 5 of 7',
      title: 'Inside the Cross-Section: Compression vs. Tension',
      summary: 'Sagging squeezes the top fibers together (Compression, −σ) and stretches the bottom fibers apart (Tension, +σ). Right along the middle Neutral Axis (N.A.), bending stress is ZERO!',
      takeaway: 'Look at the Cross-Section Plate below right: I-beams (IPE/HEB) put most of their steel in wide top & bottom flanges where leverage is highest, leaving a thin web in the middle.',
      preset: 'office_safe',
      xFrac: 0.5,
      focusDiagram: 'section',
      showCallouts: false,
    },
    {
      badge: 'Stop 6 of 7',
      title: 'Elastic Deflection δ(x) & The Fourth-Power L⁴ Law',
      summary: 'A timber joist can easily pass the strength check (55% of bending limit) and still feel unacceptably bouncy! Because δmax = 5wL⁴ / (384EI), doubling a beam’s span multiplies its sag by 2⁴ = 16×.',
      takeaway: 'Engineers always verify two independent limits: ULS Strength (σ ≤ fy, so it does not break) AND SLS Serviceability (δ ≤ L/300, so floors & plaster do not crack).',
      preset: 'timber_joist',
      xFrac: 0.5,
      focusDiagram: 'deflection',
      showCallouts: false,
    },
    {
      badge: 'Stop 7 of 7',
      title: 'Spotting Yield Failure & Fixing a Design',
      summary: 'On this overloaded 6 m IPE 200 (15 kN/m), extreme fiber stress hits 347.9 MPa — exceeding S235 steel yield (235 MPa) by 48%, while sag reaches 62.1 mm (L/97). Look at the red dashed ±fy fence inside the stress triangle below right.',
      takeaway: 'Try fixing it yourself in the sidebar: upgrade the profile to IPE 300 or HEB 240 (raising both Wy and Iy dramatically) or reduce the span!',
      preset: 'overloaded',
      xFrac: 0.5,
      focusDiagram: 'bmd',
      showCallouts: true,
    },
  ];

  // Concepts & Intuition cards (for Tab 3)
  const CONCEPT_CARDS = [
    {
      title: '1. Pin + Roller = Determinate Equilibrium',
      body: 'A Pin at A blocks horizontal and vertical motion while allowing rotation. A Roller at B blocks only vertical motion, letting the beam expand thermally without building internal axial compression.',
      latex: '\\sum F_y = 0 \\implies R_A + R_B = wL, \\qquad R_A = R_B = \\frac{wL}{2}',
      actionLabel: 'Inspect Supports in Plate →',
      preset: 'office_safe',
      xFrac: 0.0,
    },
    {
      title: '2. The Calculus Chain: Load → Shear → Moment → Sag',
      body: 'Every diagram is the integral of the one above it! Uniform load w (constant) integrates to linear Shear V(x), which integrates to parabolic Moment M(x), which integrates twice to the 4th-degree Deflection curve δ(x).',
      latex: '\\frac{dV}{dx} = -w, \\qquad \\frac{dM}{dx} = V(x), \\qquad EI\\frac{d^2\\delta}{dx^2} = M(x)',
      actionLabel: 'Trace at Quarter Span (L/4) →',
      preset: 'office_safe',
      xFrac: 0.25,
    },
    {
      title: '3. Why I-Beams Beat Solid Rectangles',
      body: 'Bending stress is zero at the Neutral Axis and largest at the outer top and bottom edges. Placing material far from the center maximizes Moment of Inertia Iy and Section Modulus Wy = Iy / (h/2) per kilogram of steel.',
      latex: '\\sigma(y) = \\frac{M(x)\\cdot y}{I_y}, \\qquad \\sigma_{\\max} = \\frac{M_{\\max}}{W_y}',
      actionLabel: 'Inspect IPE 200 Stress →',
      preset: 'overloaded',
      xFrac: 0.5,
    },
    {
      title: '4. The L⁴ Deflection Penalty',
      body: 'Reactions grow linearly with span (∝ L), bending moment grows quadratically (∝ L²), and deflection explodes with the fourth power (∝ L⁴)! Extending a span by just +25% increases sag by +144%.',
      latex: '\\delta_{\\max} = \\frac{5\\,w\\,L^4}{384\\,E\\,I_y}, \\qquad \\theta_A = \\frac{w\\,L^3}{24\\,E\\,I_y}',
      actionLabel: 'Test 8 m Heavy Span →',
      preset: 'bridge_span',
      xFrac: 0.5,
    },
    {
      title: '5. Strength (ULS) vs. Stiffness (SLS)',
      body: 'Upgrading steel from S235 to S355 increases yield strength by 51%, yet Young’s modulus E stays 210 GPa — so the beam bends the exact same amount! Timber and aluminum beams often fail stiffness (L/300) before strength.',
      latex: '\\text{ULS: } \\sigma_{\\max} \\le f_y, \\qquad \\text{SLS: } \\delta_{\\max} \\le \\frac{L}{300}',
      actionLabel: 'See Timber Stiffness Demo →',
      preset: 'timber_joist',
      xFrac: 0.5,
    },
    {
      title: '6. Eurocode Tension-Side vs. Math Plot',
      body: 'European structural engineers draw bending moments on the tension face of the beam (sagging moment plotted downward) so rebar or bottom flange tension is immediately obvious. North American textbooks often plot positive moments upward.',
      latex: 'M(x) = \\frac{w\\,x}{2}(L - x) \\ge 0 \\quad \\text{(Sagging = Bottom Tension)}',
      actionLabel: 'Inspect Aluminum Box →',
      preset: 'alu_box',
      xFrac: 0.5,
    },
  ];

  // Handbook reading sections (Right column of Tab 3, styled like 1967 book page)
  const HANDBOOK_SECTIONS = [
    {
      tag: '§1 · LOAD FLOW',
      jumpLabel: 'Show FBD',
      preset: 'office_safe',
      xFrac: 0.5,
      text: 'A floor slab or roof deck rests along the entire top of the beam. Instead of one concentrated weight, every unit length carries force w (kN/m or lbf/ft). The beam’s job is to collect that spread-out load and funnel it sideways to supports A and B.',
    },
    {
      tag: '§2 · WHY MAKE AN IMAGINARY CUT?',
      jumpLabel: 'Cut at L/4',
      preset: 'office_safe',
      xFrac: 0.25,
      text: 'External equilibrium only tells us the support forces RA and RB. To discover what the steel or timber feels inside, we slice the beam mentally at distance x. On the exposed cut face, internal vertical Shear V(x) stops the left piece from sliding up past the right piece, while an internal Bending Moment M(x) — top compression pushing left, bottom tension pulling right — stops it from rotating.',
    },
    {
      tag: '§3 · READING SFD & BMD TOGETHER',
      jumpLabel: 'Midspan Peak',
      preset: 'office_safe',
      xFrac: 0.5,
      text: 'Start at support A: reaction RA jumps the shear diagram straight up to +wL/2. As you move right, each meter of downward load w subtracts from shear until V crosses zero right at midspan (x = L/2). The area under the positive shear triangle equals the peak bending moment: ½ × (L/2) × (wL/2) = wL²/8.',
    },
    {
      tag: '§4 · ELASTIC CURVE & SUPPORT SLOPE θ',
      jumpLabel: 'See Timber Sag',
      preset: 'timber_joist',
      xFrac: 0.5,
      text: 'Because top fibers shorten and bottom fibers lengthen under moment M(x), the beam curves smoothly downward into an elastic arc. Its tangent stays horizontal at midspan (slope = 0) and tilts steepest at supports A and B by angle θ = wL³ / (24EI).',
    },
    {
      tag: '§5 · WHEN EULER-BERNOULLI APPLIES',
      jumpLabel: 'Test 8 m Span',
      preset: 'bridge_span',
      xFrac: 0.5,
      text: 'Classical Euler-Bernoulli theory assumes plane sections remain plane and perpendicular to the neutral axis, neglecting shear deformation. It is highly accurate for slender beams where span-to-depth ratio L/h ≥ 10, small slopes (θ ≪ 1 rad), and stresses below yield (σ ≤ fy). For very short, deep beams (L/h < 10), Timoshenko shear deflection becomes significant.',
    },
  ];

  /**
   * Calculates cross-section properties and returns normalized geometry for SVG rendering:
   * - Iy (cm⁴ or in⁴), Wy (cm³ or in³), A (cm² or in²), h (mm or in), b (mm or in)
   */
  function calculateSectionProperties(type, params, unit) {
    const u = unit || 'metric';
    const p = params || {};
    let Iy = 0;
    let Wy = 0;
    let A = 0;
    let h_total = 0;
    let b_total = 0;
    let geom = { type };

    if (type === 'rect') {
      const b = Math.max(1e-3, parseFloat(p.b) || (u === 'metric' ? 100 : 4));
      const h = Math.max(1e-3, parseFloat(p.h) || (u === 'metric' ? 200 : 8));
      h_total = h;
      b_total = b;
      A = b * h;
      Iy = (b * Math.pow(h, 3)) / 12;
      Wy = (b * Math.pow(h, 2)) / 6;
      geom = { type: 'rect', b, h };
      if (u === 'metric') {
        Iy /= 1e4; Wy /= 1e3; A /= 1e2;
      }
    } else if (type === 'i_beam') {
      const h = Math.max(1e-2, parseFloat(p.h) || (u === 'metric' ? 200 : 8));
      const b = Math.max(1e-2, parseFloat(p.b) || (u === 'metric' ? 100 : 4));
      const tfRaw = Math.max(1e-3, parseFloat(p.tf) || (u === 'metric' ? 9 : 0.35));
      const twRaw = Math.max(1e-3, parseFloat(p.tw) || (u === 'metric' ? 6 : 0.25));
      const tf = Math.min(tfRaw, h * 0.48);
      const tw = Math.min(twRaw, b * 0.95);
      h_total = h;
      b_total = b;
      const hw = Math.max(0, h - 2 * tf);
      A = 2 * (b * tf) + hw * tw;
      Iy = (b * Math.pow(h, 3) - (b - tw) * Math.pow(hw, 3)) / 12;
      Wy = Iy / (h / 2);
      geom = { type: 'i_beam', h, b, tw, tf };
      if (u === 'metric') {
        Iy /= 1e4; Wy /= 1e3; A /= 1e2;
      }
    } else if (type === 'hollow_rect') {
      const B = Math.max(1e-2, parseFloat(p.b) || (u === 'metric' ? 120 : 4.5));
      const H = Math.max(1e-2, parseFloat(p.h) || (u === 'metric' ? 160 : 6));
      const tRaw = Math.max(1e-3, parseFloat(p.t) || (u === 'metric' ? 6 : 0.25));
      const t = Math.min(tRaw, Math.min(B, H) * 0.48);
      h_total = H;
      b_total = B;
      const bi = Math.max(0, B - 2 * t);
      const hi = Math.max(0, H - 2 * t);
      A = B * H - bi * hi;
      Iy = (B * Math.pow(H, 3) - bi * Math.pow(hi, 3)) / 12;
      Wy = Iy / (H / 2);
      geom = { type: 'hollow_rect', b: B, h: H, t };
      if (u === 'metric') {
        Iy /= 1e4; Wy /= 1e3; A /= 1e2;
      }
    } else if (type === 'round_solid') {
      const d = Math.max(1e-2, parseFloat(p.d) || (u === 'metric' ? 80 : 3));
      h_total = d;
      b_total = d;
      A = (Math.PI * Math.pow(d, 2)) / 4;
      Iy = (Math.PI * Math.pow(d, 4)) / 64;
      Wy = (Math.PI * Math.pow(d, 3)) / 32;
      geom = { type: 'round_solid', d };
      if (u === 'metric') {
        Iy /= 1e4; Wy /= 1e3; A /= 1e2;
      }
    } else if (type === 'round_tube') {
      const D = Math.max(1e-2, parseFloat(p.D) || (u === 'metric' ? 100 : 4));
      const tRaw = Math.max(1e-3, parseFloat(p.t) || (u === 'metric' ? 5 : 0.2));
      const t = Math.min(tRaw, D * 0.48);
      h_total = D;
      b_total = D;
      const d = Math.max(0, D - 2 * t);
      A = (Math.PI * (Math.pow(D, 2) - Math.pow(d, 2))) / 4;
      Iy = (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4))) / 64;
      Wy = Iy / (D / 2);
      geom = { type: 'round_tube', D, t };
      if (u === 'metric') {
        Iy /= 1e4; Wy /= 1e3; A /= 1e2;
      }
    } else if (type === 'standard') {
      const profile = STANDARD_PROFILES[p.name] || STANDARD_PROFILES.IPE200;
      if (u === 'metric') {
        Iy = profile.Iy;
        Wy = profile.Wy;
        A = profile.A;
        h_total = profile.h;
        b_total = profile.b;
        geom = {
          type: 'i_beam',
          name: profile.name,
          h: profile.h,
          b: profile.b,
          tw: profile.tw,
          tf: profile.tf,
        };
      } else {
        Iy = profile.Iy * 0.024025096;
        Wy = profile.Wy * 0.061023744;
        A = profile.A * 0.15500031;
        h_total = profile.h / 25.4;
        b_total = profile.b / 25.4;
        geom = {
          type: 'i_beam',
          name: profile.name,
          h: profile.h / 25.4,
          b: profile.b / 25.4,
          tw: profile.tw / 25.4,
          tf: profile.tf / 25.4,
        };
      }
    } else {
      // Direct custom I & h
      Iy = Math.max(0.0001, parseFloat(p.custom_I) || (u === 'metric' ? 1940 : 46.6));
      h_total = Math.max(1e-2, parseFloat(p.custom_h) || (u === 'metric' ? 200 : 8));
      b_total = h_total * 0.55;
      // metric: Iy in cm⁴, h in mm -> h/2 in cm is h/20 -> Wy in cm³ = Iy / (h/20)
      // imperial: Iy in in⁴, h in in -> h/2 in in -> Wy in in³ = Iy / (h/2)
      Wy = Iy / (h_total / (u === 'metric' ? 20 : 2));
      A = u === 'metric' ? 30 : 4.65;
      geom = { type: 'custom', h: h_total, b: b_total };
    }

    return {
      Iy: Math.max(0.0001, Iy),
      Wy: Math.max(0.0001, Wy),
      A: Math.max(0.0001, A),
      h: h_total,
      b: b_total,
      geom,
    };
  }

  /**
   * Solves complete static & Euler-Bernoulli deflection problem for Simply Supported Beam + UDL.
   */
  function solveBeamUDL({ L, w, x, E, I, W_mod, h_depth, yieldVal, unit = 'metric' }) {
    const span = Math.max(0.001, parseFloat(L) || 1);
    const load = Math.max(0, parseFloat(w) || 0);
    const pos = Math.max(0, Math.min(span, parseFloat(x) || 0));
    const modE = Math.max(0.001, parseFloat(E) || 1);
    const momI = Math.max(0.0001, parseFloat(I) || 1);
    const secW = Math.max(0.0001, parseFloat(W_mod) || 1);
    const fy = Math.max(0.1, parseFloat(yieldVal) || (unit === 'metric' ? 235 : 36));
    const depth = Math.max(1e-3, parseFloat(h_depth) || (unit === 'metric' ? 200 : 8));

    const W_total = load * span;
    const R_A = W_total / 2;
    const R_B = R_A;

    const V_max = R_A;
    const V_x = load * (span / 2 - pos);

    const M_max = (load * span * span) / 8;
    const M_x = (load * pos / 2) * (span - pos);

    let delta_max = 0;
    let delta_x = 0;
    let theta_A_rad = 0;
    let theta_x_rad = 0;
    let sigma_max = 0;
    let sigma_x = 0;
    let span_for_ratio = 0;
    let slenderness = 0;

    if (unit === 'metric') {
      const w_SI = load * 1e3;     // N/m
      const E_SI = modE * 1e9;     // N/m²
      const I_SI = momI * 1e-8;    // m⁴
      const W_SI = secW * 1e-6;    // m³
      const EI = E_SI * I_SI;

      delta_max = ((5 * w_SI * Math.pow(span, 4)) / (384 * EI)) * 1000; // mm
      delta_x = (((w_SI * pos) / (24 * EI)) * (Math.pow(span, 3) - 2 * span * pos * pos + Math.pow(pos, 3))) * 1000; // mm
      theta_A_rad = (w_SI * Math.pow(span, 3)) / (24 * EI);
      // Slope dy/dx = w/(24EI) * (L^3 - 6 L x^2 + 4 x^3)
      theta_x_rad = (w_SI / (24 * EI)) * (Math.pow(span, 3) - 6 * span * pos * pos + 4 * Math.pow(pos, 3));

      sigma_max = ((M_max * 1e3) / W_SI) / 1e6; // MPa
      sigma_x = ((M_x * 1e3) / W_SI) / 1e6;     // MPa
      span_for_ratio = span * 1000; // mm
      slenderness = span_for_ratio / depth; // L/h
    } else {
      const L_in = span * 12;
      const w_in = load / 12;      // lbf/in
      const x_in = pos * 12;
      const E_psi = modE * 1000;   // psi
      const EI = E_psi * momI;

      delta_max = (5 * w_in * Math.pow(L_in, 4)) / (384 * EI); // in
      delta_x = ((w_in * x_in) / (24 * EI)) * (Math.pow(L_in, 3) - 2 * L_in * x_in * x_in + Math.pow(x_in, 3)); // in
      theta_A_rad = (w_in * Math.pow(L_in, 3)) / (24 * EI);
      theta_x_rad = (w_in / (24 * EI)) * (Math.pow(L_in, 3) - 6 * L_in * x_in * x_in + 4 * Math.pow(x_in, 3));

      sigma_max = ((M_max * 12) / secW) / 1000; // ksi
      sigma_x = ((M_x * 12) / secW) / 1000;     // ksi
      span_for_ratio = L_in; // in
      slenderness = L_in / depth; // L/h
    }

    const dMaxAbs = Math.abs(delta_max);
    const dXAbs = Math.abs(delta_x);
    const ratio_max = dMaxAbs > 1e-6 ? Math.round(span_for_ratio / dMaxAbs) : 999999;
    const deflLimit300 = span_for_ratio / 300; // L/300 serviceability benchmark
    const utilizationPct = (sigma_max / fy) * 100;
    const strengthOk = utilizationPct <= 100;
    const serviceOk = dMaxAbs <= deflLimit300 + 1e-9;
    const deepBeamWarning = slenderness < 10;

    return {
      L: span,
      w: load,
      x: pos,
      x_rel: pos / span,
      E: modE,
      I: momI,
      W_sec: secW,
      h_depth: depth,
      yieldVal: fy,
      unit,
      W_total,
      R_A,
      R_B,
      V_max,
      V_x,
      M_max,
      M_x,
      delta_max: dMaxAbs,
      delta_x: dXAbs,
      theta_A_rad: Math.abs(theta_A_rad),
      theta_A_deg: Math.abs(theta_A_rad * (180 / Math.PI)),
      theta_x_deg: theta_x_rad * (180 / Math.PI),
      sigma_max,
      sigma_x,
      ratio_max,
      deflLimit300,
      utilizationPct,
      strengthOk,
      serviceOk,
      slenderness,
      deepBeamWarning,
    };
  }

  function generateDiagramCurves(solution, numPoints) {
    const n = numPoints || 120;
    const { L, w, E, I, W_sec, h_depth, yieldVal, unit } = solution;
    const points = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * L;
      const solAtX = solveBeamUDL({ L, w, x, E, I, W_mod: W_sec, h_depth, yieldVal, unit });
      points.push({
        x,
        x_rel: x / L,
        V: solAtX.V_x,
        M: solAtX.M_x,
        delta: solAtX.delta_x,
        sigma: solAtX.sigma_x,
      });
    }
    return points;
  }

  /**
   * Produces a plain-English live physical reading of what is happening at probe x.
   */
  function describeProbeState(sol) {
    const isMetric = sol.unit === 'metric';
    const uL = isMetric ? 'm' : 'ft';
    const uF = isMetric ? 'kN' : 'lbf';
    const uM = isMetric ? 'kNm' : 'lbf·ft';
    const uD = isMetric ? 'mm' : 'in';
    const uS = isMetric ? 'MPa' : 'ksi';
    const r = sol.x_rel;

    let locationDesc = '';
    if (r <= 0.04) {
      locationDesc = `At Pin Support A (x = ${sol.x.toFixed(2)} ${uL}), reaction RA = ${sol.R_A.toFixed(1)} ${uF} creates peak positive shear (+${sol.V_x.toFixed(1)} ${uF}), while bending moment and sag are zero.`;
    } else if (r >= 0.96) {
      locationDesc = `At Roller Support B (x = ${sol.x.toFixed(2)} ${uL}), internal shear reaches its negative peak (${sol.V_x.toFixed(1)} ${uF}) to balance RB, while bending moment and sag drop to zero.`;
    } else if (Math.abs(r - 0.5) <= 0.05) {
      locationDesc = `At Midspan (x = ${sol.x.toFixed(2)} ${uL}), shear crosses zero (V = ${sol.V_x.toFixed(1)} ${uF}) — which is why bending moment (${sol.M_x.toFixed(1)} ${uM}) and vertical sag (${sol.delta_x.toFixed(2)} ${uD}) both reach their absolute peak here.`;
    } else if (r < 0.5) {
      locationDesc = `In the left half (x = ${sol.x.toFixed(2)} ${uL}, ${(r * 100).toFixed(0)}% L), upward reaction RA still exceeds the partial load w·x, leaving positive shear (+${sol.V_x.toFixed(1)} ${uF}) that builds bending moment toward midspan (M = ${sol.M_x.toFixed(1)} ${uM}).`;
    } else {
      locationDesc = `In the right half (x = ${sol.x.toFixed(2)} ${uL}, ${(r * 100).toFixed(0)}% L), cumulative downward load w·x exceeds RA, reversing shear to ${sol.V_x.toFixed(1)} ${uF} as bending moment tapers down to support B (M = ${sol.M_x.toFixed(1)} ${uM}).`;
    }

    let checkDesc = '';
    if (!sol.strengthOk && !sol.serviceOk) {
      checkDesc = `Design FAIL: peak stress ${sol.sigma_max.toFixed(1)} ${uS} exceeds yield (${sol.utilizationPct.toFixed(0)}% fy) AND sag L/${sol.ratio_max} exceeds L/300.`;
    } else if (!sol.strengthOk) {
      checkDesc = `Strength FAIL: peak stress ${sol.sigma_max.toFixed(1)} ${uS} exceeds yield (${sol.utilizationPct.toFixed(0)}% fy), even though sag (L/${sol.ratio_max}) passes L/300.`;
    } else if (!sol.serviceOk) {
      checkDesc = `Stiffness WARN: stress is safe (${sol.utilizationPct.toFixed(0)}% fy), but sag L/${sol.ratio_max} exceeds the L/300 comfort limit.`;
    } else {
      checkDesc = `Design PASS: stress is ${sol.utilizationPct.toFixed(0)}% of yield (${sol.sigma_max.toFixed(1)} / ${sol.yieldVal} ${uS}) and sag is L/${sol.ratio_max} (stiffer than L/300).`;
    }

    return { locationDesc, checkDesc };
  }

  global.BEAM_ENGINE = {
    MATERIALS,
    STANDARD_PROFILES,
    SCENARIO_PRESETS,
    TOUR_STOPS,
    CONCEPT_CARDS,
    HANDBOOK_SECTIONS,
    calculateSectionProperties,
    solveBeamUDL,
    generateDiagramCurves,
    describeProbeState,
  };
})(window);
