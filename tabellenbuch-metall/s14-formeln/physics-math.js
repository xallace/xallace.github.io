/**
 * physics-math.js - Mathematical and Physical calculation engine for Tabellenbuch Metall (S. 14)
 * Covers:
 * 1. Physical Formulas (Größengleichungen): Schnittgeschwindigkeit vc = π · d · n
 * 2. Numerical Value Equations (Zahlenwertgleichungen): Drehmoment M = (9550 · P) / n
 * 3. Linear Functions: y = m · x + b
 * 4. Cost and Revenue Functions (Kosten- und Erlösfunktion & Gewinnschwelle / Break-Even):
 *    KG = Kv · M + Kf, E = e · M
 */

const PhysicsMath = {
  // -------------------------------------------------------------------------
  // 1. SCHNITTGESCHWINDIGKEIT (Größengleichung: vc = π · d · n)
  // -------------------------------------------------------------------------
  cuttingSpeed: {
    // Standard materials reference catalog (Richtwerte nach Tabellenbuch Metall)
    materials: [
      { id: 'custom', name: 'Benutzerdefiniert / Eigene Werte', vcHss: 30, vcVhm: 120 },
      { id: 's235', name: 'Baustahl S235JR (St 37-2)', vcHss: 28, vcVhm: 140, info: 'Allgemeiner Baustahl, gut zerspanbar' },
      { id: 'c45', name: 'Vergütungsstahl C45', vcHss: 22, vcVhm: 110, info: 'Maschinenbauteile, Wellen, Achsen' },
      { id: '11smn30', name: 'Automatenstahl 11SMn30', vcHss: 40, vcVhm: 180, info: 'Sehr gut zerspanbar, kurze Späne' },
      { id: '42crmo4', name: 'Vergütungsstahl 42CrMo4', vcHss: 18, vcVhm: 95, info: 'Hochfeste Bauteile, Kurbelwellen' },
      { id: 'x5crni18-10', name: 'Edelstahl 1.4301 (V2A)', vcHss: 14, vcVhm: 75, info: 'Rostfrei, zäh, Neigung zur Kaltverfestigung' },
      { id: 'almgsi05', name: 'Aluminiumlegierung AlMgSi0,5', vcHss: 85, vcVhm: 360, info: 'Leichtmetall, hohe Schnittgeschwindigkeiten' },
      { id: 'engjl250', name: 'Gusseisen EN-GJL-250 (GG-25)', vcHss: 24, vcVhm: 150, info: 'Grauguss, abrasive Späne, trocken bearbeiten' },
      { id: 'cusn8', name: 'Kupfer-Zinn-Bronze CuSn8', vcHss: 35, vcVhm: 160, info: 'Gleitlagerwerkstoff, gute Zerspanung' }
    ],

    /**
     * Convert diameter to meters
     * @param {number} val 
     * @param {string} unit 'mm' | 'cm' | 'm' | 'in'
     */
    toDiameterMeters(val, unit) {
      switch (unit) {
        case 'mm': return val / 1000;
        case 'cm': return val / 100;
        case 'in': return val * 0.0254;
        case 'm':
        default: return val;
      }
    },

    /**
     * Convert speed to 1/min (rpm)
     * @param {number} val 
     * @param {string} unit '1/min' | '1/s' | 'rad/s'
     */
    toRpm(val, unit) {
      switch (unit) {
        case '1/s': return val * 60;
        case 'rad/s': return (val * 60) / (2 * Math.PI);
        case '1/min':
        default: return val;
      }
    },

    /**
     * Calculate vc in m/min
     * vc = π · d[m] · n[1/min]
     */
    calcVc(dMeters, nRpm) {
      return Math.PI * dMeters * nRpm;
    },

    /**
     * Calculate diameter d in meters
     * d = vc / (π · n)
     */
    calcDiameter(vcMPerMin, nRpm) {
      if (nRpm <= 0) return 0;
      return vcMPerMin / (Math.PI * nRpm);
    },

    /**
     * Calculate spindle speed n in 1/min
     * n = vc / (π · d)
     */
    calcRpm(vcMPerMin, dMeters) {
      if (dMeters <= 0) return 0;
      return vcMPerMin / (Math.PI * dMeters);
    },

    /**
     * Format a complete step-by-step breakdown as shown on page 14:
     * vc = π · d · n = π · 200 mm · 630 1/min = π · 200 mm · (1 m / 1000 mm) · 630 1/min = 395,84 m/min
     */
    getStepByStepVc(dVal, dUnit, nVal, nUnit) {
      const dMeters = this.toDiameterMeters(dVal, dUnit);
      const nRpm = this.toRpm(nVal, nUnit);
      const vc = this.calcVc(dMeters, nRpm);

      const dMm = dVal * (dUnit === 'mm' ? 1 : dUnit === 'cm' ? 10 : dUnit === 'm' ? 1000 : 25.4);
      const dMmFormatted = dMm.toLocaleString('de-DE', { maximumFractionDigits: 2 });
      const nFormatted = nRpm.toLocaleString('de-DE', { maximumFractionDigits: 1 });
      const vcFormatted = vc.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return {
        formula: 'v_c = \\pi \\cdot d \\cdot n',
        rawSub: `v_c = \\pi \\cdot ${dMmFormatted}\\,\\text{mm} \\cdot ${nFormatted}\\,\\frac{1}{\\text{min}}`,
        conversionStep: `v_c = \\pi \\cdot ${dMmFormatted}\\,\\text{mm} \\cdot \\frac{1\\,\\text{m}}{1000\\,\\text{mm}} \\cdot ${nFormatted}\\,\\frac{1}{\\text{min}}`,
        simplifiedStep: `v_c = \\pi \\cdot ${(dMeters).toLocaleString('de-DE', { maximumFractionDigits: 4 })}\\,\\text{m} \\cdot ${nFormatted}\\,\\frac{1}{\\text{min}}`,
        result: `${vcFormatted}\\,\\frac{\\text{m}}{\\text{min}}`,
        numericResult: vc
      };
    },

    getStepByStepN(vcMPerMin, dVal, dUnit) {
      const dMeters = this.toDiameterMeters(dVal, dUnit);
      const nRpm = this.calcRpm(vcMPerMin, dMeters);
      const dMm = dMeters * 1000;

      return {
        formula: 'n = \\frac{v_c}{\\pi \\cdot d}',
        rawSub: `n = \\frac{${vcMPerMin.toLocaleString('de-DE', { maximumFractionDigits: 2 })}\\,\\frac{\\text{m}}{\\text{min}}}{\\pi \\cdot ${dMm.toLocaleString('de-DE', { maximumFractionDigits: 2 })}\\,\\text{mm}}`,
        conversionStep: `n = \\frac{${vcMPerMin.toLocaleString('de-DE', { maximumFractionDigits: 2 })}\\,\\frac{\\text{m}}{\\text{min}}}{\\pi \\cdot ${dMeters.toLocaleString('de-DE', { maximumFractionDigits: 4 })}\\,\\text{m}}`,
        result: `${nRpm.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\\,\\frac{1}{\\text{min}}`,
        numericResult: nRpm
      };
    },

    getStepByStepD(vcMPerMin, nRpm) {
      const dMeters = this.calcDiameter(vcMPerMin, nRpm);
      const dMm = dMeters * 1000;

      return {
        formula: 'd = \\frac{v_c}{\\pi \\cdot n}',
        rawSub: `d = \\frac{${vcMPerMin.toLocaleString('de-DE', { maximumFractionDigits: 2 })}\\,\\frac{\\text{m}}{\\text{min}}}{\\pi \\cdot ${nRpm.toLocaleString('de-DE', { maximumFractionDigits: 1 })}\\,\\frac{1}{\\text{min}}}`,
        conversionStep: `d = ${dMeters.toLocaleString('de-DE', { maximumFractionDigits: 4 })}\\,\\text{m} = ${dMm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\\,\\text{mm}`,
        result: `${dMm.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\\,\\text{mm}`,
        numericResult: dMm
      };
    }
  },

  // -------------------------------------------------------------------------
  // 2. ZAHLENWERTGLEICHUNGEN (Drehmoment: M = (9550 · P) / n)
  // -------------------------------------------------------------------------
  torqueEquation: {
    // Constant according to Tabellenbuch Metall
    CONSTANT_PRACTICE: 9550,
    // Exact constant: 60000 / (2 * π) = 30000 / π = 9549.29658551372...
    CONSTANT_EXACT: (60 * 1000) / (2 * Math.PI),

    /**
     * Calculate Torque M in N·m
     * M = (9550 · P) / n
     * P in kW, n in 1/min
     */
    calcM(pKw, nRpm, useExact = false) {
      if (nRpm <= 0) return 0;
      const c = useExact ? this.CONSTANT_EXACT : this.CONSTANT_PRACTICE;
      return (c * pKw) / nRpm;
    },

    /**
     * Calculate Power P in kW
     * P = (M · n) / 9550
     * M in N·m, n in 1/min
     */
    calcP(mNm, nRpm, useExact = false) {
      const c = useExact ? this.CONSTANT_EXACT : this.CONSTANT_PRACTICE;
      return (mNm * nRpm) / c;
    },

    /**
     * Calculate Spindle Speed n in 1/min
     * n = (9550 · P) / M
     * P in kW, M in N·m
     */
    calcN(pKw, mNm, useExact = false) {
      if (mNm <= 0) return 0;
      const c = useExact ? this.CONSTANT_EXACT : this.CONSTANT_PRACTICE;
      return (c * pKw) / mNm;
    },

    /**
     * Mathematical derivation steps for why the factor 9550 exists
     */
    getDerivation() {
      return {
        formulaPhysical: 'P = M \\cdot \\omega',
        omegaDef: '\\omega = 2\\pi \\cdot f = 2\\pi \\cdot \\frac{n}{60}',
        substituting: 'P = M \\cdot \\frac{2\\pi \\cdot n}{60}',
        rearrangedM: 'M = \\frac{60}{2\\pi} \\cdot \\frac{P}{n} \\approx 9{,}5493 \\cdot \\frac{P}{n} \\quad [P \\text{ in Watt, } M \\text{ in Nm, } n \\text{ in } 1/\\text{min}]',
        kiloWattTransition: 'P(\\text{W}) = P(\\text{kW}) \\cdot 1000 \\implies M = \\frac{60 \\cdot 1000}{2\\pi} \\cdot \\frac{P(\\text{kW})}{n}',
        exactConstant: (60000 / (2 * Math.PI)),
        roundedConstant: 9550,
        relativeErrorPercent: ((9550 - (60000 / (2 * Math.PI))) / (60000 / (2 * Math.PI))) * 100
      };
    },

    getStepByStepM(pKw, nRpm) {
      const M = this.calcM(pKw, nRpm);
      const M_exact = this.calcM(pKw, nRpm, true);
      const pStr = pKw.toLocaleString('de-DE', { maximumFractionDigits: 3 });
      const nStr = nRpm.toLocaleString('de-DE', { maximumFractionDigits: 1 });
      const mStr = M.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      const mExactStr = M_exact.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

      return {
        formula: 'M = \\frac{9550 \\cdot P}{n}',
        rawSub: `M = \\frac{9550 \\cdot ${pStr}}{${nStr}}\\,\\text{N}\\cdot\\text{m}`,
        result: `${mStr}\\,\\text{N}\\cdot\\text{m}`,
        exactResult: `${mExactStr}\\,\\text{N}\\cdot\\text{m}`,
        numericResult: M
      };
    },

    getStepByStepP(mNm, nRpm) {
      const P = this.calcP(mNm, nRpm);
      const mStr = mNm.toLocaleString('de-DE', { maximumFractionDigits: 2 });
      const nStr = nRpm.toLocaleString('de-DE', { maximumFractionDigits: 1 });
      const pStr = P.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

      return {
        formula: 'P = \\frac{M \\cdot n}{9550}',
        rawSub: `P = \\frac{${mStr} \\cdot ${nStr}}{9550}\\,\\text{kW}`,
        result: `${pStr}\\,\\text{kW}`,
        numericResult: P
      };
    },

    getStepByStepN(pKw, mNm) {
      const n = this.calcN(pKw, mNm);
      const pStr = pKw.toLocaleString('de-DE', { maximumFractionDigits: 3 });
      const mStr = mNm.toLocaleString('de-DE', { maximumFractionDigits: 2 });
      const nStr = n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

      return {
        formula: 'n = \\frac{9550 \\cdot P}{M}',
        rawSub: `n = \\frac{9550 \\cdot ${pStr}}{${mStr}}\\,\\frac{1}{\\text{min}}`,
        result: `${nStr}\\,\\frac{1}{\\text{min}}`,
        numericResult: n
      };
    }
  },

  // -------------------------------------------------------------------------
  // 3. GLEICHUNGEN UND DIAGRAMME: LINEARE FUNKTION (y = m · x + b)
  // -------------------------------------------------------------------------
  linearFunction: {
    /**
     * Compute y = m · x + b
     */
    eval(m, b, x) {
      return m * x + b;
    },

    /**
     * Generate table of values (Wertetabelle) for specific or ranged x
     */
    generateTable(m, b, xValues = [-2, 0, 2, 3]) {
      return xValues.map(x => ({
        x,
        y: this.eval(m, b, x)
      }));
    },

    /**
     * Compute x-intercept (Nullstelle): y = 0 => x = -b / m
     */
    getRoot(m, b) {
      if (Math.abs(m) < 1e-12) return null;
      return -b / m;
    }
  },

  // -------------------------------------------------------------------------
  // 4. KOSTEN- UND ERLÖSFUNKTION & GEWINNSCHWELLE (BREAK-EVEN)
  // -------------------------------------------------------------------------
  breakEven: {
    // Textbook default scenario (Beispiel 2, Seite 14)
    bookPreset: {
      name: 'Buch-Beispiel 2 (Tabellenbuch Metall S. 14)',
      Kf: 200000,      // Fixkosten in €
      Kv: 60,          // variable Kosten in €/Stück
      e: 110,          // Erlös / Verkaufspreis in €/Stück
      currentM: 6000   // Beispiel-Stückzahl
    },

    // Additional practical industry presets
    presets: [
      {
        id: 'book',
        name: 'Buch-Beispiel S. 14 (Maschinenbau-Großbaugruppe)',
        Kf: 200000,
        Kv: 60,
        e: 110,
        currentM: 6000,
        desc: 'Originaldaten: Kf = 200.000 €, Kv = 60 €/Stck, e = 110 €/Stck. Gewinnschwelle bei 4.000 Stück.'
      },
      {
        id: 'cnc_shaft',
        name: 'CNC-Präzisions-Welle (Kleinserie)',
        Kf: 15000,
        Kv: 25,
        e: 65,
        currentM: 500,
        desc: 'CNC-Rüstkosten & Werkzeugaufnahme Kf = 15.000 €, Kv = 25 €/Stck, Verkaufspreis 65 €.'
      },
      {
        id: 'injection_mold',
        name: 'Spritzguss-Werkzeug (Großserie Gehäuse)',
        Kf: 85000,
        Kv: 1.80,
        e: 4.50,
        currentM: 40000,
        desc: 'Hohe Werkzeuginvestition (Kf = 85.000 €), extrem geringe Stückkosten (1,80 €).'
      },
      {
        id: 'stamping',
        name: 'Stanz-Biegeteil (Blechfertigung)',
        Kf: 45000,
        Kv: 0.75,
        e: 1.65,
        currentM: 75000,
        desc: 'Folgeverbundwerkzeug Kf = 45.000 €, Kv = 0,75 €/Stck, e = 1,65 €/Stck.'
      }
    ],

    /**
     * Gesamtkosten: KG = Kv · M + Kf
     */
    calcKg(Kf, Kv, M) {
      return Kv * M + Kf;
    },

    /**
     * Erlös: E = e · M
     */
    calcE(e, M) {
      return e * M;
    },

    /**
     * Gewinn/Verlust: G = E - KG = (e - Kv) · M - Kf
     */
    calcProfit(Kf, Kv, e, M) {
      return this.calcE(e, M) - this.calcKg(Kf, Kv, M);
    },

    /**
     * Deckungsbeitrag pro Stück: db = e - Kv
     */
    calcContributionMarginPerUnit(Kv, e) {
      return e - Kv;
    },

    /**
     * Gewinnschwelle (Break-Even Menge Gs):
     * KG = E  =>  Kv · M + Kf = e · M  =>  M_Gs = Kf / (e - Kv)
     */
    calcBreakEvenQuantity(Kf, Kv, e) {
      const db = e - Kv;
      if (db <= 0) return Infinity; // Niemals Gewinnschwelle, wenn Erlös <= var. Kosten
      return Kf / db;
    },

    /**
     * Umsatz an der Gewinnschwelle: E_Gs = e · M_Gs
     */
    calcBreakEvenRevenue(Kf, Kv, e) {
      const mGs = this.calcBreakEvenQuantity(Kf, Kv, e);
      if (!isFinite(mGs)) return Infinity;
      return this.calcE(e, mGs);
    },

    /**
     * Return Wertetabelle comparing key production milestones (like S. 14):
     * M = 0, M = Gewinnschwelle (4000 im Buch), M = 6000 (im Buch), and custom M
     */
    generateComparisonTable(Kf, Kv, e, customM) {
      const mGs = this.calcBreakEvenQuantity(Kf, Kv, e);
      const points = [0];

      if (isFinite(mGs) && mGs > 0) {
        points.push(Math.round(mGs));
      }

      // Add a standard upper benchmark
      const upperBenchmark = isFinite(mGs) ? Math.round(mGs * 1.5) : 10000;
      if (!points.includes(upperBenchmark)) {
        points.push(upperBenchmark);
      }

      if (customM !== undefined && !points.includes(customM)) {
        points.push(customM);
      }

      // Sort points
      points.sort((a, b) => a - b);

      return points.map(m => {
        const kg = this.calcKg(Kf, Kv, m);
        const erlos = this.calcE(e, m);
        const profit = erlos - kg;
        const isBreakEven = isFinite(mGs) && Math.abs(m - mGs) < 0.01;

        return {
          m,
          kg,
          erlos,
          profit,
          isBreakEven,
          status: profit > 0.01 ? 'Gewinn' : profit < -0.01 ? 'Verlust' : 'Gewinnschwelle'
        };
      });
    }
  }
};

// Make available globally in browser window
if (typeof window !== 'undefined') {
  window.PhysicsMath = PhysicsMath;
}
