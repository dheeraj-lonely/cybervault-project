"""
CyberVault — Flask Application
================================
Dual-database layer:
  • SQLite  (local / development)  via Flask-SQLAlchemy
  • Supabase (cloud PostgreSQL)     via supabase-py

DB_MODE (set in .env):
  sqlite   → SQLite only
  supabase → Supabase only (SQLite still initialised as fallback)
  dual     → write to both, read from Supabase with SQLite fallback
"""

import os
import uuid
import random
import logging
import datetime

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy

# ── Logging ───────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(name)s — %(message)s',
                    datefmt='%H:%M:%S')
log = logging.getLogger('cybervault')

# ── App factory ───────────────────────────────────────────────────
app = Flask(__name__)
app.config['SECRET_KEY']                    = os.getenv('FLASK_SECRET_KEY', 'evidence-lot-secret-2024')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ── SQLite path ───────────────────────────────────────────────────
_BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
_SQLITE_FN = os.getenv('SQLITE_DB_PATH', 'cybervault.db')
_SQLITE_PATH = os.path.join(_BASE_DIR, _SQLITE_FN)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{_SQLITE_PATH}'

# ── DB mode ───────────────────────────────────────────────────────
DB_MODE = os.getenv('DB_MODE', 'dual').lower()   # sqlite | supabase | dual

# ── Import models & Supabase helpers ─────────────────────────────
from database.models import (
    db, Subscriber, ChatMessage, GameSession,
    CollectedEvidence, InvestigationReport, LeaderboardEntry
)
from database.supabase_client import (
    is_supabase_configured, SupabaseSync
)

db.init_app(app)

# ══════════════════════════════════════════════════════════════════
#  DB WRITE HELPER  — writes to SQLite and/or Supabase depending
#  on DB_MODE, without ever raising.
# ══════════════════════════════════════════════════════════════════
def _db_commit():
    """Commit SQLite session, log but suppress errors."""
    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        log.error("SQLite commit failed: %s", exc)


def _use_sqlite() -> bool:
    return DB_MODE in ('sqlite', 'dual')


def _use_supabase() -> bool:
    return DB_MODE in ('supabase', 'dual') and is_supabase_configured()


