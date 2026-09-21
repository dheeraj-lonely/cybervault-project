const evidenceData = [
  {
    id: 'USB-STORAGE',
    category: 'Digital Device',
    evidence: 'USB Drive',
    time: '12:05:22',
    source: 'Investigator_01',
    confidence: 75,
    observation: 'An unlabeled flash drive was found near the finance desk.'
  },
  {
    id: 'MSG-045',
    category: 'Communication',
    evidence: 'Chat Log',
    time: '12:11:38',
    source: 'Investigator_03',
    confidence: 85,
    observation: 'Message thread references a file named “revision final_v2”.'
  },
  {
    id: 'TRACE-118',
    category: 'Browser',
    evidence: 'Browser History',
    time: '12:13:11',
    source: 'Investigator_02',
    confidence: 78,
    observation: 'File preview activity occurred during off-hours access.'
  }
];

const miniGameLibrary = {
  fingerprint: {
    title: 'Fingerprint Match',
    prompt: 'Which suspect match best aligns with the ridge pattern found on the evidence bag?',
    options: ['Matt Oakes', 'Ari Chen', 'Nia Brooks', 'No match'],
    answer: 'Ari Chen',
    result: 'The ridge pattern aligns with Ari Chen, matching the latent print chain noted in the evidence workbook.'
  },
  dna: {
    title: 'DNA Strand Analysis',
    prompt: 'Which DNA sequence best matches the recovered trace from the finance device?',
    options: ['CGA-TTG-ACC', 'GTA-ACG-ACT', 'ATG-CGG-TTA', 'CTA-TGG-CCA'],
    answer: 'GTA-ACG-ACT',
    result: 'The recovered DNA sample matches the sequence from the warehouse access log and confirms continuity.'
  },
  cctv: {
    title: 'CCTV Timeline',
    prompt: 'Which timestamp best matches the moment the suspect entered the archive wing?',
    options: ['09:42', '11:08', '12:34', '14:18'],
    answer: '12:34',
    result: 'The footage confirms the suspect entered at 12:34, which aligns with the USB transfer and file access spike.'
  },
  document: {
    title: 'Document Reassembly',
    prompt: 'Which fragment completes the hidden clue in the torn ledger?',
    options: ['Revision final_v2', 'Quarterly memo', 'Transfer schedule', 'Security note'],
    answer: 'Revision final_v2',
    result: 'The document fragment reveals the project name “revision final_v2,” connecting the rogue device to the data movement.'
  }
};

const state = {
  selectedCase: 'CV-014',
  progress: 20,
  confidence: 82,
  currentLevel: 'beginner',
  selectedEvidence: evidenceData[0]
};

function updateCaseProgress() {
  const progressBar = document.querySelector('#case-progress-bar');
  const progressText = document.querySelector('#progress-value');
  const confidenceText = document.querySelector('#confidence-value');
  const evidenceCount = document.querySelector('#evidence-count');

  if (progressBar) progressBar.style.width = `${Math.min(100, state.progress)}%`;
  if (progressText) progressText.textContent = `${Math.min(100, state.progress)}%`;
  if (confidenceText) confidenceText.textContent = `${state.confidence}%`;
  if (evidenceCount) evidenceCount.textContent = String(Math.min(5, evidenceData.length));
}

function selectEvidence(itemId) {
  const selectedEvidence = evidenceData.find((entry) => entry.id === itemId) || evidenceData[0];
  state.selectedEvidence = selectedEvidence;

  document.querySelectorAll('.evidence-line').forEach((line) => {
    line.classList.toggle('selected', line.dataset.evidence === itemId);
  });

  const obs = document.querySelector('#evidence-observation');
  const type = document.querySelector('#evidence-type');
  const category = document.querySelector('#evidence-category');
  const ts = document.querySelector('#evidence-time');
  const source = document.querySelector('#evidence-source');

  if (obs) obs.textContent = selectedEvidence.observation;
  if (type) type.textContent = selectedEvidence.evidence;
  if (category) category.textContent = selectedEvidence.category;
  if (ts) ts.textContent = selectedEvidence.time;
  if (source) source.textContent = selectedEvidence.source;

  state.confidence = Math.min(98, selectedEvidence.confidence + 4);
  updateCaseProgress();
}

function renderSuggestions() {
  const list = document.getElementById('course-suggestions-list');
  if (!list) return;

  const suggestions = [
    { title: 'Evidence Handling Basics', level: 'Beginner', detail: 'Review custody, labeling, and imaging rules.' },
    { title: 'Timeline Correlation', level: 'Intermediate', detail: 'Connect access logs, browser data, and messages.' },
    { title: 'Incident Reporting', level: 'Advanced', detail: 'Turn findings into a defensible final report.' }
  ];

  list.innerHTML = suggestions.map((item) => `
    <div class="mini-suggestion-item">
      <strong>${item.title}</strong>
      <span>${item.level}</span>
      <small>${item.detail}</small>
    </div>
  `).join('');
}

function renderProgressList() {
  const list = document.getElementById('course-progress-list');
  if (!list) return;

  const progressItems = [
    { title: 'Digital evidence collection', value: '86%' },
    { title: 'Case timeline review', value: '71%' },
    { title: 'Final report writing', value: '64%' }
  ];

  list.innerHTML = progressItems.map((item) => `
    <div class="mini-progress-item">
      <div class="mini-progress-head">
        <strong>${item.title}</strong>
        <span>${item.value}</span>
      </div>
      <div class="mini-progress-bar"><span style="width:${item.value}"></span></div>
    </div>
  `).join('');
}

