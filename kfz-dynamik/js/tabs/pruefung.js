/* Reiter Prüfung & Quellen: Vergleich der Rechenkerne mit Zahlen aus dem Buch (dieselbe Liste wie tests/verify.js),
   Annahmen, gefundene Unstimmigkeiten im Buch, digitalisierte Kurven, Lizenzen. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { el } = root.UI;
  let tableHost = null, summaryEl = null, done = false;

  const fmt = (v) => (typeof v === 'number' ? KFmt(v, Math.abs(v) >= 100 ? 1 : 3) : v);

  function runChecks() {
    const rows = K.pruefung.run();
    let ok = 0, fail = 0, info = 0;
    const t = el('table', 'checks');
    t.innerHTML = '<thead><tr><th>Status</th><th>Größe</th><th style="text-align:right">Modell</th><th style="text-align:right">Buch</th>' +
      '<th style="text-align:right">Abw.</th><th style="text-align:right">Tol.</th><th>Quelle</th></tr></thead>';
    const tb = el('tbody');
    for (const r of rows) {
      const tr = el('tr');
      if (r.kind === 'sect') { tr.className = 'sect'; tr.innerHTML = `<td colspan="7">${r.label}</td>`; tb.appendChild(tr); continue; }
      const dev = (r.got - r.want) / Math.abs(r.want) * 100;
      const st = r.kind === 'info' ? 'INFO' : r.ok ? 'OK' : 'FEHLER';
      tr.className = r.kind === 'info' ? 'info' : r.ok ? 'ok' : 'fail';
      if (r.kind === 'info') info++; else if (r.ok) ok++; else fail++;
      tr.innerHTML = `<td class="st">${st}</td><td>${r.label}</td><td class="num">${fmt(r.got)}</td><td class="num">${fmt(r.want)}</td>` +
        `<td class="num">${dev >= 0 ? '+' : ''}${KFmt(dev, 1)} %</td><td class="num">${r.kind === 'info' ? '–' : '± ' + KFmt(r.tol * 100, 1) + ' %'}</td><td>${r.ref}</td>`;
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    tableHost.innerHTML = '';
    tableHost.appendChild(t);
    root.UI.kpis(summaryEl, [
      { label: 'bestanden', value: ok, digits: 0, state: 'ok' },
      { label: 'fehlgeschlagen', value: fail, digits: 0, state: fail ? 'bad' : 'ok' },
      { label: 'bekannte Abweichungen', value: info, digits: 0, state: 'warn' },
    ]);
  }

  function init(sec) {
    sec.innerHTML = '';
    const head = el('div', 'tab-head');
    head.appendChild(el('h2', '', 'Prüfung & Quellen'));
    head.appendChild(el('p', '', 'Jedes Modul ist gegen Zahlenbeispiele des Buchs gerechnet. „OK“ heißt: innerhalb der Toleranz, die sich ' +
      'aus der Ablesegenauigkeit der Vorlage ergibt. „INFO“ markiert bekannte Abweichungen mit Begründung. Dieselbe Liste läuft ' +
      'ohne Browser mit <code>node tests/verify.js</code>.'));
    sec.appendChild(head);
    const main = el('div', 'main');
    sec.appendChild(main);
    summaryEl = el('div', 'kpis');
    main.appendChild(summaryEl);
    const card = el('section', 'card');
    card.appendChild(el('h3', 'card-title', 'Vergleich mit dem Buch'));
    tableHost = el('div', 'table-wrap', '<p class="note">Rechne …</p>');
    card.appendChild(tableHost);
    main.appendChild(card);

    const prose = el('section', 'card');
    prose.innerHTML = `<div class="prose">
      <h4>Unstimmigkeiten im Buch</h4>
      <ul>
        <li><b>Anhaltedauer, S. 218:</b> gedruckt sind 4,4 s. Gl. (9.19a) mit den Zahlen des Beispiels (tr = 0,64 s, ta = 0,05 s,
          ts = 0,17 s, vA = 22,2 m/s, a = 5,8 m/s²) ergibt 4,6 s. Der Anhalteweg 59,7 m stimmt.</li>
        <li><b>Tab. 2.3, Haftbereich:</b> Fx = cx·Sx ist die linearisierte Form; am Übergang s̄R = 0,5 springt die Kraft dann um den
          Faktor 1/(1 − Sx). Die App rechnet im Haftbereich mit demselben Faktor wie im Teilgleitbereich, die Kurve ist stetig.</li>
        <li><b>Tab. 2.3, nx im Teilgleitbereich:</b> Fy/cy steht in der Klammer, die mit lL·tan α multipliziert wird; die Einheit
          stimmt so nicht. Die App setzt Fy/cy wie im Haftbereich außerhalb der Klammer.</li>
        <li><b>Abb. 13.2 i/k/l:</b> Vergrößerungsfunktion mal Bewertungsfunktion ergibt am Maximum (1,3 Hz) etwa 5,6, das
          Ergebnisdiagramm zeigt dort 4. Deshalb weicht K Fuß ab (Modell 7,6, Buch 5,9) und mit ihm Kges.</li>
        <li><b>Abb. 12.7 und Abb. 13.2:</b> Die Bewertungsfunktionen beider Kapitel unterscheiden sich unter 2 Hz um 30–50 %.
          Die Beispielwerte in Kap. 13 passen zu Abb. 13.2; mit Abb. 12.7 werden K Sitz und K Fuß 24 bzw. 51 % größer.</li>
      </ul>
      <h4>Annahmen, die nicht aus dem Buch stammen</h4>
      <ul>
        <li>Reifen: μ01 = 1,17, kR = 0,32 und a = 0,09 s/m sind an die Messkurven von Abb. 2.44 angepasst. Die Fahrgeschwindigkeit der
          Messung nennt das Buch nicht, angenommen sind 60 km/h. Die Form von cα(Fz) folgt Abb. 2.37, skaliert auf 50 kN/rad bei 4 kN.
          Die Sturzsteifigkeit cγ = 0,1·cα ist geschätzt. Das Modell erreicht im Maximum von Fx etwa 4,15 kN statt gemessener 4,83 kN.</li>
        <li>Bremsung: φ = 0,76 ist aus den Zahlen auf S. 227 erschlossen (μV = μH = 0,8 bei z = 0,8).</li>
        <li>Fahrleistungen: Anfahren mit der konstanten Höchstbeschleunigung des 1. Gangs, ohne Schaltpausen, wie Abb. 7.11.
          Den Weg 0–100 km/h nennt das Buch „ungefähr 280 m“ (aus Abb. 7.11e), das Modell kommt auf 311 m bei gleicher Zeit.</li>
        <li>Schwingungen: Die statische Radlast folgt aus den Massen. Das Straßenprofil der Animation ist eine Summe aus 200
          Kosinuswellen mit Zufallsphasen, deren Amplituden aus dem Spektrum (11.92) folgen.</li>
        <li>Einspurmodell: Für die Fahrzeuge 2 und 7 liegen Tψ̇max und Überschwingen bis 15 % neben Tab. 22.4, obwohl
          Kreisfahrtwerte, Eigenfrequenz und Dämpfung stimmen. Die Ursache ist nicht geklärt.</li>
      </ul>
      <h4>Aus Diagrammen abgelesene Kurven</h4>
      <ul>
        <li>Volllast-Drehmoment des 37-kW-Motors aus Abb. 7.1c</li>
        <li>Bewertungsfunktionen B(f) für Sitz und Fuß aus Abb. 13.2 f/k sowie Sitz, Fuß und Hand aus Abb. 12.7 b–d</li>
        <li>Messpunkte Fx(Sx) und Fy(α) aus Abb. 2.44</li>
      </ul>
      <h4>Quelle und Lizenzen</h4>
      <ul>
        <li>M. Mitschke, H. Wallentowitz: <i>Dynamik der Kraftfahrzeuge</i>, 5. Auflage, Springer Vieweg, Wiesbaden 2014.
          Die App setzt die Gleichungen um; Texte und Abbildungen des Buchs sind nicht übernommen.</li>
        <li>three.js r128 (MIT-Lizenz), KaTeX 0.16.8 (MIT-Lizenz), beide lokal unter <code>vendor/</code>.</li>
      </ul>
    </div>`;
    main.appendChild(prose);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.pruefung = {
    init,
    activate() {
      if (done) return;
      done = true;
      setTimeout(() => {
        try { runChecks(); } catch (e) { tableHost.innerHTML = `<p class="note">Fehler: ${e.message}</p>`; console.error(e); }
      }, 30);
    },
    deactivate() {},
  };
})(window);