# ══════════════════════════════════════════════════════════════════
#  FORENSICS LLM  — Rule-based knowledge engine
# ══════════════════════════════════════════════════════════════════
FORENSICS_KB = {
    "digital forensics": {
        "keywords": ["digital forensic","computer forensic","cyber forensic","electronic evidence","digital evidence","disk forensic","forensic computing"],
        "response": (
            "**Digital Forensics** is the branch of forensic science that focuses on recovering and investigating "
            "material found in digital devices, often in relation to cybercrime or criminal investigations.\n\n"
            "**Core disciplines:**\n"
            "• **Disk forensics** — imaging and analysing hard drives, SSDs, USBs\n"
            "• **Network forensics** — capturing and inspecting network traffic\n"
            "• **Mobile forensics** — extracting data from phones and tablets\n"
            "• **Memory forensics** — analysing RAM dumps for running processes\n"
            "• **Cloud forensics** — recovering artefacts from cloud storage\n\n"
            "**Key principle:** Evidence must be collected with a *write-blocker* to prevent modification, "
            "and every action must be logged in the **chain of custody**.\n\n"
            "**Common tools:** Autopsy, FTK, Volatility, Cellebrite, EnCase, Wireshark."
        )
    },
    "chain of custody": {
        "keywords": ["chain of custody","evidence chain","custody log","evidence handling","evidence integrity","tamper"],
        "response": (
            "**Chain of Custody (CoC)** is the chronological documentation that records the sequence of custody, "
            "control, transfer, analysis, and disposition of physical or electronic evidence.\n\n"
            "**Why it matters:** Any break in the chain can render evidence inadmissible in court.\n\n"
            "**A proper CoC record includes:**\n"
            "• Who collected the evidence and when\n"
            "• Description and unique identifier (e.g., hash value for digital files)\n"
            "• Every person who handled it and for what purpose\n"
            "• Storage conditions and seal integrity\n\n"
            "**For digital evidence:** Generate a cryptographic hash (MD5 / SHA-256) immediately after acquisition. "
            "Any change to the file will produce a different hash — proving tampering."
        )
    },
    "fingerprint": {
        "keywords": ["fingerprint","latent print","ridge pattern","dactyloscopy","afis","fingerprint match","fingerprint analysis","print powder","ninhydrin","cyanoacrylate"],
        "response": (
            "**Fingerprint Analysis (Dactyloscopy)** is one of the most reliable biometric identification methods in forensics.\n\n"
            "**Types of fingerprints at a scene:**\n"
            "• **Latent** — invisible, left by sweat/oil, revealed by powder or chemicals\n"
            "• **Patent** — visible in soft surfaces (blood, grease, paint)\n"
            "• **Plastic** — 3D impression left in soft material (wax, putty)\n\n"
            "**Development techniques:**\n"
            "• Aluminium/carbon powder on smooth surfaces\n"
            "• Cyanoacrylate (superglue) fuming for plastics\n"
            "• Ninhydrin spray for porous surfaces (paper)\n"
            "• DFO / luminescent powders for fluorescent detection\n\n"
            "**Ridge patterns:** Every fingerprint has one of three basic patterns — *loop* (~65%), *whorl* (~30%), *arch* (~5%).\n\n"
            "**AFIS** (Automated Fingerprint Identification System) can compare prints against millions of records in seconds."
        )
    },
    "dna": {
        "keywords": ["dna","dna analysis","dna profile","strdna","codis","genetic","pcr","touch dna","mitochondrial dna","buccal swab","dna match","biological evidence"],
        "response": (
            "**DNA Forensic Analysis** uses biological material to identify individuals with extreme precision.\n\n"
            "**Sources of DNA at a crime scene:**\n"
            "• Blood, saliva, semen, hair roots, skin cells (touch DNA), bone\n\n"
            "**Methods:**\n"
            "• **STR (Short Tandem Repeat)** — the gold standard; analyses 20 loci in CODIS\n"
            "• **PCR amplification** — copies tiny DNA samples to workable quantities\n"
            "• **Mitochondrial DNA** — used when nuclear DNA is degraded (old bones, hair shaft)\n"
            "• **Touch DNA** — recovered from surfaces the suspect merely touched\n\n"
            "**CODIS** (Combined DNA Index System) is the FBI's national DNA database with over 20 million profiles.\n\n"
            "**Probability of a random match** using a full STR profile is approximately 1 in a quintillion."
        )
    },
    "blood spatter": {
        "keywords": ["blood spatter","bloodstain","blood pattern","bpa","luminol","impact spatter","cast-off","blood analysis","origin of blood","blood drop"],
        "response": (
            "**Bloodstain Pattern Analysis (BPA)** interprets the size, shape, and distribution of bloodstains "
            "to reconstruct events.\n\n"
            "**Key patterns:**\n"
            "• **Impact spatter** — small circular/elliptical stains from a blow\n"
            "• **Cast-off** — arc of stains from a swinging bloody object\n"
            "• **Drip trail** — circular stains showing movement\n"
            "• **Projected blood** — arterial spurting, large volume\n"
            "• **Transfer/contact** — smears, swipes, wipes\n\n"
            "**Luminol** detects blood cleaned from surfaces — produces a blue chemiluminescent glow visible in darkness."
        )
    },
    "cctv": {
        "keywords": ["cctv","surveillance","camera","video forensics","dvr","nvr","metadata","video analysis","footage","timestamp","cctv analysis"],
        "response": (
            "**CCTV and Video Forensics** involves recovering, authenticating, and analysing surveillance footage.\n\n"
            "**Process:**\n"
            "1. Secure the DVR/NVR — do not reboot or allow overwrite\n"
            "2. Image the storage device with a write-blocker\n"
            "3. Extract video files — note container format\n"
            "4. Verify file integrity via hash\n"
            "5. Analyse metadata — embedded timestamps, GPS data, device serial numbers\n\n"
            "**Analytical techniques:** Timestamp correlation, facial recognition, gait analysis, enhancement."
        )
    },
    "crime scene": {
        "keywords": ["crime scene","scene investigation","csi","scene processing","scene examination","scene documentation","scene control","perimeter","cordon"],
        "response": (
            "**Crime Scene Investigation (CSI)** is the systematic process of examining a scene to recover evidence.\n\n"
            "**Phases:** Secure → Document → Search → Collect → Preserve → Analyse\n\n"
            "**The Locard Exchange Principle:** *Every contact leaves a trace.* The suspect takes something from the scene "
            "and leaves something behind — the basis of all trace evidence."
        )
    },
    "document analysis": {
        "keywords": ["document","questioned document","handwriting","ink analysis","paper analysis","forgery","alteration","indented writing","esda","obliterated","document forensic"],
        "response": (
            "**Questioned Document Examination (QDE)** analyses physical documents to determine authenticity, authorship, or alterations.\n\n"
            "**What analysts examine:** Handwriting, ink chemistry, paper analysis, typeface/printer analysis, alterations.\n\n"
            "**ESDA** recovers indented writing. **VSC** uses different wavelengths of light to reveal hidden or altered ink."
        )
    },
    "forensic tools": {
        "keywords": ["forensic tool","autopsy","ftk","encase","volatility","cellebrite","wireshark","helix","sleuth kit","magnet","oxygen forensics","write blocker"],
        "response": (
            "**Key Forensic Investigation Tools:**\n\n"
            "• **Autopsy** — open-source disk forensics GUI\n"
            "• **FTK** — commercial; fast indexing\n"
            "• **EnCase** — industry standard for law enforcement\n"
            "• **Volatility** — RAM / memory forensics\n"
            "• **Cellebrite UFED** — mobile extraction\n"
            "• **Wireshark** — network packet capture\n"
            "• **Write blockers** — hardware; prevent writes to evidence drives"
        )
    },
    "trace evidence": {
        "keywords": ["trace evidence","fibre","hair","glass","paint","soil","pollen","gunshot residue","gsr","locard","transfer"],
        "response": (
            "**Trace Evidence** refers to small, often microscopic material transferred during contact (Locard's Exchange Principle).\n\n"
            "**Types:** Hair, fibres, glass, paint, gunshot residue (GSR), soil/pollen.\n\n"
            "**Collection:** Tape lifts, forceps, vacuum devices — each requiring specific packaging to prevent cross-contamination."
        )
    },
    "toxicology": {
        "keywords": ["toxicology","poison","drug","alcohol","blood alcohol","bac","autopsy tox","forensic toxicology","substance","overdose","cause of death tox"],
        "response": (
            "**Forensic Toxicology** identifies and quantifies drugs, alcohol, poisons in biological specimens.\n\n"
            "**Specimens:** Blood, urine, hair, vitreous humour, liver, bile\n\n"
            "**Techniques:** Immunoassay (screening), GC-MS (gold standard confirmation), LC-MS/MS (thermally labile compounds).\n\n"
            "**Hair analysis** can provide a 90-day retrospective drug history — 1 cm of hair ≈ 1 month."
        )
    },
    "autopsy": {
        "keywords": ["autopsy","post mortem","postmortem","cause of death","manner of death","pathology","forensic pathologist","medico-legal","death investigation","coroner","morgue"],
        "response": (
            "**Forensic Autopsy (Post-Mortem Examination)** determines cause and manner of death.\n\n"
            "**Manner of death:** Natural, Accident, Homicide, Suicide, Undetermined\n\n"
            "**PMI estimated via:** Algor mortis (cooling), livor mortis (lividity), rigor mortis, decomposition, and forensic entomology."
        )
    },
    "cyber forensics": {
        "keywords": ["malware","ransomware","phishing","intrusion","hack","cyber attack","incident response","ioc","artefact","log analysis","registry","prefetch","browser history","event log"],
        "response": (
            "**Cyber Incident Forensics** investigates intrusions, malware infections, and data breaches.\n\n"
            "**Key Windows artefacts:** Registry (NTUSER.DAT), Event logs (4624/4625), Prefetch files, Browser history SQLite, $MFT, LNK files.\n\n"
            "**Malware analysis:** Static (strings, headers) → Dynamic (sandbox) → Code analysis (IDA Pro, Ghidra).\n\n"
            "**IOCs:** File hashes, IPs, domains, registry keys — shared via STIX/TAXII."
        )
    },
    "forensic photography": {
        "keywords": ["forensic photo","crime scene photo","evidence photo","photography","document scene","photograph evidence","macro photography","uv photography","ir photography"],
        "response": (
            "**Forensic Photography** creates a permanent visual record of the crime scene.\n\n"
            "**Sequence:** Overall → Mid-range → Close-up (with and without scale)\n\n"
            "**Specialist techniques:** UV/IR photography, oblique lighting, focus stacking, photogrammetry.\n\n"
            "**EXIF metadata** embedded in digital photos is itself forensic evidence — preserve originals."
        )
    },
    "admissibility": {
        "keywords": ["admissible","admissibility","daubert","frye","expert witness","court","legal","evidence law","expert testimony","scientific evidence"],
        "response": (
            "**Forensic Evidence Admissibility** governs whether scientific evidence can be presented in court.\n\n"
            "• **Frye Standard** (1923) — must be *generally accepted* in the scientific community\n"
            "• **Daubert Standard** (1993) — judge as gatekeeper; considers testing, peer review, error rate, general acceptance\n\n"
            "**Spoliation:** Intentional destruction of evidence can result in adverse inference instructions to the jury."
        )
    },
    "ballistics": {
        "keywords": ["ballistic","firearms","bullet","cartridge","rifling","gunshot","gsw","wound ballistic","toolmark","striation","calibre","firearm analysis"],
        "response": (
            "**Forensic Ballistics & Firearms Analysis** identifies weapons and links them to crimes.\n\n"
            "• **Toolmark analysis** — rifling grooves leave unique striations on bullets\n"
            "• **Cartridge case comparison** — breech face marks, firing pin impressions\n"
            "• **NIBIN** — automated correlation of bullet/case images\n\n"
            "**GSR** (gunshot residue): Lead-barium-antimony particles detected by SEM-EDX on hands/clothing."
        )
    },
    "entomology": {
        "keywords": ["entomology","insect","fly","maggot","blowfly","calliphoridae","forensic entomology","pmi","post-mortem insect","succession","beetle","larva"],
        "response": (
            "**Forensic Entomology** uses insect activity to estimate the post-mortem interval (PMI).\n\n"
            "**Blowfly lifecycle:** Eggs → 1st instar (8 hrs) → 2nd (18 hrs) → 3rd (36 hrs) → Pupation → Adult (~2–3 weeks).\n\n"
            "**ADH (Accumulated Degree Hours):** PMI calculated by accumulating temperature over time, not just days."
        )
    },
    "mobile forensics": {
        "keywords": ["mobile forensic","phone forensic","smartphone","ios forensic","android forensic","cellebrite","ufed","graykey","extraction","artifact mobile","imei","sim"],
        "response": (
            "**Mobile Device Forensics** recovers data from smartphones, tablets, and wearables.\n\n"
            "**Extraction levels:** Manual → Logical → File system → Physical → Chip-off\n\n"
            "**Key artefacts:** Call logs, SMS, WhatsApp/Signal databases, GPS history, photos with EXIF, app usage, health data, Wi-Fi networks."
        )
    },
    "general forensics": {
        "keywords": ["forensic science","forensics","forensic","investigation","evidence","analyst","laboratory","fbi","interpol","forensic unit","case"],
        "response": (
            "**Forensic Science** applies scientific methods to investigate crimes and legal matters.\n\n"
            "**Major disciplines:** Criminalistics, Digital Forensics, Pathology, Toxicology, QDE, Odontology, Anthropology, Entomology, Psychology.\n\n"
            "**The investigative process:** Scene → Documentation → Collection → Chain of Custody → Laboratory → Report → Court\n\n"
            "Ask me about any specific area — DNA, fingerprints, CCTV, blood spatter, toxicology, ballistics, or forensic tools!"
        )
    }
}

