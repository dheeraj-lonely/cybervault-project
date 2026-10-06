/* ═══════════════════════════════════════════════════════
   CYBERVAULT FORENSIC ESCAPE — Game Engine
   Complete game logic, state management, all interactions
   ═══════════════════════════════════════════════════════ */
'use strict';

/* ── GAME STATE ─────────────────────────────────────────── */
const GS = {
  screen: 'menu',          // menu | cases | briefing | game | verdict
  currentCaseId: null,
  currentCase: null,
  currentRoom: 'office',
  inventory: [],           // collected evidence IDs
  analyzedEvidence: [],
  solvedPuzzles: [],
  unlockedRooms: ['office'],
  cctv: { index: 0, playing: false },
  suspects: {},            // id → { credibility, interviewed, contradiction }
  timeline: [],            // placed event IDs in order
  theory: { suspect: '', motive: '', method: '', location: '', time: '', evidence: [] },
  evidenceConnections: [], // [{from, to, validated}]
  hintsUsed: 0,
  maxHints: 4,
  timerSec: 0,
  timerInterval: null,
  activeTool: null,        // uv | magnifier | camera | null
  activePanel: null,       // lab | suspects | board | timeline | theory | report | null
  activePuzzleId: null,
  activeSuspect: null,
  xp: 0, rank: 0,
  achievements: [],
  boardCards: [],          // positioned cards for evidence board
  journal: [],
  score: {},
  saves: {}
};

/* ── HELPERS ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $c = cls => document.querySelectorAll(`.${cls}`);

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function getCase() { return GS.currentCase; }

function getEvidence(id) {
  return getCase()?.evidence.find(e => e.id === id);
}

function getPuzzle(id) {
  return getCase()?.puzzles.find(p => p.id === id);
}

function getSuspect(id) {
  return getCase()?.suspects.find(s => s.id === id);
}

/* ── NOTIFICATIONS ───────────────────────────────────────── */
const NotifStack = $('notif-stack');
function notify(msg, type = 'info', dur = 3500) {
  if (!NotifStack) return;
  const n = document.createElement('div');
  n.className = `notif ${type}`;
  n.textContent = msg;
  NotifStack.appendChild(n);
  setTimeout(() => n.remove(), dur);
}

/* ── JOURNAL ─────────────────────────────────────────────── */
function addJournal(text) {
  const now = formatTime(GS.timerSec);
  GS.journal.unshift({ time: now, text });
  renderJournal();
}

function renderJournal() {
  const el = $('journal-list');
  if (!el) return;
  el.innerHTML = GS.journal.map(j =>
    `<div class="journal-entry"><div class="journal-time">${j.time}</div>${j.text}</div>`
  ).join('');
}

/* ── TIMER ───────────────────────────────────────────────── */
function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function startTimer() {
  GS.timerSec = 0;
  clearInterval(GS.timerInterval);
  GS.timerInterval = setInterval(() => {
    GS.timerSec++;
    const el = $('topbar-timer');
    if (el) {
      el.textContent = formatTime(GS.timerSec);
      const target = getCase()?.targetTime || 1200;
      el.classList.toggle('urgent', GS.timerSec > target * 1.3);
    }
  }, 1000);
}

function stopTimer() { clearInterval(GS.timerInterval); }

/* ── SCREEN NAVIGATION ───────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`screen-${id}`);
  if (el) el.classList.add('active');
  GS.screen = id;
}

/* ── MAIN MENU ───────────────────────────────────────────── */
function initMenu() {
  showScreen('menu');
  spawnParticles();
  renderMenuSaveInfo();
}

function spawnParticles() {
  const container = $('menu-particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'menu-particle';
    p.style.cssText = `left:${Math.random()*100}%;animation-duration:${6+Math.random()*10}s;animation-delay:-${Math.random()*10}s;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;`;
    container.appendChild(p);
  }
}

function renderMenuSaveInfo() {
  const saves = loadAllSaves();
  const hasSave = Object.keys(saves).length > 0;
  const continueBtn = $('btn-continue');
  if (continueBtn) continueBtn.style.display = hasSave ? 'block' : 'none';
}

/* ── CASE SELECT ─────────────────────────────────────────── */
function showCaseSelect() {
  showScreen('cases');
  renderCaseFiles();
}

function renderCaseFiles() {
  const grid = $('cases-grid');
  if (!grid) return;
  grid.innerHTML = '';

  GAME_DATA.cases.forEach(c => {
    const save = loadSave(c.id);
    const progress = save ? Math.round((save.inventory.length / c.evidenceTotal) * 100) : 0;
    const bestScore = save?.score?.accuracy ? `${save.score.accuracy}%` : '—';

    const card = document.createElement('div');
    card.className = `case-file${c.unlocked ? '' : ' locked'}`;

    const statusClass = !c.unlocked ? 'locked' : (save?.completed ? 'solved' : 'unsolved');
    const statusText  = !c.unlocked ? 'LOCKED' : (save?.completed ? 'SOLVED' : 'UNSOLVED');
    const stars = Array(5).fill(0).map((_,i) =>
      `<span class="star ${i < c.difficulty ? 'filled' : 'empty'}">★</span>`
    ).join('');

    card.innerHTML = `
      <div class="case-file-header">
        <span class="case-num">CASE ${c.num}</span>
        <span class="case-status ${statusClass}">${statusText}</span>
      </div>
      <div class="case-file-body">
        <div class="case-title">${c.title}</div>
        <div class="case-location">${c.location}</div>
        <div class="case-difficulty">${stars}</div>
        <div class="case-stats">
          <div class="case-stat"><span class="case-stat-val">${c.evidenceTotal}</span><span class="case-stat-lbl">EVIDENCE</span></div>
          <div class="case-stat"><span class="case-stat-val">${c.suspectsTotal}</span><span class="case-stat-lbl">SUSPECTS</span></div>
          <div class="case-stat"><span class="case-stat-val">${c.puzzlesTotal}</span><span class="case-stat-lbl">PUZZLES</span></div>
        </div>
        ${c.unlocked ? `
        <div class="case-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        </div>
        <button class="case-begin-btn" onclick="startCase('${c.id}')">
          ${save && !save.completed ? '[ CONTINUE INVESTIGATION ]' : '[ BEGIN INVESTIGATION ]'}
        </button>` : `<div class="case-locked-msg">🔒 Complete previous case to unlock</div>`}
      </div>`;

    grid.appendChild(card);
  });
}

/* ── BRIEFING ────────────────────────────────────────────── */
function startCase(caseId) {
  const caseData = GAME_DATA.cases.find(c => c.id === caseId);
  if (!caseData || !caseData.unlocked) return;
  GS.currentCaseId = caseId;
  GS.currentCase = deepClone(caseData);
  showScreen('briefing');
  renderBriefing();
}

function renderBriefing() {
  const c = getCase();
  if (!c) return;
  const el = $('briefing-content');
  if (!el) return;

  el.innerHTML = `
    <div class="briefing-header">
      <div class="briefing-case-id">CASE ${c.num} — CLASSIFIED INVESTIGATION FILE</div>
      <div class="briefing-title">${c.title}</div>
    </div>
    <div class="briefing-body">
      <div class="briefing-section">
        <div class="briefing-label">SITUATION REPORT</div>
        <div class="briefing-text">${c.story.briefing.replace(/\n/g, '<br>')}</div>
      </div>
      <div class="briefing-section">
        <div class="briefing-label">INVESTIGATION OBJECTIVES</div>
        <div class="briefing-objectives">
          ${(c.story.objectives||[]).map(o =>
            `<div class="briefing-obj"><span class="obj-bullet">▶</span>${o}</div>`
          ).join('')}
        </div>
      </div>
      <div class="briefing-section">
        <div class="briefing-label">RESOURCES</div>
        <div class="briefing-text">Evidence: 0 / ${c.evidenceTotal} &nbsp;|&nbsp; Suspects: ${c.suspectsTotal} &nbsp;|&nbsp; Puzzles: ${c.puzzlesTotal} &nbsp;|&nbsp; Hints: ${GS.maxHints}</div>
      </div>
    </div>
    <div class="briefing-footer">
      <button class="btn-secondary2" onclick="showCaseSelect()">← BACK</button>
      <button class="btn-enter" onclick="enterCrimeScene()">ENTER CRIME SCENE →</button>
    </div>`;
}

/* ── ENTER CRIME SCENE ───────────────────────────────────── */
function enterCrimeScene() {
  const save = loadSave(GS.currentCaseId);
  if (save && !save.completed) {
    restoreFromSave(save);
  } else {
    initGameState();
  }
  showScreen('game');
  renderGameUI();
  renderScene(GS.currentRoom);
  startTimer();
  addJournal(`Investigation started. Location: ${getCase().location}`);
}

