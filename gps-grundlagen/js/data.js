// Inhalte: 14 Toleranzarten nach DIN EN ISO 1101, Grundsätze nach DIN EN ISO 8015:2011, Regeln für den Toleranzrahmen.
// Eigene Formulierungen. Quellen: ISO 8015:2011 Abschnitt 5, ISO 5459:2011 Abschnitt 7.2.2,
// B. Klein, Toleranzdesign (5. Aufl. 2021) Tab. 7.1, G. Henzold, GD&T (3rd ed 2021), ZEISS GPS-Poster (VIII/2023).

export const GROUPS = [
  { id: 'form', name: 'Formtoleranzen', rule: 'Eine Formtoleranz hat keinen Bezug. Sie begrenzt nur die Gestalt eines einzelnen Elements, die Zone darf beliebig liegen.' },
  { id: 'richtung', name: 'Richtungstoleranzen', rule: 'Richtungstoleranzen brauchen einen Bezug. Die Zone ist im Winkel zum Bezug ausgerichtet, ihr Abstand dazu ist frei. Sie begrenzen die Form des Elements gleich mit.' },
  { id: 'ort', name: 'Ortstoleranzen', rule: 'Ortstoleranzen legen die Zone an einen festen Ort, beschrieben durch theoretisch genaue Maße zum Bezug. Sie begrenzen Richtung und Form gleich mit.' },
  { id: 'lauf', name: 'Lauftoleranzen', rule: 'Lauftoleranzen gelten immer zu einer Bezugsachse. Gemessen wird beim Drehen um diese Achse, das Ergebnis enthält Form- und Lageanteile zusammen.' },
];

