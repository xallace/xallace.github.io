// Content: 14 tolerance types per DIN EN ISO 1101, principles per DIN EN ISO 8015:2011, and tolerance frame validation rules.
// Original phrasing. Sources: ISO 8015:2011 Clause 5, ISO 5459:2011 Clause 7.2.2,
// B. Klein, Toleranzdesign (5th ed. 2021) Table 7.1, G. Henzold, GD&T (3rd ed. 2021), ZEISS GPS Poster (VIII/2023).

export const GROUPS = [
  { id: 'form', name: 'Form tolerances', rule: 'A form tolerance has no datum. It constrains only the intrinsic shape of an individual feature; the zone may float freely in space.' },
  { id: 'richtung', name: 'Orientation tolerances', rule: 'Orientation tolerances require a datum. The zone is fixed at the specified angle to the datum, while its distance from the datum is free. They simultaneously constrain the form of the feature.' },
  { id: 'ort', name: 'Location tolerances', rule: 'Location tolerances lock the zone to a fixed position defined by theoretically exact dimensions (TEDs) from the datum. They simultaneously constrain orientation and form.' },
  { id: 'lauf', name: 'Run-out tolerances', rule: 'Run-out tolerances always apply relative to a datum axis. Measurement is performed while rotating the part about that axis; the result combines form and location deviations.' },
];

// datum: 'nein' | 'ja' | 'optional' (profile, position)
// dia: Ø permitted before tolerance value (cylindrical or circular zone)
// mmr: Maximum Material Requirement Ⓜ per ISO 2692 applicable (derived features of features of size only)
export const TYPES = [
  { id: 'gerad', name: 'Straightness', en: 'straightness', group: 'form', datum: 'nein', dia: true, mmr: true,
    element: 'line on a surface, edge, or axis',
    zone: 'two parallel straight lines separated by t; for an axis with Ø, a cylinder of diameter Ø t',
    includes: '—',
    check: 'straightedge or knife-edge ruler with light gap, dial indicator along a guideway, CMM',
    note: 'When the leader arrow terminates directly on the dimension line of a diameter, the axis is toleranced — then Ø appears in the frame.' },
  { id: 'eben', name: 'Flatness', en: 'flatness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'flat surface (or median plane)',
    zone: 'two parallel planes separated by t',
    includes: 'straightness of all lines lying in the surface',
    check: 'surface plate (bluing check), dial indicator over a granite surface plate, CMM',
    note: 'The tolerance zone may tilt freely. Orientation relative to other surfaces requires an orientation tolerance.' },
  { id: 'rund', name: 'Roundness', en: 'roundness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'every cross-section of a cylinder, cone, or sphere',
    zone: 'in each cross-section, two concentric circles with radial separation t',
    includes: '—',
    check: 'roundness measuring instrument (precision spindle), not merely an outside micrometer: odd-lobed shapes go undetected',
    note: 'A two-point diameter measurement cannot detect constant-width lobing (e.g. odd-lobed shapes), which is why roundness requires its own callout.' },
  { id: 'zyl', name: 'Cylindricity', en: 'cylindricity', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'entire cylindrical surface',
    zone: 'two coaxial cylinders with radial separation t',
    includes: 'roundness, straightness of surface elements, and parallelism of opposite elements',
    check: 'form measuring machine with linear axis, CMM',
    note: 'More stringent and costly to inspect than roundness. Specify only where full-surface function demands it, e.g. a plain bearing journal.' },
  { id: 'linie', name: 'Line profile', en: 'line profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'any arbitrary line (contour in a cross-section)',
    zone: 'two envelopes of circles of diameter Ø t centered on the true profile',
    includes: 'with a datum: also controls orientation or location of the profile',
    check: 'profile template, contour measuring machine, CMM',
    note: 'The true profile must be defined by theoretically exact dimensions (TEDs in boxes). Without a datum it is a form tolerance; with a datum it controls orientation or location.' },
  { id: 'flaeche', name: 'Surface profile', en: 'surface profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'any arbitrary surface (freeform)',
    zone: 'two enveloping surfaces formed by spheres of diameter Ø t centered on the true surface',
    includes: 'with a datum: also controls orientation or location of the surface',
    check: 'CMM or optical 3D scanner compared against the CAD model',
    note: 'The most common tolerance for freeform surfaces and castings, typically referenced to a datum system A|B|C.' },
  { id: 'para', name: 'Parallelism', en: 'parallelism', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'surface, line, or axis',
    zone: 'two planes (or lines) parallel to the datum at distance t; for an axis with Ø, a cylinder Ø t',
    includes: 'flatness or straightness of the toleranced feature',
    check: 'dial indicator over a surface plate with the part resting on datum A, CMM',
    note: 'The zone is oriented to the datum, not to the best-fit associated plane of the actual feature.' },
  { id: 'recht', name: 'Perpendicularity', en: 'perpendicularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'surface, line, or axis',
    zone: 'two planes perpendicular to the datum at distance t; for an axis with Ø, a cylinder Ø t',
    includes: 'flatness or straightness of the toleranced feature',
    check: 'precision square and light gap, dial indicator on a height stand, CMM',
    note: 'For a bore perpendicular to face A, the axis is usually toleranced: ⊥ Ø t | A.' },
  { id: 'neig', name: 'Angularity', en: 'angularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'surface, line, or axis',
    zone: 'two parallel planes separated by t, inclined at the theoretically exact angle to the datum',
    includes: 'flatness or straightness of the toleranced feature',
    check: 'sine bar or angle fixture with dial indicator, CMM',
    note: 'The nominal angle is given as a theoretically exact dimension (TED) in a rectangular box (e.g. 30°) and carries no tolerance of its own.' },
  { id: 'pos', name: 'Position', en: 'position', group: 'ort', datum: 'optional', dia: true, mmr: true,
    element: 'point, axis, median plane, or surface',
    zone: 'usually a cylinder Ø t centered on the true position defined by TEDs from the datum system',
    includes: 'orientation and form of the toleranced feature',
    check: 'CMM; with Ⓜ, also functional attribute gauges',
    note: 'Position replaces ± coordinate tolerances. A circular zone circumscribing a ± tolerance square offers 57% more area (π/2) without sacrificing function. Without a datum, it controls only pattern-to-pattern location.' },
  { id: 'koax', name: 'Coaxiality / Concentricity', en: 'coaxiality / concentricity', group: 'ort', datum: 'ja', dia: true, mmr: true,
    element: 'axis (coaxiality) or center point (concentricity, with ACS)',
    zone: 'cylinder Ø t coaxial with the datum axis; for concentricity, a circle Ø t',
    includes: 'orientation and straightness of the axis',
    check: 'CMM or form measuring machine; the axis must first be derived from cross-section centers',
    note: 'Often replaced by circular run-out in the shop because run-out can be checked directly with a dial indicator.' },
  { id: 'sym', name: 'Symmetry', en: 'symmetry', group: 'ort', datum: 'ja', dia: false, mmr: true,
    element: 'median plane (or median line)',
    zone: 'two parallel planes separated by t, symmetrically disposed about the datum median plane',
    includes: 'parallelism of the median plane to the datum',
    check: 'dial indicator using 180° reversal measurement, CMM',
    note: 'Typical for slots and keyways centered on a shaft.' },
  { id: 'lauf', name: 'Circular run-out', en: 'circular run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'circular line in each cross-section (radial) or on each measuring cylinder (axial)',
    zone: 'radial: two concentric circles about the datum axis separated by t; axial: two circles on a measuring cylinder',
    includes: 'radial: roundness and coaxiality in each individual cross-section',
    check: 'rotate part between centers or on V-blocks while reading a dial indicator',
    note: 'The leader arrow stands normal to the surface: radial on the cylindrical face, axial on the end face.' },
  { id: 'gesamt', name: 'Total run-out', en: 'total run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'entire cylindrical surface or entire end face',
    zone: 'radial: two coaxial cylinders about the datum axis separated by t; axial: two planes perpendicular to the axis',
    includes: 'radial: circular run-out, cylindricity, and coaxiality; axial: axial circular run-out, flatness, and perpendicularity to the axis',
    check: 'rotate part while traversing the dial indicator axially (or radially); total reading across the entire surface',
    note: 'Total axial run-out produces the exact same tolerance zone as perpendicularity of an end face to a datum axis.' },
];