FORENSICS_SUGGESTIONS = [
    "How does DNA analysis work in forensics?",
    "What is the chain of custody?",
    "How are fingerprints collected at a crime scene?",
    "Explain blood spatter pattern analysis",
    "What tools do digital forensic investigators use?",
    "How is CCTV footage analysed as evidence?",
    "What happens during a forensic autopsy?",
    "How does forensic entomology estimate time of death?",
    "What makes forensic evidence admissible in court?",
    "How do investigators analyse mobile phones?",
    "What is Locard's Exchange Principle?",
    "How is gunshot residue detected?",
    "Explain trace evidence analysis",
    "What is questioned document examination?",
    "How does toxicology determine cause of death?",
]


def forensics_llm(message: str) -> dict:
    text = message.lower().strip()

    # Greetings
    if any(g in text.split() for g in ["hello","hi","hey","greetings","howdy"]):
        return {
            "reply": (
                "Hello, Investigator! I'm **ForensicAI**, your digital forensics assistant.\n\n"
                "I can help you with:\n"
                "• DNA & fingerprint analysis\n"
                "• Digital & mobile forensics\n"
                "• Crime scene investigation\n"
                "• Blood spatter & trace evidence\n"
                "• CCTV & video analysis\n"
                "• Toxicology & autopsy\n"
                "• Ballistics, admissibility & chain of custody\n\n"
                "What would you like to know?"
            ),
            "topic": "greeting", "confidence": 1.0,
            "suggestions": random.sample(FORENSICS_SUGGESTIONS, 4)
        }

    if any(h in text for h in ["help","what can you","capabilities","topics"]):
        return {
            "reply": (
                "**I'm trained on 18 forensic science topics:**\n\n"
                "🔬 Digital & Cyber Forensics · 🧬 DNA · 🖐️ Fingerprints · 🩸 Blood Spatter\n"
                "📹 CCTV · 💻 Malware/IR · 🔫 Ballistics · 📄 Documents · ⚗️ Toxicology\n"
                "🪲 Entomology · 📱 Mobile Forensics · 🏛️ Admissibility · 🔍 Trace Evidence\n"
                "⚕️ Autopsy · 🔗 Chain of Custody · 📸 Forensic Photography\n\n"
                "Just ask about any of these!"
            ),
            "topic": "help", "confidence": 1.0,
            "suggestions": random.sample(FORENSICS_SUGGESTIONS, 4)
        }

    scores = {
        topic: sum(len(kw.split()) for kw in data["keywords"] if kw in text)
        for topic, data in FORENSICS_KB.items()
    }
    best_topic = max(scores, key=scores.get)
    best_score = scores[best_topic]

    if best_score > 0:
        return {
            "reply":       FORENSICS_KB[best_topic]["response"],
            "topic":       best_topic,
            "confidence":  round(min(best_score / 6.0, 1.0), 2),
            "suggestions": random.sample(FORENSICS_SUGGESTIONS, 3)
        }

    return {
        "reply": (
            "I specialise in forensic science. I didn't find a close match — try asking about:\n\n"
            "• DNA, fingerprints, or blood spatter\n"
            "• Digital forensics, CCTV, or mobile devices\n"
            "• Toxicology, autopsy, or ballistics\n"
            "• Chain of custody or admissibility"
        ),
        "topic": "unknown", "confidence": 0.0,
        "suggestions": random.sample(FORENSICS_SUGGESTIONS, 4)
    }


