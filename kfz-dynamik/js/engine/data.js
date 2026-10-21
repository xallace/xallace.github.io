/* Beispieldaten aus Mitschke/Wallentowitz, Dynamik der Kraftfahrzeuge, 5. Aufl. 2014.
   Jede Vorlage nennt ihre Quelle. Werte in SI-Einheiten. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;

  // Tab. 21.7: l = 2,5 m, iL = 19, VL = 1, i/l = 0,46
  const einspurFahrzeuge = [
    { name: 'Fzg. 1', title: 'Grundfahrzeug, untersteuernd', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.06, CL: 10000 } },
    { name: 'Fzg. 2', title: 'seitensteife Reifen', p: { m: 1000, lVrel: 0.5, caV: 75000, caH: 75000, nV: 0.06, CL: 10000 } },
    { name: 'Fzg. 3', title: 'seitenweiche Reifen', p: { m: 1000, lVrel: 0.5, caV: 25000, caH: 25000, nV: 0.06, CL: 10000 } },
    { name: 'Fzg. 4', title: 'steife Lenkung, kleiner Nachlauf', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.04, CL: 20000 } },
    { name: 'Fzg. 5', title: 'weiche Lenkung, großer Nachlauf', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.08, CL: 5000 } },
    { name: 'Fzg. 6', title: 'hecklastig, stark untersteuernd', p: { m: 1000, lVrel: 0.6, caV: 45000, caH: 55000, nV: 0.06, CL: 10000 } },
    { name: 'Fzg. 7', title: 'frontlastig', p: { m: 1000, lVrel: 0.4, caV: 55000, caH: 45000, nV: 0.06, CL: 10000 } },
    { name: 'Fzg. 8', title: 'beladen, übersteuernd (vkrit = 33,4 m/s)', p: { m: 1400, lVrel: 0.6, caV: 50000, caH: 50000, nV: 0.06, CL: 10000 } },
  ].map((v) => ({ ...v, p: { l: 2.5, iL: 19, VL: 1, iRel: 0.46, ...v.p } }));

  // Tab. 13.1, Werte je Rad (Federkonstanten in N/m, Dämpfung in Ns/m)
  const base13 = { Fzstat: 2820, m1: 31, m2: 229, m3: 28, c1: 128000, c2: 20200, c3: 9900, k2: 1140, k3: 260 };
  const schwingungFahrzeuge = [
    { name: 'Fzg. 1', title: 'Mittelklasse-Pkw, 1 Person (Grundfahrzeug)', p: {} },
    { name: 'Fzg. 2', title: 'weiche Aufbaufeder, ν2/2π = 0,8 Hz', p: { c2: 5100 } },
    { name: 'Fzg. 4', title: 'harte Aufbaufeder, ν2/2π = 2,1 Hz', p: { c2: 40400 } },
    { name: 'Fzg. 8', title: 'kaum gedämpft, D2 = 0,05', p: { k2: 230 } },
    { name: 'Fzg. 5', title: 'schwach gedämpft, D2 = 0,16', p: { k2: 680 } },
    { name: 'Fzg. 6', title: 'stark gedämpft, D2 = 0,37', p: { k2: 1590 } },
    { name: 'Fzg. 20', title: 'schwere Radmasse, m1 = 62 kg', p: { m1: 62, Fzstat: 3120 } },
    { name: 'Fzg. 22', title: 'weicher Reifen, c1 = 94 kN/m', p: { c1: 94000 } },
    { name: 'Fzg. 23', title: 'ohne Insassen (Zweimassensystem)', p: { Fzstat: 2450, m2: 219, m3: 0 } },
    { name: 'Fzg. 25', title: '3 Personen + Gepäck, Federung nicht angepasst', p: { Fzstat: 4410, m2: 335, m3: 84, c3: 29800, k3: 790 } },
    { name: 'Fzg. 28', title: '3 Personen + Gepäck, Aufbaufeder angepasst (c2 = 27,5 kN/m)', p: { Fzstat: 4410, m2: 335, m3: 84, c2: 27500, c3: 29800, k3: 790 } },
  ].map((v) => ({ ...v, p: { ...base13, ...v.p } }));

  // Tab. 11.5 (ISO 8608), Mittelwerte bei w = 2
  const strassenklassen = [
    { name: 'A · sehr gut', PhiOmega0: 1e-6 },
    { name: 'B · gut', PhiOmega0: 4e-6 },
    { name: 'C · mittel', PhiOmega0: 16e-6 },
    { name: 'D · schlecht', PhiOmega0: 64e-6 },
    { name: 'E · sehr schlecht', PhiOmega0: 256e-6 },
  ];

  // Tab. 9.1 Reaktionsdauern (Mittelwert, 2 %, 98 %)
  const reaktion = [
    { name: 'ohne Blickzuwendung', tr: [0.64, 0.36, 0.78] },
    { name: 'Blickbewegung 0,5…5°', tr: [1.12, 0.68, 1.33] },
    { name: 'Blickbewegung > 5°', tr: [1.25, 0.77, 1.48] },
  ];

  // Abb. 2.44, Reifen 205/60 R 15, Fz = 4000 N, trocken – aus den Diagrammen abgelesen
  const reifenMessung = {
    FxVsSlip: [[0.14, 4830], [0.2, 4700], [0.3, 4400], [0.4, 4050], [0.5, 3800], [0.6, 3600], [0.8, 3330], [1.0, 3170]],
    FyVsAlpha: [[3, 2600], [6, 3200], [9, 3600], [12, 3850], [15, 3900]],
  };

  K.data = { einspurFahrzeuge, schwingungFahrzeuge, strassenklassen, reaktion, reifenMessung };
})(typeof globalThis !== 'undefined' ? globalThis : this);