function initGameState() {
  const c = getCase();
  GS.inventory = [];
  GS.analyzedEvidence = [];
  GS.solvedPuzzles = [];
  GS.unlockedRooms = ['office'];
  GS.suspects = {};
  c.suspects.forEach(s => {
    GS.suspects[s.id] = { credibility: s.credibility, interviewed: false, contradictions: [] };
  });
  GS.timeline = [];
  GS.theory = { suspect: '', motive: '', method: '', location: '', time: '', evidence: [] };
  GS.evidenceConnections = [];
  GS.hintsUsed = 0;
  GS.activeTool = null;
  GS.activePanel = null;
  GS.journal = [];
  GS.boardCards = initBoardCards();
  GS.timerSec = 0;
  GS.currentRoom = 'office';
}

/* ── GAME UI RENDER ──────────────────────────────────────── */
function renderGameUI() {
  const c = getCase();
  const topTitle = $('topbar-title');
  if (topTitle) topTitle.textContent = `${c.num} — ${c.title}`;
  const topCase = $('topbar-case-id');
  if (topCase) topCase.textContent = c.num;
  updateHintDisplay();
  renderRoomMap();
  renderEvidencePanel();
  renderJournal();
  updateTopbarRoom();
}

function updateTopbarRoom() {
  const roomLabel = $('topbar-room');
  if (!roomLabel) return;
  const room = getCase()?.rooms.find(r => r.id === GS.currentRoom);
  if (room) roomLabel.textContent = room.label.toUpperCase();
}

function updateHintDisplay() {
  const el = $('topbar-hints');
  if (el) el.textContent = `HINTS: ${GS.maxHints - GS.hintsUsed}`;
}

/* ── ROOM MAP ────────────────────────────────────────────── */
function renderRoomMap() {
  const el = $('room-map');
  if (!el) return;
  const rooms = getCase()?.rooms || [];
  el.innerHTML = rooms.map(r => {
    const unlocked = GS.unlockedRooms.includes(r.id);
    const current  = r.id === GS.currentRoom;
    const evCount  = countRoomEvidence(r.id);
    const cls = `room-btn${current ? ' current' : ''}${!unlocked ? ' locked-room' : ''}`;
    return `<button class="${cls}" onclick="changeRoom('${r.id}')" ${!unlocked ? 'disabled' : ''}>
      <span class="room-dot"></span>
      ${r.icon} ${r.label.split(' ')[0]}
      ${evCount > 0 ? `<span class="room-evidence-count">${evCount}</span>` : ''}
    </button>`;
  }).join('');
}

function countRoomEvidence(roomId) {
  return (getCase()?.evidence || []).filter(e =>
    e.room === roomId && !GS.inventory.includes(e.id)
  ).length;
}

/* ── CRIME SCENE RENDER ──────────────────────────────────── */
function renderScene(roomId) {
  GS.currentRoom = roomId;
  const scene = $('crime-scene');
  if (!scene) return;

  // Room backgrounds
  const bg = scene.querySelector('.scene-bg');
  if (bg) {
    bg.className = 'scene-bg';
    const bgMap = { office: 'office', archive: 'archive', security: 'server', server: 'server' };
    bg.classList.add(bgMap[roomId] || 'office');
  }

  // Render objects
  const objLayer = $('scene-objects');
  if (!objLayer) return;
  objLayer.innerHTML = '';

  const objects = GAME_DATA.roomObjects[roomId] || [];
  objects.forEach(obj => {
    const div = document.createElement('div');
    div.className = 'scene-item';
    div.id = `scene-obj-${obj.id}`;

    const styleStr = Object.entries(obj.pos).map(([k,v]) => `${k}:${v}`).join(';');
    const sizeStr  = Object.entries(obj.size).map(([k,v]) => `${k}:${v}`).join(';');

    // Check if evidence already collected
    const allCollected = (obj.evidenceIds || []).every(id => GS.inventory.includes(id));
    const hasSparkle = (obj.evidenceIds || []).some(id => !GS.inventory.includes(id));

    div.innerHTML = `
      <div class="item-highlight" style="position:absolute;${styleStr};${sizeStr};display:flex;align-items:center;justify-content:center;">
        <span style="font-size:1.4rem;opacity:${allCollected ? .3 : .85}">${obj.icon}</span>
        ${hasSparkle ? '<div class="evidence-sparkle"></div>' : ''}
      </div>
      <div class="item-tooltip" style="${styleStr};position:absolute;">${obj.label}</div>`;

    div.style.cssText = `position:absolute;${styleStr};${sizeStr};`;
    div.onclick = () => inspectObject(obj.id);
    objLayer.appendChild(div);
  });

  // UV reveals
  const uvLayer = $('scene-uv-layer');
  if (uvLayer) {
    uvLayer.innerHTML = objects
      .filter(o => o.uvReveal)
      .map(o => `<div class="uv-reveal" style="position:absolute;${Object.entries(o.pos).map(([k,v])=>`${k}:${v}`).join(';')};font-size:.7rem;padding:4px 8px;background:rgba(0,0,0,.7);border:1px solid #ff88ff">${o.uvReveal}</div>`)
      .join('');
  }

  updateTopbarRoom();
  renderRoomMap();
}

/* ── OBJECT INSPECTION ───────────────────────────────────── */
function inspectObject(objId) {
  const room = GS.currentRoom;
  const obj = (GAME_DATA.roomObjects[room] || []).find(o => o.id === objId);
  if (!obj) return;

  // UV tool required
  if (obj.toolRequired === 'uv' && GS.activeTool !== 'uv') {
    notify('This area requires UV Scanner to examine.', 'warning');
    return;
  }

  // Build actions
  const actions = [];
  const pendingEvidence = (obj.evidenceIds || []).filter(id => !GS.inventory.includes(id));

  if (pendingEvidence.length > 0) {
    actions.push(`<button class="action-btn collect" onclick="collectEvidence('${pendingEvidence[0]}', '${objId}')">COLLECT EVIDENCE</button>`);
  }
  if (obj.puzzleId && !GS.solvedPuzzles.includes(obj.puzzleId)) {
    actions.push(`<button class="action-btn solve" onclick="openPuzzle('${obj.puzzleId}')">SOLVE PUZZLE</button>`);
  }
  actions.push(`<button class="action-btn leave" onclick="closeInspectPanel()">LEAVE</button>`);

  const panel = $('inspect-panel');
  const inner = $('inspect-inner');
  if (!panel || !inner) return;

  inner.innerHTML = `
    <div class="inspect-icon">${obj.icon}</div>
    <div class="inspect-content">
      <div class="inspect-name">${obj.label}</div>
      <div class="inspect-observation">${obj.uvReveal && GS.activeTool === 'uv' ? `<span style="color:#ff88ff">UV SCAN: ${obj.uvReveal}</span>` : obj.observation}</div>
      <div class="inspect-actions">${actions.join('')}</div>
    </div>
    <button class="inspect-close" onclick="closeInspectPanel()">✕</button>`;

  panel.classList.add('open');
}

function closeInspectPanel() {
  const panel = $('inspect-panel');
  if (panel) panel.classList.remove('open');
}

/* ── EVIDENCE COLLECTION ─────────────────────────────────── */
function collectEvidence(evidenceId, objId) {
  if (GS.inventory.includes(evidenceId)) return;
  const ev = getEvidence(evidenceId);
  if (!ev) return;

  // Check requirement
  if (ev.requiresEvidence && !GS.inventory.includes(ev.requiresEvidence)) {
    notify('You need to find something else first.', 'warning');
    return;
  }

  GS.inventory.push(evidenceId);
  ev.collected = true;

  // Show notification
  const notif = $('ev-notif');
  if (notif) {
    notif.textContent = `NEW EVIDENCE: ${ev.num} — ${ev.name}`;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2500);
  }

  notify(`Collected: ${ev.name}`, 'success');
  addJournal(`Evidence collected: ${ev.num} — ${ev.name} (${ev.room})`);
  checkAchievement('evidence_count_1');
  if (GS.inventory.length === getCase().evidenceTotal) checkAchievement('all_evidence');

  // Refresh UI
  renderScene(GS.currentRoom);
  renderEvidencePanel();
  updateSidebarBadges();
  autoSave();
}