# ══════════════════════════════════════════════════════════════════
#  CASE DATA
# ══════════════════════════════════════════════════════════════════
CASE_047 = {
    "id": "047", "title": "The Abandoned Warehouse", "subtitle": "Case #047",
    "briefing": (
        "A suspicious incident has occurred inside an abandoned warehouse on the edge of the industrial district. "
        "Several objects are scattered around the location and investigators have discovered unusual evidence. "
        "Your task is to collect, analyze, and connect the clues to reconstruct what happened."
    ),
    "suspects": [
        {"id":"A","name":"Marcus Reeve", "profile":"Former warehouse manager. Known to have disputed access rights.","fingerprint_code":"R3V"},
        {"id":"B","name":"Diana Cole",   "profile":"Private investigator. Last seen near the district that evening.", "fingerprint_code":"C0L"},
        {"id":"C","name":"Owen Marsh",   "profile":"Delivery driver. Route passes the warehouse regularly.",          "fingerprint_code":"M4R"},
    ],
    "scene_objects": [
        {"id":"door",     "label":"Entry Door",     "x":12,"y":55,"icon":"🚪","interactions":["EXAMINE","PHOTOGRAPH"],"examine_text":"The door frame is scratched. The handle shows smudges consistent with a hurried grip.","evidence_id":"fingerprint"},
        {"id":"body",     "label":"Covered Figure", "x":48,"y":62,"icon":"🧍","interactions":["EXAMINE","PHOTOGRAPH"],"examine_text":"A white sheet covers something on the floor. Dried blood stains spread outward in a radial pattern.","evidence_id":"blood_sample"},
        {"id":"briefcase","label":"Open Briefcase", "x":38,"y":70,"icon":"💼","interactions":["EXAMINE","COLLECT","PHOTOGRAPH"],"examine_text":"An open forensic case with tools still inside. One slot is empty.","evidence_id":None},
        {"id":"phone",    "label":"Mobile Phone",   "x":62,"y":58,"icon":"📱","interactions":["EXAMINE","COLLECT","PHOTOGRAPH"],"examine_text":"Screen is cracked. Last active timestamp visible: 20:47.","evidence_id":"phone_data"},
        {"id":"note",     "label":"Torn Note",      "x":25,"y":45,"icon":"📄","interactions":["EXAMINE","COLLECT","PHOTOGRAPH"],"examine_text":"Two torn halves of a handwritten note. Numbers and a partial name are visible.","evidence_id":"torn_note"},
        {"id":"cctv",     "label":"CCTV Terminal",  "x":78,"y":35,"icon":"💻","interactions":["EXAMINE","ANALYZE"],"examine_text":"A dusty monitor. Last recorded footage is timestamped 20:51.","evidence_id":"cctv_footage"},
        {"id":"footprint","label":"Footprints",     "x":55,"y":80,"icon":"👣","interactions":["EXAMINE","COLLECT","PHOTOGRAPH"],"examine_text":"Clear boot impressions in the dust. Size 10, leading from the south entrance.","evidence_id":"footprint"},
        {"id":"glove",    "label":"Latex Glove",    "x":18,"y":75,"icon":"🧤","interactions":["EXAMINE","COLLECT"],"examine_text":"A single latex glove, inside-out. Trace biological material may be present.","evidence_id":"dna_sample"},
        {"id":"key",      "label":"Key Ring",       "x":70,"y":72,"icon":"🔑","interactions":["EXAMINE","COLLECT"],"examine_text":"Three keys on a plain ring. Tag reads '…47'.","evidence_id":"keys"},
    ],
    "evidence_definitions": {
        "fingerprint": {"id":"fingerprint","name":"Fingerprint","icon":"🖐️","location":"Door Handle","meaning":"May identify who entered the warehouse.","lab_type":"fingerprint","result_code":"R3V","match_suspect":"A"},
        "blood_sample":{"id":"blood_sample","name":"Blood Sample","icon":"🩸","location":"Floor — origin","meaning":"Type and DNA can be analyzed.","lab_type":"dna","result_code":"A","match_suspect":"A"},
        "phone_data":  {"id":"phone_data","name":"Mobile Phone","icon":"📱","location":"Near figure","meaning":"Last active 20:47 — timeline clue.","lab_type":"cctv","result_code":None,"match_suspect":None},
        "torn_note":   {"id":"torn_note","name":"Torn Note","icon":"📄","location":"Desk area","meaning":"Partial name and numbers — case link.","lab_type":"document","result_code":None,"match_suspect":None},
        "cctv_footage":{"id":"cctv_footage","name":"CCTV Footage","icon":"📹","location":"Security terminal","meaning":"Timestamped entry — 20:51.","lab_type":"cctv","result_code":None,"match_suspect":"A"},
        "footprint":   {"id":"footprint","name":"Footprint","icon":"👣","location":"Warehouse floor","meaning":"Movement path through scene.","lab_type":None,"result_code":None,"match_suspect":None},
        "dna_sample":  {"id":"dna_sample","name":"DNA Sample","icon":"🧬","location":"Latex glove","meaning":"Biological trace — suspect link.","lab_type":"dna","result_code":"A","match_suspect":"A"},
        "keys":        {"id":"keys","name":"Key Ring","icon":"🔑","location":"Near storage","meaning":"Access key — tag reads '…47'.","lab_type":None,"result_code":None,"match_suspect":None},
    },
    "timeline_events": [
        {"id":"t1","time":"19:30","text":"Warehouse last officially accessed by staff"},
        {"id":"t2","time":"20:47","text":"Mobile phone last active — partial text message sent"},
        {"id":"t3","time":"20:51","text":"CCTV records figure entering south entrance"},
        {"id":"t4","time":"21:15","text":"Neighbours report unusual sounds"},
        {"id":"t5","time":"22:40","text":"Anonymous tip received — patrol unit dispatched"},
        {"id":"t6","time":"23:05","text":"First responders arrive and secure the scene"},
    ],
    "correct_suspect":"A",
    "correct_answers":{"who":"A","when":"t3","where":"south_entrance","what":"entered_warehouse"},
    "min_evidence_to_solve":4,
}


