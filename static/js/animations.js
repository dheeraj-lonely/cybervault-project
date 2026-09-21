/* ═══════════════════════════════════════════════════════════════
   CyberVault — Animation Engine
   ═══════════════════════════════════════════════════════════════
   Modules:
   01. Page entry overlay
   02. Scroll progress bar
   03. Noise canvas
   04. 3D tilt cards
   05. Magnetic buttons
   06. Ripple effect
   07. Spotlight hover
   08. Glitch text trigger
   09. Section observers (blur-in, zoom, flip, stagger)
   10. Evidence marker burst
   11. Radar widget
   12. Hero text scramble
   13. Shimmer on image placeholders
   14. Keyboard shortcut Easter egg
   15. Smooth section highlight on scroll
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────── */
  const qs  = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const rnd = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  /* ══════════════════════════════════════ 01. PAGE OVERLAY ══ */
  (function initPageOverlay() {
    const el = document.createElement('div');
    el.id = 'cv-page-overlay';
    document.body.insertBefore(el, document.body.firstChild);
    // Remove after animation completes
    el.addEventListener('animationend', () => el.remove(), { once: true });
  })();

  /* ══════════════════════════════════ 02. SCROLL PROGRESS ══ */
  (function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'cv-scroll-progress';
    document.body.insertBefore(bar, document.body.firstChild);
    window.addEventListener('scroll', () => {
      const total  = document.documentElement.scrollHeight - innerHeight;
      const pct    = total > 0 ? (scrollY / total) * 100 : 0;
      bar.style.width = clamp(pct, 0, 100) + '%';
    }, { passive: true });
  })();

  /* ══════════════════════════════════ 03. NOISE CANVAS ══ */
  (function initNoise() {
    const canvas = document.createElement('canvas');
    canvas.id = 'cv-noise-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resize() {
      canvas.width  = innerWidth;
      canvas.height = innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function drawNoise() {
      frame++;
      // Only redraw every 3 frames to reduce CPU
      if (frame % 3 !== 0) { requestAnimationFrame(drawNoise); return; }
      const w = canvas.width, h = canvas.height;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255 | 0;
        d[i] = d[i+1] = d[i+2] = v;
        d[i+3] = 18; // very low alpha
      }
      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(drawNoise);
    }
    requestAnimationFrame(drawNoise);
  })();

  /* ══════════════════════════════════ 04. 3D TILT CARDS ══ */
  (function initTilt() {
    const TILT_MAX = 10; // degrees

    function enableTilt(el) {
      el.classList.add('cv-tilt');

      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        const rotX = clamp(-dy * TILT_MAX, -TILT_MAX, TILT_MAX);
        const rotY = clamp( dx * TILT_MAX, -TILT_MAX, TILT_MAX);
        el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    }

    qsa('.feat-card, .about-card, .lab-preview-card, .hero-case-card, .game-preview-card').forEach(enableTilt);
  })();

  /* ══════════════════════════════════ 05. MAGNETIC BUTTONS ══ */
  (function initMagnetic() {
    const STRENGTH = 0.38;

    qsa('.cv-btn-primary, .cv-btn-play, .btn-case-file, .gpc-play-btn, .cv-btn-secondary').forEach(function (btn) {
      btn.classList.add('cv-magnetic');

      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * STRENGTH;
        const dy   = (e.clientY - cy) * STRENGTH;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
        setTimeout(() => { btn.style.transition = ''; }, 460);
      });
    });
  })();

  /* ══════════════════════════════════ 06. RIPPLE EFFECT ══ */
  (function initRipple() {
    function addRipple(e) {
      const btn  = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const x    = e.clientX - rect.left - size / 2;
      const y    = e.clientY - rect.top  - size / 2;
      const circle = document.createElement('span');
      circle.className = 'cv-ripple-circle';
      circle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove(), { once: true });
    }

    qsa('.cv-btn-primary, .cv-btn-play, .cv-btn-secondary, .cv-chat-toggle-btn, .cw-send, .aic-send-btn, .sub-btn, .cf-btn, .btn-enter-scene').forEach(function (btn) {
      btn.classList.add('cv-ripple-host');
      btn.addEventListener('click', addRipple);
    });
  })();

  /* ══════════════════════════════════ 07. SPOTLIGHT HOVER ══ */
  (function initSpotlight() {
    qsa('.feat-card, .about-card, .game-preview-card, .newsletter-card, .ai-inline-chat').forEach(function (el) {
      el.classList.add('cv-spotlight');
      const beam = document.createElement('div');
      beam.className = 'cv-spotlight-beam';
      el.appendChild(beam);

      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        beam.style.left = (e.clientX - rect.left) + 'px';
        beam.style.top  = (e.clientY - rect.top)  + 'px';
      });
    });
  })();

  /* ══════════════════════════════════ 08. GLITCH TEXT ══ */
  (function initGlitch() {
    // Add glitch class + data-text to hero title
    const heroTitle = qs('.hero-title');
    if (heroTitle) {
      heroTitle.classList.add('cv-glitch');
      heroTitle.setAttribute('data-text', heroTitle.textContent);

      // Trigger glitch randomly
      function scheduleGlitch() {
        setTimeout(function () {
          heroTitle.classList.add('glitching');
          setTimeout(() => heroTitle.classList.remove('glitching'), 450);
          scheduleGlitch();
        }, rnd(4000, 9000));
      }
      scheduleGlitch();
    }

    // Also glitch the brand name on hover
    const brand = qs('.cv-brand-name');
    if (brand) {
      brand.classList.add('cv-glitch');
      brand.setAttribute('data-text', brand.textContent);
      qs('.cv-brand')?.addEventListener('mouseenter', () => {
        brand.classList.add('glitching');
        setTimeout(() => brand.classList.remove('glitching'), 420);
      });
    }
  })();

  /* ══════════════════════════════════ 09. SECTION OBSERVERS ══ */
  (function initSectionAnims() {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el    = entry.target;
          const delay = (parseInt(el.dataset.delay) || 0);
          setTimeout(() => el.classList.add('visible'), delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    // Apply blur-in to section headings
    qsa('.section-heading, .section-label').forEach(function (el) {
      if (!el.classList.contains('anim-blur-in')) {
        el.classList.add('anim-blur-in');
        observer.observe(el);
      }
    });

    // Zoom-in to stat cards
    qsa('.about-card').forEach(function (el, i) {
      el.classList.add('anim-zoom');
      el.dataset.delay = i * 80;
      observer.observe(el);
    });

    // Flip-in to lab cards
    qsa('.lab-preview-card').forEach(function (el, i) {
      el.classList.add('anim-flip');
      el.dataset.delay = i * 90;
      observer.observe(el);
    });

    // Stagger feature cards
    const featGrid = qs('.features-grid');
    if (featGrid) {
      featGrid.classList.add('cv-stagger');
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          featGrid.classList.add('stagger-visible');
          this.disconnect();
        }
      }, { threshold: 0.1 }).observe(featGrid);
    }

    // Stagger workflow strip steps
    const wfInner = qs('.wf-inner');
    if (wfInner) {
      wfInner.classList.add('cv-stagger');
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          wfInner.classList.add('stagger-visible');
          this.disconnect();
        }
      }, { threshold: 0.3 }).observe(wfInner);
    }
  })();

  /* ════════════════════════ 10. EVIDENCE MARKER BURST ══ */
  (function initMarkerBurst() {
    qsa('.hero-ev-marker').forEach(function (marker) {
      marker.addEventListener('click', function (e) {
        const burst = document.createElement('div');
        burst.className = 'ev-burst';

        // Position at marker centre
        const rect = marker.getBoundingClientRect();
        burst.style.cssText = `
          position:fixed;
          left:${rect.left + rect.width/2}px;
          top:${rect.top  + rect.height/2}px;
          width:0;height:0;pointer-events:none;z-index:9000;
        `;
        document.body.appendChild(burst);

        // 8 particles in a circle
        for (let k = 0; k < 8; k++) {
          const s = document.createElement('span');
          s.style.setProperty('--angle', (k * 45) + 'deg');
          burst.appendChild(s);
        }
        burst.addEventListener('animationend', () => burst.remove(), { once: true });
      });
    });
  })();

  /* ══════════════════════════════════ 11. RADAR WIDGET ══ */
  (function initRadar() {
    // Inject a small radar into the hero right side if the fingerprint is present
    const fp = qs('.hero-fp-watermark');
    if (!fp) return;

    const radar = document.createElement('div');
    radar.className = 'cv-radar';
    radar.style.cssText = 'position:absolute;bottom:14%;right:3%;z-index:3;opacity:.55;';
    radar.innerHTML = `
      <div class="cv-radar-sweep"></div>
      <div class="cv-radar-dot" style="top:28%;left:62%"></div>
      <div class="cv-radar-dot" style="top:60%;left:35%;animation-delay:.8s"></div>
      <div class="cv-radar-dot" style="top:45%;left:72%;animation-delay:1.4s"></div>
    `;
    qs('.cv-hero')?.appendChild(radar);
  })();

  /* ══════════════════════════════════ 12. HERO TEXT SCRAMBLE ══ */
  (function initScramble() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

    function scramble(el, finalText, duration) {
      let frame = 0;
      const total = Math.ceil(duration / 40);
      const timer = setInterval(function () {
        frame++;
        const progress = frame / total;
        const revealed = Math.floor(progress * finalText.length);
        let display = '';
        for (let i = 0; i < finalText.length; i++) {
          if (finalText[i] === ' ' || finalText[i] === '\n' || finalText[i] === '<' || i < revealed) {
            display += finalText[i];
          } else {
            display += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        el.textContent = display;
        if (frame >= total) { el.textContent = finalText; clearInterval(timer); }
      }, 40);
    }

    // Scramble each hero kicker on page load
    const kicker = qs('.hero-kicker');
    if (kicker) {
      const orig = kicker.textContent.trim();
      kicker.textContent = orig.replace(/[A-Z]/g, '?');
      setTimeout(() => scramble(kicker, orig, 900), 400);
    }
  })();

  /* ════════════════════════════════ 13. SHIMMER PLACEHOLDERS ══ */
  (function initShimmer() {
    // Add shimmer to empty image/video placeholders while loading
    qsa('.media-placeholder, .thumb-inner, .gpc-floor').forEach(el => {
      if (!el.classList.contains('cv-shimmer')) el.classList.add('cv-shimmer');
    });

    // Remove shimmer once any actual background has loaded (simple timer)
    setTimeout(() => {
      qsa('.cv-shimmer').forEach(el => el.classList.remove('cv-shimmer'));
    }, 2200);
  })();

  /* ════════════════════════════════ 14. KEYBOARD EASTER EGG ══ */
  (function initEasterEgg() {
    const CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    document.addEventListener('keydown', function (e) {
      if (e.key === CODE[pos]) {
        pos++;
        if (pos === CODE.length) {
          pos = 0;
          activateKonamiMode();
        }
      } else { pos = 0; }
    });

    function activateKonamiMode() {
      // Temporarily neon-pulse all accent text
      qsa('.hero-title, .cv-brand-name').forEach(el => {
        el.classList.add('neon-blue', 'anim-repeat');
        setTimeout(() => el.classList.remove('neon-blue', 'anim-repeat'), 4000);
      });

      // Show a secret toast
      const toastWrap = qs('#cv-toasts');
      if (toastWrap) {
        const t = document.createElement('div');
        t.className = 'cv-toast';
        t.innerHTML = '🔍 CASE UNLOCKED: The truth is out there. Every detail matters.';
        toastWrap.appendChild(t);
        setTimeout(() => t.remove(), 4000);
      }

      // Shake the radar
      qsa('.cv-radar').forEach(r => r.classList.add('anim-shake'));
      setTimeout(() => qsa('.cv-radar').forEach(r => r.classList.remove('anim-shake')), 500);
    }
  })();

  /* ════════════════════════ 15. ACTIVE SECTION HIGHLIGHT ══ */
  (function initSectionHighlight() {
    const sections = qsa('section[id]');
    const navLinks = qsa('.cv-nav-link');

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(l => {
            const isMatch = l.getAttribute('href') === '#' + id;
            l.classList.toggle('active', isMatch);
            // Briefly pop the matching nav link
            if (isMatch) {
              l.classList.add('anim-pop');
              l.addEventListener('animationend', () => l.classList.remove('anim-pop'), { once: true });
            }
          });
        }
      });
    }, { threshold: 0.4, rootMargin: '-60px 0px -40% 0px' });

    sections.forEach(s => io.observe(s));
  })();

  /* ════════════════════════ BONUS: Interactive feat-card titles ══ */
  (function initFeatInteractive() {
    qsa('.feat-card').forEach(function (card) {
      const h3 = card.querySelector('h3');
      if (!h3) return;

      card.addEventListener('mouseenter', function () {
        h3.style.transition = 'color .3s, text-shadow .3s';
        h3.style.textShadow = '0 0 14px rgba(74,158,255,.7)';
      });
      card.addEventListener('mouseleave', function () {
        h3.style.textShadow = '';
      });
    });
  })();

  /* ════════════════════════ BONUS: Scroll-velocity parallax ══ */
  (function initVelocityParallax() {
    let lastY = 0, velocity = 0;
    window.addEventListener('scroll', function () {
      velocity = scrollY - lastY;
      lastY    = scrollY;

      // Slightly tilt the hero fp based on scroll speed
      const fp = qs('.hero-fp-watermark');
      if (fp) {
        const skew = clamp(velocity * 0.06, -4, 4);
        fp.style.transform = `translateY(-50%) skewX(${skew}deg)`;
      }
    }, { passive: true });
  })();

  /* ════════════════════════ BONUS: Terminal section for how-steps ══ */
  (function initHowStepTerminal() {
    qsa('.how-step h4').forEach(function (h4) {
      const orig = h4.textContent;
      h4.dataset.orig = orig;

      const parent = h4.closest('.how-step');
      parent?.addEventListener('mouseenter', function () {
        h4.classList.add('cv-terminal-cursor');
      });
      parent?.addEventListener('mouseleave', function () {
        h4.classList.remove('cv-terminal-cursor');
      });
    });
  })();

})();