/* ── EVIDENCE PANEL ──────────────────────────────────────── */
function renderEvidencePanel() {
  const el = $('evidence-panel');
  if (!el) return;

  const c = getCase();
  const evProgress = $('ev-progress');
  if (evProgress) evProgress.textContent = `${GS.inventory.length} / ${c.evidenceTotal}`;

  el.innerHTML = GS.inventory.length === 0
    ? '<div class="muted" style="font-size:.75rem;padding:8px">No evidence collected yet.</div>'
    : GS.inventory.map(id => {
        const ev = getEvidence(id);
        if (!ev) return '';
        const analyzed = GS.analyzedEvidence.includes(id);
        return `
          <div class="ev-item" onclick="showEvidenceDetail('${id}')">
            <div class="ev-item-header">
              <span class="ev-id">${ev.num}</span>
              <span class="ev-cat ${ev.category}">${ev.category.toUpperCase()}</span>
            </div>
            <div class="ev-name">${ev.name}</div>
            <div class="ev-location">${ev.room.toUpperCase()}</div>
            <div class="ev-status ${analyzed ? 'analyzed' : 'pending'}">${analyzed ? '✓ ANALYZED' : '● PENDING ANALYSIS'}</div>
            ${!analyzed ? `<button class="ev-analyze-btn" onclick="analyzeEvidence('${id}',event)">ANALYZE</button>` : ''}
          </div>`;
      }).join('');
}

function showEvidenceDetail(id) {
  const ev = getEvidence(id);
  if (!ev) return;
  const analyzed = GS.analyzedEvidence.includes(id);
  const detail = analyzed
    ? `<strong style="color:var(--green)">ANALYSIS COMPLETE</strong><br><br>${ev.analysisResult}`
    : ev.description;
  openDetailModal(ev.num + ' — ' + ev.name, detail, ev.category);
}

function analyzeEvidence(id, e) {
  if (e) e.stopPropagation();
  if (GS.analyzedEvidence.includes(id)) return;
  const ev = getEvidence(id);
  if (!ev) return;
  GS.analyzedEvidence.push(id);
  ev.analyzed = true;
  notify(`Analysis complete: ${ev.name}`, 'success');
  addJournal(`Evidence analyzed: ${ev.num} — ${ev.analysisResult.slice(0,60)}…`);
  renderEvidencePanel();
  updateSidebarBadges();
  autoSave();
  openDetailModal(ev.num + ' — ' + ev.name, `<strong style="color:var(--green)">ANALYSIS COMPLETE</strong><br><br>${ev.analysisResult}`, ev.category);
}

/* ── DETAIL MODAL ────────────────────────────────────────── */
function openDetailModal(title, body, type) {
  const m = $('detail-modal');
  const mt = $('detail-modal-title');
  const mb = $('detail-modal-body');
  if (!m || !mt || !mb) return;
  mt.textContent = title;
  mb.innerHTML = body;
  m.style.display = 'flex';
  // Set border color by type
  const box = m.querySelector('.puzzle-box');
  if (box) {
    const colors = { digital: 'var(--cyan)', physical: 'var(--amber)', document: 'var(--purple)', surveillance: 'var(--green)' };
    box.style.borderColor = colors[type] || 'var(--border2)';
  }
}
function closeDetailModal() {
  const m = $('detail-modal');
  if (m) m.style.display = 'none';
}

/* ── SIDEBAR BADGES ──────────────────────────────────────── */
function updateSidebarBadges() {
  const pending = GS.inventory.filter(id => !GS.analyzedEvidence.includes(id)).length;
  const labBtn = $('sidenav-lab');
  if (labBtn) { labBtn.dataset.badge = pending > 0 ? pending : ''; labBtn.classList.toggle('has-badge', pending > 0); }
}

/* ── TOOLS ───────────────────────────────────────────────── */
function toggleTool(tool) {
  GS.activeTool = GS.activeTool === tool ? null : tool;
  const scene = $('crime-scene');
  if (scene) {
    scene.classList.toggle('uv-mode', GS.activeTool === 'uv');
    scene.classList.toggle('magnifier-mode', GS.activeTool === 'magnifier');
  }
  document.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === GS.activeTool);
  });
  if (GS.activeTool) {
    const toolNames = { uv: 'UV SCANNER ACTIVE', magnifier: 'MAGNIFIER ACTIVE', camera: 'CAMERA READY', gloves: 'EVIDENCE GLOVES', analyzer: 'DIGITAL ANALYZER', kit: 'SAMPLE KIT', signal: 'SIGNAL SCANNER', decoder: 'ACCESS DECODER' };
    notify(toolNames[tool] || tool, 'info', 2000);
  }
}

/* ── ROOM CHANGE ─────────────────────────────────────────── */
function changeRoom(roomId) {
  if (!GS.unlockedRooms.includes(roomId)) { notify('Area locked. Find the required access.', 'warning'); return; }
  closeInspectPanel();
  renderScene(roomId);
  addJournal(`Moved to: ${roomId}`);
}

/* ── PUZZLES ─────────────────────────────────────────────── */
function openPuzzle(puzzleId) {
  const puzzle = getPuzzle(puzzleId);
  if (!puzzle) return;
  if (GS.solvedPuzzles.includes(puzzleId)) { notify('This puzzle is already solved.', 'info'); return; }

  GS.activePuzzleId = puzzleId;
  closeInspectPanel();

  // Route to puzzle type
  switch (puzzle.type) {
    case 'combination': openComboPuzzle(puzzle); break;
    case 'password':    openPasswordPuzzle(puzzle); break;
    case 'pattern':     openPatternPuzzle(puzzle); break;
    case 'keycard':     openKeycardPuzzle(puzzle); break;
    default:            openPasswordPuzzle(puzzle);
  }
}

/* Combo lock */
function openComboPuzzle(puzzle) {
  const overlay = $('puzzle-combo');
  if (!overlay) return;
  const title = overlay.querySelector('.puzzle-title');
  const hint  = overlay.querySelector('.puzzle-hint');
  if (title) title.textContent = puzzle.title;
  if (hint)  hint.textContent  = puzzle.hint;
  // init dials
  const dials = overlay.querySelector('.combo-dials');
  if (dials) {
    window._comboValues = puzzle.solution.map(() => 0);
    dials.innerHTML = window._comboValues.map((v,i) => `
      <div class="combo-dial">
        <button class="dial-btn" onclick="adjustDial(${i},1)">▲</button>
        <div class="dial-display" id="dial-${i}">${v}</div>
        <button class="dial-btn" onclick="adjustDial(${i},-1)">▼</button>
      </div>`).join('');
  }
  const fb = overlay.querySelector('.puzzle-feedback');
  if (fb) { fb.className = 'puzzle-feedback'; fb.textContent = ''; }
  overlay.classList.add('open');
}

function adjustDial(i, dir) {
  window._comboValues[i] = (window._comboValues[i] + dir + 10) % 10;
  const el = $(`dial-${i}`);
  if (el) el.textContent = window._comboValues[i];
}

function submitCombo() {
  const puzzle = getPuzzle(GS.activePuzzleId);
  if (!puzzle) return;
  const correct = puzzle.solution.every((v,i) => window._comboValues[i] === v);
  const fb = document.querySelector('#puzzle-combo .puzzle-feedback');
  if (correct) {
    if (fb) { fb.className = 'puzzle-feedback success'; fb.textContent = '✓ ' + puzzle.rewardMessage; }
    setTimeout(() => { closePuzzle('puzzle-combo'); onPuzzleSolved(puzzle); }, 1200);
  } else {
    if (fb) { fb.className = 'puzzle-feedback error'; fb.textContent = '✗ Incorrect combination. Review your evidence.'; }
  }
}

/* Password lock */
function openPasswordPuzzle(puzzle) {
  const overlay = $('puzzle-password');
  if (!overlay) return;
  const title = overlay.querySelector('.puzzle-title');
  const hint  = overlay.querySelector('.puzzle-hint');
  if (title) title.textContent = puzzle.title;
  if (hint)  hint.textContent  = puzzle.hint;
  const input = overlay.querySelector('.password-input');
  if (input) input.value = '';
  const fb = overlay.querySelector('.puzzle-feedback');
  if (fb) { fb.className = 'puzzle-feedback'; fb.textContent = ''; }
  overlay.classList.add('open');
  if (input) setTimeout(() => input.focus(), 100);
}

function submitPassword() {
  const puzzle = getPuzzle(GS.activePuzzleId);
  if (!puzzle) return;
  const input = document.querySelector('#puzzle-password .password-input');
  const val   = (input?.value || '').trim().toUpperCase();
  const fb    = document.querySelector('#puzzle-password .puzzle-feedback');
  if (val === puzzle.solution.toUpperCase()) {
    if (fb) { fb.className = 'puzzle-feedback success'; fb.textContent = '✓ ' + puzzle.rewardMessage; }
    setTimeout(() => { closePuzzle('puzzle-password'); onPuzzleSolved(puzzle); }, 1200);
  } else {
    if (fb) { fb.className = 'puzzle-feedback error'; fb.textContent = '✗ ' + (puzzle.solutionHint ? `Incorrect. Hint: ${puzzle.solutionHint}` : 'Incorrect. Look for more clues.'); }
  }
}

