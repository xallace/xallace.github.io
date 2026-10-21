/* Prüfung der Rechenkerne gegen Zahlenwerte aus dem Buch.
   Wird von tests/verify.js (Node) und vom Reiter „Prüfung“ im Browser benutzt.
   kind 'check' zählt als bestanden/fehlgeschlagen, 'info' zeigt eine bekannte Abweichung. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const DEG = Math.PI / 180;

  function run() {
    const rows = [];
    const sect = (title) => rows.push({ kind: 'sect', label: title });
    const check = (label, got, want, tol, ref) =>
      rows.push({ kind: 'check', label, got, want, tol, ref, ok: Math.abs(got - want) <= tol * Math.abs(want) });
    const info = (label, got, want, ref) => rows.push({ kind: 'info', label, got, want, ref });

    sect('Teil II · Fahrleistungen (Pkw aus Abb. 7.1/7.10)');
    {
      const L = K.laengs, p = L.withDefaults({});
      check('max. Motorleistung [kW]', L.maxPower(p).P / 1000, 37, 0.03, 'Abb. 7.1d');
      check('Höchstgeschwindigkeit [m/s]', L.vmax({}).v, 40, 0.03, 'Abb. 7.10/7.11a');
      const run1 = L.accelerationRun({}, 100 / 3.6);
      check('0–100 km/h [s]', run1.tEnd, 18, 0.06, 'S. 153');
      info('Weg 0–100 km/h [m]', run1.xEnd, 280, 'S. 153: „ungefähr 280 m“, aus Abb. 7.11e');
      check('Zeit für 1000 m [s]', L.timeForDistance({}, 1000), 40, 0.05, 'S. 153');
      check('max. Beschleunigung 1. Gang ẍ/g', run1.a1max / 9.81, 0.25, 0.05, 'Abb. 7.10');
    }

    sect('Teil II · Bremsung (Fahrzeug aus Abb. 9.12, φ = 0,76)');
    {
      const B = K.bremsung, p = B.withDefaults({});
      const u04 = B.utilization(p, 0.4), u08 = B.utilization(p, 0.8), u10 = B.utilization(p, 1.0);
      check('μV bei z = 0,4', u04.muV, 0.46, 0.02, 'S. 227');
      check('μH bei z = 0,4', u04.muH, 0.30, 0.04, 'S. 227');
      check('μV bei z = 0,8', u08.muV, 0.8, 0.01, 'S. 227');
      check('μH bei z = 0,8', u08.muH, 0.8, 0.01, 'S. 227');
      check('μV bei z = 1,0', u10.muV, 0.94, 0.01, 'S. 227');
      check('μH bei z = 1,0', u10.muH, 1.23, 0.01, 'S. 227');
      const lim = B.lockLimits(p, 0.46);
      check('zmax bei μh = 0,46', lim.zmax, 0.4, 0.02, 'S. 227');
      check('Gütegrad zmax/zgrenz', lim.guete, 0.87, 0.02, 'S. 227');
      const st = B.stopping({});
      check('Anhalteweg aus 80 km/h [m]', st.s, 59.7, 0.005, 'Gl. 9.17, S. 217');
      // S. 218 druckt 4,4 s; (0,64 + 0,05 + 0,085) + 22,2/5,8 = 4,6 s, also Rechenfehler im Buch
      check('Anhaltedauer [s]', st.t, 4.605, 0.002, 'Gl. 9.19a nachgerechnet, Buch druckt 4,4 s');
    }

    sect('Teil III · Schwingungen (Fzg. 1, Tab. 13.1; Φh(Ω0) = 4 cm³, w = 2, v = 20 m/s)');
    {
      const S = K.schwingung, r = S.evaluate({}, 8000);
      check('Aufbaueigenfrequenz ν2/2π [Hz]', r.char.f2, 1.5, 0.01, 'Tab. 13.1');
      check('Radeigenfrequenz ν1/2π [Hz]', r.char.f1, 11.0, 0.01, 'Tab. 13.1');
      check('Dämpfungsmaß D2', r.char.D2, 0.27, 0.03, 'Tab. 13.1');
      check('σF [N]', r.sigmaF, 257, 0.03, 'S. 377');
      check('σF/Fzstat', r.sigmaFrel, 0.09, 0.05, 'S. 377');
      check('Effektivwert Aufbaubeschleunigung [m/s²]', r.sigmaAcc2, 0.73, 0.05, 'S. 377');
      check('Effektivwert Sitzbeschleunigung [m/s²]', r.sigmaAcc3, 0.7, 0.07, 'S. 378');
      check('K Sitz', r.Ksitz, 18.5, 0.08, 'S. 378, B aus Abb. 13.2f digitalisiert');
      // Abb. 13.2i × 13.2k ergibt am Maximum bei 1,3 Hz ≈ 5,6, Abb. 13.2l zeigt dort nur 4 (K-Wert)²s;
      // die Fläche unter 13.2l führt eher auf K ≈ 6,7 als auf die gedruckten 5,9.
      info('K Fuß', r.Kfuss, 5.9, 'S. 377; Diagramme 13.2i/k/l unter sich nicht stimmig');
      check('σ Δz32 Sitzfederweg [mm]', r.sigmaDz32 * 1000, 1.8, 0.06, 'S. 378');
      check('σ Δz21 Radfederweg [mm]', r.sigmaDz21 * 1000, 5.6, 0.04, 'S. 378');
      info('Kges', r.Kges, 23.6, 'Abb. 13.12c abgelesen, enthält KFuß');
      const r127 = S.evaluate({ bSet: '12.7' }, 8000);
      info('K Sitz mit B aus Abb. 12.7', r127.Ksitz, 18.5, 'andere Bewertungskurve');
      info('K Fuß mit B aus Abb. 12.7', r127.Kfuss, 5.9, 'andere Bewertungskurve');
      const fc = S.frequencyCurves({}, 2000);
      const iF = fc.force.indexOf(Math.max(...fc.force));
      check('Maximum F̂z/ĥ [kN/m]', fc.force[iF] / 1000, 270, 0.08, 'Abb. 13.2b abgelesen');
      check('Lage des Maximums F̂z/ĥ [Hz]', fc.f[iF], 11, 0.08, 'Abb. 13.2b abgelesen');
    }

    sect('Teil IV · Einspurmodell (Tab. 21.7, Tab. 22.4)');
    {
      const E = K.einspur;
      const veh = K.data.einspurFahrzeuge.map((v) => v.p);
      const want = [
        { SQ: 0.769, vch: 29 }, { SQ: 0.690, vch: 29 }, { SQ: 0.870, vch: 29 }, { SQ: 0.909, vch: 50 },
        { SQ: 0.556, vch: 18 }, { SQ: 0.966, vch: 81 }, { SQ: 0.613, vch: 21 }, { SQ: 1.154, vkrit: 33.4 },
      ];
      want.forEach((w, i) => {
        const d = E.derived(veh[i]);
        check(`Fzg. ${i + 1}: SQ`, d.SQ, w.SQ, 0.01, 'Tab. 21.7');
        if (w.vch) check(`Fzg. ${i + 1}: vch [m/s]`, d.vch, w.vch, 0.03, 'Tab. 21.7');
        else check(`Fzg. ${i + 1}: vkrit [m/s]`, d.vkrit, w.vkrit, 0.01, 'Tab. 21.7');
      });
      const tab224 = [
        { i: 0, dL: 35.1, gain: 0.297, T: 0.54, os: 0.089 },
        { i: 1, dL: 35.1, gain: 0.297, T: 0.46, os: 0.054 },
        { i: 6, dL: 46.5, gain: 0.225, T: 0.50, os: 0.143 },
      ];
      for (const row of tab224) {
        const p = { ...veh[row.i], v: 22.2 };
        const gain = E.gains(p, 22.2);
        const dLstat = 4 / (22.2 * gain.yawRate);
        check(`Fzg. ${row.i + 1}: (ψ̇/δL)stat [1/s]`, gain.yawRate, row.gain, 0.015, 'Tab. 22.4');
        check(`Fzg. ${row.i + 1}: δL stat [°]`, dLstat / DEG, row.dL, 0.015, 'Tab. 22.4');
        const sim = E.simulate(p, E.steerInput('rampe', { amplitude: dLstat, rate: 200 * DEG, t0: 0 }), 4, 0.0005);
        const m = E.responseMetrics(sim, dLstat / (200 * DEG) / 2);
        if (row.i === 0) {
          check(`Fzg. ${row.i + 1}: Tψ̇max [s] ab 50 % Lenkeingabe`, m.tPeakFrom50, row.T, 0.06, 'Tab. 22.4');
          check(`Fzg. ${row.i + 1}: Überschwingweite Uψ̇`, m.overshoot, row.os, 0.12, 'Tab. 22.4');
        } else {
          // Kreisfahrtwerte, νf und Df stimmen, die Zeitkennwerte dieser Fahrzeuge weichen ab
          info(`Fzg. ${row.i + 1}: Tψ̇max [s] ab 50 % Lenkeingabe`, m.tPeakFrom50, row.T, 'Tab. 22.4, Ursache offen');
          info(`Fzg. ${row.i + 1}: Überschwingweite Uψ̇`, m.overshoot, row.os, 'Tab. 22.4');
        }
      }
      check('Fzg. 7: Df bei 22,2 m/s', E.eigen(veh[6], 22.2).D, 0.70, 0.02, 'S. 676');
    }

    sect('Teil I · Reifen (HSRI-Modell, Tab. 2.3; Reifen 205/60 R 15 aus Abb. 2.44)');
    {
      const R = K.reifen;
      check('Fx bei Sx = 1 % (≈ cx·Sx) [N]', R.forces({}, 0.01, 0).Fx, 470, 0.02, 'S. 49');
      check('Fy bei α = 1° (≈ cα·tan α) [N]', R.forces({}, 0, DEG).Fy, 50000 * Math.tan(DEG), 0.01, 'Abb. 2.44a');
      check('Fx bei Sx = 100 % [N]', R.forces({}, 0.999, 0).Fx, 3170, 0.05, 'Abb. 2.44b abgelesen');
      check('Fy bei α = 3° [N]', R.forces({}, 0, 3 * DEG).Fy, 2600, 0.05, 'Abb. 2.44a abgelesen');
      info('Maximum Fx bei α = 0 [N]', Math.max(...R.curvesVsSlip({}, [0], 200)[0].Fx), 4830, 'Abb. 2.44b; HSRI-Kurve ist flacher');
      check('Reifennachlauf bei α → 0 [m] (lL/3)', R.forces({}, 0, 0.05 * DEG).ny, Math.sqrt(2 * 0.3 * 0.02) / 3, 0.02, 'Tab. 2.3');
    }
    return rows;
  }

  K.pruefung = { run };
})(typeof globalThis !== 'undefined' ? globalThis : this);