export const typeById = Object.fromEntries(TYPES.map((t) => [t.id, t]));
export const inGroup = (g) => TYPES.filter((t) => (t.groups || [t.group]).includes(g));

export const DATUM_TEXT = { nein: 'no datum', ja: 'datum required', optional: 'with or without datum' };

// Principles per DIN EN ISO 8015:2011, Clause 5 (original concise summary)
export const PRINCIPLES = [
  { n: '5.1', name: 'Invocation principle', text: 'Any single GPS indication on a drawing invokes the entire ISO GPS system, including the 20 °C reference temperature and ISO 14253-1 decision rules. A title-block note such as “Tolerancing ISO 8015” is not required.', exam: 'A drawing with just one geometrical tolerance symbol is already an ISO GPS drawing.' },
  { n: '5.2', name: 'Principle of GPS standard hierarchy', text: 'Fundamental, global, general, and complementary GPS standards build upon one another. Higher-level rules govern unless a lower-level standard explicitly specifies an exception.', exam: 'ISO 8015 is fundamental, ISO 1101 is general, and ISO 2768 is complementary.' },
  { n: '5.3', name: 'Principle of the definitive drawing', text: 'Only what appears on the drawing (broadly: the complete product documentation) applies. Requirements missing from it cannot be demanded.', exam: 'If a tolerance is omitted, the manufacturer cannot be held to unwritten “shop practice”.' },
  { n: '5.4', name: 'Feature principle', text: 'Each specification applies to one complete geometrical feature between its natural boundaries, and only to that feature. Partial features or combined features require explicit modifiers such as ACS or CZ.', exam: 'Two identical holes without CZ have two separate, independent tolerance zones.' },
  { n: '5.5', name: 'Independency principle', text: 'Each requirement is fulfilled independently. A size tolerance does not control form unless explicitly specified by a modifier such as Ⓔ (envelope requirement), Ⓜ, or CZ.', exam: 'The key departure from old DIN 7167, which assumed the envelope requirement by default.' },
  { n: '5.6', name: 'Principle of decimal representation', text: 'Non-indicated decimal places are assumed to be zeros: 10 means 10.000…', exam: 'An untoleranced dimension does not mean “approximate”; mathematically it is exact.' },
  { n: '5.7', name: 'Default principle', text: 'Every specification without a modifier uses the default specification operator defined in the relevant standard. For example, 30 H6 means local two-point size per ISO 14405-1.', exam: 'Modifiers such as GG, GX, or ACS override the default and are visibly shown on the drawing.' },
  { n: '5.8', name: 'Reference condition principle', text: 'All specifications apply at 20 °C (ISO 1) on a clean workpiece. Other conditions, such as humidity, must be stated on the drawing.', exam: 'Often critical for polymer parts: specify conditioning temperature and humidity.' },
  { n: '5.9', name: 'Rigid workpiece principle', text: 'The workpiece is treated as infinitely rigid and evaluated in the free state without external forces, including gravity. Restrained states are governed by standards such as ISO 10579 (Ⓕ).', exam: 'Thin-walled parts require an explicit clamping/restraining specification.' },
  { n: '5.10', name: 'Duality principle', text: 'The specification defines what must hold independently of the measurement method. Inspection implements it as closely as possible using a verification operator.', exam: 'The drawing does not prescribe a specific measuring instrument.' },
  { n: '5.11', name: 'Functional control principle', text: 'The specification should represent the part’s intended function. The less effectively it captures function, the more ambiguous the functional description becomes.', exam: 'Tolerance according to function, not habit.' },
  { n: '5.12', name: 'General specification principle', text: 'General tolerances in the title block apply only where no individual specification of the same type exists. If two specifications conflict, the more permissive one governs.', exam: 'Example: ISO 2768-mK in the title block is overridden by an individual tolerance on a specific feature.' },
  { n: '5.13', name: 'Responsibility principle', text: 'The designer is responsible for any ambiguity in the specification. Measurement uncertainty is borne by the party proving conformance (ISO 14253-1).', exam: 'Whoever checks conformance must know and account for their measurement uncertainty.' },
];

