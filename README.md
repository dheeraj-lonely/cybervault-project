# CyberVault Investigation Platform 🔍

An advanced interactive forensic investigation game featuring multi-level campaigns, AI-driven interrogation, and immersive 3D crime scene environments.

## 🚀 New Advanced Features

### Multi-Level Campaign System
- **5 Progressive Levels**: From "The First Breach" to "The Mastermind"
- **Dynamic Difficulty Scaling**: Adaptive challenges based on player performance
- **Time-Limited Missions**: 60-33 minutes per level with decreasing time limits
- **Objective-Based Progression**: Clear goals and evidence requirements per level

### AI-Driven Investigation
- **Criminal Mind AI (Dr. Aris Thorne)**: Advanced psychological profiling system
- **Forensic Copilot LLM**: AI assistant for evidence analysis and insights
- **Interactive Interrogation Terminal**: Real-time suspect questioning with stress tracking
- **Adaptive Response System**: AI responses change based on evidence presented and stress levels

### Advanced Forensic Analysis
- **DNA Sequencer**: Genetic analysis with confidence ratings and match probabilities
- **Digital Data Extractor**: Recovery of deleted files, metadata analysis, and decryption
- **Timeline Reconstructor**: Automated event sequencing and correlation analysis
- **Network Traffic Analyzer**: Advanced cybersecurity investigation tools

### Streak & Combo System
- **Progressive Multipliers**: 1.0x → 1.5x → 2.0x → 3.0x based on performance
- **Combo Timer**: 30-second windows to maintain investigation momentum
- **Milestone Rewards**: Special bonuses at 5, 10, 20, and 50-streak intervals
- **Visual Feedback**: Real-time streak indicators with scaling animations

### Dynamic Background Music
- **Adaptive Audio Layers**: Ambient, tension, action, and mystery tracks
- **Situation-Aware Mixing**: Music responds to gameplay context
- **Intensity Scaling**: Audio adapts to investigation progress and stress levels
- **Web Audio API**: Real-time audio synthesis and mixing

## 🎮 Game Modes

### 1. Classic Dashboard (`/game`)
- Traditional 2D forensic investigation interface
- Evidence collection and analysis tools
- Timeline reconstruction and case management

### 2. 3D Investigation Environment (`/cybervault-3d`)
- Immersive Three.js crime scene reconstruction
- Interactive object manipulation and evidence collection
- Physical puzzle-solving mechanics

### 3. Advanced Campaign Mode (`/cybervault-advanced`)
- Complete multi-level investigation campaign
- All advanced features integrated
- Progressive difficulty and unlockable content

### 4. AI Interrogation Terminal (`/ai-terminal`)
- Standalone AI suspect interaction interface
- Psychological profiling and stress tracking
- Evidence-based questioning strategies

## 🛠️ Technical Architecture

### Backend (Python Flask)
- **Flask Application**: Multi-route web server with RESTful APIs
- **Dual Database Support**: SQLite (local) + Supabase (cloud) integration
- **AI Response System**: Psychological profiling algorithms for suspect behavior
- **Evidence Management**: Comprehensive forensic data modeling

### Frontend (JavaScript/HTML5)
- **Three.js 3D Engine**: WebGL-based crime scene rendering
- **Advanced Game Engine**: Multi-system architecture with campaign management
- **Responsive UI**: Professional forensic interface design
- **Real-time Updates**: WebSocket-ready for live collaboration features

### Audio System
- **Web Audio API**: Dynamic background music synthesis
- **Multi-layer Mixing**: Situational audio adaptation
- **Real-time Processing**: Intensity-based audio manipulation

## 📊 Scoring & Progress System

### Level Scoring Formula
```
Base Score: 1000 points
+ Time Bonus: (Time Remaining × 0.5)
+ Streak Bonus: (Current Multiplier × 100)
+ Difficulty Bonus: (Level Difficulty × 200)
```

### Campaign Progression
- **Unlockable Tools**: New forensic capabilities per level
- **Feature Gates**: Advanced tools unlock with campaign progress
- **Achievement System**: Milestone tracking and rewards

## 🧠 AI Systems

### Criminal Mind AI (Dr. Aris Thorne)
```javascript
Personality Traits:
- Intelligence: 95/100
- Manipulation: 88/100
- Tech Aptitude: 92/100
- Profile: "Methodical, arrogant, seeks intellectual validation"
```

