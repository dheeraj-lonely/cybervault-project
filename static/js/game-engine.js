/* ══════════════════════════════════════════════════════════════
   Evidence: Line of Truth — Game Engine
   State machine · Scene · Mini-games · Board · Deduction
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════ STATE ══ */
  const State = {
    caseData:     null,
    inventory:    [],       // evidence ids collected
    analyzed:     {},       // evidenceId -> result object
    boardConns:   [],       // [{from, to}]
    examineCount: 0,
    score:        0,
    currentScreen: 'menu',
    timelineOrder: [],      // user's ordered timeline events
    markedEvents:  [],      // cctv marked event ids
  };

  /* ══════════════════════════════════ CUSTOM CURSOR ══ */
  const ring = document.getElementById('g-cursor-ring');
  const dot  = document.getElementById('g-cursor-dot');
  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function animCursor() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animCursor);
  })();
  document.addEventListener('mousedown', function () { document.body.classList.add('cur-click'); });
  document.addEventListener('mouseup',   function () { document.body.classList.remove('cur-click'); });
  function attachHoverCursor(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cur-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cur-hover'); });
    });
  }

  /* ══════════════════════════════════ SCREEN ROUTER ══ */
  function goTo(name) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    const next = document.getElementById('screen-' + name);
    if (next) {
      next.classList.add('active');
      State.currentScreen = name;
    }
    const hud = document.getElementById('hud-bar');
    if (name === 'menu' || name === 'briefing') {
      hud.hidden = true;
    } else {
      hud.hidden = false;
    }
    // Active nav
    document.querySelectorAll('.hud-btn').forEach(function (b) {
      b.classList.toggle('active-nav', b.dataset.screen === name);
    });
    // Refresh screens when visited
    if (name === 'inventory') renderInventory();
    if (name === 'lab')       renderLab();
    if (name === 'board')     renderBoard();
    if (name === 'deduction') renderDeduction();
  }

  /* ══════════════════════════════════ TOAST ══ */
  function toast(msg, type, dur) {
    dur = dur || 2800;
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.innerHTML = (type === 'success' ? '&#9670; ' : type === 'error' ? '&#9888; ' : '&#9670; ') + msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.animation = 'toast-out .35s ease forwards';
      setTimeout(function () { el.remove(); }, 360);
    }, dur);
  }

  /* ══════════════════════════════════ SCORE ══ */
  function addScore(pts) {
    State.score += pts;
    document.getElementById('hud-score').textContent = State.score;
  }

  /* ══════════════════════════════════ INIT ══ */
  async function init() {
    // Attach static UI events
    attachMenuEvents();
    attachHudEvents();

    // Load case data
    try {
      const res = await fetch('/api/case/047');
      State.caseData = await res.json();
    } catch (e) {
      toast('Could not load case data — using fallback.', 'error');
      State.caseData = getFallbackCase();
    }
    // Start on menu
    goTo('menu');
    attachHoverCursor('a, button, .scene-obj, .board-node, .dq-option, .fp-suspect-row, .tl-event-card, .dna-base');
  }

  /* ══════════════════════════════════ MENU EVENTS ══ */
  function attachMenuEvents() {
    document.getElementById('btn-start-case').addEventListener('click', startCase);
    document.getElementById('btn-case-files').addEventListener('click', function () {
      togglePanel('panel-case-files');
    });
    document.getElementById('btn-how-to-play').addEventListener('click', function () {
      togglePanel('panel-how');
    });
    document.getElementById('cf-start-btn').addEventListener('click', startCase);

    document.querySelectorAll('.panel-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.close;
        if (id) document.getElementById(id).hidden = true;
      });
    });
  }

  function togglePanel(id) {
    const p = document.getElementById(id);
    if (p) p.hidden = !p.hidden;
  }

  function startCase() {
    // Close any open panels
    document.querySelectorAll('.side-panel').forEach(function (p) { p.hidden = true; });
    renderBriefing();
    goTo('briefing');
  }

  /* ══════════════════════════════════ HUD EVENTS ══ */
  function attachHudEvents() {
    document.querySelectorAll('.hud-btn[data-screen]').forEach(function (btn) {
      btn.addEventListener('click', function () { goTo(btn.dataset.screen); });
    });
    document.querySelectorAll('[data-screen]').forEach(function (el) {
      if (!el.classList.contains('hud-btn')) {
        el.addEventListener('click', function () { goTo(el.dataset.screen); });
      }
    });
    document.getElementById('hud-menu-btn').addEventListener('click', function () { goTo('menu'); });
    document.getElementById('btn-play-again').addEventListener('click', resetGame);
  }

  /* ══════════════════════════════════ BRIEFING ══ */
  function renderBriefing() {
    const cd = State.caseData;
    // Typewriter body
    const bodyEl = document.getElementById('briefing-body');
    bodyEl.textContent = '';
    let i = 0;
    const text = cd.briefing;
    function typeChar() {
      if (i < text.length) {
        bodyEl.textContent += text[i++];
        setTimeout(typeChar, 16);
      }
    }
    setTimeout(typeChar, 300);

    // Suspects
    const suspEl = document.getElementById('briefing-suspects');
    suspEl.innerHTML = '';
    (cd.suspects || []).forEach(function (s) {
      const card = document.createElement('div');
      card.className = 'suspect-card';
      card.innerHTML = '<div class="sc-id">' + s.id + '</div><div class="sc-name">' + s.name + '</div><div class="sc-profile">' + s.profile + '</div>';
      suspEl.appendChild(card);
    });

    document.getElementById('btn-enter-scene').addEventListener('click', function () {
      goTo('scene');
      renderScene();
    }, { once: true });
  }

  /* ══════════════════════════════════ SCENE ══ */
  function renderScene() {
    const container = document.getElementById('scene-objects');
    container.innerHTML = '';
    const cd = State.caseData;
    const objects = cd.scene_objects || [];
    const total = objects.filter(function (o) { return o.interactions && o.interactions.length > 0; }).length;
    updateProgress(0, total);

    objects.forEach(function (obj, idx) {
      // Evidence number markers (for ①③ etc.)
      if (obj.icon && (obj.icon === '①' || obj.icon === '③')) {
        const marker = document.createElement('div');
        marker.className = 'ev-num-marker';
        marker.style.left = obj.x + '%';
        marker.style.top  = obj.y + '%';
        marker.textContent = idx < 4 ? (idx + 1) : obj.icon;
        container.appendChild(marker);
        return;
      }

      const el = document.createElement('div');
      el.className = 'scene-obj';
      el.style.left = obj.x + '%';
      el.style.top  = obj.y + '%';
      el.dataset.id = obj.id;

      const iconEl = document.createElement('div');
      iconEl.className = 'obj-marker';
      iconEl.textContent = obj.icon;

      const labelEl = document.createElement('div');
      labelEl.className = 'obj-label';
      labelEl.textContent = obj.label;

      el.appendChild(iconEl);
      el.appendChild(labelEl);

      if (State.inventory.includes(obj.evidence_id)) {
        el.classList.add('collected');
      }

      el.addEventListener('click', function () { examineObject(obj, el); });
      container.appendChild(el);
    });

    document.getElementById('btn-go-lab').addEventListener('click', function () { goTo('lab'); }, { once: true });
    document.getElementById('scene-hint').textContent = 'Click highlighted objects to examine them.';
    hideExamineBox();
  }

  function examineObject(obj, el) {
    State.examineCount = (State.examineCount || 0);
    const examineBox = document.getElementById('examine-box');
    examineBox.hidden = false;
    document.getElementById('examine-icon').textContent   = obj.icon;
    document.getElementById('examine-label').textContent  = obj.label;
    document.getElementById('examine-text').textContent   = obj.examine_text;
    document.getElementById('scene-hint').textContent     = 'Examining: ' + obj.label;

    if (!el.classList.contains('examined')) {
      el.classList.add('examined');
      State.examineCount++;
      addScore(5);
      const total = (State.caseData.scene_objects || []).filter(function (o) { return o.interactions && o.interactions.length > 0; }).length;
      updateProgress(State.examineCount, total);
    }

    // Build action buttons
    const actionsEl = document.getElementById('examine-actions');
    actionsEl.innerHTML = '';
    (obj.interactions || []).forEach(function (action) {
      const btn = document.createElement('button');
      btn.className = 'ex-btn';
      if (action === 'COLLECT') btn.classList.add('collect-btn');
      btn.textContent = action;
      if (action === 'COLLECT') {
        if (!obj.evidence_id) {
          btn.disabled = true;
          btn.title = 'No collectable evidence here';
        } else if (State.inventory.includes(obj.evidence_id)) {
          btn.disabled = true;
          btn.textContent = 'COLLECTED ✓';
        }
      }
      btn.addEventListener('click', function () {
        handleAction(action, obj, btn, el);
      });
      actionsEl.appendChild(btn);
    });

    attachHoverCursor('.ex-btn');
  }

  function handleAction(action, obj, btn, el) {
    if (action === 'EXAMINE') {
      toast('Examined: ' + obj.label);
    } else if (action === 'PHOTOGRAPH') {
      triggerPhotoFlash();
      toast('Photographed: ' + obj.label, 'success');
      addScore(3);
    } else if (action === 'COLLECT') {
      if (!obj.evidence_id) { toast('Nothing collectable here.'); return; }
      if (State.inventory.includes(obj.evidence_id)) { toast('Already collected.'); return; }
      collectEvidence(obj.evidence_id, obj, el);
      btn.disabled = true;
      btn.textContent = 'COLLECTED ✓';
    } else if (action === 'ANALYZE') {
      collectEvidence(obj.evidence_id, obj, el);
      toast('Evidence logged for lab analysis.', 'success');
    }
  }

  function collectEvidence(evidenceId, obj, el) {
    if (!evidenceId) return;
    if (State.inventory.includes(evidenceId)) return;
    State.inventory.push(evidenceId);
    el && el.classList.add('collected');
    updateEvCount();
    addScore(10);
    toast('Evidence collected: ' + (obj ? obj.label : evidenceId), 'success');
  }

  function triggerPhotoFlash() {
    const f = document.getElementById('photo-flash');
    f.hidden = false;
    f.style.animation = 'none';
    void f.offsetWidth;
    f.style.animation = 'flash-anim .35s ease forwards';
    setTimeout(function () { f.hidden = true; }, 360);
  }

  function updateProgress(done, total) {
    const bar   = document.getElementById('sp-bar');
    const count = document.getElementById('sp-count');
    if (!bar) return;
    const pct = total > 0 ? (done / total) * 100 : 0;
    bar.style.width = pct + '%';
    if (count) count.textContent = done + ' / ' + total;
  }

  function updateEvCount() {
    document.getElementById('ev-count').textContent = State.inventory.length;
  }

  function hideExamineBox() {
    document.getElementById('examine-box').hidden = true;
  }

  /* ══════════════════════════════════ INVENTORY ══ */
  function renderInventory() {
    const grid  = document.getElementById('inventory-grid');
    const empty = document.getElementById('inv-empty');
    const defs  = State.caseData.evidence_definitions || {};
    const items = State.inventory.map(function (id) { return defs[id]; }).filter(Boolean);

    if (items.length === 0) {
      empty.hidden = false;
      grid.innerHTML = '';
      grid.appendChild(empty);
      return;
    }
    empty.hidden = true;
    grid.innerHTML = '';
    items.forEach(function (ev) {
      const card = document.createElement('div');
      card.className = 'inv-card' + (State.analyzed[ev.id] ? ' analyzed' : '');
      card.innerHTML =
        '<div class="inv-icon">' + ev.icon + '</div>' +
        '<div class="inv-name">' + ev.name + '</div>' +
        '<div class="inv-loc">' + ev.location + '</div>' +
        '<div class="inv-meaning">' + ev.meaning + '</div>';
      grid.appendChild(card);
    });
    attachHoverCursor('.inv-card');
  }

  /* ══════════════════════════════════ LAB ══ */
  function renderLab() {
    const grid = document.getElementById('lab-grid');
    grid.innerHTML = '';
    const defs = State.caseData.evidence_definitions || {};
    const collected = State.inventory.map(function (id) { return defs[id]; }).filter(Boolean);

    if (collected.length === 0) {
      grid.innerHTML = '<p style="color:var(--txt3);font-size:13px;padding:20px 0;">No evidence collected yet. Return to the crime scene.</p>';
      return;
    }

    collected.forEach(function (ev) {
      const card = document.createElement('div');
      const hasLab = !!ev.lab_type;
      card.className = 'lab-card' + (!hasLab ? ' no-lab' : '') + (State.analyzed[ev.id] ? ' analyzed' : '');
      card.innerHTML =
        '<div class="lab-icon">' + ev.icon + '</div>' +
        '<div class="lab-name">' + ev.name + '</div>' +
        (hasLab ? '<div class="lab-type-badge">' + ev.lab_type.toUpperCase() + ' ANALYSIS</div>' : '<div class="lab-type-badge" style="background:none;color:var(--txt3)">NO LAB REQUIRED</div>') +
        '<div class="lab-desc">' + ev.meaning + '</div>';
      if (hasLab) {
        card.addEventListener('click', function () { openMinigame(ev); });
      }
      grid.appendChild(card);
    });
    attachHoverCursor('.lab-card');
  }

  function openMinigame(ev) {
    const wrap = document.getElementById('minigame-wrap');
    const labGrid = document.getElementById('lab-grid');
    labGrid.hidden = true;
    wrap.hidden = false;

    // Hide all mini-games
    document.querySelectorAll('.minigame').forEach(function (m) { m.hidden = true; m.innerHTML = ''; });

    const mgEl = document.getElementById('mg-' + ev.lab_type);
    if (!mgEl) {
      labGrid.hidden = false; wrap.hidden = true;
      toast('Lab type not found.', 'error');
      return;
    }
    mgEl.hidden = false;

    if (ev.lab_type === 'fingerprint') buildFingerprintMG(mgEl, ev);
    else if (ev.lab_type === 'dna')    buildDNAMG(mgEl, ev);
    else if (ev.lab_type === 'cctv')   buildCCTVMG(mgEl, ev);
    else if (ev.lab_type === 'document') buildDocumentMG(mgEl, ev);
    else if (ev.lab_type === 'timeline') buildTimelineMG(mgEl, ev);

    document.getElementById('mg-back').onclick = function () {
      wrap.hidden = true; labGrid.hidden = false;
    };
    attachHoverCursor('.fp-suspect-row, .fp-match-btn, .dna-profile-btn, .cctv-btn, .cctv-mark-btn, .doc-piece, .doc-confirm-btn, .tl-event-card, .tl-pick-btn, .tl-confirm-btn, .mg-back');
  }

  /* ─── Fingerprint Mini-game ─── */
  function buildFingerprintMG(el, ev) {
    const cd = State.caseData;
    el.innerHTML =
      '<div class="fp-mg">' +
        '<div class="fp-collected">' +
          '<div class="fp-collected-title">COLLECTED PRINT</div>' +
          '<div class="fp-visual">' +
            '<div class="fp-ridges"></div>' +
            '<svg class="fp-svg" viewBox="0 0 100 100" fill="none">' +
              '<circle cx="50" cy="50" r="45" stroke="#4a9eff" stroke-width="1" opacity=".3"/>' +
              '<circle cx="50" cy="50" r="36" stroke="#4a9eff" stroke-width="1" opacity=".4"/>' +
              '<circle cx="50" cy="50" r="26" stroke="#4a9eff" stroke-width="1.2" opacity=".5"/>' +
              '<circle cx="50" cy="50" r="16" stroke="#4a9eff" stroke-width="1.5" opacity=".6"/>' +
              '<circle cx="50" cy="50" r="7"  stroke="#4a9eff" stroke-width="2"   opacity=".7"/>' +
            '</svg>' +
          '</div>' +
          '<p style="font-size:11px;color:var(--txt3);margin-top:10px;">Partial print recovered from door handle. Match against suspect profiles.</p>' +
        '</div>' +
        '<div class="fp-suspects" id="fp-suspects-list">' +
          '<div class="fp-suspects-title">SUSPECT PROFILES</div>' +
        '</div>' +
      '</div>' +
      '<div id="fp-result"></div>';

    const list = el.querySelector('#fp-suspects-list');
    (cd.suspects || []).forEach(function (s) {
      const row = document.createElement('div');
      row.className = 'fp-suspect-row';
      row.innerHTML =
        '<div class="fps-mini">&#x1F91A;</div>' +
        '<div class="fps-name">' + s.name + '</div>' +
        '<div class="fps-code">' + s.fingerprint_code + '</div>' +
        '<button class="fp-match-btn" data-code="' + s.fingerprint_code + '" data-sid="' + s.id + '">COMPARE</button>';
      list.appendChild(row);
    });

    el.querySelectorAll('.fp-match-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const code = btn.dataset.code;
        const sid  = btn.dataset.sid;
        try {
          const res = await fetch('/api/lab/fingerprint', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ code: code })
          });
          const data = await res.json();
          const row  = btn.closest('.fp-suspect-row');
          const resEl = el.querySelector('#fp-result');
          el.querySelectorAll('.fp-suspect-row').forEach(function (r) { r.classList.remove('matched','no-match'); });
          if (data.match) {
            row.classList.add('matched');
            resEl.innerHTML = '<div class="mg-result success">&#9670; MATCH CONFIRMED — Fingerprint matches <strong>' + data.suspect.name + '</strong>. This person handled the door.</div>';
            markAnalyzed(ev, { match: true, suspect: data.suspect });
            addScore(20);
            updateBoardForFingerprint(sid);
          } else {
            row.classList.add('no-match');
            resEl.innerHTML = '<div class="mg-result fail">&#9888; No match for ' + (cd.suspects.find(function(s){return s.fingerprint_code===code;})||{name:'Unknown'}).name + '. Continue searching.</div>';
          }
        } catch (e) {
          // Fallback: client-side match
          const correct = ev.result_code;
          const isMatch = (code === correct);
          const row = btn.closest('.fp-suspect-row');
          const resEl = el.querySelector('#fp-result');
          el.querySelectorAll('.fp-suspect-row').forEach(function (r) { r.classList.remove('matched','no-match'); });
          if (isMatch) {
            row.classList.add('matched');
            const suspect = (cd.suspects || []).find(function(s){return s.id===sid;}) || {};
            resEl.innerHTML = '<div class="mg-result success">&#9670; MATCH CONFIRMED — ' + (suspect.name||'Suspect') + '</div>';
            markAnalyzed(ev, { match: true, suspect: suspect });
            addScore(20);
            updateBoardForFingerprint(sid);
          } else {
            row.classList.add('no-match');
            resEl.innerHTML = '<div class="mg-result fail">&#9888; No match for this profile.</div>';
          }
        }
      });
    });
  }

  /* ─── DNA Mini-game ─── */
  function buildDNAMG(el, ev) {
    const cd = State.caseData;
    const bases = ['A','T','G','C'];
    // Random strand for sample
    let sampleStrand = '';
    for (let i=0; i<16; i++) sampleStrand += bases[Math.floor(Math.random()*4)];
    // Known profile strand for suspect A (slightly different)
    let profileStrand = sampleStrand.split('').map(function(b,i){return i%5===2?bases[(bases.indexOf(b)+1)%4]:b;}).join('');

    el.innerHTML =
      '<div class="dna-title">DNA STRAND ANALYSIS</div>' +
      '<p style="font-size:12px;color:var(--txt2);margin-bottom:14px;">Sample recovered from latex glove. Compare against suspect profiles below.</p>' +
      '<p style="font-size:10px;letter-spacing:2px;color:var(--txt3);margin-bottom:8px;">EVIDENCE SAMPLE</p>' +
      '<div class="dna-strands" id="dna-sample-strand"></div>' +
      '<div class="dna-match-row">' +
        (cd.suspects||[]).map(function(s){
          return '<button class="dna-profile-btn" data-sid="'+s.id+'">Compare: '+s.name+'</button>';
        }).join('') +
      '</div>' +
      '<div id="dna-result" class="dna-result">Select a suspect profile to run the comparison.</div>';

    const strandEl = el.querySelector('#dna-sample-strand');
    sampleStrand.split('').forEach(function (b) {
      const col = document.createElement('div');
      col.className = 'dna-strand';
      const base = document.createElement('div');
      base.className = 'dna-base ' + b;
      base.textContent = b;
      col.appendChild(base);
      strandEl.appendChild(col);
    });

    el.querySelectorAll('.dna-profile-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const sid = btn.dataset.sid;
        try {
          const res = await fetch('/api/lab/dna', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({profile: sid})
          });
          const data = await res.json();
          showDNAResult(el, data, ev, sid);
        } catch(e) {
          const isMatch = (sid === (ev.match_suspect || ev.result_code));
          const suspect = (cd.suspects||[]).find(function(s){return s.id===sid;}) || {};
          showDNAResult(el, {match: isMatch, suspect: suspect}, ev, sid);
        }
      });
    });
  }

  function showDNAResult(el, data, ev, sid) {
    const resEl = el.querySelector('#dna-result');
    if (data.match) {
      resEl.className = 'dna-result match';
      resEl.textContent = '✓ DNA MATCH CONFIRMED — Sample consistent with profile of ' + (data.suspect ? data.suspect.name : 'Suspect ' + sid) + '.';
      markAnalyzed(ev, {match:true, suspect:data.suspect});
      addScore(20);
    } else {
      resEl.className = 'dna-result no-match';
      resEl.textContent = '✗ No DNA match for this profile. Sample does not correspond.';
    }
  }

  /* ─── CCTV Mini-game ─── */
  function buildCCTVMG(el, ev) {
    const cd = State.caseData;
    const events = cd.timeline_events || [];
    let playing = false;
    let progress = 0;
    let interval;

    el.innerHTML =
      '<div class="cctv-title" style="font-family:var(--font-d);font-size:14px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">CCTV FOOTAGE ANALYSIS</div>' +
      '<div class="cctv-screen" id="cctv-screen">' +
        '<div class="cctv-overlay"></div>' +
        '<div class="cctv-timestamp" id="cctv-ts">19:30:00</div>' +
        '<div class="cctv-cam-label">CAM 02 — SOUTH ENTRY</div>' +
        '<div class="cctv-scene">' +
          '<div class="cctv-figure" id="cctv-figure" style="left:-8%">&#x1F464;</div>' +
        '</div>' +
      '</div>' +
      '<div class="cctv-controls">' +
        '<button class="cctv-btn" id="cctv-play">&#9654; PLAY</button>' +
        '<button class="cctv-btn" id="cctv-pause">&#9646;&#9646; PAUSE</button>' +
        '<button class="cctv-btn" id="cctv-reset">&#8635; RESET</button>' +
      '</div>' +
      '<div class="cctv-timeline"><div class="cctv-progress" id="cctv-prog"></div></div>' +
      '<p style="font-size:11px;color:var(--txt3);margin-bottom:12px;margin-top:6px;">Mark the key event when you see the person enter the warehouse.</p>' +
      '<div class="cctv-events" id="cctv-events"></div>' +
      '<div id="cctv-result"></div>';

    const tsEl    = el.querySelector('#cctv-ts');
    const figEl   = el.querySelector('#cctv-figure');
    const progEl  = el.querySelector('#cctv-prog');
    const eventsEl = el.querySelector('#cctv-events');

    // Build event rows
    events.forEach(function (ev2) {
      const row = document.createElement('div');
      row.className = 'cctv-event' + (ev2.id === 't3' ? ' highlight' : '');
      row.dataset.eid = ev2.id;
      row.innerHTML =
        '<span class="cctv-event-time">' + ev2.time + '</span>' +
        '<span class="cctv-event-text">' + ev2.text + '</span>' +
        '<button class="cctv-mark-btn' + (State.markedEvents.includes(ev2.id) ? ' marked' : '') + '" data-eid="' + ev2.id + '">' +
        (State.markedEvents.includes(ev2.id) ? '✓ MARKED' : 'MARK') + '</button>';
      eventsEl.appendChild(row);
    });

    eventsEl.querySelectorAll('.cctv-mark-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const eid = btn.dataset.eid;
        if (!State.markedEvents.includes(eid)) {
          State.markedEvents.push(eid);
          btn.classList.add('marked');
          btn.textContent = '✓ MARKED';
          if (eid === 't3') {
            el.querySelector('#cctv-result').innerHTML =
              '<div class="mg-result success">&#9670; KEY EVENT IDENTIFIED — Figure enters south entrance at 20:51. This establishes the timeline.</div>';
            markAnalyzed(ev, {marked: true, key_event: 't3'});
            addScore(15);
          } else {
            el.querySelector('#cctv-result').innerHTML =
              '<div class="mg-result partial">&#9670; Event marked. Keep reviewing for the key entry moment.</div>';
          }
        }
      });
    });

    // Playback simulation
    const startTime = 19.5; // 19:30
    const endTime   = 23.1; // 23:06

    el.querySelector('#cctv-play').addEventListener('click', function () {
      if (playing) return; playing = true;
      interval = setInterval(function () {
        progress = Math.min(progress + 0.4, 100);
        progEl.style.width = progress + '%';
        const simTime = startTime + (endTime - startTime) * (progress / 100);
        const h = Math.floor(simTime);
        const m = Math.floor((simTime - h) * 60);
        tsEl.textContent = (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':00';
        // Figure walks in around 20:51 (progress ~36%)
        if (progress > 32 && progress < 55) {
          figEl.style.left = Math.min(50, -8 + (progress-32)*2.5) + '%';
        } else if (progress >= 55) {
          figEl.style.left = '110%';
        }
        if (progress >= 100) { clearInterval(interval); playing = false; }
      }, 80);
    });
    el.querySelector('#cctv-pause').addEventListener('click', function () { clearInterval(interval); playing = false; });
    el.querySelector('#cctv-reset').addEventListener('click', function () {
      clearInterval(interval); playing = false; progress = 0;
      progEl.style.width = '0'; tsEl.textContent = '19:30:00';
      figEl.style.left = '-8%';
    });
  }

  /* ─── Document Mini-game ─── */
  function buildDocumentMG(el, ev) {
    el.innerHTML =
      '<div class="doc-title">DOCUMENT REASSEMBLY</div>' +
      '<p style="font-size:12px;color:var(--txt2);margin-bottom:16px;">The torn note was found in two pieces. Select each piece then place them in order to read the message.</p>' +
      '<div class="doc-pieces-wrap" id="doc-pieces"></div>' +
      '<p style="font-size:10px;letter-spacing:2px;color:var(--txt3);margin-bottom:10px;">ASSEMBLY AREA — click pieces in correct order</p>' +
      '<div class="doc-assemble-area">' +
        '<div class="doc-slot" id="slot-left">Left half</div>' +
        '<div class="doc-slot" id="slot-right">Right half</div>' +
      '</div>' +
      '<button class="doc-confirm-btn" id="doc-confirm">CONFIRM ASSEMBLY</button>' +
      '<div id="doc-result" style="margin-top:14px;"></div>';

    const pieces = [
      { id: 'p1', side: 'left',  cls: 'torn-edge', text: 'MEET AT\nWAREHOUSE\n#47\nDO NOT', note: 'Left half' },
      { id: 'p2', side: 'right', cls: 'torn-left',  text: 'BRING\nANYONE\n9PM\n– M.R.', note: 'Right half' },
    ];
    // Shuffle pieces
    const shuffled = pieces.sort(function(){return Math.random()-.5;});
    let slotLeft = null, slotRight = null;

    const piecesEl = el.querySelector('#doc-pieces');
    shuffled.forEach(function (p) {
      const div = document.createElement('div');
      div.className = 'doc-piece ' + p.cls;
      div.dataset.id   = p.id;
      div.dataset.side = p.side;
      div.textContent  = p.text;
      div.title = p.note;
      div.addEventListener('click', function () {
        if (div.classList.contains('selected')) {
          div.classList.remove('selected'); return;
        }
        el.querySelectorAll('.doc-piece').forEach(function(d){d.classList.remove('selected');});
        div.classList.add('selected');
      });
      piecesEl.appendChild(div);
    });

    el.querySelectorAll('.doc-slot').forEach(function (slot) {
      slot.addEventListener('click', function () {
        const selected = el.querySelector('.doc-piece.selected');
        if (!selected) return;
        const side = slot.id === 'slot-left' ? 'left' : 'right';
        if (selected.dataset.side === side) {
          slot.textContent = selected.textContent;
          slot.classList.add('filled');
          selected.classList.add('placed','selected');
          selected.style.opacity = '.3';
          if (side === 'left')  slotLeft  = selected.dataset.id;
          else                   slotRight = selected.dataset.id;
        } else {
          toast('Wrong side — try the other slot.', 'error');
        }
        selected.classList.remove('selected');
      });
    });

    el.querySelector('#doc-confirm').addEventListener('click', function () {
      const resEl = el.querySelector('#doc-result');
      if (slotLeft === 'p1' && slotRight === 'p2') {
        resEl.innerHTML = '<div class="mg-result success">&#9670; DOCUMENT RECONSTRUCTED — Note reads: "MEET AT WAREHOUSE #47 — DO NOT BRING ANYONE — 9PM – M.R." Initials M.R. may correspond to a suspect.</div>';
        markAnalyzed(ev, {assembled: true, content: 'Meet at Warehouse #47 — 9PM'});
        addScore(15);
      } else {
        resEl.innerHTML = '<div class="mg-result fail">&#9888; Assembly incorrect or incomplete. Try placing both halves.</div>';
      }
    });
  }

  /* ─── Timeline Mini-game ─── */
  function buildTimelineMG(el, ev) {
    const cd = State.caseData;
    const events = (cd.timeline_events || []).slice();
    // Shuffle for the pool
    const poolEvents = events.slice().sort(function(){return Math.random()-.5;});
    const slots = Array(events.length).fill(null);

    el.innerHTML =
      '<div class="tl-title">TIMELINE RECONSTRUCTION</div>' +
      '<p class="tl-instruction">Arrange the discovered events in the correct chronological order. Click PLACE next to each event then click the target slot.</p>' +
      '<div class="tl-events-pool" id="tl-pool"></div>' +
      '<div class="tl-answer-strip" id="tl-strip"></div>' +
      '<button class="tl-confirm-btn" id="tl-confirm">SUBMIT TIMELINE</button>' +
      '<div id="tl-result" style="margin-top:14px;"></div>';

    const poolEl  = el.querySelector('#tl-pool');
    const stripEl = el.querySelector('#tl-strip');

    // Build answer slots
    events.forEach(function (_, i) {
      const slot = document.createElement('div');
      slot.className = 'tl-slot';
      slot.dataset.idx = i;
      slot.innerHTML =
        '<div class="tl-slot-num">' + (i+1) + '</div>' +
        '<div class="tl-slot-time" style="color:var(--txt3)">--:--</div>' +
        '<div class="tl-slot-text" style="color:var(--txt3)">Empty</div>';
      stripEl.appendChild(slot);
    });

    let selectedCard = null;

    // Build pool cards
    poolEvents.forEach(function (evt) {
      const card = document.createElement('div');
      card.className = 'tl-event-card';
      card.dataset.eid = evt.id;
      card.innerHTML =
        '<div class="tl-time-pick">' + evt.time + '</div>' +
        '<div class="tl-event-text">' + evt.text + '</div>' +
        '<button class="tl-pick-btn">PLACE</button>';
      card.querySelector('.tl-pick-btn').addEventListener('click', function () {
        if (selectedCard) selectedCard.style.outline = '';
        selectedCard = card;
        card.style.outline = '1px solid var(--accent)';
        toast('Now click a numbered slot to place this event.', '', 1800);
      });
      poolEl.appendChild(card);
    });

    // Click slots to place selected card
    stripEl.querySelectorAll('.tl-slot').forEach(function (slot, i) {
      slot.addEventListener('click', function () {
        if (!selectedCard) { toast('Select an event first (click PLACE).', '', 1800); return; }
        const eid = selectedCard.dataset.eid;
        const evt = events.find(function(e){return e.id===eid;});
        slots[i] = eid;
        slot.querySelector('.tl-slot-time').textContent  = evt.time;
        slot.querySelector('.tl-slot-time').style.color = 'var(--accent)';
        slot.querySelector('.tl-slot-text').textContent  = evt.text;
        slot.querySelector('.tl-slot-text').style.color  = 'var(--txt)';
        selectedCard.style.outline = '';
        selectedCard.classList.add('placed');
        selectedCard.querySelector('.tl-pick-btn').disabled = true;
        selectedCard = null;
      });
    });

    el.querySelector('#tl-confirm').addEventListener('click', function () {
      const correct = events.map(function(e){return e.id;});
      let matches = 0;
      slots.forEach(function(s,i){ if(s === correct[i]) matches++; });
      const resEl = el.querySelector('#tl-result');
      // Mark slots
      stripEl.querySelectorAll('.tl-slot').forEach(function (slot, i) {
        slot.classList.remove('correct','wrong');
        if (slots[i]) slot.classList.add(slots[i] === correct[i] ? 'correct' : 'wrong');
      });
      if (matches === events.length) {
        resEl.innerHTML = '<div class="mg-result success">&#9670; PERFECT — Timeline fully reconstructed. The sequence of events is confirmed.</div>';
        markAnalyzed(ev, {timeline: slots, correct: true});
        addScore(25);
      } else if (matches >= events.length * 0.5) {
        resEl.innerHTML = '<div class="mg-result partial">&#9670; PARTIAL — ' + matches + '/' + events.length + ' events correctly placed. Review the order.</div>';
        markAnalyzed(ev, {timeline: slots, correct: false});
        addScore(10);
      } else {
        resEl.innerHTML = '<div class="mg-result fail">&#9888; Incorrect timeline — only ' + matches + '/' + events.length + ' events correct. Re-examine the evidence.</div>';
      }
    });
  }

  /* ─── Mark analyzed ─── */
  function markAnalyzed(ev, result) {
    if (!State.analyzed[ev.id]) {
      State.analyzed[ev.id] = result;
    }
    // Ensure evidence is in inventory
    if (!State.inventory.includes(ev.id)) {
      State.inventory.push(ev.id);
      updateEvCount();
    }
  }

  /* ─── Board update helper ─── */
  function updateBoardForFingerprint(suspectId) {
    const conn = { from: 'ev-fingerprint', to: 'susp-' + suspectId, label: 'fingerprint match' };
    if (!State.boardConns.some(function(c){return c.from===conn.from&&c.to===conn.to;})) {
      State.boardConns.push(conn);
    }
  }

  /* ══════════════════════════════════ EVIDENCE BOARD ══ */
  function renderBoard() {
    const canvas  = document.getElementById('board-canvas');
    const nodesEl = document.getElementById('board-nodes');
    const svgEl   = document.getElementById('board-svg');
    const cd      = State.caseData;
    const defs    = cd.evidence_definitions || {};
    nodesEl.innerHTML = '';
    svgEl.innerHTML   = '';

    const collected = State.inventory.map(function(id){return defs[id];}).filter(Boolean);
    if (collected.length === 0) {
      nodesEl.innerHTML = '<p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--txt3);font-size:13px;">No evidence collected yet.</p>';
      return;
    }

    const nodePositions = {};

    // Layout: evidence nodes on left arc, suspects on right
    const evCount = collected.length;
    collected.forEach(function (ev, i) {
      const pct = (i + 0.5) / evCount;
      const x = 12 + pct * 2;       // 12–14% left col
      const y = 10 + i * (80 / Math.max(evCount-1,1));
      placeNode(nodesEl, 'ev-' + ev.id, ev.icon, 'EV', ev.name, 'node-evidence', x, Math.min(y, 85), nodePositions);
    });

    // Suspects
    (cd.suspects || []).forEach(function (s, i) {
      const y = 20 + i * 30;
      placeNode(nodesEl, 'susp-' + s.id, '🧑', 'SUSPECT', s.name, 'node-suspect', 70, y, nodePositions);
    });

    // Key events
    const keyEvents = [
      {id:'entry', icon:'🚪', label:'ENTRY',   name:'South Entrance'},
      {id:'time',  icon:'🕐', label:'TIME',    name:'20:51 Entry'},
      {id:'scene', icon:'📍', label:'SCENE',   name:'Warehouse Floor'},
    ];
    keyEvents.forEach(function (ev2, i) {
      placeNode(nodesEl, 'evt-'+ev2.id, ev2.icon, ev2.label, ev2.name, 'node-event', 40, 15 + i * 28, nodePositions);
    });

    // Draw existing connections
    State.boardConns.forEach(function (conn) {
      drawLine(svgEl, nodePositions, conn.from, conn.to, canvas);
    });

    // Auto-connect analyzed items
    if (State.analyzed['fingerprint']) {
      autoConnect(svgEl, nodesEl, nodePositions, 'ev-fingerprint', 'susp-A', canvas, 'fingerprint → suspect');
      autoConnect(svgEl, nodesEl, nodePositions, 'susp-A', 'evt-entry', canvas, 'entered scene');
    }
    if (State.analyzed['cctv_footage'] || State.markedEvents.includes('t3')) {
      autoConnect(svgEl, nodesEl, nodePositions, 'ev-cctv_footage', 'evt-time', canvas, 'CCTV timestamp');
      autoConnect(svgEl, nodesEl, nodePositions, 'evt-time', 'susp-A', canvas, 'time matches');
    }
    if (State.analyzed['blood_sample'] || State.analyzed['dna_sample']) {
      const eid = State.analyzed['blood_sample'] ? 'ev-blood_sample' : 'ev-dna_sample';
      autoConnect(svgEl, nodesEl, nodePositions, eid, 'susp-A', canvas, 'DNA match');
    }
    if (State.analyzed['torn_note']) {
      autoConnect(svgEl, nodesEl, nodePositions, 'ev-torn_note', 'evt-entry', canvas, 'note references warehouse');
    }

    // Sidebar
    renderBoardSidebar(cd);
    attachHoverCursor('.board-node');
  }

  function placeNode(container, id, icon, label, name, cls, xPct, yPct, positions) {
    const el = document.createElement('div');
    el.className = 'board-node ' + cls;
    el.id = 'bn-' + id;
    el.style.left = xPct + '%';
    el.style.top  = yPct + '%';
    el.innerHTML =
      '<div class="bn-icon">' + icon + '</div>' +
      '<div class="bn-label">' + label + '</div>' +
      '<div class="bn-name">'  + name  + '</div>';
    container.appendChild(el);
    positions[id] = { x: xPct, y: yPct };
  }

  function autoConnect(svgEl, nodesEl, positions, fromId, toId, canvas, label) {
    const already = State.boardConns.some(function(c){return c.from===fromId&&c.to===toId;});
    if (!already) State.boardConns.push({from:fromId, to:toId, label:label});
    drawLine(svgEl, positions, fromId, toId, canvas);
    const fromEl = document.getElementById('bn-'+fromId);
    const toEl   = document.getElementById('bn-'+toId);
    if (fromEl) fromEl.classList.add('node-connected');
    if (toEl)   toEl.classList.add('node-connected');
  }

  function drawLine(svgEl, positions, fromId, toId, canvas) {
    const from = positions[fromId];
    const to   = positions[toId];
    if (!from || !to) return;
    const w = canvas.offsetWidth  || 800;
    const h = canvas.offsetHeight || 400;
    const x1 = (from.x / 100) * w;
    const y1 = (from.y / 100) * h;
    const x2 = (to.x   / 100) * w;
    const y2 = (to.y   / 100) * h;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(74,158,255,.45)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '4 4');
    svgEl.appendChild(line);
    // Red string visual
    const line2 = document.createElementNS('http://www.w3.org/2000/svg','line');
    line2.setAttribute('x1', x1); line2.setAttribute('y1', y1);
    line2.setAttribute('x2', x2); line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', 'rgba(192,57,43,.3)');
    line2.setAttribute('stroke-width', '1');
    svgEl.appendChild(line2);
  }

  function renderBoardSidebar(cd) {
    const suspEl = document.getElementById('bsb-suspects');
    const connEl = document.getElementById('bsb-connections');
    suspEl.innerHTML = '';
    connEl.innerHTML = '';
    (cd.suspects||[]).forEach(function (s) {
      const chip = document.createElement('div');
      chip.className = 'susp-chip' + (State.boardConns.some(function(c){return c.to==='susp-'+s.id;}) ? ' highlighted' : '');
      chip.innerHTML = '<span class="susp-chip-id">' + s.id + '</span> ' + s.name;
      suspEl.appendChild(chip);
    });
    State.boardConns.forEach(function (c) {
      const item = document.createElement('div');
      item.className = 'conn-item';
      item.innerHTML = '<span class="conn-dot"></span>' + c.label;
      connEl.appendChild(item);
    });
  }

  /* ══════════════════════════════════ DEDUCTION ══ */
  function renderDeduction() {
    const cd = State.caseData;

    // WHO
    const whoEl = document.getElementById('dq-who');
    whoEl.innerHTML = '';
    (cd.suspects||[]).forEach(function (s) {
      const btn = document.createElement('button');
      btn.className = 'dq-option' + (getDeductionAnswer('who') === s.id ? ' selected' : '');
      btn.dataset.val = s.id;
      btn.textContent = s.name;
      btn.addEventListener('click', function () {
        whoEl.querySelectorAll('.dq-option').forEach(function(b){b.classList.remove('selected');});
        btn.classList.add('selected');
        setDeductionAnswer('who', s.id);
      });
      whoEl.appendChild(btn);
    });

    // WHEN
    const whenEl = document.getElementById('dq-when');
    whenEl.innerHTML = '';
    (cd.timeline_events||[]).forEach(function (ev) {
      const btn = document.createElement('button');
      btn.className = 'dq-option' + (getDeductionAnswer('when') === ev.id ? ' selected' : '');
      btn.dataset.val = ev.id;
      btn.innerHTML = '<span style="font-family:var(--font-m);color:var(--accent);margin-right:6px;">' + ev.time + '</span>' + ev.text;
      btn.addEventListener('click', function () {
        whenEl.querySelectorAll('.dq-option').forEach(function(b){b.classList.remove('selected');});
        btn.classList.add('selected');
        setDeductionAnswer('when', ev.id);
      });
      whenEl.appendChild(btn);
    });

    // EVIDENCE (multi-select)
    const evEl = document.getElementById('dq-evidence');
    evEl.innerHTML = '';
    const defs = cd.evidence_definitions || {};
    State.inventory.forEach(function (id) {
      const ev = defs[id]; if (!ev) return;
      const btn = document.createElement('button');
      btn.className = 'dq-option' + (getDeductionEvidenceSelected(id) ? ' selected' : '');
      btn.dataset.eid = id;
      btn.innerHTML = ev.icon + ' ' + ev.name;
      btn.addEventListener('click', function () {
        btn.classList.toggle('selected');
      });
      evEl.appendChild(btn);
    });

    document.getElementById('btn-submit-report').onclick = submitReport;
    attachHoverCursor('.dq-option');
  }

  const _deductionAnswers = {};
  function setDeductionAnswer(k, v) { _deductionAnswers[k] = v; }
  function getDeductionAnswer(k) { return _deductionAnswers[k] || ''; }
  function getDeductionEvidenceSelected(id) {
    const el = document.querySelector('#dq-evidence .dq-option[data-eid="' + id + '"]');
    return el && el.classList.contains('selected');
  }

  async function submitReport() {
    const who        = getDeductionAnswer('who');
    const when       = getDeductionAnswer('when');
    const conclusion = document.getElementById('dq-conclusion').value.trim();
    const evidenceSelected = Array.from(document.querySelectorAll('#dq-evidence .dq-option.selected'))
                                  .map(function(b){return b.dataset.eid;});

    if (!who)  { toast('Please identify a suspect.', 'error'); return; }
    if (!when) { toast('Please select a timeline event.', 'error'); return; }

    try {
      const res = await fetch('/api/submit-report', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ suspect: who, when: when, evidence: evidenceSelected, conclusion: conclusion })
      });
      const data = await res.json();
      showResults(data);
    } catch(e) {
      // Client-side fallback evaluation
      const cd = State.caseData;
      const correct = cd.correct_answers || {};
      let score = 0;
      const feedback = [];
      if (who === correct.who) { score += 40; feedback.push({field:'suspect', correct:true, msg:'Correct suspect identified.'}); }
      else { feedback.push({field:'suspect', correct:false, msg:'Suspect identification incorrect.'}); }
      if (when === correct.when) { score += 25; feedback.push({field:'when', correct:true, msg:'Entry time correctly identified.'}); }
      else { feedback.push({field:'when', correct:false, msg:'Timeline entry not fully supported.'}); }
      score += Math.min(evidenceSelected.length * 7, 35);
      feedback.push({field:'evidence', correct: evidenceSelected.length >= 3, msg: evidenceSelected.length + ' evidence items cited.'});
      const suspect = (cd.suspects||[]).find(function(s){return s.id===cd.correct_suspect;}) || {};
      showResults({ solved: score >= 65, score: score, max_score: 100, feedback: feedback, correct_suspect: cd.correct_suspect, suspect_name: suspect.name || '' });
    }
  }

  function showResults(data) {
    goTo('results');
    const stamp = document.getElementById('results-stamp');
    const title = document.getElementById('results-title');
    const scoreEl = document.getElementById('results-score');
    const fbEl    = document.getElementById('results-feedback');
    const revealEl = document.getElementById('results-reveal');
    const rrEl    = document.getElementById('rr-content');

    stamp.className = 'results-stamp ' + (data.solved ? 'solved' : 'failed');
    stamp.textContent = data.solved ? 'CASE CLOSED' : 'CASE OPEN';
    title.textContent = data.solved
      ? 'Excellent work, Investigator. Your report is confirmed.'
      : 'Insufficient evidence to close the case. Keep investigating.';

    // Count-up score
    let displayed = 0;
    const target = data.score || 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(function () {
      displayed = Math.min(displayed + step, target);
      scoreEl.textContent = displayed;
      if (displayed >= target) clearInterval(timer);
    }, 30);

    fbEl.innerHTML = '';
    (data.feedback || []).forEach(function (f) {
      const item = document.createElement('div');
      item.className = 'rf-item ' + (f.correct ? 'ok' : 'bad');
      item.innerHTML = '<span class="rf-icon">' + (f.correct ? '✓' : '✗') + '</span>' + f.msg;
      fbEl.appendChild(item);
    });

    if (data.solved) {
      revealEl.hidden = false;
      const suspect = (State.caseData.suspects||[]).find(function(s){return s.id===data.correct_suspect;}) || {};
      rrEl.innerHTML =
        '<strong>Perpetrator:</strong> ' + (data.suspect_name || suspect.name || 'Suspect ' + data.correct_suspect) + '<br>' +
        '<strong>Key Evidence:</strong> Fingerprint on door handle + CCTV footage (20:51) + DNA trace on latex glove<br>' +
        '<strong>Timeline:</strong> ' + (State.caseData.correct_suspect === 'A' ? 'Marcus Reeve entered the warehouse at 20:51, interacted with multiple objects, and left before emergency services arrived.' : 'Suspect entered the warehouse during the relevant window.') + '<br>' +
        '<strong>Conclusion:</strong> The evidence chain is consistent with Suspect ' + data.correct_suspect + ' as the individual present at the scene.';
    } else {
      revealEl.hidden = true;
    }

    addScore(data.score || 0);
  }

  /* ══════════════════════════════════ RESET ══ */
  function resetGame() {
    State.inventory    = [];
    State.analyzed     = {};
    State.boardConns   = [];
    State.examineCount = 0;
    State.score        = 0;
    State.timelineOrder = [];
    State.markedEvents  = [];
    Object.keys(_deductionAnswers).forEach(function(k){delete _deductionAnswers[k];});
    document.getElementById('hud-score').textContent = '0';
    updateEvCount();
    goTo('menu');
  }

  /* ══════════════════════════════════ FALLBACK CASE ══ */
  function getFallbackCase() {
    return {
      id:'047', title:'The Abandoned Warehouse', subtitle:'Case #047',
      briefing:'A suspicious incident has occurred inside an abandoned warehouse. Collect, analyze, and connect the clues to reconstruct what happened.',
      suspects: [
        {id:'A', name:'Marcus Reeve',  profile:'Former warehouse manager.', fingerprint_code:'R3V'},
        {id:'B', name:'Diana Cole',    profile:'Private investigator.',     fingerprint_code:'C0L'},
        {id:'C', name:'Owen Marsh',    profile:'Delivery driver.',          fingerprint_code:'M4R'},
      ],
      scene_objects: [
        {id:'door',      label:'Entry Door',      x:12, y:55, icon:'🚪', interactions:['EXAMINE','PHOTOGRAPH'],  examine_text:'Door frame scratched. Handle shows smudges.', evidence_id:'fingerprint'},
        {id:'body',      label:'Covered Figure',  x:48, y:62, icon:'🧍', interactions:['EXAMINE','PHOTOGRAPH'],  examine_text:'White sheet covers something. Dried blood nearby.', evidence_id:'blood_sample'},
        {id:'phone',     label:'Mobile Phone',    x:62, y:58, icon:'📱', interactions:['EXAMINE','COLLECT'],     examine_text:'Cracked screen. Last active 20:47.', evidence_id:'phone_data'},
        {id:'note',      label:'Torn Note',       x:25, y:45, icon:'📄', interactions:['EXAMINE','COLLECT'],     examine_text:'Two torn halves. Numbers and a partial name.', evidence_id:'torn_note'},
        {id:'cctv',      label:'CCTV Terminal',   x:78, y:35, icon:'💻', interactions:['EXAMINE','ANALYZE'],     examine_text:'Dusty monitor. Last footage timestamped 20:51.', evidence_id:'cctv_footage'},
        {id:'footprint', label:'Footprints',      x:55, y:80, icon:'👣', interactions:['EXAMINE','COLLECT'],     examine_text:'Boot impressions. Size 10.', evidence_id:'footprint'},
        {id:'glove',     label:'Latex Glove',     x:18, y:75, icon:'🧤', interactions:['EXAMINE','COLLECT'],     examine_text:'Single glove, inside-out.', evidence_id:'dna_sample'},
        {id:'key',       label:'Key Ring',        x:70, y:72, icon:'🔑', interactions:['EXAMINE','COLLECT'],     examine_text:'Three keys. Tag reads …47.', evidence_id:'keys'},
      ],
      evidence_definitions: {
        fingerprint:  {id:'fingerprint',  name:'Fingerprint',  icon:'🖐️', location:'Door Handle',    meaning:'May identify who entered.', lab_type:'fingerprint', result_code:'R3V', match_suspect:'A'},
        blood_sample: {id:'blood_sample', name:'Blood Sample', icon:'🩸', location:'Floor origin',   meaning:'DNA can be analyzed.',      lab_type:'dna',         result_code:'A',   match_suspect:'A'},
        phone_data:   {id:'phone_data',   name:'Mobile Phone', icon:'📱', location:'Near figure',    meaning:'Last active 20:47.',        lab_type:'cctv',        result_code:null,  match_suspect:null},
        torn_note:    {id:'torn_note',    name:'Torn Note',    icon:'📄', location:'Desk area',      meaning:'Partial name and numbers.', lab_type:'document',    result_code:null,  match_suspect:null},
        cctv_footage: {id:'cctv_footage', name:'CCTV Footage', icon:'📹', location:'Security terminal', meaning:'Entry timestamped 20:51.', lab_type:'cctv',       result_code:null,  match_suspect:'A'},
        footprint:    {id:'footprint',    name:'Footprint',    icon:'👣', location:'Warehouse floor', meaning:'Movement path.',           lab_type:null,          result_code:null,  match_suspect:null},
        dna_sample:   {id:'dna_sample',   name:'DNA Sample',   icon:'🧬', location:'Latex glove',   meaning:'Biological trace.',         lab_type:'dna',         result_code:'A',   match_suspect:'A'},
        keys:         {id:'keys',         name:'Key Ring',     icon:'🔑', location:'Near storage',   meaning:"Access key — tag '…47'.",   lab_type:null,          result_code:null,  match_suspect:null},
      },
      timeline_events: [
        {id:'t1', time:'19:30', text:'Warehouse last officially accessed'},
        {id:'t2', time:'20:47', text:'Mobile phone last active'},
        {id:'t3', time:'20:51', text:'CCTV: figure enters south entrance'},
        {id:'t4', time:'21:15', text:'Neighbours report unusual sounds'},
        {id:'t5', time:'22:40', text:'Anonymous tip received'},
        {id:'t6', time:'23:05', text:'First responders arrive'},
      ],
      correct_suspect: 'A',
      correct_answers: { who:'A', when:'t3', where:'south_entrance', what:'entered_warehouse' },
      min_evidence_to_solve: 4,
    };
  }

  /* ══════════════════════════════════ START ══ */
  document.addEventListener('DOMContentLoaded', init);

})();
