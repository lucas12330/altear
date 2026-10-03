// Altear — interactions du site vitrine (aucune dépendance externe).
(() => {
  'use strict';

  // État du PC affiché en haut de page. À activer quand bureau.altear.tech/api/etat sera public
  // (portail en ligne) : tant que Cloudflare Access protège tout le sous-domaine, la requête échouerait.
  const STATUS = { enabled: false, url: 'https://bureau.altear.tech/api/etat', timeoutMs: 4000 };

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ---------- Navigation ---------- */
  const nav = $('[data-nav]');
  const toggle = $('.nav-toggle');
  const menu = $('#menu');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 860px)').addEventListener('change', () => setMenu(false));

  /* ---------- Apparition au défilement (décalage entre éléments voisins) ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  for (const el of $$('[data-reveal]')) {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
    const rank = siblings.indexOf(el);
    if (rank > 0) el.style.setProperty('--d', `${Math.min(rank, 6) * 0.08}s`);
    revealObserver.observe(el);
  }

  /* ---------- Compteurs ---------- */
  const countObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (!target || reduceMotion) continue;
      const start = performance.now();
      const duration = 1300;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- Halo qui suit le pointeur sur les cartes ---------- */
  for (const card of $$('.card')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ---------- Questions (accordéon) ---------- */
  for (const button of $$('[data-faq] button')) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.closest('.faq-item').classList.toggle('open', open);
    });
  }

  /* ---------- iPhone : se redresse pendant le défilement ---------- */
  const tilt = $('[data-tilt]');
  if (tilt && !reduceMotion) {
    let queued = false;
    const updateTilt = () => {
      queued = false;
      const top = tilt.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (top - vh * 0.12) / (vh * 0.7)));
      tilt.style.setProperty('--tilt', p.toFixed(3));
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(updateTilt); }
    }, { passive: true });
    window.addEventListener('resize', updateTilt);
    updateTilt();
  } else if (tilt) {
    tilt.style.setProperty('--tilt', '0');
  }

  /* ---------- iPhone : scénario Face ID → bureau ---------- */
  const device = $('[data-device]');
  const term = $('[data-typing]');
  const clock = $('[data-clock]');
  const TERMINAL = [
    { text: 'toi@altear:~/projets$ ', cls: 'pr' },
    { text: 'cd robot && git pull', type: true },
    { text: '\nDéjà à jour.', cls: 'out', wait: 350 },
    { text: '\ntoi@altear:~/projets/robot$ ', cls: 'pr', wait: 250 },
    { text: 'python3 pid.py --test', type: true },
    { text: '\n✓ 12 tests réussis en 0,8 s', cls: 'ok', wait: 650 },
    { text: '\ntoi@altear:~/projets/robot$ ', cls: 'pr', wait: 250 },
  ];
  const SCENES = [['lock', 1500], ['scan', 1500], ['ok', 1100], ['desktop', 8800]];

  const updateClock = () => {
    clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  if (clock) {
    updateClock();
    setInterval(updateClock, 30000);
  }

  let typingRun = 0;
  const typeTerminal = async (run, instant = false) => {
    term.textContent = '';
    for (const part of TERMINAL) {
      if (run !== typingRun) return;
      if (part.wait && !instant) await sleep(part.wait);
      const span = document.createElement('span');
      if (part.cls) span.className = part.cls;
      term.append(span);
      if (part.type && !instant) {
        for (const ch of part.text) {
          if (run !== typingRun) return;
          span.textContent += ch;
          await sleep(40 + Math.random() * 60);
        }
      } else {
        span.textContent = part.text;
      }
    }
  };

  if (device) {
    if (reduceMotion) {
      device.dataset.scene = 'desktop';
      device.classList.add('play');
      typeTerminal(++typingRun, true);
    } else {
      let index = 0;
      let timer = 0;
      let running = false;
      const step = () => {
        const [scene, duration] = SCENES[index];
        device.dataset.scene = scene;
        if (scene === 'desktop') {
          device.classList.remove('play');
          void device.offsetWidth; // relance les animations CSS du bureau
          device.classList.add('play');
          typeTerminal(++typingRun);
        } else if (scene === 'lock') {
          device.classList.remove('play');
          typingRun++;
        }
        index = (index + 1) % SCENES.length;
        timer = setTimeout(step, duration);
      };
      const start = () => { if (!running) { running = true; step(); } };
      const stop = () => { running = false; clearTimeout(timer); };
      let visible = false;
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: 0.2 }).observe(device);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else if (visible) start();
      });
    }
  }

  /* ---------- Fond de particules de l'accueil ---------- */
  const canvas = $('.hero-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    let width = 0;
    let height = 0;
    let points = [];
    let frame = 0;
    let active = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 720 ? 34 : 72;
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.2 + 0.4,
      }));
    };

    const LINK = 120;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = width + 10; else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10; else if (p.y > height + 10) p.y = -10;
      }
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          ctx.strokeStyle = `rgba(167, 139, 250, ${(1 - Math.sqrt(d2) / LINK) * 0.16})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(199, 210, 254, .55)';
      for (const p of points) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      if (active) frame = requestAnimationFrame(draw);
    };

    const play = (on) => {
      if (on === active) return;
      active = on;
      if (on) frame = requestAnimationFrame(draw); else cancelAnimationFrame(frame);
    };
    resize();
    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    let heroVisible = false;
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      play(heroVisible && !document.hidden);
    }).observe(hero);
    document.addEventListener('visibilitychange', () => play(heroVisible && !document.hidden));
  }

  /* ---------- État du PC ---------- */
  const checkStatus = async () => {
    if (!STATUS.enabled) return;
    const pill = $('[data-status]');
    const label = $('[data-status-text]');
    if (!pill || !label) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STATUS.timeoutMs);
    let online = false;
    try {
      const res = await fetch(STATUS.url, { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
      const data = res.ok ? await res.json() : null;
      online = Boolean(data && data.etat === 'en_ligne');
    } catch {
      online = false;
    } finally {
      clearTimeout(timeout);
    }
    pill.dataset.state = online ? 'online' : 'offline';
    label.textContent = online ? 'PC en ligne, prêt à l’emploi' : 'PC hors ligne pour le moment';
  };
  checkStatus();

  /* ---------- Année du pied de page ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