/* Pattern puzzle */
function openPatternPuzzle(puzzle) {
  const overlay = $('puzzle-pattern');
  if (!overlay) return;
  const title = overlay.querySelector('.puzzle-title');
  const hint  = overlay.querySelector('.puzzle-hint');
  if (title) title.textContent = puzzle.title;
  if (hint)  hint.textContent  = puzzle.hint;
  window._patternSelected = [];
  const grid = overlay.querySelector('.pattern-grid');
  if (grid) {
    const symbols = ['★', '△', '○', '□', '◆', '☽', '✦', '⊕'];
    grid.style.gridTemplateColumns = 'repeat(4,1fr)';
    grid.innerHTML = symbols.map((s,i) =>
      `<div class="pattern-cell" onclick="togglePattern('${s}',this)">${s}</div>`
    ).join('');
  }
  const fb = overlay.querySelector('.puzzle-feedback');
  if (fb) { fb.className = 'puzzle-feedback'; fb.textContent = ''; }
  overlay.classList.add('open');
}

function togglePattern(sym, el) {
  const idx = window._patternSelected.indexOf(sym);
  if (idx >= 0) { window._patternSelected.splice(idx,1); el.classList.remove('selected'); }
  else if (window._patternSelected.length < 4) { window._patternSelected.push(sym); el.classList.add('selected'); }
}

function submitPattern() {
  const puzzle = getPuzzle(GS.activePuzzleId);
  if (!puzzle) return;
  const correct = JSON.stringify(window._patternSelected) === JSON.stringify(puzzle.solution);
  const fb = document.querySelector('#puzzle-pattern .puzzle-feedback');
  if (correct) {
    document.querySelectorAll('#puzzle-pattern .pattern-cell.selected').forEach(c => c.classList.add('correct'));
    if (fb) { fb.className = 'puzzle-feedback success'; fb.textContent = '✓ ' + puzzle.rewardMessage; }
    setTimeout(() => { closePuzzle('puzzle-pattern'); onPuzzleSolved(puzzle); }, 1200);
  } else {
    if (fb) { fb.className = 'puzzle-feedback error'; fb.textContent = '✗ Incorrect sequence. Review the archive symbols.'; }
    window._patternSelected = [];
    document.querySelectorAll('#puzzle-pattern .pattern-cell').forEach(c => c.classList.remove('selected'));
  }
}

/* Keycard puzzle */
function openKeycardPuzzle(puzzle) {
  if (!puzzle.requiresEvidence) { onPuzzleSolved(puzzle); return; }
  if (GS.inventory.includes(puzzle.requiresEvidence)) {
    notify(puzzle.rewardMessage, 'success');
    onPuzzleSolved(puzzle);
  } else {
    notify('You need to find the required item first.', 'warning');
  }
}

function onPuzzleSolved(puzzle) {
  if (GS.solvedPuzzles.includes(puzzle.id)) return;
  GS.solvedPuzzles.push(puzzle.id);
  notify(`PUZZLE SOLVED: ${puzzle.title}`, 'success', 4000);
  addJournal(`Puzzle solved: ${puzzle.title}`);

  // Unlock room
  if (puzzle.unlockRoom && !GS.unlockedRooms.includes(puzzle.unlockRoom)) {
    GS.unlockedRooms.push(puzzle.unlockRoom);
    notify(`NEW AREA UNLOCKED: ${puzzle.unlockRoom.toUpperCase()}`, 'info', 4000);
    addJournal(`Area unlocked: ${puzzle.unlockRoom}`);
  }

  // Reward evidence
  (puzzle.reward || []).forEach(evId => {
    if (!GS.inventory.includes(evId)) collectEvidence(evId, null);
  });

  renderScene(GS.currentRoom);
  renderRoomMap();
  checkAchievement('connections_5');
  autoSave();
}

function closePuzzle(overlayId) {
  const el = $(overlayId);
  if (el) el.classList.remove('open');
  GS.activePuzzleId = null;
}

/* ── FORENSIC LAB ─────────────────────────────────────────── */
function openPanel(panelId) {
  document.querySelectorAll('.fullpanel').forEach(p => p.classList.remove('open'));
  const panel = $(`panel-${panelId}`);
  if (panel) panel.classList.add('open');
  GS.activePanel = panelId;
  closeInspectPanel();

  switch (panelId) {
    case 'lab':       renderLabPanel();       break;
    case 'suspects':  renderSuspectsPanel();  break;
    case 'board':     renderBoardPanel();     break;
    case 'timeline':  renderTimelinePanel();  break;
    case 'theory':    renderTheoryPanel();    break;
    case 'report':    renderReportPanel();    break;
  }
}

function closePanel() {
  document.querySelectorAll('.fullpanel').forEach(p => p.classList.remove('open'));
  GS.activePanel = null;
}

/* LAB */
function renderLabPanel() {
  const body = $('lab-body');
  if (!body) return;
  const pendingEv = GS.inventory.filter(id => !GS.analyzedEvidence.includes(id));
  const analyzedEv = GS.analyzedEvidence;

  body.innerHTML = `
    <div class="lab-grid">
      ${renderFingerprintStation()}
      ${renderCCTVStation()}
      ${renderDocumentStation()}
      ${renderDigitalStation()}
    </div>`;
}

function renderFingerprintStation() {
  const fpEvidence = GS.inventory.find(id => getEvidence(id)?.category === 'physical' && getEvidence(id)?.analysisResult?.includes('ridge') || getEvidence(id)?.analysisResult?.includes('fingerprint'));
  return `
    <div class="lab-station">
      <div class="lab-station-header">🖐️ FINGERPRINT ANALYSIS</div>
      <div class="lab-station-body">
        <div class="lab-subject">Compare discovered print against suspect samples.</div>
        <div class="fingerprint-display">
          ${getCase().suspects.map(s => `
            <div class="fp-card" id="fp-${s.id}" onclick="comparePrint('${s.id}')">
              <div class="fp-pattern"><div class="${s.id === 'S003' ? 'fp-loop' : s.id === 'S001' ? 'fp-whorl' : 'fp-arch'}"></div></div>
              <div class="fp-name">${s.name.split(' ')[1]}</div>
            </div>`).join('')}
        </div>
        <div class="lab-result" id="fp-result"></div>
        <button class="lab-analyze-btn" onclick="runFingerprintAnalysis()">RUN COMPARISON</button>
      </div>
    </div>`;
}

function comparePrint(suspId) {
  document.querySelectorAll('.fp-card').forEach(c => c.classList.remove('match','nomatch'));
}

function runFingerprintAnalysis() {
  const res = $('fp-result');
  if (!res) return;
  const hasWindow = GS.inventory.includes('E006');
  if (hasWindow) {
    res.className = 'lab-result match';
    res.innerHTML = `PARTIAL MATCH DETECTED<br>Characteristics consistent with D.REED<br>Confidence: 78%<br><span style="font-size:.62rem;color:var(--muted)">Prints lifted from window latch.</span>`;
    notify('Fingerprint match found — review results', 'success');
  } else {
    res.className = 'lab-result inconclusive';
    res.innerHTML = `INSUFFICIENT SAMPLE<br>Collect more physical evidence to compare.`;
  }
}

function renderCCTVStation() {
  const hasFootage = GS.inventory.includes('E012');
  const events = hasFootage ? getCase().evidence.find(e => e.id === 'E012') : null;
  return `
    <div class="lab-station">
      <div class="lab-station-header">📹 CCTV ANALYSIS</div>
      <div class="lab-station-body">
        <div class="cctv-viewer">
          <div class="cctv-screen">
            <div class="cctv-timestamp" id="cctv-ts">--:-- NO SIGNAL</div>
            <div class="cctv-event-display" id="cctv-display">${hasFootage ? 'FOOTAGE AVAILABLE' : 'No footage loaded'}</div>
          </div>
        </div>
        <div class="cctv-controls">
          <button class="cctv-btn" onclick="cctvPlay()">▶ PLAY</button>
          <button class="cctv-btn" onclick="cctvPause()">⏸ PAUSE</button>
          <button class="cctv-btn" onclick="cctvPrev()">◀ PREV</button>
          <button class="cctv-btn" onclick="cctvNext()">NEXT ▶</button>
        </div>
        <div class="cctv-events" id="cctv-events">
          ${hasFootage ? renderCCTVEvents() : '<div class="muted" style="font-size:.7rem;padding:6px">Collect CCTV evidence first.</div>'}
        </div>
      </div>
    </div>`;
}

function renderCCTVEvents() {
  const cctvEvents = [
    { time: '09:03', desc: 'A.Morgan — Security patrol check', suspicious: false },
    { time: '09:11', desc: 'D.Reed — Enters 4th floor corridor', suspicious: true },
    { time: '09:16', desc: 'Unidentified entry — Room 4F-12', suspicious: true },
    { time: '09:44', desc: 'D.Reed — Exits carrying bag', suspicious: true },
    { time: '09:52', desc: 'CCTV CAMERA DISABLED (Remote)', suspicious: true },
    { time: '10:45', desc: 'Building exit locked by system', suspicious: false }
  ];
  return cctvEvents.map((ev,i) => `
    <div class="cctv-event-item" onclick="showCCTVEvent(${i})">
      <span class="cctv-event-time">${ev.time}</span>
      <span>${ev.desc}</span>
      ${ev.suspicious ? '<span class="cctv-event-suspicious">⚠ SUSPICIOUS</span>' : ''}
    </div>`).join('');
}