// Datum letters: I, O, Q, and X shall not be used per ISO 5459:2011, 7.2.2
export const BAD_LETTERS = ['I', 'O', 'Q', 'X'];

// Checks a tolerance frame. Returns list of {level: 'bad'|'warn'|'ok', text}
export function checkFrame({ type, dia = false, mmr = false, datums = [] }) {
  const t = typeById[type];
  if (!t) return [{ level: 'bad', text: 'Unknown tolerance type.' }];
  const out = [];
  const ds = datums.filter(Boolean);
  if (t.datum === 'nein' && ds.length) out.push({ level: 'bad', text: `${t.name} is a form tolerance and cannot reference a datum.` });
  if (t.datum === 'ja' && !ds.length) out.push({ level: 'bad', text: `${t.name} requires a datum; otherwise the zone orientation or location is undefined.` });
  if (t.id === 'pos' && !ds.length) out.push({ level: 'warn', text: 'Position without a datum only defines location within a hole pattern, not relative to the workpiece.' });
  if (dia && !t.dia) out.push({ level: 'bad', text: `Ø is not valid for ${t.name}: the tolerance zone is neither cylindrical nor circular.` });
  if (mmr && !t.mmr) out.push({ level: 'bad', text: `Ⓜ cannot be used with ${t.name}: the maximum material requirement applies only to axes and median planes of features of size (ISO 2692).` });
  if (mmr && t.mmr && ['gerad', 'para', 'recht', 'neig', 'pos', 'koax'].includes(t.id) && !dia) out.push({ level: 'warn', text: 'Ⓜ requires a feature of size; for an axis, Ø normally precedes the tolerance value.' });
  for (const d of ds) {
    for (const ch of d.replace('-', '')) if (BAD_LETTERS.includes(ch)) out.push({ level: 'bad', text: `Datum letter ${ch} should not be used (risk of confusion, ISO 5459).` });
  }
  if (new Set(ds).size !== ds.length) out.push({ level: 'bad', text: 'The same datum appears twice in the frame.' });
  if (ds.length > 3) out.push({ level: 'bad', text: 'A datum system has at most three datums (primary, secondary, tertiary).' });
  if (['lauf', 'gesamt', 'koax'].includes(t.id) && ds.length && ds.length > 1 && !ds.some((d) => d.includes('-'))) out.push({ level: 'warn', text: 'Run-out and coaxiality usually reference a common datum axis such as A-B rather than a datum system A|B.' });
  if (!out.length) out.push({ level: 'ok', text: 'Formally valid tolerance frame.' });
  return out;
}

export const frameOk = (spec) => !checkFrame(spec).some((r) => r.level === 'bad');
