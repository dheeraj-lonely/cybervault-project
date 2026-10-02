/* ═══════════════════════════════════════════════════════════
   CyberVault — Main Site JS
   Custom cursor · Navbar · Hero · Particles · Count-up
   Scroll reveal · How-steps · Chatbox (floating + inline)
   Subscribe · Toast · Game preview
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ══════════════════════════ CURSOR ══ */
  const ring = document.getElementById('cv-cursor-ring');
  const dot  = document.getElementById('cv-cursor-dot');
  if (ring && dot) {
    let mx = -200, my = -200, rx = -200, ry = -200;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    (function animRing() {
      rx += (mx - rx) * 0.13; ry += (my - ry) * 0.13;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    })();
    document.addEventListener('mousedown', function () { document.body.classList.add('cur-c'); });
    document.addEventListener('mouseup',   function () { document.body.classList.remove('cur-c'); });
    function attachHover(els) {
      els.forEach(function (el) {
        el.addEventListener('mouseenter', function () { document.body.classList.add('cur-h'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cur-h'); });
      });
    }
    attachHover(document.querySelectorAll('a, button, .feat-card, .lab-preview-card, .about-card, .gs-item, .ai-topic-chip, .cw-sugg-chip, .aic-sugg-chip, .hero-ev-marker, .plat-item'));
  }

  /* ══════════════════════════ PARTICLES ══ */
  const particleContainer = document.getElementById('hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 32; i++) {
      const s = document.createElement('span');
      const sz = 0.8 + Math.random() * 2;
      s.style.cssText = [
        'left:'  + (Math.random() * 100) + '%',
        'bottom:'+ (Math.random() * 25)  + '%',
        'width:' + sz + 'px', 'height:' + sz + 'px',
        'animation-duration:' + (9 + Math.random() * 16) + 's',
        'animation-delay:' + (Math.random() * 16) + 's'
      ].join(';');
      particleContainer.appendChild(s);
    }
  }

  /* ══════════════════════════ EVIDENCE MARKERS ══ */
  document.querySelectorAll('.hero-ev-marker').forEach(function (m) {
    m.setAttribute('role', 'button');
    m.setAttribute('tabindex', '0');
    m.setAttribute('title', m.dataset.ev || 'Evidence marker');
    m.addEventListener('click', function () {
      showToast('🔍 ' + (m.dataset.ev || 'Evidence found'));
    });
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') showToast('🔍 ' + (m.dataset.ev || 'Evidence found'));
    });
  });

  /* ══════════════════════════ NAVBAR ══ */
  const nav = document.getElementById('cv-nav');
  const navLinks = document.querySelectorAll('.cv-nav-link');
  const sections = document.querySelectorAll('section[id], footer[id]');
  const hamburger = document.getElementById('cv-hamburger');
  const navMenu   = document.getElementById('cv-nav-links');

  window.addEventListener('scroll', function () {
    nav && nav.classList.toggle('scrolled', window.scrollY > 20);
    let cur = '';
    sections.forEach(function (sec) {
      if (window.scrollY >= sec.offsetTop - 90) cur = sec.id;
    });
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('href') === '#' + cur);
    });
  }, { passive: true });

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      const open = navMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
    });
    navMenu.querySelectorAll('.cv-nav-link').forEach(function (l) {
      l.addEventListener('click', function () {
        navMenu.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }

  /* ══════════════════════════ SMOOTH ANCHORS ══ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' }); }
    });
  });

  /* ══════════════════════════ SCROLL REVEAL ══ */
  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
        setTimeout(function () { el.classList.add('revealed'); }, delay);
        revealObs.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(function (el) {
    revealObs.observe(el);
  });

  /* ══════════════════════════ COUNT-UP ══ */
  const countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = parseInt(el.dataset.target) || 0;
      const dur = 1400, step = 16, steps = dur / step;
      const inc = target / steps;
      let cur = 0;
      const t = setInterval(function () {
        cur = Math.min(cur + inc, target);
        el.textContent = Math.round(cur);
        if (cur >= target) clearInterval(t);
      }, step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count-up').forEach(function (el) { countObs.observe(el); });

  /* ══════════════════════════ HOW-STEPS CONNECTOR ══ */
  const stepObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const idx = Array.from(document.querySelectorAll('.how-step')).indexOf(entry.target);
        setTimeout(function () { entry.target.classList.add('conn-lit'); }, idx * 140);
        stepObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.how-step').forEach(function (s) { stepObs.observe(s); });

  /* ══════════════════════════ TYPEWRITER — case card ══ */
  const twEl = document.getElementById('case-title-tw');
  if (twEl) {
    const txt = twEl.textContent.trim();
    twEl.innerHTML = '';
    let i = 0;
    const cur = document.createElement('span');
    cur.style.cssText = 'display:inline-block;width:2px;height:1em;background:#4a9eff;margin-left:2px;vertical-align:middle;animation:blink .8s step-end infinite';
    const style = document.createElement('style');
    style.textContent = '@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}';
    document.head.appendChild(style);
    twEl.appendChild(cur);
    function typeNext() {
      if (i < txt.length) {
        twEl.insertBefore(document.createTextNode(txt[i++]), cur);
        setTimeout(typeNext, 50 + Math.random() * 40);
      } else { cur.remove(); }
    }
    setTimeout(typeNext, 800);
  }

  /* ══════════════════════════ HERO PARALLAX ══ */
  const heroSection = document.querySelector('.cv-hero');
  const heroBg      = document.querySelector('.hero-layer-bg');
  const heroFp      = document.querySelector('.hero-fp-watermark');
  if (heroSection) {
    heroSection.addEventListener('mousemove', function (e) {
      const rect = heroSection.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width  - 0.5;
      const cy = (e.clientY - rect.top)  / rect.height - 0.5;
      if (heroBg) heroBg.style.transform = 'translate(' + (cx * -16) + 'px,' + (cy * -10) + 'px) scale(1.04)';
      if (heroFp) heroFp.style.transform = 'translateY(-50%) translate(' + (cx * 22) + 'px,' + (cy * 14) + 'px)';
    });
    heroSection.addEventListener('mouseleave', function () {
      if (heroBg) heroBg.style.transform = '';
      if (heroFp) heroFp.style.transform = 'translateY(-50%)';
    });
  }

  /* ══════════════════════════ GAME PREVIEW ANIMATION ══ */
  const statusTexts = [
    'SCENE READY — Click to begin',
    'Evidence marker 1 detected…',
    'Fingerprint trace at door handle',
    'CCTV timestamp: 20:51',
    'Blood sample — origin point marked',
    'Mobile device — last active 20:47',
    'Suspect profile loaded…',
    'DNA trace on latex glove',
  ];
  let si = 0;
  const statusEl = document.getElementById('gpc-status-text');
  if (statusEl) {
    setInterval(function () {
      si = (si + 1) % statusTexts.length;
      statusEl.style.opacity = '0';
      setTimeout(function () { statusEl.textContent = statusTexts[si]; statusEl.style.opacity = '1'; }, 300);
    }, 2800);
  }

  /* ══════════════════════════ SUBSCRIBE ══ */
  const subForm  = document.getElementById('sub-form');
  const subEmail = document.getElementById('sub-email');
  const subMsg   = document.getElementById('sub-msg');
  const subBtn   = subForm && subForm.querySelector('.sub-btn');
  if (subForm) {
    subForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = subEmail ? subEmail.value.trim() : '';
      if (!email || !email.includes('@')) { setSubMsg('Please enter a valid email.', 'err'); return; }
      if (subBtn) { subBtn.disabled = true; subBtn.textContent = '…'; }
      try {
        const r = await fetch('/api/subscribe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) });
        const d = await r.json();
        if (d.success) { setSubMsg(d.message, 'ok'); if (subEmail) subEmail.value = ''; if (subBtn) subBtn.textContent = '✓ DONE'; }
        else { setSubMsg(d.message, 'err'); if (subBtn) { subBtn.disabled = false; subBtn.textContent = 'SUBSCRIBE'; } }
      } catch (_) {
        setSubMsg("You're in. We'll keep you updated.", 'ok');
        if (subEmail) subEmail.value = ''; if (subBtn) subBtn.textContent = '✓ DONE';
      }
    });
  }
  function setSubMsg(t, cls) {
    if (!subMsg) return; subMsg.textContent = t; subMsg.className = 'sub-msg ' + cls;
  }

  /* ══════════════════════════ SCROLL TO TOP ══ */
  const scrollTop = document.getElementById('cv-scroll-top');
  if (scrollTop) scrollTop.addEventListener('click', function () { window.scrollTo({top:0,behavior:'smooth'}); });

  /* ══════════════════════════ TOAST ══ */
  function showToast(msg, type, dur) {
    const wrap = document.getElementById('cv-toasts'); if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'cv-toast' + (type === 'ok' ? ' ok' : type === 'err' ? ' err' : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.animation = 'toast-out .3s ease forwards';
      setTimeout(function () { el.remove(); }, 320);
    }, dur || 3000);
  }

  /* ══════════════════════════ CHAT MARKDOWN RENDERER ══ */
  function renderMarkdown(text) {
    // Convert **bold** and bullet lines
    const lines = text.split('\n');
    let html = '';
    lines.forEach(function (line) {
      if (!line.trim()) { html += '<br>'; return; }
      let l = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^•\s*(.*)/, '<span class="md-bullet">$1</span>')
        .replace(/^\*\s*(.*)/, '<span class="md-bullet">$1</span>');
      html += '<p>' + l + '</p>';
    });
    return html;
  }

  /* ══════════════════════════════════════════
     FLOATING CHATBOX
  ══════════════════════════════════════════ */
  const fab       = document.getElementById('cv-chat-fab');
  const fabBtn    = document.getElementById('chat-fab-btn');
  const cwMsgs    = document.getElementById('cw-messages');
  const cwInput   = document.getElementById('cw-input');
  const cwSend    = document.getElementById('cw-send');
  const cwTyping  = document.getElementById('cw-typing');
  const cwSuggEl  = document.getElementById('cw-sugg-chips');
  const cwClear   = document.getElementById('cw-clear');
  const cwMin     = document.getElementById('cw-minimize');
  const navChatBtn = document.getElementById('nav-chat-btn');
  const heroChatBtn = document.getElementById('hero-ai-btn');
  const aiBtnSection = document.getElementById('ai-section-open-btn');

  function openChat()  { fab && fab.classList.add('open'); document.getElementById('fab-badge') && (document.getElementById('fab-badge').style.display = 'none'); }
  function closeChat() { fab && fab.classList.remove('open'); }
  function toggleChat() { fab && fab.classList.toggle('open'); }

  fabBtn    && fabBtn.addEventListener('click', toggleChat);
  navChatBtn && navChatBtn.addEventListener('click', openChat);
  heroChatBtn && heroChatBtn.addEventListener('click', function () { openChat(); window.scrollTo({top:0,behavior:'smooth'}); });
  aiBtnSection && aiBtnSection.addEventListener('click', openChat);
  cwMin   && cwMin.addEventListener('click', closeChat);

  if (cwClear) {
    cwClear.addEventListener('click', function () {
      if (!cwMsgs) return;
      cwMsgs.innerHTML = '';
      appendMsg('ai', "Chat cleared. Ask me anything about forensic science!", true);
      loadSuggestions(cwSuggEl);
    });
  }

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (fab && fab.classList.contains('open') && !fab.contains(e.target)) closeChat();
  });

  function appendMsg(role, text, isHtml) {
    const wrap = document.createElement('div');
    wrap.className = 'cw-msg ' + (role === 'user' ? 'user-msg' : 'ai-msg');
    const avatar = document.createElement('div');
    avatar.className = 'cw-msg-avatar';
    avatar.textContent = role === 'user' ? 'YOU' : 'AI';
    const body = document.createElement('div');
    body.className = 'cw-msg-body';
    if (isHtml) body.innerHTML = renderMarkdown(text);
    else { const p = document.createElement('p'); p.textContent = text; body.appendChild(p); }
    const time = document.createElement('div');
    time.className = 'cw-msg-time';
    time.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    body.appendChild(time);
    wrap.appendChild(avatar); wrap.appendChild(body);
    if (cwMsgs) { cwMsgs.appendChild(wrap); cwMsgs.scrollTop = cwMsgs.scrollHeight; }
  }

  async function sendFloatChat(message) {
    if (!message.trim()) return;
    appendMsg('user', message, false);
    if (cwInput) cwInput.value = '';
    if (cwTyping) cwTyping.hidden = false;
    if (cwMsgs) cwMsgs.scrollTop = cwMsgs.scrollHeight;

    try {
      const res = await fetch('/api/forensics-chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({message})
      });
      const data = await res.json();
      if (cwTyping) cwTyping.hidden = true;
      appendMsg('ai', data.reply || 'I could not process that. Please try again.', true);
      if (cwSuggEl && data.suggestions) renderSuggChips(cwSuggEl, data.suggestions, sendFloatChat);
    } catch (_) {
      if (cwTyping) cwTyping.hidden = true;
      appendMsg('ai', 'Connection error. Please try again.', false);
    }
  }

  cwSend && cwSend.addEventListener('click', function () { cwInput && sendFloatChat(cwInput.value.trim()); });
  cwInput && cwInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFloatChat(cwInput.value.trim()); }
  });

  async function loadSuggestions(container) {
    try {
      const res = await fetch('/api/forensics-suggestions');
      const data = await res.json();
      renderSuggChips(container, data.suggestions || [], sendFloatChat);
    } catch (_) {
      renderSuggChips(container, ['How does DNA work?', 'What is chain of custody?', 'Explain fingerprint analysis', 'CCTV forensics'], sendFloatChat);
    }
  }

  function renderSuggChips(container, suggestions, handler) {
    if (!container) return;
    container.innerHTML = '';
    (suggestions || []).slice(0, 5).forEach(function (s) {
      const chip = document.createElement('button');
      chip.className = 'cw-sugg-chip';
      chip.textContent = s;
      chip.addEventListener('click', function () { handler(s); });
      container.appendChild(chip);
    });
    document.body.querySelectorAll('.cw-sugg-chip').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cur-h'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cur-h'); });
    });
  }

  // Initial suggestions
  loadSuggestions(cwSuggEl);

  /* ══════════════════════════════════════════
     INLINE CHAT (ai-section)
  ══════════════════════════════════════════ */
  const aicMsgs   = document.getElementById('aic-messages');
  const aicInput  = document.getElementById('aic-inline-input');
  const aicSend   = document.getElementById('aic-inline-send');
  const aicSugg   = document.getElementById('aic-inline-suggestions');
  const aicExpand = document.getElementById('aic-expand-btn');

  function appendAicMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'aic-msg ' + (role === 'user' ? 'user-msg' : 'ai-msg');
    const avatar = document.createElement('div');
    avatar.className = 'aic-msg-avatar';
    avatar.textContent = role === 'user' ? 'YOU' : 'AI';
    const body = document.createElement('div');
    body.className = 'aic-msg-body';
    body.innerHTML = renderMarkdown(text);
    wrap.appendChild(avatar); wrap.appendChild(body);
    if (aicMsgs) { aicMsgs.appendChild(wrap); aicMsgs.scrollTop = aicMsgs.scrollHeight; }
  }

  async function sendInlineChat(message) {
    if (!message.trim()) return;
    appendAicMsg('user', message);
    if (aicInput) aicInput.value = '';
    try {
      const res = await fetch('/api/forensics-chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message})
      });
      const data = await res.json();
      appendAicMsg('ai', data.reply || 'I could not process that.');
      if (aicSugg && data.suggestions) renderAicSuggChips(data.suggestions);
    } catch (_) {
      appendAicMsg('ai', 'Connection error. Please try again.');
    }
  }

  function renderAicSuggChips(suggestions) {
    if (!aicSugg) return;
    aicSugg.innerHTML = '';
    (suggestions || []).slice(0, 4).forEach(function (s) {
      const chip = document.createElement('button');
      chip.className = 'aic-sugg-chip';
      chip.textContent = s;
      chip.addEventListener('click', function () { sendInlineChat(s); });
      aicSugg.appendChild(chip);
    });
  }

  aicSend && aicSend.addEventListener('click', function () { aicInput && sendInlineChat(aicInput.value.trim()); });
  aicInput && aicInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendInlineChat(aicInput.value.trim()); }
  });
  aicExpand && aicExpand.addEventListener('click', function () { openChat(); });

  // Inline suggestions
  (async function () {
    try {
      const res = await fetch('/api/forensics-suggestions');
      const data = await res.json();
      renderAicSuggChips((data.suggestions || []).slice(0, 4));
    } catch (_) {
      renderAicSuggChips(['How does DNA work?', 'Explain fingerprint analysis', 'What is CCTV forensics?', 'Chain of custody explained']);
    }
  })();

  /* ══════════════════════════ FEAT CARD LINE ANIMATION ══ */
  const featObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const line = entry.target.querySelector('.feat-line');
        if (line) setTimeout(function () { line.style.width = '60%'; }, 300);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.feat-card').forEach(function (c) { featObs.observe(c); });

  /* ══════════════════════════ LAB CARD BAR FILL ══ */
  const labObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.lpc-fill');
        if (fill) {
          const target = fill.style.width;
          fill.style.width = '0';
          setTimeout(function () { fill.style.transition = 'width 1.2s cubic-bezier(.4,0,.2,1)'; fill.style.width = target; }, 200);
        }
        labObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.lab-preview-card').forEach(function (c) { labObs.observe(c); });

  /* ══════════════════════════ GS-ITEMS STAGGER ══ */
  const gsObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const items = entry.target.querySelectorAll('.gs-item');
        items.forEach(function (item, i) {
          item.style.opacity = '0';
          item.style.transform = 'translateX(-12px)';
          setTimeout(function () {
            item.style.transition = 'opacity .5s ease, transform .5s ease';
            item.style.opacity = '1'; item.style.transform = '';
          }, i * 100);
        });
        gsObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  const gsWrap = document.querySelector('.game-steps');
  if (gsWrap) gsObs.observe(gsWrap);

  /* ══════════════════════════ WORKFLOW STRIP HOVER ══ */
  document.querySelectorAll('.wf-step').forEach(function (step) {
    step.addEventListener('mouseenter', function () {
      step.querySelector('.wf-num') && (step.querySelector('.wf-num').style.color = 'var(--accent)');
      step.querySelectorAll('span:last-child').forEach(function (s) { s.style.color = 'var(--txt)'; });
    });
    step.addEventListener('mouseleave', function () {
      step.querySelector('.wf-num') && (step.querySelector('.wf-num').style.color = '');
      step.querySelectorAll('span:last-child').forEach(function (s) { s.style.color = ''; });
    });
  });

});

