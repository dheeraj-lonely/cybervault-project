/* CyberVault — Main JS */
(function () {
'use strict';

/* ── Custom cursor ─────────────────────────────────── */
var ring = document.getElementById('cv-cursor-ring');
var dot  = document.getElementById('cv-cursor-dot');
if (ring && dot && window.matchMedia('(pointer:fine)').matches) {
  var mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function loop() {
    rx += (mx - rx) * .14; ry += (my - ry) * .14;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
  var hover = document.querySelectorAll('a,button,.hero-ev-marker,.feat-card,.lab-preview-card,.about-card');
  hover.forEach(function(el) {
    el.addEventListener('mouseenter', function() { ring.style.width='46px'; ring.style.height='46px'; ring.style.borderColor='rgba(74,158,255,.7)'; });
    el.addEventListener('mouseleave', function() { ring.style.width='32px'; ring.style.height='32px'; ring.style.borderColor='rgba(74,158,255,.4)'; });
  });
}

/* ── Nav: scroll shrink + hamburger ───────────────── */
var nav    = document.getElementById('cv-nav');
var burger = document.getElementById('cv-hamburger');
var links  = document.getElementById('cv-nav-links');
if (nav) {
  var lastY = 0;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    lastY = window.scrollY;
  }, { passive: true });
}
if (burger && links) {
  burger.addEventListener('click', function() {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      burger.classList.remove('open');
      links.classList.remove('open');
    });
  });
}

/* ── Active nav link on scroll ─────────────────────── */
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.cv-nav-link[href^="#"]');
if (sections.length && navLinks.length) {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) {
        navLinks.forEach(function(a) { a.classList.remove('active'); });
        var match = document.querySelector('.cv-nav-link[href="#' + en.target.id + '"]');
        if (match) match.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function(s) { io.observe(s); });
}

/* ── Scroll reveals ─────────────────────────────────── */
var reveals = document.querySelectorAll('.reveal-left,.reveal-right,.reveal-up');
if ('IntersectionObserver' in window) {
  var revObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) {
        var delay = parseInt(en.target.dataset.delay || '0', 10);
        setTimeout(function() { en.target.classList.add('is-visible'); }, delay);
        revObs.unobserve(en.target);
      }
    });
  }, { threshold: .1, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(function(el) { revObs.observe(el); });
} else {
  reveals.forEach(function(el) { el.classList.add('is-visible'); });
}

/* ── Count-up ───────────────────────────────────────── */
var counters = document.querySelectorAll('.count-up');
if (counters.length) {
  var cntObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (!en.isIntersecting) return;
      var el     = en.target;
      var target = parseInt(el.dataset.target || '0', 10);
      var dur    = 1600;
      var start  = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      })(start);
      cntObs.unobserve(el);
    });
  }, { threshold: .5 });
  counters.forEach(function(el) { cntObs.observe(el); });
}

/* ── Hero particles ─────────────────────────────────── */
var pc = document.getElementById('hero-particles');
if (pc) {
  for (var i = 0; i < 28; i++) {
    var p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.cssText = 'left:' + Math.random()*100 + '%;animation-duration:' + (9+Math.random()*12) + 's;animation-delay:-' + (Math.random()*12) + 's;opacity:' + (.2+Math.random()*.4);
    pc.appendChild(p);
  }
}

/* ── Lab card bar fill on reveal ────────────────────── */
var bars = document.querySelectorAll('.lpc-fill');
if (bars.length) {
  var barObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) {
        en.target.style.width = en.target.dataset.width || '80%';
        barObs.unobserve(en.target);
      }
    });
  }, { threshold: .3 });
  bars.forEach(function(b) { barObs.observe(b); });
}

/* ── Game preview status ticker ─────────────────────── */
var statusEl = document.getElementById('gpc-status-text');
if (statusEl) {
  var statuses = ['SCENE READY — Click to begin', '● EVIDENCE LOADED', '● FORENSIC LAB ONLINE', '● AI ASSISTANT ACTIVE'];
  var si = 0;
  setInterval(function() { si = (si+1)%statuses.length; statusEl.textContent = statuses[si]; }, 2600);
}

