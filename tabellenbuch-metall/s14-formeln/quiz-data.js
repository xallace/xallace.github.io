/**
 * quiz-data.js - Interactive practice problems, hints, and exam solutions for Tabellenbuch Metall S. 14
 * Formatted with explicit LaTeX delimiters for KaTeX mathematical typesetting
 */

const QuizData = [
  {
    id: 'q1',
    category: 'Formeln (Schnittgeschwindigkeit)',
    title: 'Aufgabe 1: Drehen einer Antriebswelle',
    question: 'Eine Welle mit dem Durchmesser $d = 80\\,\\text{mm}$ aus Vergütungsstahl C45 soll auf einer CNC-Drehmaschine längsgedreht werden. Für die gewählte Hartmetall-Wendeschneidplatte wird eine Schnittgeschwindigkeit von $v_c = 140\\,\\text{m/min}$ vorgegeben. Welche Spindeldrehzahl $n$ (in $1/\\text{min}$) muss an der Drehmaschine eingestellt werden?',
    inputs: [
      { id: 'q1_n', label: 'Spindeldrehzahl n', unit: '1/min', target: 557.0, tolerance: 3.0 }
    ],
    hint: 'Formel umstellen: $n = \\frac{v_c}{\\pi \\cdot d}$. Achte darauf, den Durchmesser $d$ von Millimetern in Meter umzurechnen ($80\\,\\text{mm} = 0{,}080\\,\\text{m}$)!',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <div class="math-row">$$n = \\frac{v_c}{\\pi \\cdot d}$$</div>
        <p><strong>1. Einheiten umrechnen:</strong> $d = 80\\,\\text{mm} = 0{,}080\\,\\text{m}$</p>
        <p><strong>2. Werte einsetzen:</strong></p>
        <div class="math-row">$$n = \\frac{140\\,\\frac{\\text{m}}{\\text{min}}}{\\pi \\cdot 0{,}080\\,\\text{m}} = \\frac{140}{0{,}25133} \\approx \\mathbf{557\\,\\text{min}^{-1}}$$</div>
        <p class="text-muted">Hinweis für die Werkstattpraxis: An konventionellen Drehmaschinen wählt man die nächstgelegene Getriebestufe (z. B. $560\\,\\text{min}^{-1}$).</p>
      </div>
    `
  },
  {
    id: 'q2',
    category: 'Formeln (Schnittgeschwindigkeit)',
    title: 'Aufgabe 2: Schaftfräsen in Aluminium',
    question: 'Ein VHM-Schaftfräser mit dem Durchmesser $d = 16\\,\\text{mm}$ arbeitet in einem Aluminium-Werkstück mit einer Drehzahl von $n = 6000\\,1/\\text{min}$. Wie groß ist die wirksame Schnittgeschwindigkeit $v_c$ in $\\text{m/min}$?',
    inputs: [
      { id: 'q2_vc', label: 'Schnittgeschwindigkeit vc', unit: 'm/min', target: 301.6, tolerance: 2.0 }
    ],
    hint: 'Grundformel: $v_c = \\pi \\cdot d \\cdot n$. Durchmesser $d$ in Metern einsetzen ($16\\,\\text{mm} = 0{,}016\\,\\text{m}$).',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <div class="math-row">$$v_c = \\pi \\cdot d \\cdot n$$</div>
        <p><strong>1. Einsetzen mit Einheitenumrechnung:</strong></p>
        <div class="math-row">$$v_c = \\pi \\cdot 16\\,\\text{mm} \\cdot \\frac{1\\,\\text{m}}{1000\\,\\text{mm}} \\cdot 6000\\,\\frac{1}{\\text{min}}$$</div>
        <div class="math-row">$$v_c = \\pi \\cdot 0{,}016\\,\\text{m} \\cdot 6000\\,\\frac{1}{\\text{min}} = \\mathbf{301{,}59\\,\\frac{\\text{m}}{\\text{min}}}$$</div>
        <p class="text-muted">Für Aluminium sind hohe Schnittgeschwindigkeiten über $300\\,\\text{m/min}$ bei VHM-Werkzeugen optimal.</p>
      </div>
    `
  },
  {
    id: 'q3',
    category: 'Zahlenwertgleichungen (Drehmoment)',
    title: 'Aufgabe 3: Drehstrom-Asynchronmotor Nennmoment',
    question: 'Ein Drehstrommotor an einer Frässpindel hat eine Nennleistung von $P = 7{,}5\\,\\text{kW}$ und eine Nenndrehzahl von $n = 1450\\,1/\\text{min}$. Bestimme das abgegebene Drehmoment $M$ in $\\text{N}\\cdot\\text{m}$ unter Verwendung der Zahlenwertgleichung aus dem Tabellenbuch Metall.',
    inputs: [
      { id: 'q3_m', label: 'Drehmoment M', unit: 'N·m', target: 49.4, tolerance: 0.5 }
    ],
    hint: 'Zahlenwertgleichung: $M = \\frac{9550 \\cdot P}{n}$. Beachte: Die Zahlenwerte dürfen nur in den vorgeschriebenen Einheiten ($P$ in $\\text{kW}$, $n$ in $1/\\text{min}$) eingesetzt werden!',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <div class="math-row">$$M = \\frac{9550 \\cdot P}{n}$$</div>
        <p><strong>Werte in vorgeschriebenen Einheiten einsetzen:</strong> $P = 7{,}5\\,\\text{kW}$, $n = 1450\\,\\text{min}^{-1}$</p>
        <div class="math-row">$$M = \\frac{9550 \\cdot 7{,}5}{1450}\\,\\text{N}\\cdot\\text{m} = \\frac{71625}{1450}\\,\\text{N}\\cdot\\text{m} = \\mathbf{49{,}4\\,\\text{N}\\cdot\\text{m}}$$</div>
        <p class="text-muted">Präziser physikalischer Wert (mit $\\frac{60\\,000}{2\\pi}$): $49{,}392\\,\\text{N}\\cdot\\text{m}$. Der Fehler der Zahlenwertgleichung beträgt weniger als $0{,}01\\%$!</p>
      </div>
    `
  },
  {
    id: 'q4',
    category: 'Zahlenwertgleichungen (Drehmoment)',
    title: 'Aufgabe 4: Getriebemotor Leistungsauslegung',
    question: 'An der Antriebswelle einer Transportanlage wird ein Drehmoment von $M = 350\\,\\text{N}\\cdot\\text{m}$ bei einer Arbeitsdrehzahl von $n = 120\\,1/\\text{min}$ gemessen. Welche mechanische Antriebsleistung $P$ (in $\\text{kW}$) muss der Getriebemotor an dieser Welle abgeben?',
    inputs: [
      { id: 'q4_p', label: 'Antriebsleistung P', unit: 'kW', target: 4.40, tolerance: 0.1 }
    ],
    hint: 'Zahlenwertgleichung nach $P$ umstellen: $P = \\frac{M \\cdot n}{9550}$.',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <div class="math-row">$$P = \\frac{M \\cdot n}{9550}$$</div>
        <p><strong>Werte einsetzen:</strong> $M = 350\\,\\text{N}\\cdot\\text{m}$, $n = 120\\,\\text{min}^{-1}$</p>
        <div class="math-row">$$P = \\frac{350 \\cdot 120}{9550}\\,\\text{kW} = \\frac{42000}{9550}\\,\\text{kW} = \\mathbf{4{,}40\\,\\text{kW}}$$</div>
        <p class="text-muted">In der Praxis wird ein Norm-Motor der nächsten Nennleistungsstufe gewählt (z. B. $5{,}5\\,\\text{kW}$ Drehstrom-Normmotor).</p>
      </div>
    `
  },
  {
    id: 'q5',
    category: 'Gleichungen & Diagramme (Kosten & Gewinnschwelle)',
    title: 'Aufgabe 5: Gewinnschwelle eines CNC-Fertigungsauftrags',
    question: 'Für die Fertigung von Ventilblöcken entstehen einmalige Rüst- und Programmierkosten $K_f = 24\\,000\\,\\text{€}$. Die variablen Material- und Lohnstückkosten betragen $K_v = 35\\,\\text{€/Stück}$. Der vereinbarte Netto-Verkaufspreis liegt bei $e = 95\\,\\text{€/Stück}$. Bei welcher Stückzahl $M$ (Gewinnschwelle $M_{\\text{Gs}}$) sind alle Kosten gerade gedeckt?',
    inputs: [
      { id: 'q5_mgs', label: 'Gewinnschwelle M_Gs', unit: 'Stück', target: 400, tolerance: 0 }
    ],
    hint: 'An der Gewinnschwelle gilt: $K_G = E$ bzw. $M_{\\text{Gs}} = \\frac{K_f}{e - K_v}$. Berechne zunächst den Deckungsbeitrag $db = e - K_v$.',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <div class="math-row">$$K_G = E \\iff K_v \\cdot M + K_f = e \\cdot M$$</div>
        <p><strong>1. Deckungsbeitrag je Stück berechnen:</strong></p>
        <div class="math-row">$$db = e - K_v = 95\\,\\text{€/Stck} - 35\\,\\text{€/Stck} = 60\\,\\text{€/Stck}$$</div>
        <p><strong>2. Mindestmenge (Gewinnschwelle) ermitteln:</strong></p>
        <div class="math-row">$$M_{\\text{Gs}} = \\frac{K_f}{e - K_v} = \\frac{24\\,000\\,\\text{€}}{60\\,\\text{€/Stck}} = \\mathbf{400\\,\\text{Stück}}$$</div>
        <p class="text-muted">Ab dem 401. gefertigten Ventilblock erwirtschaftet das Unternehmen Gewinn!</p>
      </div>
    `
  },
  {
    id: 'q6',
    category: 'Gleichungen & Diagramme (Kosten & Gewinnschwelle)',
    title: 'Aufgabe 6: Gewinnberechnung bei Serienlosgröße',
    question: 'Ein Kunde bestellt für die Ventilblöcke aus Aufgabe 5 eine Losgröße von $M = 1000\\,\\text{Stück}$ ($K_f = 24\\,000\\,\\text{€}$, $K_v = 35\\,\\text{€/Stck}$, $e = 95\\,\\text{€/Stck}$). Wie hoch ist der erwirtschaftete Gesamtgewinn $G$ in Euro?',
    inputs: [
      { id: 'q6_profit', label: 'Gewinn G', unit: '€', target: 36000, tolerance: 10 }
    ],
    hint: 'Gewinn = Gesamterlös $E$ - Gesamtkosten $K_G$, oder: Gewinn = $(M - M_{\\text{Gs}}) \\cdot db$.',
    solutionHtml: `
      <div class="solution-block">
        <h4>Musterlösung & Rechenweg:</h4>
        <p><strong>Methode A (Erlös minus Gesamtkosten):</strong></p>
        <div class="math-row">$$E = e \\cdot M = 95\\,\\text{€/Stck} \\cdot 1000\\,\\text{Stck} = 95\\,000\\,\\text{€}$$</div>
        <div class="math-row">$$K_G = K_v \\cdot M + K_f = 35\\,\\text{€/Stck} \\cdot 1000\\,\\text{Stck} + 24\\,000\\,\\text{€} = 59\\,000\\,\\text{€}$$</div>
        <div class="math-row">$$G = E - K_G = 95\\,000\\,\\text{€} - 59\\,000\\,\\text{€} = \\mathbf{36\\,000\\,\\text{€}}$$</div>
        <p><strong>Methode B (über die Gewinnschwelle):</strong></p>
        <div class="math-row">$$G = (M - M_{\\text{Gs}}) \\cdot db = (1000 - 400) \\cdot 60\\,\\text{€} = 600 \\cdot 60\\,\\text{€} = \\mathbf{36\\,000\\,\\text{€}}$$</div>
      </div>
    `
  }
];

if (typeof window !== 'undefined') {
  window.QuizData = QuizData;
}