// datum: 'nein' | 'ja' | 'optional' (Profil, Position)
// dia: Ø vor dem Toleranzwert zulässig (zylinderförmige oder kreisförmige Zone)
// mmr: Maximum-Material-Bedingung Ⓜ nach ISO 2692 anwendbar (nur abgeleitete Elemente von Maßelementen)
export const TYPES = [
  { id: 'gerad', name: 'Geradheit', en: 'straightness', group: 'form', datum: 'nein', dia: true, mmr: true,
    element: 'Linie auf einer Fläche, Kante oder Achse',
    zone: 'zwei parallele Geraden im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: '—',
    check: 'Messlineal oder Haarlineal und Lichtspalt, Messuhr entlang einer Führung, KMG',
    note: 'Steht der Pfeil auf der Maßlinie eines Durchmessers, ist die Achse toleriert, dann mit Ø im Rahmen.' },
  { id: 'eben', name: 'Ebenheit', en: 'flatness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'ebene Fläche (oder Mittelebene)',
    zone: 'zwei parallele Ebenen im Abstand t',
    includes: 'Geradheit aller Linien in der Fläche',
    check: 'Tuschierplatte, Messuhr über Messplatte, KMG',
    note: 'Die Zone darf beliebig gekippt liegen. Die Lage zu anderen Flächen regelt erst eine Richtungstoleranz.' },
  { id: 'rund', name: 'Rundheit', en: 'roundness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'jeder Querschnitt eines Zylinders, Kegels oder einer Kugel',
    zone: 'in jedem Querschnitt zwei konzentrische Kreise mit Radiendifferenz t',
    includes: '—',
    check: 'Formmessgerät (Rundheitsmessung), nicht einfach mit der Bügelmessschraube: Gleichdicke fallen dort nicht auf',
    note: 'Ein Zweipunktmaß erkennt ungeradzahlige Unrundheit wie die Gleichdickform nicht, deshalb ist Rundheit eine eigene Anforderung.' },
  { id: 'zyl', name: 'Zylinderform', en: 'cylindricity', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'ganze Mantelfläche eines Zylinders',
    zone: 'zwei koaxiale Zylinder mit Radiendifferenz t',
    includes: 'Rundheit, Geradheit der Mantellinien, Parallelität gegenüberliegender Mantellinien',
    check: 'Formmessgerät mit Längsachse, KMG',
    note: 'Strenger und teurer zu prüfen als Rundheit. Nur fordern, wenn die Funktion die ganze Fläche braucht, z. B. Gleitlagersitz.' },
  { id: 'linie', name: 'Linienprofil', en: 'line profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'beliebige Linie (Kontur in einem Schnitt)',
    zone: 'zwei Hüllkurven von Kreisen Ø t, deren Mittelpunkte auf der Sollkontur liegen',
    includes: 'mit Bezug: auch Richtung oder Ort der Kontur',
    check: 'Profilschablone, Konturmessgerät, KMG',
    note: 'Die Sollkontur muss durch theoretisch genaue Maße (im Rahmen) festgelegt sein. Ohne Bezug Formtoleranz, mit Bezug Richtungs- oder Ortstoleranz.' },
  { id: 'flaeche', name: 'Flächenprofil', en: 'surface profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'beliebige Fläche (Freiform)',
    zone: 'zwei Hüllflächen von Kugeln Ø t, deren Mittelpunkte auf der Sollfläche liegen',
    includes: 'mit Bezug: auch Richtung oder Ort der Fläche',
    check: 'KMG oder optischer Scanner gegen das CAD-Modell',
    note: 'Die gebräuchlichste Toleranz für Freiformflächen und Gussteile, oft als Flächenprofil zu einem Bezugssystem A|B|C.' },
  { id: 'para', name: 'Parallelität', en: 'parallelism', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei zum Bezug parallele Ebenen (oder Geraden) im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Messuhr über Messplatte, Teil auf Bezugsfläche A aufgelegt',
    note: 'Die Zone ist zum Bezug ausgerichtet, nicht zur Ausgleichsfläche des Ist-Elements.' },
  { id: 'recht', name: 'Rechtwinkligkeit', en: 'perpendicularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei zum Bezug senkrechte Ebenen im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Winkel und Lichtspalt, Messuhr am Messständer, KMG',
    note: 'Bei einer Bohrung zur Planfläche A wird meist die Achse toleriert: ⊥ Ø t | A.' },
  { id: 'neig', name: 'Neigung', en: 'angularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei parallele Ebenen im Abstand t, im theoretisch genauen Winkel zum Bezug',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Sinuslineal oder Winkelvorrichtung mit Messuhr, KMG',
    note: 'Der Sollwinkel steht als theoretisch genaues Maß im Rahmen (z. B. 30°) und hat selbst keine Toleranz.' },
  { id: 'pos', name: 'Position', en: 'position', group: 'ort', datum: 'optional', dia: true, mmr: true,
    element: 'Punkt, Achse, Mittelebene oder Fläche',
    zone: 'meist Zylinder Ø t um die Nennlage, die durch theoretisch genaue Maße zum Bezugssystem festgelegt ist',
    includes: 'Richtung und Form des tolerierten Elements',
    check: 'KMG, bei Ⓜ auch Lehre',
    note: 'Position ersetzt die Koordinatenmaßtoleranzen ±. Der Kreis um das Toleranzquadrat einer ±-Bemaßung hat 57 % mehr Fläche (π/2), ohne dass die Funktion leidet. Ohne Bezug nur für die Lage innerhalb eines Lochbilds.' },
  { id: 'koax', name: 'Koaxialität / Konzentrizität', en: 'coaxiality / concentricity', group: 'ort', datum: 'ja', dia: true, mmr: true,
    element: 'Achse (Koaxialität) oder Mittelpunkt (Konzentrizität, mit ACS)',
    zone: 'Zylinder Ø t koaxial zur Bezugsachse; bei Konzentrizität Kreis Ø t',
    includes: 'Richtung und Geradheit der Achse',
    check: 'KMG oder Formmessgerät; die Achse muss erst aus Querschnitten ermittelt werden',
    note: 'In der Werkstatt oft durch Rundlauf ersetzt, weil Rundlauf direkt mit der Messuhr prüfbar ist.' },
  { id: 'sym', name: 'Symmetrie', en: 'symmetry', group: 'ort', datum: 'ja', dia: false, mmr: true,
    element: 'Mittelebene (oder Mittellinie)',
    zone: 'zwei parallele Ebenen im Abstand t, symmetrisch zur Bezugsmittelebene',
    includes: 'Parallelität der Mittelebene zum Bezug',
    check: 'Messuhr mit Umschlagmessung (Teil wenden), KMG',
    note: 'Typisch für Nuten und Passfedernuten zur Wellenmitte.' },
  { id: 'lauf', name: 'Rundlauf / Planlauf', en: 'circular run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'Kreislinie in jedem Querschnitt (radial) oder auf jedem Messzylinder (axial)',
    zone: 'radial: zwei konzentrische Kreise um die Bezugsachse im Abstand t; axial: zwei Kreise auf einem Messzylinder',
    includes: 'radial: Rundheit und Koaxialität im jeweiligen Querschnitt',
    check: 'Teil zwischen Spitzen oder in Prismen drehen, Messuhr anlegen',
    note: 'Der Pfeil steht senkrecht auf der Fläche: radial auf dem Mantel, axial auf der Planfläche.' },
  { id: 'gesamt', name: 'Gesamtrundlauf / Gesamtplanlauf', en: 'total run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'ganze Mantelfläche oder ganze Planfläche',
    zone: 'radial: zwei koaxiale Zylinder um die Bezugsachse im Abstand t; axial: zwei zur Achse senkrechte Ebenen',
    includes: 'radial: Rundlauf, Zylinderform, Koaxialität; axial: Planlauf, Ebenheit, Rechtwinkligkeit zur Achse',
    check: 'drehen und gleichzeitig die Messuhr entlang (bzw. quer) führen, Spanne über alles',
    note: 'Gesamtplanlauf ergibt dieselbe Zone wie Rechtwinkligkeit einer Fläche zur Achse.' },
];

