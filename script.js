(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const desktopMotion = window.matchMedia('(min-width: 768px)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const qs = (selector, root = doc) => root.querySelector(selector);
  const qsa = (selector, root = doc) => [...root.querySelectorAll(selector)];
  const onReady = (fn) => {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  /* -------------------------------------------------------
     Preloader — independent from GSAP/CDN availability
     ------------------------------------------------------- */
  const preloader = qs('.site-preloader');
  let preloaderReleased = false;
  if (preloader && !reduceMotion) body.classList.add('is-preloading');

  const releasePreloader = () => {
    if (preloaderReleased) return;
    preloaderReleased = true;
    if (!preloader) {
      window.dispatchEvent(new Event('zonexdev:ready'));
      return;
    }
    if (reduceMotion) {
      preloader.remove();
      body.classList.remove('is-preloading');
      window.dispatchEvent(new Event('zonexdev:ready'));
      return;
    }
    body.classList.remove('is-preloading');
    body.classList.add('site-ready');
    preloader.classList.add('is-leaving');
    window.dispatchEvent(new Event('zonexdev:ready'));
    window.setTimeout(() => preloader.remove(), 820);
  };
  // Keep the brand moment intentionally visible for roughly three seconds.
  onReady(() => window.setTimeout(releasePreloader, 1500));
  // Failsafe: never leave the user trapped behind the loader.
  window.setTimeout(releasePreloader, 3000);

  /* -------------------------------------------------------
     Header + scroll progress — one RAF per scroll burst
     ------------------------------------------------------- */
  const progress = qs('.scroll-progress span');
  const header = qs('.site-header');
  let scrollTicking = false;
  const renderScrollUI = () => {
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(current / max, 0, 1) : 0})`;
    header?.classList.toggle('is-scrolled', current > 48);
    scrollTicking = false;
  };
  const requestScrollUI = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(renderScrollUI);
  };
  window.addEventListener('scroll', requestScrollUI, { passive: true });
  window.addEventListener('resize', requestScrollUI, { passive: true });
  renderScrollUI();


  /* Footer back-to-top — explicit so it works consistently across routed pages. */
  qsa('a[href="#top"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* -------------------------------------------------------
     Mobile menu
     ------------------------------------------------------- */
  const menuToggle = qs('.menu-toggle');
  const mobileMenu = qs('.mobile-menu');
  const setMobileMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
    body.classList.toggle('menu-open', open);
  };
  menuToggle?.addEventListener('click', () => setMobileMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  qsa('a', mobileMenu || doc.createElement('div')).forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));

  /* -------------------------------------------------------
     Desktop mega menu — hover/focus only, no indicator
     ------------------------------------------------------- */
  const megaShell = qs('[data-mega-shell]');
  const megaTriggers = qsa('[data-mega]');
  const megaPanels = qsa('[data-panel]');
  let megaCloseTimer = 0;
  let megaHideTimer = 0;
  let activeMega = '';

  const cancelMegaClose = () => {
    if (megaCloseTimer) window.clearTimeout(megaCloseTimer);
    if (megaHideTimer) window.clearTimeout(megaHideTimer);
    megaCloseTimer = 0;
    megaHideTimer = 0;
  };

  const openMega = (name) => {
    if (!megaShell || !name || window.innerWidth < 901) return;
    cancelMegaClose();
    activeMega = name;
    megaShell.hidden = false;
    megaPanels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === name));
    megaTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(trigger.dataset.mega === name)));
    requestAnimationFrame(() => megaShell.classList.add('is-open'));
  };

  const closeMega = (immediate = false) => {
    if (!megaShell || megaShell.hidden) return;
    cancelMegaClose();
    activeMega = '';
    megaShell.classList.remove('is-open');
    megaTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    const hide = () => {
      megaPanels.forEach((panel) => panel.classList.remove('is-active'));
      megaShell.hidden = true;
    };
    if (immediate || reduceMotion) hide();
    else megaHideTimer = window.setTimeout(hide, 150);
  };

  const scheduleMegaClose = () => {
    cancelMegaClose();
    megaCloseTimer = window.setTimeout(() => closeMega(false), 120);
  };

  megaTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('pointerenter', () => openMega(trigger.dataset.mega));
    trigger.addEventListener('focus', () => openMega(trigger.dataset.mega));
  });
  header?.addEventListener('pointerleave', (event) => {
    if (megaShell?.contains(event.relatedTarget)) return;
    scheduleMegaClose();
  });
  megaShell?.addEventListener('pointerenter', cancelMegaClose);
  megaShell?.addEventListener('pointerleave', (event) => {
    if (header?.contains(event.relatedTarget)) return;
    scheduleMegaClose();
  });
  megaShell?.addEventListener('focusin', cancelMegaClose);
  megaShell?.addEventListener('focusout', (event) => {
    if (!megaShell.contains(event.relatedTarget) && !header?.contains(event.relatedTarget)) scheduleMegaClose();
  });
  doc.addEventListener('pointerdown', (event) => {
    if (!activeMega) return;
    if (!megaShell?.contains(event.target) && !header?.contains(event.target)) closeMega(true);
  });

  /* -------------------------------------------------------
     Home hero entrance — starts as the preloader moves away
     ------------------------------------------------------- */
  const splitElement = qs('.split-reveal');
  let homeWords = [];
  if (splitElement) {
    const nodes = [...splitElement.childNodes];
    splitElement.textContent = '';
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/\s+/.test(part)) return splitElement.appendChild(doc.createTextNode(part));
          const wrap = doc.createElement('span');
          wrap.className = 'word';
          const inner = doc.createElement('span');
          inner.textContent = part;
          wrap.appendChild(inner);
          splitElement.appendChild(wrap);
        });
      } else if (node.nodeName === 'BR') {
        splitElement.appendChild(doc.createElement('br'));
      }
    });
    homeWords = qsa('.word > span', splitElement);
  }

  let homeHeroPlayed = false;
  const playHomeHero = () => {
    if (homeHeroPlayed) return;
    homeHeroPlayed = true;
    qsa('.hero .reveal-up').forEach((item) => item.classList.add('is-visible'));
    if (reduceMotion) return;
    homeWords.forEach((word, index) => {
      word.animate(
        [{ transform: 'translate3d(0,72%,0)', opacity: .35 }, { transform: 'translate3d(0,0,0)', opacity: 1 }],
        { duration: 660, delay: 80 + index * 46, easing: 'cubic-bezier(.22,.8,.26,1)', fill: 'both' }
      );
    });
    qsa('.hero .reveal-up').forEach((item, index) => {
      item.animate(
        [{ transform: 'translate3d(0,14px,0)', opacity: .55 }, { transform: 'translate3d(0,0,0)', opacity: 1 }],
        { duration: 560, delay: 150 + index * 65, easing: 'cubic-bezier(.22,.8,.26,1)', fill: 'both' }
      );
    });
  };
  window.addEventListener('zonexdev:ready', playHomeHero, { once: true });
  if (!preloader) playHomeHero();

  /* -------------------------------------------------------
     Lightweight viewport reveals
     ------------------------------------------------------- */
  const revealItems = qsa('.reveal-up').filter((item) => !item.closest('.hero'));
  if (!reduceMotion && revealItems.length && 'IntersectionObserver' in window) {
    body.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else revealItems.forEach((item) => item.classList.add('is-visible'));

  /* -------------------------------------------------------
     Soft inner-page reveals — IntersectionObserver, no ScrollTrigger cost
     ------------------------------------------------------- */
  const softRevealItems = qsa('.reveal-safe[data-reveal]').filter((item) => !item.closest('.page-hero'));
  if (!reduceMotion && softRevealItems.length && 'IntersectionObserver' in window) {
    body.classList.add('soft-reveal-ready');
    const softObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        softObserver.unobserve(entry.target);
      });
    }, { threshold: .07, rootMargin: '0px 0px -3% 0px' });
    softRevealItems.forEach((item) => softObserver.observe(item));
  } else softRevealItems.forEach((item) => item.classList.add('is-visible'));

  /* -------------------------------------------------------
     Cursor + hero light — event-driven, no permanent RAF loop
     ------------------------------------------------------- */
  const cursor = qs('.cursor');
  const heroGlowA = qs('.hero-glow-a');
  const heroGlowB = qs('.hero-glow-b');
  if (cursor && finePointer && !reduceMotion) {
    let pointerFrame = 0;
    let px = innerWidth / 2;
    let py = innerHeight / 2;
    const paintPointer = () => {
      pointerFrame = 0;
      cursor.style.setProperty('--cursor-x', `${px}px`);
      cursor.style.setProperty('--cursor-y', `${py}px`);
      cursor.style.opacity = '1';
      const nx = (px / innerWidth - .5) * 2;
      const ny = (py / innerHeight - .5) * 2;
      if (heroGlowA) heroGlowA.style.transform = `translate3d(${nx * 16}px, ${ny * 12}px, 0)`;
      if (heroGlowB) heroGlowB.style.transform = `translate3d(${nx * -12}px, ${ny * -8}px, 0)`;
    };
    window.addEventListener('pointermove', (event) => {
      px = event.clientX;
      py = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    }, { passive: true });
    qsa('a, button, input, textarea, select').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* -------------------------------------------------------
     Home starfield — capped DPR and ~30fps
     ------------------------------------------------------- */
  const canvas = qs('#starfield');
  if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let stars = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let starFrame = 0;
    let lastPaint = 0;

    const buildStars = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.35);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor(clamp((width * height) / 15500, 42, 105));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * .85 + .2,
        a: Math.random() * .62 + .12,
        s: Math.random() * .0024 + .0008,
        p: Math.random() * Math.PI * 2
      }));
    };

    const paintStars = (time = 0) => {
      if (!reduceMotion && time - lastPaint < 32) {
        starFrame = requestAnimationFrame(paintStars);
        return;
      }
      lastPaint = time;
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const alpha = reduceMotion ? star.a : star.a * (.72 + Math.sin(time * star.s + star.p) * .28);
        ctx.beginPath();
        ctx.fillStyle = `rgba(216,228,255,${Math.max(.05, alpha)})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion && !doc.hidden) starFrame = requestAnimationFrame(paintStars);
    };

    buildStars();
    paintStars();
    window.addEventListener('resize', () => {
      window.clearTimeout(canvas._resizeTimer);
      canvas._resizeTimer = window.setTimeout(buildStars, 120);
    }, { passive: true });
    doc.addEventListener('visibilitychange', () => {
      if (!doc.hidden && !reduceMotion && !starFrame) starFrame = requestAnimationFrame(paintStars);
      if (doc.hidden && starFrame) {
        cancelAnimationFrame(starFrame);
        starFrame = 0;
      }
    });
  }

  /* -------------------------------------------------------
     Homepage service tabs
     ------------------------------------------------------- */
  const serviceContent = {
    brand: ['01 / 05', 'Identity that feels unmistakably yours.', 'Positioning, visual language, typography and scalable brand systems designed to stay coherent across every touchpoint.'],
    design: ['02 / 05', 'Interfaces that make the complex feel simple.', 'High-impact web design, product UI and content systems that give every screen hierarchy, rhythm and a clear next action.'],
    research: ['03 / 05', 'Decisions grounded in what users actually need.', 'Competitive reviews, customer patterns, content architecture and UX insights that remove assumptions before design begins.'],
    strategy: ['04 / 05', 'A digital roadmap built around momentum.', 'We connect positioning, narrative, conversion goals and product priorities so design choices support the business direction.'],
    dev: ['05 / 05', 'Development that preserves the design idea.', 'Responsive front-end builds, performant motion and interaction details engineered to feel polished without becoming fragile.']
  };
  const serviceRows = qsa('.service-row');
  const preview = qs('.service-preview');
  const setService = (key) => {
    const content = serviceContent[key];
    if (!content || !preview) return;
    serviceRows.forEach((row) => row.classList.toggle('is-active', row.dataset.service === key));
    const index = qs('.preview-index', preview);
    const title = qs('h3', preview);
    const text = qs('p', preview);
    if (index) index.textContent = content[0];
    if (title) title.textContent = content[1];
    if (text) text.textContent = content[2];
    if (!reduceMotion) {
      [title, text].forEach((el, i) => el?.animate(
        [{ opacity: .65, transform: 'translate3d(0,6px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
        { duration: 260, delay: i * 24, easing: 'ease-out' }
      ));
    }
  };
  serviceRows.forEach((row) => {
    const activate = () => setService(row.dataset.service);
    row.addEventListener('pointerenter', activate);
    row.addEventListener('focus', activate);
    row.addEventListener('click', activate);
  });
  if (serviceRows[0]) setService(serviceRows[0].dataset.service);

  /* -------------------------------------------------------
     Magnetic buttons — small translation only; 3D card tilt removed
     ------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    qsa('.magnetic').forEach((el) => {
      let magneticFrame = 0;
      let mx = 0;
      let my = 0;
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        mx = (event.clientX - rect.left - rect.width / 2) * .05;
        my = (event.clientY - rect.top - rect.height / 2) * .06;
        if (!magneticFrame) magneticFrame = requestAnimationFrame(() => {
          magneticFrame = 0;
          el.style.transform = `translate3d(${mx}px,${my}px,0)`;
        });
      });
      el.addEventListener('pointerleave', () => { el.style.transform = 'translate3d(0,0,0)'; });
    });
  }

  /* -------------------------------------------------------
     FAQ
     ------------------------------------------------------- */
  qsa('.faq-item').forEach((item) => {
    const button = qs('button', item);
    button?.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      qsa('.faq-item').forEach((other) => {
        other.classList.remove('is-open');
        qs('button', other)?.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* -------------------------------------------------------
     Project filters
     ------------------------------------------------------- */
  const filterButtons = qsa('[data-filter]');
  const projectCards = qsa('.project-grid-card[data-category]');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      projectCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-filtered-out', !show);
      });
    });
  });

  /* -------------------------------------------------------
     Resource search
     ------------------------------------------------------- */
  const resourceSearch = qs('#resource-search');
  const resourceCards = qsa('[data-resource-grid] .resource-card');
  resourceSearch?.addEventListener('input', () => {
    const term = resourceSearch.value.trim().toLowerCase();
    resourceCards.forEach((card) => {
      const haystack = `${card.dataset.tags || ''} ${card.textContent}`.toLowerCase();
      card.hidden = Boolean(term) && !haystack.includes(term);
    });
  });

  /* -------------------------------------------------------
     Counters
     ------------------------------------------------------- */
  const counters = qsa('[data-counter]');
  const runCounter = (el) => {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    const target = Number(el.dataset.counter || 0);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion || target === 0) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const start = performance.now();
    const duration = 720;
    const frame = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: .35 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else counters.forEach(runCounter);

  /* -------------------------------------------------------
     Contact form — validation only, no network/storage
     ------------------------------------------------------- */
  qsa('form#contact-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = qs('#form-status') || qs('#form-note');
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) status.textContent = 'Please complete the required fields. Nothing has been sent.';
        return;
      }
      if (status) status.textContent = 'Looks good. This prototype keeps your information in the browser and does not send or store it.';
    });
  });

  /* -------------------------------------------------------
     GSAP enhancement — deliberately small surface area
     ------------------------------------------------------- */
  const initGsap = () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    // Inner-page hero entrance starts exactly as the loader lifts away.
    const pageHero = qs('.page-hero');
    const playPageHero = () => {
      if (!pageHero || pageHero.dataset.heroPlayed === 'true') return;
      pageHero.dataset.heroPlayed = 'true';
      const heroItems = qsa('.page-hero-copy > *', pageHero);
      const orbit = qs('.page-orbit-stage', pageHero);
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, delay: .06 });
      tl.from(heroItems, { y: 18, opacity: .5, duration: .58, stagger: .055, clearProps: 'opacity,transform' });
      if (orbit) tl.from(orbit, { y: 10, scale: .96, opacity: .35, duration: .66, clearProps: 'opacity,transform' }, .04);
    };
    if (pageHero) {
      if (preloader?.isConnected) window.addEventListener('zonexdev:ready', playPageHero, { once: true });
      else playPageHero();
    }

    // Startup process graph is the main scroll-scrubbed storytelling moment.
    const processGraph = qs('[data-process-graph]');
    if (processGraph && desktopMotion) {
      const line = qs('.process-graph-line span', processGraph);
      if (line) gsap.to(line, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: processGraph, start: 'top 76%', end: 'bottom 50%', scrub: .45 }
      });
      qsa('.process-node', processGraph).forEach((node) => {
        const dot = qs('i', node);
        if (!dot) return;
        gsap.from(dot, {
          scale: .5,
          opacity: .35,
          duration: .42,
          ease: 'back.out(1.5)',
          scrollTrigger: { trigger: node, start: 'top 84%', once: true }
        });
      });
    } else if (processGraph) {
      qs('.process-graph-line span', processGraph)?.style.setProperty('transform', 'scaleX(1)');
    }

    // One restrained parallax surface on the featured case study only.
    qsa('.parallax-media').forEach((media) => {
      if (!desktopMotion) return;
      gsap.fromTo(media, { yPercent: -1.5 }, {
        yPercent: 2.5,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: .5 }
      });
    });
  };
  onReady(() => window.setTimeout(initGsap, 0));

  /* -------------------------------------------------------
     Escape key
     ------------------------------------------------------- */
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setMobileMenu(false);
    closeMega(true);
  });
})();
