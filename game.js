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

const state = {
  selectedCase: 'CV-014',
  progress: 20,
  confidence: 82,
  report: ''
};

function updateCaseProgress() {
  const evidenceCards = document.querySelectorAll('#evidence-list .evidence-line');
  const progressBar = document.querySelector('#case-progress-bar');
  const evidenceCount = document.querySelector('#evidence-count');
  const progressText = document.querySelector('#progress-value');
  const confidenceText = document.querySelector('#confidence-value');

  const selected = evidenceCards.length;
  const percent = Math.min(100, Math.round((selected / 5) * 100));
  if (progressBar) progressBar.style.width = Math.max(percent, state.progress) + '%';
  if (evidenceCount) evidenceCount.textContent = String(selected);
  if (progressText) progressText.textContent = String(Math.max(20, Math.min(100, state.progress))) + '%';
  if (confidenceText) confidenceText.textContent = String(state.confidence) + '%';
}

function attachEvents() {
  const caseBrief = document.querySelector('#case-brief');
  const caseButton = document.querySelector('#begin-investigation');
  const evidenceList = document.querySelector('#evidence-list');
  const analyzeButton = document.querySelector('#analyze-button');
  const requestButton = document.querySelector('#request-button');
  const refreshButton = document.querySelector('#refresh-button');

  if (caseButton) {
    caseButton.addEventListener('click', function () {
      if (caseBrief) {
        caseBrief.classList.add('flash');
        caseBrief.querySelector('h3').textContent = 'Case CV-014 Investigating';
      }

      const story = document.querySelector('#case-story');
      if (story) story.textContent = 'Tracking the sharing channel, file revision, and access timeline.';

      state.progress = Math.min(50, state.progress + 10);
      updateCaseProgress();
    });
  }

  if (evidenceList) {
    evidenceList.addEventListener('click', function (event) {
      const item = event.target.closest('.evidence-line');
      if (!item) return;

      document.querySelectorAll('#evidence-list .evidence-line').forEach((line) => {
        line.classList.toggle('selected', line === item);
      });

      const dataId = item.dataset.evidence;
      const selectedEvidence = evidenceData.find((entry) => entry.id === dataId) || evidenceData[0];

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

      state.confidence = Math.min(98, selectedEvidence.confidence);
      updateCaseProgress();
    });
  }

  if (analyzeButton) {
    analyzeButton.addEventListener('click', function () {
      state.progress = Math.min(70, state.progress + 15);
      state.confidence = Math.min(95, state.confidence + 4);
      const result = document.querySelector('#analysis-result');
      if (result) result.textContent = 'Signal correlation complete: activity stream verified.';
      updateCaseProgress();
    });
  }

  if (requestButton) {
    requestButton.addEventListener('click', function () {
      const artifact = document.querySelector('#artifact-request');
      if (artifact) artifact.textContent = 'Source chain requested from secure evidence store.';
      state.progress = Math.min(100, state.progress + 8);
      updateCaseProgress();
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', function () {
      const evidenceListUI = document.querySelector('#evidence-list');
      if (evidenceListUI) {
        evidenceListUI.innerHTML = evidenceData.map((item, index) => `
          <div class="evidence-line ${index === 0 ? 'selected' : ''}" data-evidence="${item.id}">
            <span class="evidence-id">${item.id}</span>
            <span class="evidence-name">${item.evidence}</span>
            <span class="evidence-meta">${item.category}</span>
          </div>
        `).join('');
      }

      const obs = document.querySelector('#evidence-observation');
      if (obs) obs.textContent = evidenceData[0].observation;

      state.progress = 25;
      state.confidence = 82;
      updateCaseProgress();
    });
  }
}

function bootstrap() {
  updateCaseProgress();
  attachEvents();
}

document.addEventListener('DOMContentLoaded', bootstrap);