function showCCTVEvent(i) {
  const events = ['A.Morgan — Security patrol', 'D.Reed enters corridor', 'Unidentified entry detected', 'Reed exits carrying bag', 'CCTV disabled remotely', 'Building locked'];
  const times = ['09:03','09:11','09:16','09:44','09:52','10:45'];
  const ts = $('cctv-ts'); const disp = $('cctv-display');
  if (ts) ts.textContent = times[i] || '--:--';
  if (disp) disp.textContent = events[i] || '—';
}

function cctvPlay() { if (!GS.inventory.includes('E012')) { notify('Collect CCTV evidence first.', 'warning'); return; } notify('Playing footage...', 'info', 1500); }
function cctvPause() {}
function cctvPrev() { showCCTVEvent(Math.max(0, (GS.cctv.index||0) - 1)); GS.cctv.index = Math.max(0, (GS.cctv.index||0) - 1); }
function cctvNext() { showCCTVEvent(Math.min(5, (GS.cctv.index||0) + 1)); GS.cctv.index = Math.min(5, (GS.cctv.index||0) + 1); }

function renderDocumentStation() {
  const hasDocs = GS.inventory.filter(id => getEvidence(id)?.category === 'document');
  return `
    <div class="lab-station">
      <div class="lab-station-header">📄 DOCUMENT ANALYSIS</div>
      <div class="lab-station-body">
        <div class="lab-subject">Analyze collected documents for forgeries and hidden content.</div>
        ${hasDocs.map(id => {
          const ev = getEvidence(id);
          const analyzed = GS.analyzedEvidence.includes(id);
          return `<div style="margin-bottom:8px">
            <div style="font-size:.72rem;color:var(--white);margin-bottom:4px">${ev.num} — ${ev.name}</div>
            ${analyzed
              ? `<div class="lab-result match" style="display:block">${ev.analysisResult.slice(0,120)}…</div>`
              : `<button class="lab-analyze-btn" onclick="analyzeEvidence('${id}')">ANALYZE DOCUMENT</button>`}
          </div>`;
        }).join('') || '<div class="muted" style="font-size:.7rem">No documents collected.</div>'}
      </div>
    </div>`;
}

function renderDigitalStation() {
  const hasDigital = GS.inventory.filter(id => getEvidence(id)?.category === 'digital');
  return `
    <div class="lab-station">
      <div class="lab-station-header">💻 DIGITAL FORENSICS</div>
      <div class="lab-station-body">
        <div class="lab-subject">Examine digital evidence for access logs, deleted files, and metadata.</div>
        ${hasDigital.map(id => {
          const ev = getEvidence(id);
          const analyzed = GS.analyzedEvidence.includes(id);
          return `<div style="margin-bottom:8px">
            <div style="font-size:.72rem;color:var(--white);margin-bottom:4px">${ev.num} — ${ev.name}</div>
            ${analyzed
              ? `<div class="lab-result match" style="display:block">${ev.analysisResult.slice(0,120)}…</div>`
              : `<button class="lab-analyze-btn" onclick="analyzeEvidence('${id}')">ANALYZE DIGITAL</button>`}
          </div>`;
        }).join('') || '<div class="muted" style="font-size:.7rem">No digital evidence collected.</div>'}
      </div>
    </div>`;
}

/* SUSPECTS */
function renderSuspectsPanel() {
  const body = $('suspects-body');
  if (!body) return;
  const suspects = getCase().suspects;
  body.innerHTML = `
    <div class="suspects-grid">
      ${suspects.map(s => {
        const gs = GS.suspects[s.id] || {};
        const cred = gs.credibility ?? s.credibility;
        return `
          <div class="suspect-card ${GS.activeSuspect === s.id ? 'focus-suspect' : ''}" onclick="selectSuspect('${s.id}')">
            <div class="suspect-photo">${s.emoji}</div>
            <div class="suspect-body">
              <div class="suspect-name">${s.name}</div>
              <div class="suspect-role">${s.role}</div>
              <div class="suspect-credibility">
                <span style="font-size:.6rem;color:var(--muted)">CREDIBILITY</span>
                <div class="credibility-bar"><div class="credibility-fill" style="width:${cred}%"></div></div>
                <span class="credibility-val">${cred}%</span>
              </div>
              <div class="suspect-actions">
                <button class="suspect-btn" onclick="interrogateSuspect('${s.id}',event)">INTERROGATE</button>
                <button class="suspect-btn" onclick="viewProfile('${s.id}',event)">PROFILE</button>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>
    <div id="interrogation-area"></div>`;
}

function selectSuspect(id) {
  GS.activeSuspect = id;
  renderSuspectsPanel();
}

function interrogateSuspect(id, e) {
  if (e) e.stopPropagation();
  GS.activeSuspect = id;
  const s = getSuspect(id);
  if (!s) return;
  const gs = GS.suspects[id];
  if (gs) gs.interviewed = true;
  const area = $('interrogation-area');
  if (!area) return;

  const contradictions = (s.contradictions || []).filter(c => GS.inventory.includes(c.evidence));
  const hasContradiction = contradictions.length > 0;

  area.innerHTML = `
    <div class="interrogation-panel" style="margin-top:20px">
      <div class="interro-subject">
        <div class="interro-photo">${s.emoji}</div>
        <div><div class="interro-name">${s.name}</div><div class="interro-role">${s.role}</div></div>
      </div>
      <div class="interro-statement">"${s.statements.default}"</div>
      ${hasContradiction ? `<div class="interro-contradiction show">⚠ CONTRADICTION DETECTED: ${contradictions[0].text}</div>` : ''}
      <div class="interro-actions">
        <button class="interro-btn" onclick="interroQuestion('${id}')">QUESTION ALIBI</button>
        <button class="interro-btn present" onclick="showEvidenceSelector('${id}')">PRESENT EVIDENCE</button>
        <button class="interro-btn" onclick="interroReturn()">RETURN</button>
      </div>
      <div id="interro-evidence-selector"></div>
      <div id="interro-response" style="margin-top:10px;font-size:.78rem;color:rgba(232,240,250,.8);min-height:20px"></div>
    </div>`;

  if (hasContradiction && gs) {
    const oldCred = gs.credibility;
    gs.credibility = Math.max(10, oldCred - 20);
    addJournal(`Contradiction found in ${s.name}'s statement.`);
    notify(`${s.name}'s credibility reduced.`, 'warning');
  }
  addJournal(`Interrogated: ${s.name}`);
}

function interroQuestion(suspId) {
  const s = getSuspect(suspId);
  const resp = $('interro-response');
  if (resp) resp.innerHTML = `<em>"${s.statements.alibi_detail}"</em>`;
}

function showEvidenceSelector(suspId) {
  const sel = $('interro-evidence-selector');
  if (!sel) return;
  const s = getSuspect(suspId);
  const linked = (s.evidenceLinks || []).filter(id => GS.inventory.includes(id));
  if (linked.length === 0) { notify('No relevant evidence collected yet.', 'warning'); return; }
  sel.innerHTML = `<div style="margin-top:10px"><div class="muted" style="font-size:.62rem;margin-bottom:6px">SELECT EVIDENCE TO PRESENT:</div>
    <div class="evidence-selector">${linked.map(id => {
      const ev = getEvidence(id);
      return `<button class="ev-select-btn" onclick="presentEvidence('${suspId}','${id}')">${ev.num}: ${ev.name}</button>`;
    }).join('')}</div></div>`;
}

function presentEvidence(suspId, evidenceId) {
  const s = getSuspect(suspId);
  const ev = getEvidence(evidenceId);
  const gs = GS.suspects[suspId];
  const resp = $('interro-response');
  const contrad = $('interrogation-area .interro-contradiction');

  const isContradiction = (s.contradictions || []).some(c => c.evidence === evidenceId);
  if (isContradiction) {
    if (gs) gs.credibility = Math.max(5, (gs.credibility || 50) - 25);
    const c = s.contradictions.find(c => c.evidence === evidenceId);
    if (contrad) { contrad.classList.add('show'); contrad.textContent = `⚠ CONTRADICTION: ${c.text}`; }
    if (resp) resp.innerHTML = `<strong style="color:var(--red)">Suspect is unable to explain this evidence.</strong>`;
    notify(`Contradiction confirmed with ${ev.num}`, 'warning', 3000);
    addJournal(`Evidence ${ev.num} created contradiction with ${s.name}.`);
  } else {
    if (resp) resp.innerHTML = `<em>"${s.statements.questioned}"</em>`;
  }
  renderSuspectsPanel(); // refresh credibility bars
}