/* ── Scroll top button ──────────────────────────────── */
var scrollBtn = document.getElementById('cv-scroll-top');
if (scrollBtn) {
  window.addEventListener('scroll', function() {
    scrollBtn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  scrollBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

/* ── ForensicAI Knowledge Base ──────────────────────── */
var KB = [
  { k: ['dna','genetic','pcr','touch'],          r: 'DNA analysis uses biological samples and STR profiling to compare genetic material and match it to a person or known sample. Even partial profiles from trace DNA can be highly informative.' },
  { k: ['fingerprint','latent','print','ridge'],  r: 'Fingerprint analysis compares ridge patterns and minutiae against known samples. Latent prints are developed using powder, cyanoacrylate fuming, or luminescent techniques.' },
  { k: ['chain','custody','tamper','evidence'],   r: 'The chain of custody documents every person who handled evidence, when, and under what conditions. Any gap can compromise admissibility in court.' },
  { k: ['blood','spatter','stain','splat'],        r: 'Blood spatter analysis examines drop size, distribution, and directionality to reconstruct the sequence of events and identify an origin point.' },
  { k: ['cctv','camera','footage','video','surveillance'], r: 'CCTV analysis involves frame-by-frame review, timestamp verification, and metadata extraction to build a verified timeline of events.' },
  { k: ['digital','computer','disk','malware'],   r: 'Digital forensics recovers and analyses data from electronic devices while maintaining a strict chain of custody. Disk images preserve evidence without altering originals.' },
  { k: ['toxicology','poison','drug','chemical'],  r: 'Toxicology screens biological fluids and tissues for drugs, poisons, and metabolites. Results can establish cause of death or impairment at time of incident.' },
  { k: ['ballistic','gun','firearm','bullet','shell'], r: 'Ballistics analysis matches fired projectiles and cartridges to specific weapons using striations from the barrel and breech face marks.' },
  { k: ['autopsy','postmortem','death','wound'],   r: 'An autopsy determines cause and manner of death through systematic examination of the body, including internal organs, injuries, and toxicological sampling.' },
  { k: ['entomol','insect','fly','larva'],         r: 'Forensic entomology uses the development stages of insects on remains to estimate time of death with surprising accuracy, especially in decomposed cases.' },
  { k: ['document','handwrit','ink','forgery'],   r: 'Document examination analyses handwriting, ink chemistry, paper fibres, and printing characteristics to detect forgery or establish authorship.' },
  { k: ['mobile','phone','iphone','android','sms'], r: 'Mobile forensics extracts call logs, messages, app data, and GPS history from devices using specialised tools, even from deleted partitions.' },
  { k: ['hello','hi','hey','help'],               r: 'Hello, Investigator! I\'m ForensicAI, trained on 18 forensic science disciplines. Ask me anything — DNA, fingerprints, CCTV, digital forensics, toxicology, and more.' },
];

function aiReply(q) {
  var ql = q.toLowerCase().trim();
  if (!ql) return 'Please type a question about forensic science and I\'ll do my best to help.';
  for (var i = 0; i < KB.length; i++) {
    if (KB[i].k.some(function(kw) { return ql.includes(kw); })) return KB[i].r;
  }
  return 'Forensic science is a broad field. I can help with DNA, fingerprints, chain of custody, blood spatter, CCTV, digital forensics, toxicology, ballistics, and more. Try asking about a specific topic.';
}

/* ── Floating AI chatbot ─────────────────────────────── */
var chatPanel  = document.getElementById('ai-chat-panel');
var toggleBtn  = document.getElementById('ai-chat-toggle');
var closeBtn   = document.getElementById('acp-close');
var chatInput  = document.getElementById('acp-chat-input');
var chatSend   = document.getElementById('acp-chat-send');
var chatMsgs   = document.getElementById('acp-messages');
var quickBtns  = document.querySelectorAll('.acp-quick-btn');

function appendMsg(text, isUser) {
  if (!chatMsgs) return;
  var wrap = document.createElement('div');
  wrap.className = 'acp-msg' + (isUser ? ' acp-user' : '');
  var av = document.createElement('div');
  av.className = 'acp-msg-av ' + (isUser ? 'acp-user-av' : 'acp-bot-av');
  av.textContent = isUser ? 'YOU' : 'AI';
  var body = document.createElement('div');
  body.className = 'acp-msg-text';
  body.textContent = text;
  if (isUser) { wrap.appendChild(body); wrap.appendChild(av); }
  else        { wrap.appendChild(av);   wrap.appendChild(body); }
  chatMsgs.appendChild(wrap);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function sendAI() {
  if (!chatInput) return;
  var q = chatInput.value.trim();
  if (!q) return;
  appendMsg(q, true);
  chatInput.value = '';
  setTimeout(function() { appendMsg(aiReply(q), false); }, 380);
}

if (toggleBtn && chatPanel) {
  toggleBtn.addEventListener('click', function() { chatPanel.classList.toggle('open'); });
}
if (closeBtn && chatPanel) {
  closeBtn.addEventListener('click', function() { chatPanel.classList.remove('open'); });
}
if (chatSend) chatSend.addEventListener('click', sendAI);
if (chatInput) chatInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendAI(); });
quickBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (chatInput) { chatInput.value = btn.textContent; sendAI(); }
  });
});