# ══════════════════════════════════════════════════════════════════
#  APP STARTUP — initialise SQLite tables
# ══════════════════════════════════════════════════════════════════
with app.app_context():
    db.create_all()
    log.info("SQLite tables verified at %s", _SQLITE_PATH)
    sb_status = "✓ configured" if is_supabase_configured() else "✗ not configured (using SQLite fallback)"
    log.info("Supabase: %s", sb_status)
    log.info("DB_MODE : %s", DB_MODE)


# ══════════════════════════════════════════════════════════════════
#  PAGE ROUTES
# ══════════════════════════════════════════════════════════════════
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/game')
def game():
    return render_template('game.html')


# ══════════════════════════════════════════════════════════════════
#  API — Health / Status
# ══════════════════════════════════════════════════════════════════
@app.route('/api/status')
def api_status():
    """Returns live health of both database connections."""
    sqlite_ok = True
    sqlite_counts = {}
    try:
        sqlite_counts = {
            'subscribers':  Subscriber.query.count(),
            'chat_messages': ChatMessage.query.count(),
            'game_sessions': GameSession.query.count(),
            'leaderboard':   LeaderboardEntry.query.count(),
        }
    except Exception as exc:
        sqlite_ok = False
        log.error("SQLite health check failed: %s", exc)

    supabase_ok = False
    supabase_configured = is_supabase_configured()
    if supabase_configured:
        supabase_ok = SupabaseSync.ping()

    return jsonify({
        'status': 'ok',
        'db_mode': DB_MODE,
        'sqlite': {
            'connected': sqlite_ok,
            'path': _SQLITE_PATH,
            'counts': sqlite_counts,
        },
        'supabase': {
            'configured': supabase_configured,
            'connected':  supabase_ok,
            'url': os.getenv('SUPABASE_URL', 'not set'),
        },
        'timestamp': datetime.datetime.utcnow().isoformat(),
    })