### Response Categories
- **Confident (0-30% stress)**: Dismissive and arrogant responses
- **Defensive (30-60% stress)**: Evasive and blame-shifting behavior  
- **Nervous (60-85% stress)**: Contradictory and revealing statements
- **Breaking Point (85%+ stress)**: Confessions and critical information

## 🔧 Installation & Setup

### Prerequisites
```bash
# Python 3.8+
# Node.js (for OmniRoute - optional)
```

### Installation
```bash
# Clone repository
git clone https://github.com/dheeraj-lonely/cybervault-project.git
cd cybervault-project

# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python database/init_db.py

# Run application
python app.py
```

### Environment Configuration
Create `.env` file:
```env
DB_MODE=sqlite  # or 'supabase' or 'dual'
SECRET_KEY=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

## 🌐 API Endpoints

### Core Game APIs
- `GET /` - Landing page and navigation
- `GET /game` - Classic 2D investigation dashboard
- `GET /cybervault-3d` - Immersive 3D environment
- `GET /cybervault-advanced` - Multi-level campaign mode
- `GET /ai-terminal` - AI interrogation interface

### Investigation APIs
- `POST /api/forensics-chat` - AI forensic assistant
- `POST /api/interrogate` - Criminal mind AI responses
- `GET /api/status` - System and database status
- `POST /api/subscribe` - Newsletter subscription

## 🎯 Game Flow

### Level 1: "The First Breach"
- **Objective**: Investigate initial security breach
- **Evidence**: Workstation logs, security footage, network traces
- **Time Limit**: 60 minutes
- **Unlocks**: Basic forensic tools, AI interrogation

### Level 2: "Corporate Espionage"
- **Objective**: Uncover corporate conspiracy
- **Evidence**: Encrypted files, financial records, employee data
- **Time Limit**: 53 minutes
- **Unlocks**: Advanced decryption, financial analysis

### Level 3: "Digital Heist"
- **Objective**: Track sophisticated cyber attack
- **Evidence**: Malware samples, network topology, server logs
- **Time Limit**: 47 minutes
- **Unlocks**: Malware analysis, network forensics

### Level 4: "International Conspiracy"
- **Objective**: Expose global cybercrime syndicate
- **Evidence**: Global incidents, communication metadata, location data
- **Time Limit**: 40 minutes
- **Unlocks**: Geolocation analysis, pattern recognition

### Level 5: "The Mastermind"
- **Objective**: Confront criminal mastermind
- **Evidence**: Master plan, access codes, psychological profile
- **Time Limit**: 33 minutes
- **Unlocks**: Master detective status, campaign completion

## 🏆 Achievements & Milestones

### Evidence Collector Series
- **First Evidence**: Collect your first piece of evidence
- **Evidence Collector**: Collect 5 pieces of evidence in one level
- **Forensic Expert**: Collect all evidence in a single playthrough

### Speed Investigation Series  
- **Speed Investigator**: Complete level in under 10 minutes
- **Lightning Detective**: Complete campaign in under 4 hours
- **Time Master**: Achieve best time on all levels

### Streak Master Series
- **Combo Starter**: Achieve 5-streak combo
- **Streak Master**: Achieve 20-streak combo
- **Unstoppable**: Achieve 50-streak combo without breaks

## 📱 Cross-Platform Compatibility

### Desktop Browsers
- **Chrome/Edge**: Full WebGL and Web Audio API support
- **Firefox**: Complete feature compatibility
- **Safari**: Core functionality with limited audio features

### Mobile Devices
- **Responsive Design**: Adaptive UI for touch interfaces
- **Touch Controls**: Mobile-optimized interaction patterns
- **Performance Scaling**: Automatic quality adjustment for mobile GPUs

## 🤝 Contributing

### Development Setup
```bash
# Fork repository
# Create feature branch
git checkout -b feature/advanced-forensics

# Make changes
# Add tests
# Submit pull request
```

### Code Standards
- **Python**: PEP 8 style guide
- **JavaScript**: ES6+ with proper error handling  
- **HTML/CSS**: Semantic markup and BEM methodology

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

### Documentation
- **Technical Docs**: `/docs/` directory
- **API Reference**: Swagger documentation at `/api/docs`
- **User Guide**: In-game help system

### Community
- **Issues**: GitHub issue tracker
- **Discussions**: GitHub discussions tab
- **Discord**: Join our forensic investigation community

---

**CyberVault Investigation Platform** - Where advanced forensic science meets cutting-edge game design. 🔍🎮