function viewProfile(id, e) {
  if (e) e.stopPropagation();
  const s = getSuspect(id);
  openDetailModal(s.name + ' — SUSPECT PROFILE',
    `<strong>Role:</strong> ${s.role}<br><br><strong>Motive:</strong> ${s.motive}<br><br><strong>Alibi:</strong> ${s.alibi}<br><br><strong>Access:</strong> ${s.access}<br><br><strong>Relationship:</strong> ${s.relationship}`,
    'document');
}

function interroReturn() { renderSuspectsPanel(); }

/* EVIDENCE BOARD */
function initBoardCards() {
  const c = getCase();
  if (!c) return [];
  const cards = [];
  // Evidence cards
  c.evidence.slice(0, 6).forEach((ev, i) => {
    cards.push({ id: ev.id, type: 'evidence-card', title: ev.name, sub: ev.num, x: 30 + (i%3)*180, y: 20 + Math.floor(i/3)*120 });
  });
  // Suspect cards
  c.suspects.forEach((s, i) => {
    cards.push({ id: s.id, type: 'suspect-card', title: s.name, sub: s.role, x: 30 + i*170, y: 320 });
  });
  return cards;
}

function renderBoardPanel() {
  const body = $('board-body');
  if (!body) return;
  body.innerHTML = `
    <div style="margin-bottom:12px;font-size:.78rem;color:var(--muted)">Connect evidence cards to build your case. Drag cards to arrange them.</div>
    <div class="board-controls">
      <button class="board-btn" onclick="addBoardCard('evidence')">+ EVIDENCE</button>
      <button class="board-btn" onclick="addBoardCard('suspect')">+ SUSPECT</button>
      <button class="board-btn active" onclick="validateConnections()">VALIDATE</button>
      <button class="board-btn" onclick="clearBoard()">CLEAR</button>
    </div>
    <div class="eboard-canvas" id="board-canvas">
      <svg class="board-svg" id="board-svg" width="100%" height="100%"></svg>
    </div>`;

  setTimeout(() => renderBoardCards(), 50);
}

function renderBoardCards() {
  const canvas = $('board-canvas');
  if (!canvas) return;
  // Remove existing cards
  canvas.querySelectorAll('.board-card').forEach(c => c.remove());

  const cardsToShow = GS.inventory.length > 0
    ? GS.boardCards.filter(bc => GS.inventory.includes(bc.id) || getCase().suspects.some(s => s.id === bc.id))
    : GS.boardCards;

  cardsToShow.forEach(bc => {
    const card = document.createElement('div');
    card.className = `board-card ${bc.type}`;
    card.id = `bc-${bc.id}`;
    card.style.cssText = `left:${bc.x}px;top:${bc.y}px;`;
    card.innerHTML = `<div class="bc-type">${bc.type.replace('-card','').toUpperCase()}</div><div class="bc-title">${bc.title}</div><div class="bc-sub">${bc.sub}</div><div class="bc-connect" onclick="startConnection('${bc.id}',event)" title="Connect"></div>`;
    makeDraggable(card, bc);
    canvas.appendChild(card);
  });
  drawConnections();
}

