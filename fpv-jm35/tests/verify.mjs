/* Checks for the JM3.5 build tour page. Run: node tests/verify.mjs
   They test the chapter model and the shipped media files (video header, thumbnails),
   not the CAD model itself. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const M = require(path.join(app, 'model.js'));

let passed = 0;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
function check(name, fn) { fn(); passed++; console.log(`  [PASS] ${name}`); }

/* Read duration from the mp4 header: moov > mvhd (version 0 or 1). */
function mp4Info(file) {
  const b = readFileSync(file);
  const boxes = [];
  for (let p = 0; p + 8 <= b.length;) {
    let size = b.readUInt32BE(p); const type = b.toString('latin1', p + 4, p + 8);
    if (size === 1) size = Number(b.readBigUInt64BE(p + 8));
    boxes.push({ type, p, size });
    if (size < 8) break;
    p += size;
  }
  const moov = boxes.find(x => x.type === 'moov');
  const mvhd = b.indexOf('mvhd', moov.p, 'latin1');
  const v = b[mvhd + 4];
  const ts = v === 1 ? b.readUInt32BE(mvhd + 4 + 4 + 16) : b.readUInt32BE(mvhd + 4 + 4 + 8);
  const dur = v === 1 ? Number(b.readBigUInt64BE(mvhd + 4 + 4 + 20)) : b.readUInt32BE(mvhd + 4 + 4 + 12);
  return { order: boxes.map(x => x.type), duration: dur / ts };
}

check('19 chapters: opening view, 17 inspection stops, closing view', () => {
  assert.equal(M.CHAPTERS.length, 19);
  assert.equal(M.stopLabel(0), 'Overview');
  assert.equal(M.stopLabel(1), 'Stop 01 / 17');
  assert.equal(M.stopLabel(17), 'Stop 17 / 17');
  assert.equal(M.stopLabel(18), 'Closing view');
});
check('chapters start at 0, end at 2217 frames / 24 fps = 92.375 s and leave no gaps', () => {
  assert.equal(M.CHAPTERS[0].t0, 0);
  assert.ok(near(M.DURATION, 92.375));
  assert.ok(near(M.CHAPTERS.at(-1).t1, M.DURATION, 1e-3));
  for (let i = 1; i < M.CHAPTERS.length; i++) {
    assert.ok(near(M.CHAPTERS[i].t0, M.CHAPTERS[i - 1].t1, 1e-9), `gap before chapter ${i}`);
    assert.ok(M.CHAPTERS[i].t1 - M.CHAPTERS[i].t0 >= 3.5, `chapter ${i} shorter than 3.5 s`);
  }
});
check('every chapter has a title, a parts line and a sentence', () => {
  for (const c of M.CHAPTERS) {
    assert.ok(c.title && c.parts && c.text, JSON.stringify(c));
    assert.ok(!/\s{2}/.test(c.parts + c.text + c.title), 'double space in ' + c.title);
  }
});
check('chapterIndexAt: boundaries belong to the next chapter, outside times clamp', () => {
  assert.equal(M.chapterIndexAt(-3), 0);
  assert.equal(M.chapterIndexAt(NaN), 0);
  assert.equal(M.chapterIndexAt(0), 0);
  assert.equal(M.chapterIndexAt(5.499), 0);
  assert.equal(M.chapterIndexAt(5.5), 1);
  assert.equal(M.chapterIndexAt(67.417), 14);
  assert.equal(M.chapterIndexAt(92.375), 18);
  assert.equal(M.chapterIndexAt(500), 18);
  M.CHAPTERS.forEach((c, i) => assert.equal(M.chapterIndexAt((c.t0 + c.t1) / 2), i));
});
check('formatClock: 0 → 0:00, 59.9 → 0:59, 63.417 → 1:03, 92.375 → 1:32', () => {
  assert.equal(M.formatClock(0), '0:00');
  assert.equal(M.formatClock(59.9), '0:59');
  assert.equal(M.formatClock(63.417), '1:03');
  assert.equal(M.formatClock(92.375), '1:32');
  assert.equal(M.formatClock(-1), '0:00');
});
check('video file: moov before mdat (streams without full download), duration matches the model', () => {
  const f = path.join(app, 'media', 'jm35-build-tour.mp4');
  const info = mp4Info(f);
  assert.ok(info.order.indexOf('moov') < info.order.indexOf('mdat'), info.order.join(','));
  assert.ok(near(info.duration, M.DURATION, 0.05), 'mp4 duration ' + info.duration);
  assert.ok(statSync(f).size < 50e6, 'video over 50 MB');
});
check('poster, studio render, ring-fix image and one thumbnail per chapter exist', () => {
  for (const n of ['poster.jpg', 'studio-render.jpg', 'ring-fix.jpg']) assert.ok(existsSync(path.join(app, 'media', n)), n);
  M.CHAPTERS.forEach((c, i) => assert.ok(existsSync(path.join(app, M.thumbFor(i))), M.thumbFor(i)));
});

console.log(`\n${passed} checks passed.`);