export const typeById = Object.fromEntries(TYPES.map((t) => [t.id, t]));
export const inGroup = (g) => TYPES.filter((t) => (t.groups || [t.group]).includes(g));

export const DATUM_TEXT = { nein: 'kein Bezug', ja: 'Bezug erforderlich', optional: 'mit oder ohne Bezug' };

// Grundsätze nach DIN EN ISO 8015:2011, Abschnitt 5 (eigene Kurzfassung)
export const PRINCIPLES = [
  { n: '5.1', name: 'Grundsatz des Aufrufens', text: 'Steht auf der Zeichnung auch nur eine GPS-Angabe, gilt das ganze ISO-GPS-System, samt 20 °C Referenztemperatur und den Entscheidungsregeln nach ISO 14253-1. Der Vermerk „Tolerierung ISO 8015“ im Schriftfeld ist dafür nicht nötig.', exam: 'Eine Zeichnung mit einem einzigen Form- und Lagesymbol ist bereits eine GPS-Zeichnung.' },
  { n: '5.2', name: 'Grundsatz der GPS-Normenhierarchie', text: 'Grundnormen, globale, allgemeine und ergänzende GPS-Normen bauen aufeinander auf. Regeln weiter oben gelten, solange eine Norm weiter unten nicht ausdrücklich etwas anderes festlegt.', exam: 'ISO 8015 ist Grundnorm, ISO 1101 allgemeine Norm, ISO 2768 ergänzende Norm.' },
  { n: '5.3', name: 'Grundsatz der bestimmenden Zeichnung', text: 'Es gilt nur, was in der Zeichnung (im weiten Sinn: der ganzen Produktdokumentation) steht. Was dort fehlt, kann nicht eingefordert werden.', exam: 'Fehlt eine Toleranz, darf der Fertiger nicht auf „üblich“ verwiesen werden.' },
  { n: '5.4', name: 'Grundsatz des Geometrieelements', text: 'Jede Angabe gilt für ein ganzes Geometrieelement zwischen seinen natürlichen Kanten und nur für dieses eine. Teilbereiche oder mehrere Elemente brauchen eine eigene Kennzeichnung, z. B. ACS oder CZ.', exam: 'Zwei gleiche Bohrungen ohne CZ haben zwei getrennte Toleranzzonen.' },
  { n: '5.5', name: 'Grundsatz der Unabhängigkeit', text: 'Jede Anforderung wird für sich erfüllt. Eine Maßtoleranz begrenzt die Form nicht, außer durch eine besondere Angabe wie Ⓔ (Hüllbedingung), Ⓜ oder CZ.', exam: 'Die wichtigste Abweichung von der alten DIN 7167, die die Hüllbedingung überall voraussetzte.' },
  { n: '5.6', name: 'Grundsatz der Dezimaldarstellung', text: 'Nicht angegebene Nachkommastellen sind Nullen: 10 heißt 10,000…', exam: 'Eine Angabe ohne Toleranz ist deshalb nicht „ungefähr“, sondern unendlich genau gemeint.' },
  { n: '5.7', name: 'Grundsatz der Standardfestlegung', text: 'Jede Angabe ohne Modifikator benutzt den in der zuständigen Norm festgelegten Standardoperator. Beispiel: 30 H6 meint das örtliche Zweipunktmaß nach ISO 14405-1.', exam: 'Modifikatoren wie GG, GX oder ACS ändern den Standard und sind in der Zeichnung sichtbar.' },
  { n: '5.8', name: 'Grundsatz der Referenzbedingungen', text: 'Alle Angaben gelten bei 20 °C (ISO 1) und am sauberen Werkstück. Andere Bedingungen, etwa Feuchte, müssen auf der Zeichnung stehen.', exam: 'Bei Kunststoffteilen oft wichtig: Feuchte und Temperatur angeben.' },
  { n: '5.9', name: 'Grundsatz des starren Werkstücks', text: 'Das Werkstück gilt als unendlich steif und wird im freien Zustand ohne äußere Kräfte betrachtet, auch ohne Schwerkraft. Andere Zustände regelt z. B. ISO 10579 (Ⓕ).', exam: 'Dünnwandige Teile brauchen eine Angabe zum Einspannzustand.' },
  { n: '5.10', name: 'Grundsatz der Dualität', text: 'Die Spezifikation beschreibt, was gelten soll, unabhängig vom Messverfahren. Die Prüfung setzt das mit einem Verifikationsoperator möglichst nah um.', exam: 'Die Zeichnung schreibt kein Messgerät vor.' },
  { n: '5.11', name: 'Grundsatz der Funktionsbeherrschung', text: 'Die Spezifikation soll die Funktion des Teils abbilden. Je weniger das gelingt, desto mehrdeutiger ist die Beschreibung der Funktion.', exam: 'Tolerieren nach Funktion, nicht nach Gewohnheit.' },
  { n: '5.12', name: 'Grundsatz der allgemeinen Spezifikation', text: 'Allgemeintoleranzen im Schriftfeld gelten nur dort, wo keine Einzelangabe der gleichen Art steht. Widersprechen sich zwei, gilt die großzügigere.', exam: 'Beispiel: ISO 2768-mK im Schriftfeld, eine Einzeltoleranz am Element geht vor.' },
  { n: '5.13', name: 'Grundsatz der Verantwortlichkeit', text: 'Für die Mehrdeutigkeit der Spezifikation ist der Konstrukteur verantwortlich. Die Messunsicherheit trägt, wer die Übereinstimmung nachweist (ISO 14253-1).', exam: 'Wer prüft, muss seine Messunsicherheit kennen und berücksichtigen.' },
];

