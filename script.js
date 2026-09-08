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
     Preloader — runs only on initial page entry
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
  onReady(() => window.setTimeout(releasePreloader, 1200));
  window.setTimeout(releasePreloader, 2600);

  /* -------------------------------------------------------
     Header + scroll progress
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

  /* -------------------------------------------------------
     Mobile menu
     ------------------------------------------------------- */
  const menuToggle = qs('.menu-toggle');
  const mobileMenu = qs('.mobile-menu');
  const setMobileMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.hidden = false;
      requestAnimationFrame(() => mobileMenu.classList.add('is-active'));
    } else {
      mobileMenu.classList.remove('is-active');
      setTimeout(() => {
        if (menuToggle.getAttribute('aria-expanded') !== 'true') {
          mobileMenu.hidden = true;
        }
      }, 300);
    }
    body.classList.toggle('menu-open', open);
  };
  menuToggle?.addEventListener('click', () => setMobileMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));

  /* -------------------------------------------------------
     Mobile nav submenus (tap label to navigate, tap the
     caret to expand/collapse — the two never overlap)
     ------------------------------------------------------- */
  qsa('.mobile-nav-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const item = toggle.closest('.mobile-nav-item');
      if (!item) return;
      const willOpen = !item.classList.contains('is-open');
      qsa('.mobile-nav-item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.mobile-nav-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* -------------------------------------------------------
     Desktop mega menu
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
     Cursor + hero light
     ------------------------------------------------------- */
  const cursor = qs('.cursor');
  if (cursor && finePointer && !reduceMotion) {
    let pointerFrame = 0;
    let px = innerWidth / 2;
    let py = innerHeight / 2;
    const paintPointer = () => {
      pointerFrame = 0;
      cursor.style.setProperty('--cursor-x', `${px}px`);
      cursor.style.setProperty('--cursor-y', `${py}px`);
      cursor.style.opacity = '1';
      const heroGlowA = qs('.hero-glow-a');
      const heroGlowB = qs('.hero-glow-b');
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
  }

  const bindCursorHovers = () => {
    if (!cursor || !finePointer || reduceMotion) return;
    qsa('a, button, input, textarea, select').forEach((el) => {
      if (el._cursorBound) return;
      el._cursorBound = true;
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  };

  /* -------------------------------------------------------
     Starfield Canvas lifecycle
     ------------------------------------------------------- */
  let activeStarCleanup = null;
  const initStarfield = () => {
    if (activeStarCleanup) {
      activeStarCleanup();
      activeStarCleanup = null;
    }
    const canvas = qs('#starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let stars = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let starFrame = 0;
    let lastPaint = 0;
    let resizeTimer = 0;

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

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildStars, 120);
    };

    const onVisibility = () => {
      if (!doc.hidden && !reduceMotion && !starFrame) starFrame = requestAnimationFrame(paintStars);
      if (doc.hidden && starFrame) {
        cancelAnimationFrame(starFrame);
        starFrame = 0;
      }
    };

    buildStars();
    paintStars();
    window.addEventListener('resize', onResize, { passive: true });
    doc.addEventListener('visibilitychange', onVisibility);

    activeStarCleanup = () => {
      if (starFrame) cancelAnimationFrame(starFrame);
      window.removeEventListener('resize', onResize);
      doc.removeEventListener('visibilitychange', onVisibility);
    };
  };

  /* -------------------------------------------------------
     Home hero text animation
     ------------------------------------------------------- */
  let activeHeroPlayed = false;
  const initHomeHero = () => {
    const splitElement = qs('.split-reveal');
    if (!splitElement) return;

    let homeWords = [];
    if (!splitElement.dataset.splitDone) {
      splitElement.dataset.splitDone = 'true';
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
    }
    homeWords = qsa('.word > span', splitElement);

    const playHomeHero = () => {
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

    if (preloader?.isConnected) {
      window.addEventListener('zonexdev:ready', playHomeHero, { once: true });
    } else {
      playHomeHero();
    }
  };

  /* -------------------------------------------------------
     Viewport reveals & soft inner reveals
     ------------------------------------------------------- */
  let activeRevealObserver = null;
  let activeSoftObserver = null;

  const initReveals = () => {
    if (activeRevealObserver) activeRevealObserver.disconnect();
    if (activeSoftObserver) activeSoftObserver.disconnect();

    const revealItems = qsa('.reveal-up').filter((item) => !item.closest('.hero'));
    if (!reduceMotion && revealItems.length && 'IntersectionObserver' in window) {
      body.classList.add('motion-ready');
      activeRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          activeRevealObserver.unobserve(entry.target);
        });
      }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
      revealItems.forEach((item) => activeRevealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const softRevealItems = qsa('.reveal-safe[data-reveal]').filter((item) => !item.closest('.page-hero'));
    if (!reduceMotion && softRevealItems.length && 'IntersectionObserver' in window) {
      body.classList.add('soft-reveal-ready');
      activeSoftObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          activeSoftObserver.unobserve(entry.target);
        });
      }, { threshold: .07, rootMargin: '0px 0px -3% 0px' });
      softRevealItems.forEach((item) => activeSoftObserver.observe(item));
    } else {
      softRevealItems.forEach((item) => item.classList.add('is-visible'));
    }
  };

  /* -------------------------------------------------------
     Homepage service tabs
     ------------------------------------------------------- */
  const serviceContent = {
    mobile: ['01 / 06', 'Mobile apps engineered for real users, not just demos.', 'Native and cross-platform apps built on solid architecture, clean UI and reliable performance across devices and OS versions.'],
    web: ['02 / 06', 'Web platforms built front-to-back, not just front-end.', 'Full-stack engineering across interface, application logic, APIs, databases and infrastructure for products that need to hold up under real usage.'],
    ai: ['03 / 06', 'Machine learning that ships inside real products.', 'Applied AI and ML engineering, from model selection and evaluation to deployment, monitoring and integration into production systems.'],
    data: ['04 / 06', 'Data that turns into decisions, not just dashboards.', 'Statistical modeling, forecasting, pipelines and reporting that give teams metrics they can actually act on.'],
    qa: ['05 / 06', 'Quality assurance that catches issues before users do.', 'Manual and automated testing, test strategy and release gates built to protect quality without slowing releases down.'],
    marketing: ['06 / 06', 'Growth and visibility tied to measurable outcomes.', 'Marketing, SEO and social strategy connected to the metrics that actually move the business forward.']
  };

  const initServiceTabs = () => {
    const serviceRows = qsa('.service-row');
    const preview = qs('.service-preview');
    if (!serviceRows.length || !preview) return;

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
  };

  /* -------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------- */
  const initMagnetic = () => {
    if (!finePointer || reduceMotion) return;
    qsa('.magnetic').forEach((el) => {
      if (el._magneticBound) return;
      el._magneticBound = true;
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
  };

  /* -------------------------------------------------------
     FAQ
     ------------------------------------------------------- */
  const initFAQ = () => {
    qsa('.faq-item').forEach((item) => {
      const button = qs('button', item);
      if (!button || button._faqBound) return;
      button._faqBound = true;
      button.addEventListener('click', () => {
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
  };

  /* -------------------------------------------------------
     Project filters
     ------------------------------------------------------- */
  const initProjectFilters = () => {
    const filterButtons = qsa('[data-filter]');
    const projectCards = qsa('.project-grid-card[data-category]');
    filterButtons.forEach((button) => {
      if (button._filterBound) return;
      button._filterBound = true;
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
        projectCards.forEach((card) => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('is-filtered-out', !show);
        });
      });
    });
  };

  /* -------------------------------------------------------
     Resource search
     ------------------------------------------------------- */
  const initResourceSearch = () => {
    const resourceSearch = qs('#resource-search');
    const resourceCards = qsa('[data-resource-grid] .resource-card');
    if (!resourceSearch || resourceSearch._searchBound) return;
    resourceSearch._searchBound = true;
    resourceSearch.addEventListener('input', () => {
      const term = resourceSearch.value.trim().toLowerCase();
      resourceCards.forEach((card) => {
        const haystack = `${card.dataset.tags || ''} ${card.textContent}`.toLowerCase();
        card.hidden = Boolean(term) && !haystack.includes(term);
      });
    });
  };

  /* -------------------------------------------------------
     Counters
     ------------------------------------------------------- */
  let activeCounterObserver = null;
  const initCounters = () => {
    if (activeCounterObserver) activeCounterObserver.disconnect();
    const counters = qsa('[data-counter]');
    if (!counters.length) return;

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

    if ('IntersectionObserver' in window) {
      activeCounterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          activeCounterObserver.unobserve(entry.target);
        });
      }, { threshold: .35 });
      counters.forEach((counter) => activeCounterObserver.observe(counter));
    } else {
      counters.forEach(runCounter);
    }
  };

  /* -------------------------------------------------------
     Contact form
     ------------------------------------------------------- */
  const initContactForms = () => {
    qsa('form#contact-form').forEach((form) => {
      if (form._contactBound) return;
      form._contactBound = true;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = qs('#form-status', form) || qs('#form-note', form) || qs('#form-status') || qs('#form-note');
        if (!form.checkValidity()) {
          form.reportValidity();
          if (status) status.textContent = 'Please complete the required fields. Nothing has been sent.';
          return;
        }
        if (status) status.textContent = 'Looks good. This prototype keeps your information in the browser and does not send or store it.';
      });
    });
  };

  /* -------------------------------------------------------
     GSAP enhancements
     ------------------------------------------------------- */
  const initGsap = () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    // Refresh triggers on page change
    ScrollTrigger.getAll().forEach((t) => t.kill());

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

    qsa('.parallax-media').forEach((media) => {
      if (!desktopMotion) return;
      gsap.fromTo(media, { yPercent: -1.5 }, {
        yPercent: 2.5,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: .5 }
      });
    });
  };

  /* -------------------------------------------------------
     Active navigation route highlighter
     ------------------------------------------------------- */
  const updateNavActiveState = (currentPath) => {
    const norm = (currentPath || '/').replace(/\/+$/, '') || '/';

    // Clear existing active flags
    qsa('.desktop-nav a, .desktop-nav .nav-trigger, .mobile-menu a').forEach((el) => {
      el.classList.remove('is-active');
    });

    if (norm === '/') {
      qs('.nav-home')?.classList.add('is-active');
      qs('.mobile-home')?.classList.add('is-active');
      return;
    }

    // Company group
    if (norm === '/company' || norm === '/about' || norm === '/team' || norm === '/careers') {
      qs('[data-mega="company"]')?.classList.add('is-active');
    }
    // Services group
    else if (norm.startsWith('/services')) {
      qs('[data-mega="services"]')?.classList.add('is-active');
    }
    // Work group
    else if (norm.startsWith('/projects') || norm === '/testimonials') {
      qs('[data-mega="work"]')?.classList.add('is-active');
    }
    // Resources group
    else if (norm.startsWith('/resources') || norm.startsWith('/blog') || norm === '/lab' || norm.startsWith('/industries')) {
      qs('[data-mega="resources"]')?.classList.add('is-active');
    }

    // Match exact links
    qsa(`.desktop-nav a[href="${norm}"], .mobile-menu a[href="${norm}"]`).forEach((el) => {
      el.classList.add('is-active');
    });
  };

  /* -------------------------------------------------------
     Master page initializers
     ------------------------------------------------------- */
  const initPageComponents = () => {
    bindCursorHovers();
    initStarfield();
    initHomeHero();
    initReveals();
    initServiceTabs();
    initMagnetic();
    initFAQ();
    initProjectFilters();
    initResourceSearch();
    initCounters();
    initContactForms();
    initGsap();
    updateNavActiveState(window.location.pathname);
  };

  /* -------------------------------------------------------
     Client-Side SPA Router via HTML5 History API
     ------------------------------------------------------- */
  const pageTransition = qs('.page-transition');
  let isNavigating = false;

  const navigateTo = async (rawUrl, { pushState = true, scrollToTop = true, hash = '' } = {}) => {
    if (isNavigating) return;
    isNavigating = true;

    try {
      const targetUrl = new URL(rawUrl, window.location.origin);
      const pathname = targetUrl.pathname;

      // Show transition curtain
      if (pageTransition && !reduceMotion) {
        pageTransition.classList.remove('is-leaving');
        pageTransition.classList.add('is-active');
        await new Promise((resolve) => window.setTimeout(resolve, 240));
      }

      // Close menus immediately
      setMobileMenu(false);
      closeMega(true);

      const response = await fetch(targetUrl.href, {
        headers: { 'X-Requested-With': 'ZonexDev-Router' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');

      // Update page title and meta
      doc.title = newDoc.title;
      const metaDesc = qs('meta[name="description"]', doc);
      const newMetaDesc = qs('meta[name="description"]', newDoc);
      if (metaDesc && newMetaDesc) metaDesc.setAttribute('content', newMetaDesc.getAttribute('content') || '');

      const canonical = qs('link[rel="canonical"]', doc);
      const newCanonical = qs('link[rel="canonical"]', newDoc);
      if (canonical && newCanonical) canonical.setAttribute('href', newCanonical.getAttribute('href') || pathname);

      // Update body dataset / classes
      body.dataset.page = newDoc.body.dataset.page || '';
      body.className = newDoc.body.className || '';

      // Replace main content
      const currentMain = qs('#main', doc);
      const newMain = qs('#main', newDoc);
      if (currentMain && newMain) {
        currentMain.innerHTML = newMain.innerHTML;
        currentMain.className = newMain.className;
        [...newMain.attributes].forEach((attr) => currentMain.setAttribute(attr.name, attr.value));
      }

      // Update URL in browser bar
      if (pushState) {
        window.history.pushState({ url: targetUrl.href }, '', targetUrl.href);
      }

      // Handle scrolling
      if (hash) {
        const targetEl = qs(hash);
        if (targetEl) targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else if (scrollToTop) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }

      renderScrollUI();

      // Re-initialize dynamic components on new DOM
      initPageComponents();

      // Lift transition curtain
      if (pageTransition && !reduceMotion) {
        pageTransition.classList.remove('is-active');
        pageTransition.classList.add('is-leaving');
        window.setTimeout(() => pageTransition.classList.remove('is-leaving'), 380);
      }

      window.dispatchEvent(new CustomEvent('zonexdev:pagechange', { detail: { url: targetUrl.href } }));
    } catch (err) {
      console.warn('Client-side router fallback to native navigation:', err);
      window.location.assign(rawUrl);
    } finally {
      isNavigating = false;
    }
  };

  // Intercept same-origin link clicks for client routing
  doc.addEventListener('click', (event) => {
    // Only left click without modifier keys
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    // In-page hash link on the same page
    if (href === '#top') {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (href.startsWith('#')) {
      const targetEl = qs(href);
      if (targetEl) {
        event.preventDefault();
        targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      return;
    }

    try {
      const targetUrl = new URL(link.href, window.location.origin);
      if (targetUrl.origin !== window.location.origin) return; // External link

      // Same route with hash on current page
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
        if (targetUrl.hash) {
          const targetEl = qs(targetUrl.hash);
          if (targetEl) {
            event.preventDefault();
            targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
            window.history.pushState(null, '', targetUrl.href);
            return;
          }
        }
      }

      event.preventDefault();
      navigateTo(targetUrl.href, { pushState: true, hash: targetUrl.hash });
    } catch {
      // Allow default browser navigation on invalid URLs
    }
  });

  // History popstate listener for back/forward buttons
  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, { pushState: false, scrollToTop: false, hash: window.location.hash });
  });

  /* -------------------------------------------------------
     Escape key listener
     ------------------------------------------------------- */
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setMobileMenu(false);
    closeMega(true);
  });

  // Initialize on first load
  onReady(initPageComponents);
})();
