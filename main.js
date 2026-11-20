/**
 * xallace.github.io — Interactive Enhancements
 * Kinematic Node Network background canvas & interactive features
 */

(function () {
  'use strict';

  // 1. Subtle Kinematic Network Canvas Simulation
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 45;
    const maxDistance = 140;

    let mouse = { x: -1000, y: -1000, radius: 160 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.5 + 1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Connect nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse avoidance/reaction
        const dxMouse = p1.x - mouse.x;
        const dyMouse = p1.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < mouse.radius) {
          const force = (1 - distMouse / mouse.radius) * 1.2;
          p1.x += (dxMouse / (distMouse || 1)) * force;
          p1.y += (dyMouse / (distMouse || 1)) * force;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fill();

        // Connect edges
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // 2. Smooth active link highlighting on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // 3. Seven-Principles-inspired 3D Spring-Physics Collector Cards
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = document.querySelectorAll('.project-card');
  const cardStates = [];

  cards.forEach((card) => {
    // Inject translucent foil, stardust, glare, and celestial filigree corner frame
    const foil = document.createElement('div');
    foil.className = 'card-foil';
    foil.setAttribute('aria-hidden', 'true');

    const sparkles = document.createElement('div');
    sparkles.className = 'card-sparkles';
    sparkles.setAttribute('aria-hidden', 'true');

    const glare = document.createElement('div');
    glare.className = 'card-glare';
    glare.setAttribute('aria-hidden', 'true');

    const frame = document.createElement('div');
    frame.className = 'card-filigree-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.innerHTML =
      '<span class="cf-c cf-tl"></span><span class="cf-c cf-tr"></span>' +
      '<span class="cf-c cf-bl"></span><span class="cf-c cf-br"></span>';

    card.appendChild(foil);
    card.appendChild(sparkles);
    card.appendChild(glare);
    card.appendChild(frame);

    if (reducedMotion) return;

    const state = {
      card,
      foil,
      glare,
      active: false,
      target: { rx: 0, ry: 0, px: 0.5, py: 0.5, scale: 1 },
      current: { rx: 0, ry: 0, px: 0.5, py: 0.5, scale: 1 }
    };

    card.addEventListener('mouseenter', () => {
      state.active = true;
    });

    card.addEventListener('mousemove', (e) => {
      const b = card.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (b.width * 0.55)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (b.height * 0.55)));
      // Keep physical Z displacement consistent across tall Row-1 and compact cards, avoiding extreme vertical skew.
      const longEdge = Math.max(b.width, b.height, 360);
      const maxTilt = Math.max(3.2, Math.min(6.5, 3200 / longEdge));
      state.target.rx = -ny * maxTilt;
      state.target.ry = nx * maxTilt;
      state.target.px = (nx + 1) * 0.5;
      state.target.py = (ny + 1) * 0.5;
      state.target.scale = 1.012;
    });

    card.addEventListener('mouseleave', () => {
      state.active = false;
      state.target.rx = 0;
      state.target.ry = 0;
      state.target.px = 0.5;
      state.target.py = 0.5;
      state.target.scale = 1;
    });

    cardStates.push(state);
  });

  if (cardStates.length > 0) {
    function animateCards() {
      const lerp = 0.14;
      for (const s of cardStates) {
        s.current.rx += (s.target.rx - s.current.rx) * lerp;
        s.current.ry += (s.target.ry - s.current.ry) * lerp;
        s.current.px += (s.target.px - s.current.px) * lerp;
        s.current.py += (s.target.py - s.current.py) * lerp;
        s.current.scale += (s.target.scale - s.current.scale) * lerp;

        const { rx, ry, px, py, scale } = s.current;
        const moving = s.active || Math.abs(rx) > 0.02 || Math.abs(ry) > 0.02 || Math.abs(scale - 1) > 0.001;
        if (!moving) {
          s.card.style.transform = '';
          s.glare.style.opacity = '0';
          s.foil.style.opacity = '0.12';
          continue;
        }

        const hyp = Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2);
        const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 132;

        // Per-card perspective keeps the vanishing point centered on each card rather than shearing off-axis across tall grids.
        s.card.style.transform =
          `perspective(1600px) translateY(${s.active ? '-4px' : '0px'}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, 1)`;
        s.card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        s.card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        s.card.style.setProperty('--hyp', hyp.toFixed(3));
        s.card.style.setProperty('--foil-angle', `${angle.toFixed(1)}deg`);
        s.card.style.setProperty('--pan-x', `${((px - 0.5) * -10).toFixed(1)}px`);
        s.card.style.setProperty('--pan-y', `${((py - 0.5) * -10).toFixed(1)}px`);

        s.glare.style.background =
          `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255, 255, 255, 0.28) 0%, rgba(139, 92, 246, 0.10) 30%, transparent 65%)`;
        s.glare.style.opacity = s.active ? (0.25 + hyp * 0.45).toFixed(2) : '0';

        s.foil.style.backgroundPosition = `${px * 180}% ${py * 180}%, ${px * 120}% ${py * 120}%`;
        s.foil.style.opacity = s.active ? (0.28 + hyp * 0.36).toFixed(2) : '0.12';
      }
      requestAnimationFrame(animateCards);
    }
    requestAnimationFrame(animateCards);
  }

  // 4. Card groups as a vertical tab deck (.tab-deck): one button per card, built from its
  //    serial code and title, placed right before the card. CSS puts the buttons in a column
  //    on the left and the active card on the right; below 700 px the DOM order gives an
  //    accordion. The deck CSS is scoped to html.js, so without JS the cards stay a grid.
  const chevron = (d) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const deckMq = window.matchMedia('(max-width: 699px)');
  const decks = [];

  document.querySelectorAll('.tab-deck').forEach((deck, d) => {
    const items = Array.from(deck.children).filter((el) => el.classList.contains('project-card'));
    if (items.length === 0) return;
    deck.style.setProperty('--n', String(items.length));

    const tabs = items.map((card, i) => {
      const id = `deck${d + 1}-${i + 1}`;
      if (!card.id) card.id = `${id}-card`;
      const title = card.querySelector('.card-title');
      const code = card.querySelector('.serial-code');
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'deck-tab';
      tab.id = `${id}-tab`;
      tab.setAttribute('aria-controls', card.id);
      tab.setAttribute('aria-expanded', 'false');
      const accent = card.style.getPropertyValue('--card-accent');
      if (accent) tab.style.setProperty('--card-accent', accent.trim());
      tab.innerHTML =
        `<span class="deck-tab-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
        '<span class="deck-tab-text"><span class="deck-tab-code"></span><span class="deck-tab-title"></span></span>' +
        `<span class="deck-tab-chev" aria-hidden="true">${chevron('M9 18l6-6-6-6')}</span>`;
      tab.querySelector('.deck-tab-code').textContent = code ? code.textContent.trim() : '';
      tab.querySelector('.deck-tab-title').textContent = title ? title.textContent.trim() : `Project ${i + 1}`;
      deck.insertBefore(tab, card);
      card.setAttribute('role', 'region');
      card.setAttribute('aria-labelledby', tab.id);
      return tab;
    });

    function setOpen(open) {
      items.forEach((card, k) => {
        const on = k === open;
        card.classList.toggle('is-active', on);
        tabs[k].classList.toggle('is-active', on);
        tabs[k].setAttribute('aria-expanded', String(on));
      });
    }

    function select(i) {
      if (!deckMq.matches) { setOpen(i); return; }
      // Accordion: a second tap closes; keep the tapped title where the finger is,
      // otherwise a card closing above it would pull the page up.
      const before = tabs[i].getBoundingClientRect().top;
      setOpen(items[i].classList.contains('is-active') ? -1 : i);
      const shift = tabs[i].getBoundingClientRect().top - before;
      if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
    }

    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));

    deck.addEventListener('keydown', (e) => {
      const k = tabs.indexOf(document.activeElement);
      if (k < 0) return;
      const n = tabs.length;
      const j = { ArrowDown: (k + 1) % n, ArrowUp: (k - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      tabs[j].focus();
      if (!deckMq.matches) setOpen(j);
    });

    // Side by side one card is always open; the phone accordion starts as a plain title list.
    const ensureOpen = () => {
      if (!deckMq.matches && !items.some((c) => c.classList.contains('is-active'))) setOpen(0);
    };
    decks.push(ensureOpen);
    ensureOpen();
  });

  if (decks.length > 0) {
    const onChange = () => decks.forEach((fn) => fn());
    if (deckMq.addEventListener) deckMq.addEventListener('change', onChange);
    else if (deckMq.addListener) deckMq.addListener(onChange);
  }

})();