// Datumsbuchstaben: I, O, Q und X sollen nach ISO 5459:2011, 7.2.2 nicht verwendet werden
export const BAD_LETTERS = ['I', 'O', 'Q', 'X'];

// Prüft einen Toleranzrahmen. Rückgabe: Liste {level: 'bad'|'warn'|'ok', text}
export function checkFrame({ type, dia = false, mmr = false, datums = [] }) {
  const t = typeById[type];
  if (!t) return [{ level: 'bad', text: 'Unbekannte Toleranzart.' }];
  const out = [];
  const ds = datums.filter(Boolean);
  if (t.datum === 'nein' && ds.length) out.push({ level: 'bad', text: `${t.name} ist eine Formtoleranz und hat keinen Bezug.` });
  if (t.datum === 'ja' && !ds.length) out.push({ level: 'bad', text: `${t.name} braucht einen Bezug, sonst ist die Lage der Zone nicht bestimmt.` });
  if (t.id === 'pos' && !ds.length) out.push({ level: 'warn', text: 'Position ohne Bezug legt nur die Lage innerhalb eines Lochbilds fest, nicht zum Werkstück.' });
  if (dia && !t.dia) out.push({ level: 'bad', text: `Ø ist bei ${t.name} nicht sinnvoll: die Zone ist nicht zylinder- oder kreisförmig.` });
  if (mmr && !t.mmr) out.push({ level: 'bad', text: `Ⓜ geht bei ${t.name} nicht: die Maximum-Material-Bedingung gilt nur für Achsen und Mittelebenen von Maßelementen (ISO 2692).` });
  if (mmr && t.mmr && ['gerad', 'para', 'recht', 'neig', 'pos', 'koax'].includes(t.id) && !dia) out.push({ level: 'warn', text: 'Ⓜ setzt ein Maßelement voraus; bei einer Achse steht dann meist auch Ø vor dem Wert.' });
  for (const d of ds) {
    for (const ch of d.replace('-', '')) if (BAD_LETTERS.includes(ch)) out.push({ level: 'bad', text: `Bezugsbuchstabe ${ch} soll nicht verwendet werden (Verwechslungsgefahr, ISO 5459).` });
  }
  if (new Set(ds).size !== ds.length) out.push({ level: 'bad', text: 'Derselbe Bezug steht zweimal im Rahmen.' });
  if (ds.length > 3) out.push({ level: 'bad', text: 'Ein Bezugssystem hat höchstens drei Bezüge (primär, sekundär, tertiär).' });
  if (['lauf', 'gesamt', 'koax'].includes(t.id) && ds.length && ds.length > 1 && !ds.some((d) => d.includes('-'))) out.push({ level: 'warn', text: 'Bei Lauf und Koaxialität ist meist eine gemeinsame Bezugsachse wie A-B gemeint, nicht ein Bezugssystem A|B.' });
  if (!out.length) out.push({ level: 'ok', text: 'Formal zulässiger Toleranzrahmen.' });
  return out;
}

export const frameOk = (spec) => !checkFrame(spec).some((r) => r.level === 'bad');
