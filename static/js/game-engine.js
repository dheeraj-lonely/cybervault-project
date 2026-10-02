/**
 * CyberVault Investigation Platform - Game Engine
 * Handles forensic investigation logic, evidence management, and AI interactions
 */

class CyberVaultEngine {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.caseData = null;
        this.collectedEvidence = new Set();
        this.labResults = new Map();
        this.suspects = [];
        this.gameProgress = 0;
        this.currentCase = '047';
        
        this.init();
    }
    
    generateSessionId() {
        return 'cv_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async init() {
        console.log('🔬 CyberVault Investigation Platform initialized');
        console.log('📋 Session ID:', this.sessionId);
        
        try {
            await this.loadCase(this.currentCase);
            this.setupEventListeners();
            this.startSession();
        } catch (error) {
            console.error('Failed to initialize platform:', error);
        }
    }
    
    async loadCase(caseId) {
        try {
            const response = await fetch(`/api/case/${caseId}`);
            if (response.ok) {
                this.caseData = await response.json();
                console.log('📁 Case loaded:', this.caseData.title);
                this.suspects = this.caseData.suspects || [];
                this.updateCaseDisplay();
            } else {
                throw new Error('Case not found');
            }
        } catch (error) {
            console.error('Error loading case:', error);
            // Fallback to mock data
            this.loadMockCase();
        }
    }
    
    loadMockCase() {
        this.caseData = {
            id: "047",
            title: "The Abandoned Warehouse",
            suspects: [
                {id: "A", name: "Marcus Reeve", profile: "Former warehouse manager"},
                {id: "B", name: "Diana Cole", profile: "Private investigator"},
                {id: "C", name: "Owen Marsh", profile: "Delivery driver"}
            ]
        };
        console.log('📁 Loaded mock case data');
    }
    
    async startSession() {
        try {
            const response = await fetch('/api/game/session/start', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: this.sessionId,
                    case_id: this.currentCase,
                    player_name: 'Investigator'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('🎮 Game session started:', data.session_id);
            }
        } catch (error) {
            console.warn('Could not start remote session:', error);
        }
    }
    
    setupEventListeners() {
        // Evidence collection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('evidence-marker')) {
                const evidenceId = e.target.dataset.evidence;
                this.collectEvidence(evidenceId);
            }
        });
        
        // Lab analysis buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="runDNAAnalysis"]')) {
                e.preventDefault();
                this.runLabAnalysis('dna');
            }
            if (e.target.matches('[onclick*="runFingerprintMatch"]')) {
                e.preventDefault();
                this.runLabAnalysis('fingerprint');
            }
            if (e.target.matches('[onclick*="enhanceCCTV"]')) {
                e.preventDefault();
                this.runLabAnalysis('cctv');
            }
        });
    }
    
    async collectEvidence(evidenceId) {
        if (this.collectedEvidence.has(evidenceId)) {
            this.showNotification('Evidence already collected', 'warning');
            return;
        }
        
        this.collectedEvidence.add(evidenceId);
        this.updateProgress();
        
        // Log to backend
        try {
            await fetch('/api/game/evidence/collect', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: this.sessionId,
                    evidence_id: evidenceId
                })
            });
        } catch (error) {
            console.warn('Could not log evidence collection:', error);
        }
        
        // Visual feedback
        const marker = document.querySelector(`[data-evidence="${evidenceId}"]`);
        if (marker) {
            marker.style.background = 'rgba(40, 167, 69, 0.8)';
            marker.style.border = '2px solid #28a745';
            
            // Add checkmark
            setTimeout(() => {
                marker.innerHTML = '✓';
                marker.style.color = 'white';
            }, 200);
        }
        
        this.showNotification(`Evidence collected: ${evidenceId}`, 'success');
        this.addTerminalLog(`[COLLECT] Evidence ${evidenceId} secured in chain of custody`);
    }
    
    async runLabAnalysis(analysisType) {
        const button = event.target;
        const originalText = button.textContent;
        
        // Disable button and show loading
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        try {
            let result;
            
            switch (analysisType) {
                case 'dna':
                    result = await this.performDNAAnalysis();
                    break;
                case 'fingerprint':
                    result = await this.performFingerprintAnalysis();
                    break;
                case 'cctv':
                    result = await this.performCCTVAnalysis();
                    break;
                default:
                    throw new Error('Unknown analysis type');
            }
            
            this.labResults.set(analysisType, result);
            this.updateProgress();
            this.displayLabResult(analysisType, result);
            
        } catch (error) {
            console.error('Lab analysis error:', error);
            this.showNotification('Analysis failed. Please try again.', 'error');
        } finally {
            // Re-enable button
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalText;
            }, 2000);
        }
    }
    
    async performDNAAnalysis() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.addTerminalLog('[DNA] Extracting genetic material...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.addTerminalLog('[DNA] Running PCR amplification...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.addTerminalLog('[DNA] STR analysis complete');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        this.addTerminalLog('[MATCH] Database search: Positive identification');
        
        return {
            type: 'DNA',
            result: 'Match found',
            confidence: 99.7,
            suspect: 'Marcus Reeve (Suspect A)',
            details: 'Male, Type A blood, 16 STR loci match'
        };
    }
    
    async performFingerprintAnalysis() {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.addTerminalLog('[PRINT] Analyzing ridge patterns...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        this.addTerminalLog('[AFIS] Searching database...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.addTerminalLog('[MATCH] 12-point match confirmed');
        
        return {
            type: 'Fingerprint',
            result: 'Positive match',
            confidence: 95.2,
            suspect: 'Marcus Reeve (Suspect A)',
            details: '12-point match, right index finger'
        };
    }
    
    async performCCTVAnalysis() {
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        this.addTerminalLog('[VIDEO] Enhancing image quality...');
        await new Promise(resolve => setTimeout(resolve, 700));
        
        this.addTerminalLog('[FACIAL] Running recognition algorithm...');
        await new Promise(resolve => setTimeout(resolve, 900));
        
        this.addTerminalLog('[TIMELINE] Timestamp verified: 20:51 UTC');
        
        return {
            type: 'CCTV',
            result: 'Identity confirmed',
            confidence: 87.3,
            suspect: 'Marcus Reeve (Suspect A)',
            details: 'Clear facial match, entry at 20:51'
        };
    }
    
    displayLabResult(analysisType, result) {
        const modalTitle = `${result.type} Analysis Complete`;
        const modalBody = `
            <div class="lab-result">
                <h6><i class="fas fa-check-circle text-success me-2"></i>Analysis Result</h6>
                <p><strong>Status:</strong> ${result.result}</p>
                <p><strong>Confidence:</strong> ${result.confidence}%</p>
                <p><strong>Suspect Match:</strong> ${result.suspect}</p>
                <p><strong>Details:</strong> ${result.details}</p>
                
                <div class="progress mt-3 mb-2">
                    <div class="progress-bar bg-success" style="width: ${result.confidence}%"></div>
                </div>
                <small class="text-muted">Confidence Level: ${result.confidence}%</small>
            </div>
        `;
        
        this.showModal(modalTitle, modalBody);
        this.showNotification(`${result.type} analysis complete: ${result.result}`, 'success');
    }
    
    updateProgress() {
        const evidenceCount = this.collectedEvidence.size;
        const labCount = this.labResults.size;
        
        // Calculate progress (evidence collection: 60%, lab results: 40%)
        const evidenceProgress = Math.min((evidenceCount / 5) * 60, 60);
        const labProgress = Math.min((labCount / 3) * 40, 40);
        this.gameProgress = Math.round(evidenceProgress + labProgress);
        
        // Update UI
        this.updateProgressDisplay();
        this.updateStats();
    }
    
    updateProgressDisplay() {
        const progressElement = document.getElementById('case-progress');
        const textElement = document.getElementById('progress-text');
        
        if (progressElement && textElement) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (this.gameProgress / 100) * circumference;
            
            progressElement.style.strokeDashoffset = offset;
            textElement.textContent = this.gameProgress + '%';
        }
    }
    
    updateStats() {
        const evidenceEl = document.getElementById('evidence-count');
        const labEl = document.getElementById('lab-results');
        const suspectsEl = document.getElementById('suspects');
        
        if (evidenceEl) evidenceEl.textContent = this.collectedEvidence.size;
        if (labEl) labEl.textContent = this.labResults.size;
        if (suspectsEl) suspectsEl.textContent = this.suspects.length;
    }
    
    updateCaseDisplay() {
        if (this.caseData) {
            // Update any case-specific display elements
            console.log('📊 Case display updated');
        }
    }
    
    addTerminalLog(message) {
        const terminal = document.getElementById('terminal-log');
        if (!terminal) return;
        
        const line = document.createElement('div');
        line.textContent = message;
        
        // Style based on content
        if (message.includes('[MATCH]') || message.includes('[SUCCESS]')) {
            line.className = 'text-success';
        } else if (message.includes('[ERROR]') || message.includes('[FAILED]')) {
            line.className = 'text-danger';
        } else if (message.includes('[ALERT]') || message.includes('[WARNING]')) {
            line.className = 'text-warning';
        } else if (message.includes('[INFO]')) {
            line.className = 'text-info';
        }
        
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        
        // Limit terminal history
        while (terminal.children.length > 25) {
            terminal.removeChild(terminal.firstChild);
        }
    }
    
    showModal(title, body) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = body;
            
            const modal = new bootstrap.Modal(document.getElementById('actionModal'));
            modal.show();
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Forensic AI Integration
    async consultForensicAI(question) {
        try {
            const response = await fetch('/api/forensics-chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    message: question,
                    session_id: this.sessionId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.reply;
            } else {
                throw new Error('AI consultation failed');
            }
        } catch (error) {
            console.error('Forensic AI error:', error);
            return 'I apologize, but I cannot process your request right now. Please try again later.';
        }
    }
    
    // Case submission and scoring
    async submitReport(suspectId, timeline, evidenceList, conclusion) {
        try {
            const response = await fetch('/api/submit-report', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: this.sessionId,
                    suspect: suspectId,
                    when: timeline,
                    evidence: Array.from(this.collectedEvidence),
                    conclusion: conclusion,
                    player_name: 'Investigator'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.displayFinalResults(result);
                return result;
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Report submission error:', error);
            this.showNotification('Failed to submit report. Please try again.', 'error');
        }
    }
    
    displayFinalResults(results) {
        const modalBody = `
            <div class="final-results">
                <h5 class="text-center mb-4">
                    <i class="fas fa-${results.solved ? 'check-circle text-success' : 'times-circle text-warning'}"></i>
                    Case ${results.solved ? 'SOLVED' : 'INCOMPLETE'}
                </h5>
                
                <div class="row text-center mb-4">
                    <div class="col-6">
                        <div class="h3 text-info">${results.score}</div>
                        <small>Score</small>
                    </div>
                    <div class="col-6">
                        <div class="h3 text-success">${results.max_score}</div>
                        <small>Maximum</small>
                    </div>
                </div>
                
                <h6>Performance Feedback:</h6>
                <ul class="list-unstyled">
                    ${results.feedback.map(item => `
                        <li class="mb-2">
                            <i class="fas fa-${item.correct ? 'check text-success' : 'times text-warning'} me-2"></i>
                            ${item.msg}
                        </li>
                    `).join('')}
                </ul>
                
                ${results.solved ? `
                    <div class="alert alert-success">
                        <strong>Congratulations!</strong> You successfully identified ${results.suspect_name} as the perpetrator.
                    </div>
                ` : `
                    <div class="alert alert-warning">
                        <strong>Investigation Incomplete.</strong> The correct suspect was ${results.suspect_name}.
                    </div>
                `}
            </div>
        `;
        
        this.showModal('Investigation Results', modalBody);
    }
    
    // Utility methods
    getCollectedEvidence() {
        return Array.from(this.collectedEvidence);
    }
    
    getLabResults() {
        return Object.fromEntries(this.labResults);
    }
    
    getGameState() {
        return {
            sessionId: this.sessionId,
            currentCase: this.currentCase,
            collectedEvidence: this.getCollectedEvidence(),
            labResults: this.getLabResults(),
            progress: this.gameProgress,
            suspects: this.suspects
        };
    }
}

// Initialize the game engine when DOM is ready
let cyberVaultEngine;

document.addEventListener('DOMContentLoaded', () => {
    cyberVaultEngine = new CyberVaultEngine();
});

// Export for global access
window.CyberVaultEngine = CyberVaultEngine;