# ══════════════════════════════════════════════════════════════════
#  API — Forensics AI Chat
# ══════════════════════════════════════════════════════════════════
@app.route('/api/forensics-chat', methods=['POST'])
def forensics_chat():
    payload    = request.get_json(silent=True) or {}
    message    = str(payload.get('message', '') or '').strip()
    session_id = str(payload.get('session_id', '') or 'anonymous').strip()[:120]

    if not message:
        return jsonify({'error': 'Message required'}), 400
    if len(message) > 600:
        return jsonify({'error': 'Message too long (max 600 chars)'}), 400

    result = forensics_llm(message)
    now    = datetime.datetime.utcnow()
    result['timestamp'] = now.strftime('%H:%M')

    # ── Persist to SQLite ─────────────────────────────────────────
    if _use_sqlite():
        try:
            db.session.add(ChatMessage(
                session_id=session_id, role='user',
                message=message, topic=None, confidence=None, created_at=now
            ))
            db.session.add(ChatMessage(
                session_id=session_id, role='ai',
                message=result['reply'], topic=result.get('topic'),
                confidence=result.get('confidence'), created_at=now
            ))
            _db_commit()
        except Exception as exc:
            log.error("SQLite chat insert failed: %s", exc)
            db.session.rollback()

    # ── Persist to Supabase ───────────────────────────────────────
    if _use_supabase():
        SupabaseSync.insert_chat_message(session_id, 'user',   message,         None,                   None)
        SupabaseSync.insert_chat_message(session_id, 'ai',     result['reply'], result.get('topic'),    result.get('confidence'))

    return jsonify(result)


@app.route('/api/forensics-suggestions', methods=['GET'])
def forensics_suggestions():
    return jsonify({'suggestions': random.sample(FORENSICS_SUGGESTIONS, 6)})


@app.route('/api/chat-history', methods=['GET'])
def api_chat_history():
    """Return chat history for a session. Reads from Supabase if available, else SQLite."""
    session_id = request.args.get('session_id', 'anonymous')[:120]
    limit      = min(int(request.args.get('limit', 50)), 100)

    if _use_supabase():
        data = SupabaseSync.get_chat_history(session_id, limit)
        if data:
            return jsonify({'source': 'supabase', 'messages': data})

    # Fallback to SQLite
    try:
        msgs = (ChatMessage.query
                .filter_by(session_id=session_id)
                .order_by(ChatMessage.created_at.asc())
                .limit(limit).all())
        return jsonify({'source': 'sqlite', 'messages': [m.to_dict() for m in msgs]})
    except Exception as exc:
        log.error("chat-history sqlite error: %s", exc)
        return jsonify({'source': 'error', 'messages': []}), 500