/* ═══════════════════════════════════════════════════════════
   CyberVault — Extended Interactions (connects to animations.js)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── About-card counter pop on hover ── */
  document.querySelectorAll('.about-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      card.classList.add('anim-pulse-border');
    });
    card.addEventListener('mouseleave', function () {
      card.classList.remove('anim-pulse-border');
    });
  });

  /* ── Feature card click → ripple + pop heading ── */
  document.querySelectorAll('.feat-card').forEach(function (card) {
    card.addEventListener('click', function () {
      const h3 = card.querySelector('h3');
      if (h3) {
        h3.classList.add('anim-pop');
        h3.addEventListener('animationend', function () {
          h3.classList.remove('anim-pop');
        }, { once: true });
      }
    });
  });

  /* ── Nav brand click → glitch trigger ── */
  var brandEl = document.querySelector('.cv-brand');
  var brandName = document.querySelector('.cv-brand-name');
  if (brandEl && brandName) {
    brandEl.addEventListener('click', function (e) {
      e.preventDefault();
      brandName.classList.add('glitching');
      setTimeout(function () { brandName.classList.remove('glitching'); }, 450);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Platform items: pop on click ── */
  document.querySelectorAll('.plat-item').forEach(function (item) {
    item.addEventListener('click', function () {
      item.classList.add('anim-pop');
      item.addEventListener('animationend', function () {
        item.classList.remove('anim-pop');
      }, { once: true });
    });
  });

  /* ── Social links: shake on hover ── */
  document.querySelectorAll('.social-link-item').forEach(function (link) {
    link.addEventListener('mouseenter', function () {
      var icon = link.querySelector('svg');
      if (icon) {
        icon.style.animation = 'cv-float .6s ease';
        icon.addEventListener('animationend', function () {
          icon.style.animation = '';
        }, { once: true });
      }
    });
  });

  /* ── Subscribe button: shake on invalid ── */
  var subForm2 = document.getElementById('sub-form');
  if (subForm2) {
    subForm2.addEventListener('invalid', function (e) {
      e.preventDefault();
      var btn = subForm2.querySelector('.sub-btn');
      if (btn) {
        btn.classList.add('anim-shake');
        btn.addEventListener('animationend', function () {
          btn.classList.remove('anim-shake');
        }, { once: true });
      }
    }, true);
  }

  /* ── Game preview card: ping on hover ── */
  var previewCard = document.querySelector('.game-preview-card');
  if (previewCard) {
    var dot = previewCard.querySelector('.gpc-dot');
    previewCard.addEventListener('mouseenter', function () {
      if (dot) dot.classList.add('anim-ping');
    });
    previewCard.addEventListener('mouseleave', function () {
      if (dot) dot.classList.remove('anim-ping');
    });
  }

  /* ── AI topic chips: quick float on click ── */
  document.querySelectorAll('.ai-topic-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.style.animation = 'cv-pop .35s ease';
      chip.addEventListener('animationend', function () {
        chip.style.animation = '';
      }, { once: true });

      // Also open the chat and send the topic
      var chatFab = document.getElementById('cv-chat-fab');
      if (chatFab) chatFab.classList.add('open');
      var input = document.getElementById('cw-input');
      if (input) {
        input.value = chip.textContent.replace(/^[^\s]+\s/, ''); // strip emoji
        input.focus();
      }
    });
  });

  /* ── Scroll-to-top: spin icon on click ── */
  var scrollTopBtn = document.getElementById('cv-scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      var svg = scrollTopBtn.querySelector('svg');
      if (svg) {
        svg.style.animation = 'cv-spin .5s linear';
        svg.addEventListener('animationend', function () { svg.style.animation = ''; }, { once: true });
      }
    });
  }

  /* ── Chat FAB: pulse-border when closed ── */
  var fab = document.getElementById('cv-chat-fab');
  var fabBtn = document.getElementById('chat-fab-btn');
  if (fab && fabBtn) {
    // Pulse the FAB after 8 seconds if chat has not been opened
    setTimeout(function () {
      if (!fab.classList.contains('open')) {
        fabBtn.classList.add('anim-pulse-border');
        setTimeout(function () { fabBtn.classList.remove('anim-pulse-border'); }, 3000);
      }
    }, 8000);
  }

  /* ── How-step circles: glow on scroll into view ── */
  var stepCircles = document.querySelectorAll('.hs-circle');
  var glowObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.boxShadow = '0 0 28px rgba(74,158,255,.55)';
        entry.target.style.transition = 'box-shadow .6s ease';
      }
    });
  }, { threshold: 0.6 });
  stepCircles.forEach(function (c) { glowObs.observe(c); });

  /* ── Section labels: terminal cursor on enter ── */
  document.querySelectorAll('.section-label').forEach(function (label) {
    label.addEventListener('mouseenter', function () {
      label.classList.add('cv-terminal-cursor');
    });
    label.addEventListener('mouseleave', function () {
      label.classList.remove('cv-terminal-cursor');
    });
  });

  /* ── Lab bar fills: re-animate on card click ── */
  document.querySelectorAll('.lab-preview-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var fill = card.querySelector('.lpc-fill');
      if (!fill) return;
      var target = fill.style.width || fill.getAttribute('data-width') || '80%';
      fill.setAttribute('data-width', target);
      fill.style.transition = 'none';
      fill.style.width = '0';
      requestAnimationFrame(function () {
        fill.style.transition = 'width 1.2s cubic-bezier(.4,0,.2,1)';
        fill.style.width = target;
      });
    });
  });

});
