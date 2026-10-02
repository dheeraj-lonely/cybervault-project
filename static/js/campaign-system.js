/**
 * CyberVault Campaign Management System
 * Multi-Level Progress Tracking & Dynamic Difficulty Scaling
 */

class CampaignSystem {
    constructor() {
        this.currentCampaign = {
            id: 'cybervault_main',
            name: 'CyberVault Investigation Campaign',
            currentLevel: 1,
            maxLevel: 5,
            totalScore: 0,
            completedLevels: [],
            unlockedFeatures: []
        };
        
        this.levelDefinitions = {
            1: {
                name: "The First Breach",
                description: "Investigate the initial security breach at TechCorp",
                objectives: [
                    "Examine the crime scene",
                    "Collect digital evidence",
                    "Interview the AI suspect",
                    "Reconstruct the timeline"
                ],
                requiredEvidence: ['workstation_logs', 'security_footage', 'network_traces'],
                timeLimit: 3600, // 60 minutes
                difficultyMultiplier: 1.0,
                unlocks: ['basic_forensic_tools', 'ai_interrogation']
            },
            2: {
                name: "Corporate Espionage",
                description: "Uncover the corporate conspiracy behind the data theft",
                objectives: [
                    "Analyze encrypted communications",
                    "Trace financial transactions",
                    "Identify insider threats",
                    "Discover the client network"
                ],
                requiredEvidence: ['encrypted_files', 'financial_records', 'employee_data'],
                timeLimit: 3200, // 53 minutes
                difficultyMultiplier: 1.3,
                unlocks: ['advanced_decryption', 'financial_analysis']
            },
            3: {
                name: "Digital Heist",
                description: "Track the sophisticated cyber attack methodology",
                objectives: [
                    "Reverse engineer the malware",
                    "Map the attack vectors",
                    "Identify command & control servers",
                    "Predict the next target"
                ],
                requiredEvidence: ['malware_samples', 'network_topology', 'server_logs'],
                timeLimit: 2800, // 47 minutes
                difficultyMultiplier: 1.6,
                unlocks: ['malware_analysis', 'network_forensics']
            },
            4: {
                name: "International Conspiracy",
                description: "Expose the global cybercrime syndicate",
                objectives: [
                    "Correlate international incidents",
                    "Identify syndicate members",
                    "Map the organizational structure",
                    "Locate the command center"
                ],
                requiredEvidence: ['global_incidents', 'communication_metadata', 'location_data'],
                timeLimit: 2400, // 40 minutes
                difficultyMultiplier: 1.9,
                unlocks: ['geolocation_analysis', 'pattern_recognition']
            },
            5: {
                name: "The Mastermind",
                description: "Confront the criminal mastermind behind it all",
                objectives: [
                    "Infiltrate the digital fortress",
                    "Decode the final puzzle",
                    "Confront Dr. Aris Thorne",
                    "Prevent the ultimate cyber attack"
                ],
                requiredEvidence: ['master_plan', 'access_codes', 'psychological_profile'],
                timeLimit: 2000, // 33 minutes
                difficultyMultiplier: 2.2,
                unlocks: ['master_detective', 'campaign_complete']
            }
        };
        
        this.streakSystem = new StreakSystem();
        this.progressTracker = new ProgressTracker();
        this.init();
    }
    
    init() {
        this.loadCampaignProgress();
        this.setupCampaignUI();
        this.initializeLevel();
        console.log('📋 Campaign System Initialized');
    }
    
    loadCampaignProgress() {
        const saved = localStorage.getItem('cybervault_campaign');
        if (saved) {
            this.currentCampaign = { ...this.currentCampaign, ...JSON.parse(saved) };
        }
    }
    
    saveCampaignProgress() {
        localStorage.setItem('cybervault_campaign', JSON.stringify(this.currentCampaign));
    }
    
    getCurrentLevel() {
        return this.levelDefinitions[this.currentCampaign.currentLevel];
    }
    
    initializeLevel() {
        const level = this.getCurrentLevel();
        if (!level) return;
        
        this.updateLevelUI(level);
        this.startLevelTimer(level.timeLimit);
        this.resetLevelProgress();
        
        // Initialize level-specific features
        this.unlockLevelFeatures(level);
        
        console.log(`🎯 Starting Level ${this.currentCampaign.currentLevel}: ${level.name}`);
    }
    
    completeObjective(objectiveId) {
        const level = this.getCurrentLevel();
        const objectiveIndex = level.objectives.findIndex(obj => 
            obj.toLowerCase().replace(/\s+/g, '_') === objectiveId
        );
        
        if (objectiveIndex !== -1) {
            this.streakSystem.addSuccess();
            this.progressTracker.completeObjective(objectiveId);
            this.updateObjectiveUI(objectiveIndex, true);
            
            // Check if level is complete
            if (this.checkLevelCompletion()) {
                this.completeLevel();
            }
        }
    }
    
