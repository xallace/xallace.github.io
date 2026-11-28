/* Model: chapter data and pure helpers for the JM3.5 build tour. No DOM.
   Loaded as a classic script in the browser (window.TourModel) and with require() in tests/verify.mjs.
   Chapter times come from the tour render (24 fps, 2217 frames = 92.375 s). */
(function (root) {
  'use strict';

  const FPS = 24;
  const FRAMES = 2217;
  const DURATION = FRAMES / FPS; // 92.375 s

  // t0/t1 in seconds. Chapter 0 and the last one are the opening/closing views,
  // the 17 in between are the inspection stops shown as "01 / 17" … "17 / 17" in the video.
  const CHAPTERS = [
    { t0: 0.0, t1: 5.5, title: "Flight-style overview", parts: "Complete quad, 4S pack installed", text: "Opening shot: the assembled quad hovers above the studio floor with the battery installed and the propellers turning." },
    { t0: 5.5, t1: 10.375, title: "Chassis plates", parts: "Lower keel, Forward saddle, Battery deck", text: "Two clamp plates capture the arm roots; the slotted deck carries the pack." },
    { t0: 10.375, t1: 15.167, title: "Arms and tip guards", parts: "Carbon motor arm ×4, TPU tip shoe ×4", text: "One replaceable carbon arm and one orange TPU shoe at each corner." },
    { t0: 15.167, t1: 20.083, title: "Frame spacers", parts: "Mid spacer ×4, Tail spacer ×2", text: "The middle and rear spacer sets establish the upper-deck height." },
    { t0: 20.083, t1: 24.792, title: "Camera cage", parts: "Carbon cheek ×2, Alloy crossbar ×2", text: "Two carbon cheeks locate the camera pivot; alloy crossbars tie them together." },
    { t0: 24.792, t1: 28.958, title: "Motor mounting", parts: "P1604 stator · base, Flange screws ×4 · motor", text: "Four screws per motor seat the stationary P1604 base on the carbon arm." },
    { t0: 28.958, t1: 34.208, title: "Rotating motor bell", parts: "P1604 rotor bell ×4", text: "The vented bell and 1.5 mm pilot turn on the stator axis." },
    { t0: 34.208, t1: 39.167, title: "Propellers and retainers", parts: "Hurricane 3520 · hand A, Hurricane 3520 · hand B, T-mount screw pair", text: "Opposite-handed 3520 tri-blades are secured to the bells by paired T-mount screws." },
    { t0: 39.167, t1: 43.708, title: "Motor wiring", parts: "Phase loom · route A, Phase loom · route B", text: "The two mirrored loom routes follow the arms to the AIO board." },
    { t0: 43.708, t1: 48.5, title: "Flight-control stack", parts: "JHEMCU GHF405AIO, Stack isolators", text: "The JHEMCU all-in-one board combines the flight controller and ESCs; risers carry the video module." },
    { t0: 48.5, t1: 53.208, title: "Digital video system", parts: "DJI O4 Lite · transmitter, Video antenna", text: "The standard O4 transmission module feeds the aft-facing video antenna." },
    { t0: 53.208, t1: 59.208, title: "Receiver and tail carrier", parts: "SpeedyBee Nano ELRS, 2.4 GHz T antenna, TPU antenna carrier", text: "The Nano receiver drives the transverse T antenna. The TPU block supports both antenna exits." },
    { t0: 59.208, t1: 63.417, title: "GNSS at the nose", parts: "SoloGood M10-180 GPS, TPU GPS cradle", text: "The ceramic patch sits in the orange cradle above the camera crossbar." },
    { t0: 63.417, t1: 67.417, title: "Camera installation", parts: "DJI O4 camera, Elastomer isolator", text: "The O4 camera sits in an elastomer isolator between the carbon cheeks." },
    { t0: 67.417, t1: 73.875, title: "Wide-angle optics and tilt", parts: "Flywoo wide-angle bezel, Retaining ring, Camera pivot", text: "The lens and retaining ring remain coaxial while the camera moves between its stops." },
    { t0: 73.875, t1: 79.042, title: "Signal and coax routes", parts: "Camera coax, GPS signal leads, Receiver coax", text: "The camera, video antenna, GPS and receiver leads run through the chassis." },
    { t0: 79.042, t1: 83.667, title: "Power connection", parts: "Battery pigtail, XT30 connector", text: "The red and black battery leads exit through the rear deck and terminate in a keyed XT30." },
    { t0: 83.667, t1: 88.375, title: "Installed battery", parts: "Ovonic 850 mAh 4S, Retention belt", text: "The optional 850 mAh 4S pack is shown installed, with its belt and matching plug." },
    { t0: 88.375, t1: 92.375, title: "Back to the opening view", parts: "Complete quad", text: "The tour closes on the same camera position, battery configuration and camera tilt as the first shot." }
  ];

  /** Index of the chapter that contains time t (s). Times outside the video clamp to the first/last chapter. */
  function chapterIndexAt(t) {
    if (!(t > 0)) return 0;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].t0) return i;
    return 0;
  }

  /** "m:ss" for a time in seconds (floored to whole seconds). */
  function formatClock(t) {
    const s = Math.max(0, Math.floor(t + 1e-6));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /** Label shown next to a chapter: "Overview", "Stop 01 / 17" … "Closing view". */
  function stopLabel(i) {
    const n = CHAPTERS.length - 2;
    if (i === 0) return 'Overview';
    if (i === CHAPTERS.length - 1) return 'Closing view';
    return 'Stop ' + String(i).padStart(2, '0') + ' / ' + n;
  }

  /** Thumbnail file for chapter i, relative to the page. */
  function thumbFor(i) {
    return 'media/stop-' + String(i + 1).padStart(2, '0') + '.jpg';
  }

  const api = { FPS, FRAMES, DURATION, CHAPTERS, chapterIndexAt, formatClock, stopLabel, thumbFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TourModel = api;
})(this);