/* ── Inline AI chat (hero section) ──────────────────── */
var inlineInput = document.getElementById('aic-inline-input');
var inlineSend  = document.getElementById('aic-inline-send');
var inlineMsgs  = document.getElementById('aic-messages');
var inlineSugg  = document.getElementById('aic-inline-suggestions');

var SUGGESTIONS = [
  'How does DNA analysis work?',
  'What is chain of custody?',
  'Explain blood spatter analysis',
  'How are fingerprints collected?'
];

if (inlineSugg) {
  SUGGESTIONS.forEach(function(s) {
    var chip = document.createElement('div');
    chip.className = 'aic-suggestion-chip';
    chip.textContent = s;
    chip.addEventListener('click', function() {
      if (inlineInput) { inlineInput.value = s; sendInline(); }
    });
    inlineSugg.appendChild(chip);
  });
}

function appendInline(text, isUser) {
  if (!inlineMsgs) return;
  var msg = document.createElement('div');
  msg.className = 'aic-msg' + (isUser ? ' ai-user-msg' : '');
  var av = document.createElement('div');
  av.className = 'aic-msg-avatar';
  av.textContent = isUser ? 'YOU' : 'AI';
  if (msg.classList.contains('ai-user-msg')) av.style.cssText='background:var(--bg4);color:var(--txt2);border:1px solid var(--border)';
  else av.classList.add('ai-msg');
  var body = document.createElement('div');
  body.className = 'aic-msg-body';
  var p = document.createElement('p');
  p.textContent = text;
  body.appendChild(p);
  if (isUser) { msg.appendChild(body); msg.appendChild(av); }
  else        { msg.appendChild(av);   msg.appendChild(body); }
  inlineMsgs.appendChild(msg);
  inlineMsgs.scrollTop = inlineMsgs.scrollHeight;
}

function sendInline() {
  if (!inlineInput) return;
  var q = inlineInput.value.trim();
  if (!q) return;
  appendInline(q, true);
  inlineInput.value = '';
  setTimeout(function() { appendInline(aiReply(q), false); }, 380);
}

if (inlineSend) inlineSend.addEventListener('click', sendInline);
if (inlineInput) inlineInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendInline(); });

/* Open chat from nav / hero buttons */
['nav-chat-btn','hero-ai-btn','ai-section-open-btn','aic-expand-btn'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el && chatPanel) el.addEventListener('click', function() { chatPanel.classList.add('open'); });
});

/* ── Subscribe form ──────────────────────────────────── */
var subForm  = document.getElementById('sub-form');
var subEmail = document.getElementById('sub-email');
var subMsg   = document.getElementById('sub-msg');
if (subForm) {
  subForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = (subEmail && subEmail.value || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (subMsg) { subMsg.textContent = 'Please enter a valid email address.'; subMsg.style.color = 'var(--red)'; }
      return;
    }
    if (subMsg) { subMsg.textContent = '✓ Subscribed! You\'ll receive new case updates.'; subMsg.style.color = 'var(--green)'; }
    if (subEmail) subEmail.value = '';
  });
}

})();