    checkLevelCompletion() {
        const level = this.getCurrentLevel();
        const completedObjectives = this.progressTracker.getCompletedObjectives();
        const requiredEvidence = this.progressTracker.getCollectedEvidence();
        
        // Check objectives completion
        const allObjectivesComplete = level.objectives.every(obj => {
            const objId = obj.toLowerCase().replace(/\s+/g, '_');
            return completedObjectives.includes(objId);
        });
        
        // Check evidence collection
        const allEvidenceCollected = level.requiredEvidence.every(evidence => 
            requiredEvidence.includes(evidence)
        );
        
        return allObjectivesComplete && allEvidenceCollected;
    }
    
    completeLevel() {
        const level = this.getCurrentLevel();
        const timeTaken = this.getLevelCompletionTime();
        const score = this.calculateLevelScore(level, timeTaken);
        
        // Update campaign progress
        this.currentCampaign.completedLevels.push({
            level: this.currentCampaign.currentLevel,
            score: score,
            timeTaken: timeTaken,
            completedAt: Date.now()
        });
        
        this.currentCampaign.totalScore += score;
        
        // Unlock next level
        if (this.currentCampaign.currentLevel < this.currentCampaign.maxLevel) {
            this.currentCampaign.currentLevel++;
        }
        
        // Save progress
        this.saveCampaignProgress();
        
        // Show completion screen
        this.showLevelCompletionScreen(level, score, timeTaken);
        
        console.log(`✅ Level Complete! Score: ${score}, Time: ${timeTaken}s`);
    }
    
    calculateLevelScore(level, timeTaken) {
        const baseScore = 1000;
        const timeBonus = Math.max(0, (level.timeLimit - timeTaken) * 0.5);
        const streakBonus = this.streakSystem.getCurrentMultiplier() * 100;
        const difficultyBonus = level.difficultyMultiplier * 200;
        
        return Math.floor(baseScore + timeBonus + streakBonus + difficultyBonus);
    }
}

class StreakSystem {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.multiplier = 1.0;
        this.comboTimer = null;
        this.comboTimeLimit = 30000; // 30 seconds
    }
    
    addSuccess() {
        this.currentStreak++;
        this.updateMultiplier();
        this.resetComboTimer();
        this.updateStreakUI();
        
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
        
        // Streak milestone rewards
        if (this.currentStreak % 5 === 0) {
            this.showStreakMilestone();
        }
    }
    
    breakStreak() {
        if (this.currentStreak > 0) {
            this.currentStreak = 0;
            this.multiplier = 1.0;
            this.updateStreakUI();
            this.showStreakBroken();
        }
    }
    
    updateMultiplier() {
        // Progressive multiplier based on streak
        if (this.currentStreak >= 20) this.multiplier = 3.0;
        else if (this.currentStreak >= 10) this.multiplier = 2.0;
        else if (this.currentStreak >= 5) this.multiplier = 1.5;
        else this.multiplier = 1.0;
    }
    
    resetComboTimer() {
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        
        this.comboTimer = setTimeout(() => {
            this.breakStreak();
        }, this.comboTimeLimit);
    }
    
    getCurrentMultiplier() {
        return this.multiplier;
    }
}

class ProgressTracker {
    constructor() {
        this.completedObjectives = [];
        this.collectedEvidence = [];
        this.milestonesReached = [];
        this.startTime = Date.now();
    }
    
    completeObjective(objectiveId) {
        if (!this.completedObjectives.includes(objectiveId)) {
            this.completedObjectives.push(objectiveId);
            this.checkMilestones();
        }
    }
    
    collectEvidence(evidenceId) {
        if (!this.collectedEvidence.includes(evidenceId)) {
            this.collectedEvidence.push(evidenceId);
            this.checkMilestones();
        }
    }
    
    checkMilestones() {
        const milestones = [
            { id: 'first_evidence', condition: () => this.collectedEvidence.length >= 1 },
            { id: 'evidence_collector', condition: () => this.collectedEvidence.length >= 5 },
            { id: 'objective_master', condition: () => this.completedObjectives.length >= 3 },
            { id: 'speed_investigator', condition: () => this.getElapsedTime() < 600 }
        ];
        
        milestones.forEach(milestone => {
            if (!this.milestonesReached.includes(milestone.id) && milestone.condition()) {
                this.milestonesReached.push(milestone.id);
                this.showMilestoneAchieved(milestone.id);
            }
        });
    }
    
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    getCompletedObjectives() {
        return this.completedObjectives;
    }
    
    getCollectedEvidence() {
        return this.collectedEvidence;
    }
}

// Initialize campaign system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.campaignSystem = new CampaignSystem();
});