function makeDraggable(el, bc) {
  let startX, startY, origX, origY;
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('bc-connect')) return;
    startX = e.clientX; startY = e.clientY;
    origX = bc.x; origY = bc.y;
    const onMove = ev => {
      bc.x = origX + ev.clientX - startX;
      bc.y = origY + ev.clientY - startY;
      el.style.left = bc.x + 'px';
      el.style.top  = bc.y + 'px';
      drawConnections();
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

let _connectionFrom = null;
function startConnection(id, e) {
  e.stopPropagation();
  if (!_connectionFrom) {
    _connectionFrom = id;
    notify('Click another card to connect.', 'info', 2000);
  } else {
    if (_connectionFrom !== id) {
      const exists = GS.evidenceConnections.find(c => (c.from === _connectionFrom && c.to === id) || (c.from === id && c.to === _connectionFrom));
      if (!exists) GS.evidenceConnections.push({ from: _connectionFrom, to: id, validated: false });
    }
    _connectionFrom = null;
    drawConnections();
  }
}

function drawConnections() {
  const svg = $('board-svg');
  const canvas = $('board-canvas');
  if (!svg || !canvas) return;
  svg.innerHTML = '';
  GS.evidenceConnections.forEach(conn => {
    const fromEl = $(`bc-${conn.from}`);
    const toEl   = $(`bc-${conn.to}`);
    if (!fromEl || !toEl) return;
    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const x1 = fr.left - cr.left + fr.width/2;
    const y1 = fr.top  - cr.top  + fr.height/2;
    const x2 = tr.left - cr.left + tr.width/2;
    const y2 = tr.top  - cr.top  + tr.height/2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.className.baseVal = `board-connection${conn.validated ? ' validated' : ''}`;
    svg.appendChild(line);
  });
}

function addBoardCard(type) {
  const c = getCase();
  if (type === 'evidence') {
    const available = GS.inventory.filter(id => !GS.boardCards.some(bc => bc.id === id));
    if (available.length === 0) { notify('All evidence already on board.', 'info'); return; }
    const id = available[0];
    const ev = getEvidence(id);
    GS.boardCards.push({ id, type: 'evidence-card', title: ev.name, sub: ev.num, x: 50 + Math.random()*200, y: 50 + Math.random()*100 });
  } else {
    const available = c.suspects.filter(s => !GS.boardCards.some(bc => bc.id === s.id));
    if (available.length === 0) { notify('All suspects already on board.', 'info'); return; }
    const s = available[0];
    GS.boardCards.push({ id: s.id, type: 'suspect-card', title: s.name, sub: s.role, x: 200 + Math.random()*200, y: 300 });
  }
  renderBoardCards();
}

function validateConnections() {
  const sol = getCase().solution;
  let correct = 0;
  GS.evidenceConnections.forEach(conn => {
    const validLinks = (getEvidence(conn.from)?.connections || []).includes(conn.to) ||
                       (getEvidence(conn.to)?.connections || []).includes(conn.from) ||
                       sol.keyEvidence.includes(conn.from) || sol.keyEvidence.includes(conn.to);
    conn.validated = validLinks;
    if (validLinks) correct++;
  });
  notify(`Validated: ${correct} / ${GS.evidenceConnections.length} connections correct.`, correct > 0 ? 'success' : 'warning');
  drawConnections();
  if (correct >= 5) checkAchievement('connections_5');
}

function clearBoard() { GS.evidenceConnections = []; renderBoardCards(); }

/* TIMELINE */
function renderTimelinePanel() {
  const body = $('timeline-body');
  if (!body) return;
  const allEvents = getCase().timeline;
  const shuffled = [...allEvents].sort(() => Math.random() - .5);

  body.innerHTML = `
    <div style="margin-bottom:12px;font-size:.78rem;color:var(--muted)">Arrange the events in the correct chronological order. Click events below to place them.</div>
    <div class="timeline-track">
      <div class="timeline-line"></div>
      ${allEvents.map(ev => {
        const placed = GS.timeline.includes(ev.id);
        return `<div class="timeline-node ${placed ? 'placed' : ''}" id="tn-${ev.id}">
          <div class="timeline-dot"></div>
          <div class="timeline-time">${placed ? ev.time : '??:??'}</div>
          <div class="timeline-desc">${placed ? ev.event : '—'}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="muted" style="font-size:.65rem;margin-bottom:8px">AVAILABLE EVENTS — Click to place in sequence:</div>
    <div class="timeline-bank">
      ${shuffled.filter(ev => !GS.timeline.includes(ev.id)).map(ev => `
        <div class="timeline-token" onclick="placeTimelineEvent('${ev.id}')">
          <span class="tt-time">?</span>
          ${ev.event.slice(0,50)}${ev.event.length > 50 ? '…' : ''}
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="board-btn" onclick="validateTimeline()">VERIFY TIMELINE</button>
      <button class="board-btn" onclick="resetTimeline()">RESET</button>
    </div>
    <div id="timeline-feedback" style="margin-top:8px;font-family:var(--font-mono);font-size:.72rem;min-height:1.2em"></div>`;
}

function placeTimelineEvent(id) {
  if (GS.timeline.includes(id)) return;
  GS.timeline.push(id);
  renderTimelinePanel();
}

function validateTimeline() {
  const allEvs = getCase().timeline;
  const correctOrder = [...allEvs].sort((a,b) => a.correct_order - b.correct_order).map(e => e.id);
  const placed = GS.timeline;
  let correct = 0;
  placed.forEach((id, i) => { if (correctOrder[i] === id) correct++; });
  const pct = placed.length > 0 ? Math.round(correct/allEvs.length*100) : 0;
  const fb = $('timeline-feedback');
  if (fb) {
    if (pct === 100) {
      fb.innerHTML = `<span class="green">✓ TIMELINE VERIFIED — ${pct}% accuracy. Sequence is correct.</span>`;
      // mark nodes correct
      placed.forEach(id => { const el = $(`tn-${id}`); if (el) el.classList.add('correct'); });
    } else {
      fb.innerHTML = `<span class="amber">Timeline ${pct}% accurate. ${placed.length < allEvs.length ? 'Place all events first.' : 'Review event order.'}</span>`;
    }
  }
}

function resetTimeline() { GS.timeline = []; renderTimelinePanel(); }

/* THEORY */
function renderTheoryPanel() {
  const body = $('theory-body');
  if (!body) return;
  const c = getCase();
  const sol = c.solution;
  const confidence = calculateTheoryConfidence();

  body.innerHTML = `
    <div class="theory-panel">
      <div class="theory-title">MY THEORY</div>
      <div class="theory-field">
        <div class="theory-label">PRIME SUSPECT</div>
        <select class="theory-select" id="theory-suspect" onchange="updateTheory('suspect',this.value)">
          <option value="">— Select suspect —</option>
          ${c.suspects.map(s => `<option value="${s.id}" ${GS.theory.suspect === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="theory-field">
        <div class="theory-label">MOTIVE</div>
        <select class="theory-select" id="theory-motive" onchange="updateTheory('motive',this.value)">
          <option value="">— Select motive —</option>
          ${sol.motiveOptions.map(m => `<option value="${m}" ${GS.theory.motive === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="theory-field">
        <div class="theory-label">METHOD</div>
        <select class="theory-select" id="theory-method" onchange="updateTheory('method',this.value)">
          <option value="">— Select method —</option>
          ${sol.methodOptions.map(m => `<option value="${m}" ${GS.theory.method === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="theory-field">
        <div class="theory-label">SUPPORTING EVIDENCE</div>
        <div class="theory-evidence">
          ${GS.inventory.map(id => {
            const ev = getEvidence(id);
            const sel = GS.theory.evidence.includes(id);
            return `<div class="theory-ev-tag ${sel ? 'selected' : ''}" onclick="toggleTheoryEvidence('${id}')">${ev.num}: ${ev.name.slice(0,20)}</div>`;
          }).join('') || '<span class="muted" style="font-size:.72rem">Collect evidence first.</span>'}
        </div>
      </div>
      <div class="theory-confidence">
        <div class="theory-label">THEORY CONFIDENCE</div>
        <div class="confidence-bar"><div class="confidence-fill" style="width:${confidence}%"></div></div>
        <div class="confidence-label">${confidence}%</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="lab-analyze-btn" onclick="openPanel('report')">PROCEED TO FINAL REPORT</button>
    </div>`;
}

function updateTheory(field, value) {
  GS.theory[field] = value;
  const conf = calculateTheoryConfidence();
  const bar  = document.querySelector('.confidence-fill');
  const lbl  = document.querySelector('.confidence-label');
  if (bar) bar.style.width = conf + '%';
  if (lbl) lbl.textContent = conf + '%';
}

function toggleTheoryEvidence(id) {
  const idx = GS.theory.evidence.indexOf(id);
  if (idx >= 0) GS.theory.evidence.splice(idx, 1);
  else GS.theory.evidence.push(id);
  renderTheoryPanel();
}

function calculateTheoryConfidence() {
  const sol = getCase().solution;
  let score = 0;
  if (GS.theory.suspect === sol.culprit) score += 35;
  if (GS.theory.motive  === sol.motive)  score += 20;
  if (GS.theory.method  === sol.method)  score += 15;
  const keyEvidenceFound = sol.keyEvidence.filter(id => GS.theory.evidence.includes(id)).length;
  score += keyEvidenceFound * 7;
  return Math.min(100, score);
}

/* FINAL REPORT */
function renderReportPanel() {
  const body = $('report-body');
  if (!body) return;
  const c = getCase();
  const sol = c.solution;

  body.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:.65rem;color:var(--muted);margin-bottom:16px;letter-spacing:2px">FINAL INVESTIGATION REPORT — CASE ${c.num}</div>
    <div class="report-fields">
      <div class="report-field">
        <div class="report-label">CULPRIT</div>
        <select class="report-select" id="rep-culprit">
          <option value="">— Select —</option>
          ${c.suspects.map(s => `<option value="${s.id}" ${GS.theory.suspect === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="report-field">
        <div class="report-label">MOTIVE</div>
        <select class="report-select" id="rep-motive">
          <option value="">— Select —</option>
          ${sol.motiveOptions.map(m => `<option value="${m}" ${GS.theory.motive === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="report-field">
        <div class="report-label">METHOD</div>
        <select class="report-select" id="rep-method">
          <option value="">— Select —</option>
          ${sol.methodOptions.map(m => `<option value="${m}" ${GS.theory.method === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="report-field">
        <div class="report-label">LOCATION</div>
        <select class="report-select" id="rep-location">
          <option value="">— Select —</option>
          ${sol.locationOptions.map(l => `<option value="${l}">${l}</option>`).join('')}
        </select>
      </div>
      <div class="report-field">
        <div class="report-label">TIME OF INCIDENT</div>
        <select class="report-select" id="rep-time">
          <option value="">— Select —</option>
          ${sol.timeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="report-field" style="margin-bottom:14px">
      <div class="report-label">KEY EVIDENCE (select all that apply)</div>
      <div class="report-evidence-list">
        ${GS.inventory.map(id => {
          const ev = getEvidence(id);
          const sel = GS.theory.evidence.includes(id);
          return `<div class="theory-ev-tag ${sel ? 'selected' : ''}" onclick="toggleTheoryEvidence('${id}')">${ev.num}: ${ev.name.slice(0,22)}</div>`;
        }).join('')}
      </div>
    </div>
    <button class="report-submit" onclick="submitReport()">[ SUBMIT INVESTIGATION REPORT ]</button>`;
}

function submitReport() {
  const culprit  = $('rep-culprit')?.value;
  const motive   = $('rep-motive')?.value;
  const method   = $('rep-method')?.value;
  const location = $('rep-location')?.value;
  const time     = $('rep-time')?.value;

  if (!culprit || !motive || !method || !location || !time) {
    notify('Complete all report fields before submitting.', 'warning');
    return;
  }

  stopTimer();
  GS.score = calculateScore({ culprit, motive, method, location, time });
  saveCompletion();
  closePanel();
  showVerdict();
}

function calculateScore(report) {
  const sol  = getCase().solution;
  const c    = getCase();
  let acc    = 0;

  const culpritCorrect  = report.culprit  === sol.culprit;
  const motiveCorrect   = report.motive   === sol.motive;
  const methodCorrect   = report.method   === sol.method;
  const locationCorrect = report.location === sol.location;
  const timeCorrect     = report.time     === sol.time;
  const keyEv = sol.keyEvidence.filter(id => GS.inventory.includes(id)).length;

  if (culpritCorrect)  acc += 35;
  if (motiveCorrect)   acc += 15;
  if (methodCorrect)   acc += 15;
  if (locationCorrect) acc += 10;
  if (timeCorrect)     acc += 10;
  acc += (keyEv / sol.keyEvidence.length) * 15;
  acc = Math.min(100, Math.round(acc));

  const evPct     = Math.round(GS.inventory.length / c.evidenceTotal * 100);
  const puzzlePct = Math.round(GS.solvedPuzzles.length / c.puzzlesTotal * 100);
  const hintPen   = GS.hintsUsed * 5;
  const timeBonus = GS.timerSec < c.targetTime ? Math.round((1 - GS.timerSec/c.targetTime) * 10) : 0;
  const finalScore = Math.max(0, Math.min(100, Math.round(acc * .6 + evPct * .2 + puzzlePct * .2 - hintPen + timeBonus)));

  let grade, ending;
  if (culpritCorrect && acc >= 90 && GS.hintsUsed === 0 && GS.inventory.length >= c.evidenceTotal - 1) {
    grade = 'S'; ending = 'perfect';
  } else if (culpritCorrect && acc >= 70) {
    grade = 'A'; ending = 'solved';
  } else if (culpritCorrect && acc < 70) {
    grade = 'B'; ending = 'partial';
  } else {
    grade = 'C'; ending = 'wrong';
  }

  // XP
  const xpGain = { S: 200, A: 150, B: 100, C: 50 }[grade] || 50;
  GS.xp += xpGain;
  updateRank();

  return { accuracy: acc, finalScore, evPct, puzzlePct, grade, ending, xpGain, timeSeconds: GS.timerSec, hintsUsed: GS.hintsUsed, culpritCorrect };
}

function updateRank() {
  const ranks = GAME_DATA.ranks;
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (GS.xp >= ranks[i].minXP) { GS.rank = i; break; }
  }
}

/* ── VERDICT SCREEN ──────────────────────────────────────── */
function showVerdict() {
  showScreen('verdict');
  renderVerdict();
}

function renderVerdict() {
  const s  = GS.score;
  const c  = getCase();
  const sol = c.solution;
  const ending = c.endings?.[s.ending] || c.endings?.solved;

  const gradeClass = { S: 'perfect', A: 'solved', B: 'partial', C: 'wrong', D: 'wrong' }[s.grade] || 'solved';

  const vbox = $('verdict-box');
  if (!vbox) return;

  vbox.innerHTML = `
    <div class="verdict-header">
      <div class="verdict-status ${gradeClass}">${ending?.title || 'CASE CLOSED'}</div>
      <div class="verdict-case">CASE ${c.num} — ${c.title}</div>
    </div>
    <div class="verdict-body">
      <div class="verdict-scores">
        <div class="score-item"><span class="score-val">${s.accuracy}%</span><span class="score-lbl">ACCURACY</span></div>
        <div class="score-item"><span class="score-val">${GS.inventory.length}/${c.evidenceTotal}</span><span class="score-lbl">EVIDENCE</span></div>
        <div class="score-item"><span class="score-val">${GS.solvedPuzzles.length}/${c.puzzlesTotal}</span><span class="score-lbl">PUZZLES</span></div>
        <div class="score-item"><span class="score-val">${formatTime(s.timeSeconds)}</span><span class="score-lbl">TIME</span></div>
        <div class="score-item"><span class="score-val">${s.hintsUsed}</span><span class="score-lbl">HINTS USED</span></div>
        <div class="score-item"><span class="score-val ${s.grade === 'S' ? 'cyan' : s.grade === 'A' ? 'green' : s.grade === 'B' ? 'amber' : 'red'}">${s.grade}</span><span class="score-lbl">GRADE</span></div>
      </div>
      <div class="verdict-narrative">${ending?.narrative || sol.motive}</div>
      ${s.ending !== 'wrong' && s.ending !== 'partial' ? renderReconstruction() : ''}
      <div class="verdict-rank">
        <div class="rank-title">INVESTIGATOR RANK</div>
        <div class="rank-name">${GAME_DATA.ranks[GS.rank]?.name || 'TRAINEE'}</div>
      </div>
      <div class="verdict-actions">
        <button class="verdict-btn primary" onclick="showCaseSelect()">CASE FILES</button>
        <button class="verdict-btn secondary" onclick="replayCurrent()">REPLAY CASE</button>
        <button class="verdict-btn secondary" onclick="initMenu()">MAIN MENU</button>
      </div>
    </div>`;
}

function renderReconstruction() {
  const events = getCase().timeline.sort((a,b) => a.correct_order - b.correct_order);
  const evHTML = events.map((ev, i) =>
    `<div class="recon-event" style="animation-delay:${i*.15}s">
      <span class="recon-time">${ev.time}</span>
      <span class="recon-desc">${ev.event}</span>
    </div>`
  ).join('');
  return `<div style="margin-bottom:16px"><div class="muted" style="font-family:var(--font-mono);font-size:.62rem;letter-spacing:2px;margin-bottom:10px">WHAT ACTUALLY HAPPENED</div>${evHTML}</div>`;
}

function replayCurrent() {
  const cid = GS.currentCaseId;
  showScreen('briefing');
  renderBriefing();
}

/* ── HINT SYSTEM ─────────────────────────────────────────── */
function useHint() {
  if (GS.hintsUsed >= GS.maxHints) { notify('No hints remaining.', 'error'); return; }
  GS.hintsUsed++;
  updateHintDisplay();
  const hints = [
    'Look carefully at the desk. Not all items are what they appear.',
    'The clock stopped for a reason. What time did it stop?',
    'The safe combination is related to the evidence you\'ve already found.',
    'Check the computer logs — they reveal who was really there that night.'
  ];
  notify(`HINT ${GS.hintsUsed}: ${hints[GS.hintsUsed - 1] || 'Review all collected evidence carefully.'}`, 'warning', 6000);
}

/* ── SAVE / LOAD ─────────────────────────────────────────── */
function autoSave() {
  const save = {
    caseId: GS.currentCaseId,
    room: GS.currentRoom,
    inventory: [...GS.inventory],
    analyzedEvidence: [...GS.analyzedEvidence],
    solvedPuzzles: [...GS.solvedPuzzles],
    unlockedRooms: [...GS.unlockedRooms],
    suspects: JSON.parse(JSON.stringify(GS.suspects)),
    timeline: [...GS.timeline],
    theory: JSON.parse(JSON.stringify(GS.theory)),
    evidenceConnections: JSON.parse(JSON.stringify(GS.evidenceConnections)),
    hintsUsed: GS.hintsUsed,
    timerSec: GS.timerSec,
    boardCards: JSON.parse(JSON.stringify(GS.boardCards)),
    journal: [...GS.journal],
    xp: GS.xp,
    rank: GS.rank,
    completed: false
  };
  localStorage.setItem(`cv_save_${GS.currentCaseId}`, JSON.stringify(save));
}

function saveCompletion() {
  const save = JSON.parse(localStorage.getItem(`cv_save_${GS.currentCaseId}`) || '{}');
  save.completed = true;
  save.score = GS.score;
  // Unlock next case
  const caseIdx = GAME_DATA.cases.findIndex(c => c.id === GS.currentCaseId);
  if (caseIdx >= 0 && caseIdx < GAME_DATA.cases.length - 1) {
    const savedUnlocks = JSON.parse(localStorage.getItem('cv_unlocks') || '{}');
    savedUnlocks[GAME_DATA.cases[caseIdx + 1].id] = true;
    localStorage.setItem('cv_unlocks', JSON.stringify(savedUnlocks));
  }
  localStorage.setItem(`cv_save_${GS.currentCaseId}`, JSON.stringify(save));
}

function loadSave(caseId) {
  const raw = localStorage.getItem(`cv_save_${caseId}`);
  return raw ? JSON.parse(raw) : null;
}

function loadAllSaves() {
  const saves = {};
  GAME_DATA.cases.forEach(c => {
    const s = loadSave(c.id);
    if (s) saves[c.id] = s;
  });
  return saves;
}

function restoreFromSave(save) {
  GS.inventory = save.inventory || [];
  GS.analyzedEvidence = save.analyzedEvidence || [];
  GS.solvedPuzzles = save.solvedPuzzles || [];
  GS.unlockedRooms = save.unlockedRooms || ['office'];
  GS.suspects = save.suspects || {};
  GS.timeline = save.timeline || [];
  GS.theory = save.theory || { suspect:'', motive:'', method:'', location:'', time:'', evidence:[] };
  GS.evidenceConnections = save.evidenceConnections || [];
  GS.hintsUsed = save.hintsUsed || 0;
  GS.timerSec = save.timerSec || 0;
  GS.boardCards = save.boardCards || initBoardCards();
  GS.journal = save.journal || [];
  GS.xp = save.xp || 0;
  GS.rank = save.rank || 0;
  GS.currentRoom = save.room || 'office';
}

function applyUnlocks() {
  const unlocks = JSON.parse(localStorage.getItem('cv_unlocks') || '{}');
  GAME_DATA.cases.forEach(c => { if (unlocks[c.id]) c.unlocked = true; });
}

/* ── ACHIEVEMENTS ────────────────────────────────────────── */
function checkAchievement(condition) {
  const ach = GAME_DATA.achievements.find(a => a.condition === condition);
  if (!ach || GS.achievements.includes(ach.id)) return;
  GS.achievements.push(ach.id);
  notify(`${ach.icon} ACHIEVEMENT: ${ach.title}`, 'success', 5000);
}

/* ── RIGHTPANEL TABS ─────────────────────────────────────── */
function switchRightTab(tab) {
  document.querySelectorAll('.rptab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.rptab-content').forEach(t => t.classList.remove('active'));
  const tabEl = document.querySelector(`.rptab[data-tab="${tab}"]`);
  const contentEl = $(`rptab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.classList.add('active');
  if (tab === 'evidence') renderEvidencePanel();
  if (tab === 'journal')  renderJournal();
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyUnlocks();
  initMenu();
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (GS.screen !== 'game') return;
    if (e.key === 'Escape') {
      if (GS.activePanel) { closePanel(); return; }
      document.querySelectorAll('.puzzle-overlay.open').forEach(p => p.classList.remove('open'));
      closeInspectPanel();
      $('detail-modal') && ($('detail-modal').style.display = 'none');
    }
    if (e.key === 'h' || e.key === 'H') useHint();
    if (e.key === 'f' || e.key === 'F') toggleTool('uv');
    if (e.key === 'm' || e.key === 'M') toggleTool('magnifier');
  });
});