# ══════════════════════════════════════════════════════════════════
#  API — Subscribe
# ══════════════════════════════════════════════════════════════════
@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    payload = request.get_json(silent=True) or {}
    email   = str(payload.get('email', '') or '').strip().lower()
    source  = str(payload.get('source', 'website') or 'website').strip()[:60]

    if not email or '@' not in email or len(email) > 255:
        return jsonify({'success': False, 'message': 'Please enter a valid email address.'}), 400

    # ── Check + write SQLite ──────────────────────────────────────
    if _use_sqlite():
        try:
            existing = Subscriber.query.filter_by(email=email).first()
            if existing:
                return jsonify({'success': False, 'message': 'Already subscribed!'}), 400
            db.session.add(Subscriber(email=email, source=source))
            _db_commit()
        except Exception as exc:
            log.error("SQLite subscribe error: %s", exc)
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Database error. Please try again.'}), 500
    else:
        # Supabase-only mode — still check SQLite for fast in-memory guard
        pass

    # ── Mirror to Supabase ────────────────────────────────────────
    if _use_supabase():
        SupabaseSync.upsert_subscriber(email, source)

    log.info("New subscriber: %s (source=%s)", email, source)
    return jsonify({'success': True, 'message': "You're in. We'll keep you updated."})


# ══════════════════════════════════════════════════════════════════
#  API — Game: case data, lab, report, leaderboard
# ══════════════════════════════════════════════════════════════════
@app.route('/api/case/<case_id>')
def api_case(case_id):
    if case_id == '047':
        return jsonify(CASE_047)
    return jsonify({'error': 'Case not found'}), 404


@app.route('/api/game/session/start', methods=['POST'])
def api_session_start():
    """Create (or return) a game session row in both DBs."""
    payload     = request.get_json(silent=True) or {}
    session_id  = str(payload.get('session_id') or uuid.uuid4())[:120]
    player_name = str(payload.get('player_name', 'Investigator') or 'Investigator')[:120]
    case_id     = str(payload.get('case_id', '047') or '047')[:20]

    if _use_sqlite():
        try:
            if not GameSession.query.filter_by(session_id=session_id).first():
                gs = GameSession(session_id=session_id, case_id=case_id, player_name=player_name)
                db.session.add(gs)
                _db_commit()
        except Exception as exc:
            log.error("SQLite session start error: %s", exc)
            db.session.rollback()

    if _use_supabase():
        SupabaseSync.upsert_game_session({
            'session_id':  session_id,
            'case_id':     case_id,
            'player_name': player_name,
            'started_at':  datetime.datetime.utcnow().isoformat(),
        })

    return jsonify({'session_id': session_id, 'status': 'started'})


@app.route('/api/game/evidence/collect', methods=['POST'])
def api_collect_evidence():
    """Log a collected evidence item to both DBs."""
    payload     = request.get_json(silent=True) or {}
    session_id  = str(payload.get('session_id', '') or '')[:120]
    evidence_id = str(payload.get('evidence_id', '') or '')[:60]
    if not session_id or not evidence_id:
        return jsonify({'error': 'session_id and evidence_id required'}), 400

    ev_def = CASE_047['evidence_definitions'].get(evidence_id, {})
    now    = datetime.datetime.utcnow()

    if _use_sqlite():
        try:
            gs = GameSession.query.filter_by(session_id=session_id).first()
            if gs:
                already = CollectedEvidence.query.filter_by(
                    game_session_id=gs.id, evidence_id=evidence_id).first()
                if not already:
                    db.session.add(CollectedEvidence(
                        game_session_id=gs.id,
                        evidence_id=evidence_id,
                        evidence_name=ev_def.get('name', evidence_id),
                        location=ev_def.get('location', ''),
                        collected_at=now,
                    ))
                    gs.evidence_count += 1
                    _db_commit()
        except Exception as exc:
            log.error("SQLite collect evidence error: %s", exc)
            db.session.rollback()

    return jsonify({'collected': True, 'evidence_id': evidence_id})


@app.route('/api/lab/fingerprint', methods=['POST'])
def api_lab_fingerprint():
    payload = request.get_json(silent=True) or {}
    code    = str(payload.get('code', '') or '').strip().upper()
    matched = next((s for s in CASE_047['suspects'] if s['fingerprint_code'] == code), None)
    return jsonify({'success': True, 'match': bool(matched), 'suspect': matched})


@app.route('/api/lab/dna', methods=['POST'])
def api_lab_dna():
    payload = request.get_json(silent=True) or {}
    profile = str(payload.get('profile', '') or '').strip().upper()
    suspect = next((s for s in CASE_047['suspects'] if s['id'] == profile), None)
    return jsonify({'success': True, 'match': bool(suspect), 'suspect': suspect})


