/* JM3.5 build tour page: tabs, chapter list, video sync. Data and helpers in model.js (window.TourModel). */
(function () {
  'use strict';
  const M = window.TourModel;
  const video = document.getElementById('tour');
  const list = document.getElementById('chapters');
  const el = id => document.getElementById(id);
  let current = -1;

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + btn.dataset.view));
    if (btn.dataset.view !== 'tour' && !video.paused) video.pause();
  }));

  /* ---------- chapter list ---------- */
  M.CHAPTERS.forEach((c, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chapter-btn';
    b.dataset.i = i;
    b.innerHTML =
      '<img src="' + M.thumbFor(i) + '" width="160" height="90" alt="" loading="lazy">' +
      '<span class="ch-body"><span class="ch-meta"><span>' + M.stopLabel(i) + '</span><span>' + M.formatClock(c.t0) + '</span></span>' +
      '<strong class="ch-title"></strong><span class="ch-parts"></span></span>';
    b.querySelector('.ch-title').textContent = c.title;
    b.querySelector('.ch-parts').textContent = c.parts;
    b.addEventListener('click', () => jump(i, true));
    li.appendChild(b);
    list.appendChild(li);
  });
  const buttons = [...list.querySelectorAll('.chapter-btn')];

  function show(i) {
    if (i === current) return;
    current = i;
    const c = M.CHAPTERS[i];
    el('now-stop').textContent = M.stopLabel(i);
    el('now-title').textContent = c.title;
    el('now-parts').textContent = c.parts;
    el('now-text').textContent = c.text;
    el('btn-prev').disabled = i === 0;
    el('btn-next').disabled = i === M.CHAPTERS.length - 1;
    buttons.forEach((b, k) => b.toggleAttribute('aria-current', k === i));
    // keep the active entry visible inside the list without moving the page
    const b = buttons[i], box = list;
    if (box.scrollHeight > box.clientHeight) {
      const top = b.offsetTop - box.offsetTop, bottom = top + b.offsetHeight;
      if (top < box.scrollTop) box.scrollTop = top - 6;
      else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 6;
    }
  }

  function jump(i, play) {
    i = Math.max(0, Math.min(M.CHAPTERS.length - 1, i));
    video.currentTime = M.CHAPTERS[i].t0 + 0.01;
    show(i);
    if (play) video.play().catch(() => {});
  }

  video.addEventListener('timeupdate', () => {
    el('now-clock').textContent = M.formatClock(video.currentTime);
    show(M.chapterIndexAt(video.currentTime));
  });
  video.addEventListener('seeked', () => show(M.chapterIndexAt(video.currentTime)));
  el('btn-prev').addEventListener('click', () => jump(current - 1, !video.paused));
  el('btn-next').addEventListener('click', () => jump(current + 1, !video.paused));

  show(0);
})();
