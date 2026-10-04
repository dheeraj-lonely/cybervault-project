/* ═══════════════════════════════════════════════════════════════
   CyberVault — Animations JS
   Scroll reveals, count-up, cursor, particles, nav, chat toggle
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Custom cursor ─────────────────────────────────────────── */
  const ring = document.getElementById('cv-cursor-ring');
  const dot  = document.getElementById('cv-cursor-dot');
  if (ring && dot) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    (function follow() {
      rx += (mx - rx) * .15; ry += (my - ry) * .15;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a,button,.hero-ev-marker,.feat-card,.lab-preview-card').forEach(el => {
      el.addEventListener('mouseenter', () => { ring.style.width = '48px'; ring.style.height = '48px'; ring.style.borderColor = 'rgba(74,158,255,.7)'; });
      el.addEventListener('mouseleave', () => { ring.style.width = '32px'; ring.style.height = '32px'; ring.style.borderColor = 'rgba(74,158,255,.4)'; });
    });
  }

  /* ── 2. Scroll reveal (IntersectionObserver) ──────────────────── */
  const revealEls = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── 3. Count-up animation ───────────────────────────────────── */
  const counters = document.querySelectorAll('.count-up');
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target || '0', 10);
      const dur = 1600; const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      })(start);
      countObs.unobserve(el);
    });
  }, { threshold: .5 });
  counters.forEach(el => countObs.observe(el));

  /* ── 4. Hero particles ───────────────────────────────────────── */
  const particleContainer = document.getElementById('hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = -Math.random() * 12 + 's';
      p.style.opacity = .2 + Math.random() * .4;
      particleContainer.appendChild(p);
    }
  }

  /* ── 5. Hero evidence markers tooltip ─────────────────────────── */
  document.querySelectorAll('.hero-ev-marker').forEach(marker => {
    marker.addEventListener('mouseenter', () => {
      const ev = marker.dataset.ev || '';
      const num = marker.dataset.num || '';
      marker.setAttribute('title', `Evidence #${num}: ${ev}`);
    });
  });

  /* ── 6. Nav scroll shrink ─────────────────────────────────────── */
  const nav = document.getElementById('cv-nav');
  if (nav) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
    });
  }

  /* ── 7. Hamburger menu ────────────────────────────────────────── */
  const burger = document.getElementById('cv-hamburger');
  const navLinks = document.getElementById('cv-nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open'); navLinks.classList.remove('open');
    }));
  }

  /* ── 8. Scroll-to-top button ──────────────────────────────────── */
  const scrollBtn = document.getElementById('cv-scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 500);
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── 9. AI chat toggle (hero + nav) ────────────────────────────── */
  const heroAiBtn = document.getElementById('hero-ai-btn');
  const navChatBtn = document.getElementById('nav-chat-btn');
  const aiSectionBtn = document.getElementById('ai-section-open-btn');
  const aicExpand = document.getElementById('aic-expand-btn');
  const inlineChat = document.getElementById('ai-inline-chat');

  function openChat() {
    if (inlineChat) inlineChat.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (heroAiBtn) heroAiBtn.addEventListener('click', openChat);
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
  if (aiSectionBtn) aiSectionBtn.addEventListener('click', openChat);

  /* ── 10. Inline AI chat (basic) ────────────────────────────────── */
  const aicInput = document.getElementById('aic-inline-input');
  const aicSend  = document.getElementById('aic-inline-send');
  const aicMsgs  = document.getElementById('aic-messages');
  const aicSugg  = document.getElementById('aic-inline-suggestions');

  const SUGGESTIONS = [
    'How does DNA analysis work?',
    'What is the chain of custody?',
    'How are fingerprints collected?',
    'Explain blood spatter analysis',
  ];

  if (aicSugg) {
    SUGGESTIONS.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'aic-suggestion-chip';
      chip.textContent = s;
      chip.addEventListener('click', () => { if (aicInput) aicInput.value = s; sendMsg(); });
      aicSugg.appendChild(chip);
    });
  }

  function sendMsg() {
    if (!aicInput || !aicMsgs) return;
    const text = aicInput.value.trim();
    if (!text) return;
    const userDiv = document.createElement('div');
    userDiv.className = 'aic-msg ai-user-msg';
    userDiv.innerHTML = `<div class="aic-msg-body"><p>${text}</p></div>`;
    aicMsgs.appendChild(userDiv);
    aicInput.value = '';
    aicMsgs.scrollTop = aicMsgs.scrollHeight;
    // Simple response
    setTimeout(() => {
      const botDiv = document.createElement('div');
      botDiv.className = 'aic-msg ai-msg';
      botDiv.innerHTML = `<div class="aic-msg-avatar">AI</div><div class="aic-msg-body"><p>${simpleReply(text)}</p></div>`;
      aicMsgs.appendChild(botDiv);
      aicMsgs.scrollTop = aicMsgs.scrollHeight;
    }, 500);
  }

  function simpleReply(q) {
    q = q.toLowerCase();
    if (q.includes('dna')) return 'DNA analysis uses biological samples and STR profiling to compare genetic material and match it to a known sample.';
    if (q.includes('chain of custody')) return 'The chain of custody documents who handled the evidence, when, and under what conditions. A break in that chain can damage evidence credibility.';
    if (q.includes('fingerprint')) return 'Fingerprint analysis compares ridge patterns and minutiae to identify whether a print matches a known source.';
    if (q.includes('blood')) return 'Blood spatter analysis examines the size, shape, and distribution of bloodstains to reconstruct the events that caused them.';
    if (q.includes('hello') || q.includes('hi')) return 'Hello, Investigator. I can help with DNA, fingerprints, crime scenes, digital forensics, and more.';
    return 'I can help with evidence handling, digital forensics, DNA, fingerprints, CCTV, and timeline reconstruction. Try asking about a specific forensic topic.';
  }

  if (aicSend) aicSend.addEventListener('click', sendMsg);
  if (aicInput) aicInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  /* ── 11. Subscribe form ────────────────────────────────────────── */
  const subForm = document.getElementById('sub-form');
  const subEmail = document.getElementById('sub-email');
  const subMsg = document.getElementById('sub-msg');
  if (subForm) {
    subForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = (subEmail && subEmail.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (subMsg) { subMsg.textContent = 'Please enter a valid email address.'; subMsg.style.color = '#ff2a5f'; }
        return;
      }
      if (subMsg) { subMsg.textContent = '✓ Subscribed! You will receive new case updates.'; subMsg.style.color = '#00ff88'; }
      if (subEmail) subEmail.value = '';
    });
  }

  /* ── 12. Game preview status text ─────────────────────────────── */
  const gpcStatus = document.getElementById('gpc-status-text');
  if (gpcStatus) {
    const statuses = ['SCENE READY — Click to begin', '● EVIDENCE LOADED', '● FORENSIC LAB ONLINE', '● AI ASSISTANT ACTIVE'];
    let si = 0;
    setInterval(() => { si = (si + 1) % statuses.length; if (gpcStatus) gpcStatus.textContent = statuses[si]; }, 2500);
  }

})();