function renderStreakSummary() {
  const node = document.getElementById('streak-summary');
  if (!node) return;

  const streaks = [
    { day: 'Mon', value: 5 },
    { day: 'Tue', value: 8 },
    { day: 'Wed', value: 10 },
    { day: 'Thu', value: 7 },
    { day: 'Fri', value: 9 },
    { day: 'Sat', value: 11 },
    { day: 'Sun', value: 13 }
  ];

  node.innerHTML = `
    <div class="streak-box">
      <span class="streak-number">13</span>
      <small>Active training streak</small>
    </div>
    <div class="streak-mini-grid">
      ${streaks.map((item) => `<div><strong>${item.day}</strong><span>${item.value}</span></div>`).join('')}
    </div>
  `;
}

function attachLevelButtons() {
  document.querySelectorAll('.level-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.level || 'beginner';
      state.currentLevel = level;
      document.querySelectorAll('.level-toggle').forEach((toggle) => toggle.classList.toggle('active', toggle === button));
      const response = document.getElementById('ai-response');
      if (response) {
        response.textContent = `Level switched to ${level}. The forensic workflow is now tuned for ${level} case complexity.`;
      }
    });
  });
}

function setupMiniGames() {
  const grid = document.getElementById('mini-game-grid');
  const panel = document.getElementById('mini-game-panel');
  if (!grid || !panel) return;

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.mini-game-card');
    if (!button) return;

    const gameKey = button.dataset.game;
    const game = miniGameLibrary[gameKey];
    if (!game) return;

    panel.innerHTML = `
      <h3 class="game-play-title">${game.title}</h3>
      <p class="mini-copy">${game.prompt}</p>
      <div class="game-options">
        ${game.options.map((option) => `
          <button class="game-option" type="button" data-correct="${option === game.answer}">${option}</button>
        `).join('')}
      </div>
      <div class="game-result">Pick an answer to test your forensic theory.</div>
    `;

    panel.querySelectorAll('.game-option').forEach((optionButton) => {
      optionButton.addEventListener('click', () => {
        const isCorrect = optionButton.dataset.correct === 'true';
        const resultNode = panel.querySelector('.game-result');
        if (!resultNode) return;

        resultNode.textContent = isCorrect ? `Correct: ${game.result}` : `Not quite. ${game.result}`;
        state.progress = Math.min(100, state.progress + 8);
        state.confidence = Math.min(100, state.confidence + 2);
        updateCaseProgress();
      });
    });
  });
}

function attachEvidenceInteractions() {
  document.querySelectorAll('.evidence-line').forEach((line) => {
    line.addEventListener('click', () => selectEvidence(line.dataset.evidence));
  });

  const refreshButton = document.getElementById('refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      state.progress = 20;
      state.confidence = 82;
      selectEvidence('USB-STORAGE');
      const result = document.getElementById('analysis-result');
      if (result) result.textContent = 'Signal correlation pending.';
      const artifact = document.getElementById('artifact-request');
      if (artifact) artifact.textContent = 'No request active.';
    });
  }

  const analyzeButton = document.getElementById('analyze-button');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', () => {
      state.progress = Math.min(80, state.progress + 15);
      state.confidence = Math.min(98, state.confidence + 6);
      const result = document.getElementById('analysis-result');
      if (result) result.textContent = 'Signal correlation complete: USB access, browser preview, and chat evidence align to a single file-transfer sequence.';
      updateCaseProgress();
    });
  }

  const requestButton = document.getElementById('request-button');
  if (requestButton) {
    requestButton.addEventListener('click', () => {
      state.progress = Math.min(100, state.progress + 10);
      const artifact = document.getElementById('artifact-request');
      if (artifact) artifact.textContent = 'Artifact request approved: secure chain-of-custody access to the shared archive log is now active.';
      updateCaseProgress();
    });
  }

  const submitReport = document.getElementById('submit-report');
  if (submitReport) {
    submitReport.addEventListener('click', () => {
      const result = document.getElementById('analysis-result');
      if (result) result.textContent = 'Final report drafted: suspicious access is linked to the USB transfer and timeline anomaly.';
      state.progress = 100;
      state.confidence = 97;
      updateCaseProgress();
    });
  }
}

function bindForensicAI() {
  const form = document.getElementById('forensic-ai-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('ai-question');
    const responseNode = document.getElementById('ai-response');
    const question = input ? input.value.trim() : '';

    if (!question) {
      if (responseNode) responseNode.textContent = 'Ask the forensic AI anything. It can answer practical, strange, or speculative questions with a forensic method.';
      return;
    }

    try {
      const response = await fetch('/api/forensic-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      if (responseNode) responseNode.textContent = data.answer || 'The forensic AI has no answer yet, but the evidence path remains open.';
    } catch (error) {
      if (responseNode) responseNode.textContent = 'The forensic AI is still reasoning. Ask again with a clearer question and the working chain will appear.';
    }
  });
}

function bootstrapDashboard() {
  updateCaseProgress();
  renderSuggestions();
  renderProgressList();
  renderStreakSummary();
  attachEvidenceInteractions();
  attachLevelButtons();
  setupMiniGames();
  bindForensicAI();
  selectEvidence('USB-STORAGE');
}

document.addEventListener('DOMContentLoaded', bootstrapDashboard);