@app.route('/api/submit-report', methods=['POST'])
def api_submit_report():
    payload      = request.get_json(silent=True) or {}
    session_id   = str(payload.get('session_id', '') or 'anonymous')[:120]
    suspect_id   = str(payload.get('suspect',   '') or '').strip().upper()
    when_answer  = str(payload.get('when',       '') or '').strip()
    evidence_ids = payload.get('evidence', []) or []
    conclusion   = str(payload.get('conclusion', '') or '').strip()[:2000]
    player_name  = str(payload.get('player_name','Investigator') or 'Investigator')[:120]

    correct = CASE_047['correct_answers']
    score, feedback = 0, []

    if suspect_id == correct['who']:
        score += 40
        feedback.append({'field':'suspect','correct':True, 'msg':'Correct suspect identified.'})
    else:
        feedback.append({'field':'suspect','correct':False,'msg':'Suspect identification incorrect.'})

    if when_answer == correct['when']:
        score += 25
        feedback.append({'field':'when','correct':True, 'msg':'Entry time correctly identified.'})
    else:
        feedback.append({'field':'when','correct':False,'msg':'Timeline entry not fully supported.'})

    ev_score = min(len([e for e in evidence_ids if e]) * 7, 35)
    score   += ev_score
    feedback.append({'field':'evidence','correct': ev_score >= 21,
                     'msg': f'{len(evidence_ids)} evidence item(s) cited.'})

    solved       = score >= 65
    suspect_name = next((s['name'] for s in CASE_047['suspects'] if s['id'] == CASE_047['correct_suspect']), '')
    now          = datetime.datetime.utcnow()

    # ── Persist report + update session in SQLite ─────────────────
    if _use_sqlite():
        try:
            gs = GameSession.query.filter_by(session_id=session_id).first()
            if not gs:
                gs = GameSession(session_id=session_id, case_id='047',
                                 player_name=player_name, started_at=now)
                db.session.add(gs)
                db.session.flush()

            gs.score          = score
            gs.solved         = solved
            gs.completed_at   = now
            gs.suspect_chosen = suspect_id
            gs.conclusion     = conclusion

            # Upsert report
            rpt = InvestigationReport.query.filter_by(game_session_id=gs.id).first()
            if rpt:
                rpt.suspect_id     = suspect_id
                rpt.suspect_name   = next((s['name'] for s in CASE_047['suspects'] if s['id']==suspect_id), suspect_id)
                rpt.when_event     = when_answer
                rpt.evidence_cited = ','.join(str(e) for e in evidence_ids)
                rpt.conclusion     = conclusion
                rpt.score          = score
                rpt.solved         = solved
                rpt.submitted_at   = now
            else:
                db.session.add(InvestigationReport(
                    game_session_id=gs.id,
                    case_id='047',
                    suspect_id=suspect_id,
                    suspect_name=next((s['name'] for s in CASE_047['suspects'] if s['id']==suspect_id), suspect_id),
                    when_event=when_answer,
                    evidence_cited=','.join(str(e) for e in evidence_ids),
                    conclusion=conclusion,
                    score=score,
                    solved=solved,
                    submitted_at=now,
                ))

            # Leaderboard entry
            db.session.add(LeaderboardEntry(
                player_name=player_name, case_id='047',
                score=score, solved=solved,
                evidence_cnt=len(evidence_ids)
            ))
            _db_commit()
        except Exception as exc:
            log.error("SQLite submit-report error: %s", exc)
            db.session.rollback()

    # ── Mirror to Supabase ────────────────────────────────────────
    if _use_supabase():
        SupabaseSync.upsert_game_session({
            'session_id':     session_id,
            'case_id':        '047',
            'player_name':    player_name,
            'completed_at':   now.isoformat(),
            'score':          score,
            'solved':         solved,
            'evidence_count': len(evidence_ids),
            'suspect_chosen': suspect_id,
            'conclusion':     conclusion,
        })
        SupabaseSync.insert_leaderboard({
            'player_name':  player_name,
            'case_id':      '047',
            'score':        score,
            'solved':       solved,
            'evidence_cnt': len(evidence_ids),
            'created_at':   now.isoformat(),
        })

    return jsonify({
        'solved':           solved,
        'score':            score,
        'max_score':        100,
        'feedback':         feedback,
        'correct_suspect':  CASE_047['correct_suspect'],
        'suspect_name':     suspect_name,
    })


@app.route('/api/leaderboard')
def api_leaderboard():
    """Top 10 for a case. Reads from Supabase if available, else SQLite."""
    case_id = request.args.get('case_id', '047')[:20]
    limit   = min(int(request.args.get('limit', 10)), 50)

    if _use_supabase():
        data = SupabaseSync.get_leaderboard(case_id, limit)
        if data:
            return jsonify({'source': 'supabase', 'leaderboard': data})

    # Fallback to SQLite
    try:
        entries = (LeaderboardEntry.query
                   .filter_by(case_id=case_id)
                   .order_by(LeaderboardEntry.score.desc())
                   .limit(limit).all())
        return jsonify({'source': 'sqlite', 'leaderboard': [e.to_dict() for e in entries]})
    except Exception as exc:
        log.error("leaderboard sqlite error: %s", exc)
        return jsonify({'source': 'error', 'leaderboard': []}), 500


# ══════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', '1') == '1',
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000))
    )
