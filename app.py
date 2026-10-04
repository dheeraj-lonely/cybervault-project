from __future__ import annotations

import os
import random
import logging
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from sqlalchemy import text

load_dotenv()

app = Flask(__name__)
log = logging.getLogger("cybervault")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s — %(message)s")
DB_MODE = os.getenv("DB_MODE", "sqlite")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "evidence-lot-secret-2024")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_SQLITE_FN = os.getenv("SQLITE_DB_PATH", "cybervault.db")
_SQLITE_PATH = os.path.join(_BASE_DIR, _SQLITE_FN)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{_SQLITE_PATH}"

from database.models import (  # noqa: E402
    ChatMessage,
    CollectedEvidence,
    CourseProgress,
    CourseRecommendation,
    Evidence,
    GameSession,
    InvestigationReport,
    LeaderboardEntry,
    Subscriber,
    db,
)

from database.supabase_client import is_supabase_configured, SupabaseSync  # noqa: E402

db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*")
rooms = {}


def ensure_course_progress_schema():
    with app.app_context():
        inspector = db.inspect(db.engine)
        if "course_progress" not in inspector.get_table_names():
            return

        existing_columns = {column["name"] for column in inspector.get_columns("course_progress")}
        column_definitions = {
            "course_id": "INTEGER NOT NULL DEFAULT 1",
            "progress": "INTEGER NOT NULL DEFAULT 0",
            "level": "VARCHAR(40) NOT NULL DEFAULT 'beginner'",
            "updated_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
        }

        for column_name, column_sql in column_definitions.items():
            if column_name not in existing_columns:
                db.session.execute(text(f"ALTER TABLE course_progress ADD COLUMN {column_name} {column_sql}"))

        db.session.commit()


def seed_data():
    with app.app_context():
        db.create_all()
        ensure_course_progress_schema()

        if not Evidence.query.first():
            db.session.add_all(
                [
                    Evidence(
                        evidence_id="usb-drive",
                        name="USB Drive",
                        category="Digital Device",
                        source="Finance Desk",
                        timestamp="2024-05-01 12:05:22",
                        observation="An unlabeled flash drive was found near the finance desk.",
                        confidence=83,
                    ),
                    Evidence(
                        evidence_id="chat-log",
                        name="Chat Log",
                        category="Communication",
                        source="Investigator_03",
                        timestamp="2024-05-01 12:11:38",
                        observation="Message thread references a file named revision final_v2.",
                        confidence=87,
                    ),
                    Evidence(
                        evidence_id="browser-history",
                        name="Browser History",
                        category="Browser",
                        source="Investigator_02",
                        timestamp="2024-05-01 12:13:11",
                        observation="File preview activity occurred during off-hours access.",
                        confidence=79,
                    ),
                ]
            )

        if not CourseRecommendation.query.first():
            db.session.add_all(
                [
                    CourseRecommendation(
                        title="Evidence Handling Basics",
                        category="Foundations",
                        level="beginner",
                        duration="30 mins",
                        description="Learn the preservation and documentation of digital evidence.",
                        materials="Chain of custody|Labeling|Imaging",
                        progress=25,
                        complete=False,
                    ),
                    CourseRecommendation(
                        title="Timeline Correlation",
                        category="Analysis",
                        level="intermediate",
                        duration="45 mins",
                        description="Connect timestamps and artifacts into a consistent story.",
                        materials="Logs|Timeline|Access review",
                        progress=30,
                        complete=False,
                    ),
                    CourseRecommendation(
                        title="Incident Reporting",
                        category="Reporting",
                        level="advanced",
                        duration="60 mins",
                        description="Turn findings into a defensible incident narrative.",
                        materials="Summary|Risks|Evidence review",
                        progress=40,
                        complete=False,
                    ),
                ]
            )

        if not CourseProgress.query.first():
            db.session.add_all(
                [
                    CourseProgress(learner="Student", course_id=1, progress=25, level="beginner"),
                    CourseProgress(learner="Alex", course_id=1, progress=50, level="intermediate"),
                ]
            )

        if not Subscriber.query.filter_by(email="demo@cybervault.com").first():
            db.session.add(Subscriber(email="demo@cybervault.com", source="seed"))

        db.session.commit()


def get_room_snapshot(room_name):
    members = rooms.get(room_name, {})
    players = [member for member in members.values()]
    return {"room": room_name, "players": players, "player_count": len(players)}


@app.route("/api/multiplayer/health")
def multiplayer_health():
    total_players = sum(len(members) for members in rooms.values())
    return jsonify({"status": "ok", "players": total_players, "rooms": list(rooms.keys())})


@socketio.on("join_room")
def handle_join_room(data):
    payload = data or {}
    room_name = str(payload.get("room", "lobby") or "lobby").strip() or "lobby"
    player_name = str(payload.get("player_name", "Player") or "Player").strip() or "Player"
    join_room(room_name)
    room_members = rooms.setdefault(room_name, {})
    room_members[request.sid] = {"id": request.sid, "name": player_name}
    emit("room_state", get_room_snapshot(room_name), room=room_name)


@socketio.on("player_update")
def handle_player_update(data):
    payload = data or {}
    room_name = str(payload.get("room", "lobby") or "lobby").strip() or "lobby"
    player_name = str(payload.get("player_name", "Player") or "Player").strip() or "Player"
    if room_name in rooms and request.sid in rooms[room_name]:
        rooms[room_name][request.sid]["name"] = player_name
    emit(
        "player_update",
        {
            "room": room_name,
            "player": {"id": request.sid, "name": player_name},
            "players": [member for member in rooms.get(room_name, {}).values()],
        },
        room=room_name,
    )


@socketio.on("leave_room")
def handle_leave_room(data):
    payload = data or {}
    room_name = str(payload.get("room", "lobby") or "lobby").strip() or "lobby"
    if room_name in rooms and request.sid in rooms[room_name]:
        del rooms[room_name][request.sid]
        if not rooms[room_name]:
            rooms.pop(room_name, None)
    leave_room(room_name)
    emit("room_state", get_room_snapshot(room_name), room=room_name)


@socketio.on("disconnect")
def handle_disconnect():
    for room_name, members in list(rooms.items()):
        if request.sid in members:
            del members[request.sid]
            if not members:
                rooms.pop(room_name, None)
            emit("room_state", get_room_snapshot(room_name), room=room_name)



def build_forensic_ai_reply(question):
    text = (question or "").lower().strip()
    if not text:
        return "I can help investigate any forensic question. Ask me about the evidence, timeline, artifact, or workflow and I will reason from the evidence path."
    if any(keyword in text for keyword in ["moon", "toaster", "silly", "absurd", "weird", "blue"]):
        return "The evidence-first response is to treat that claim as a speculative hypothesis rather than a confirmed fact. I would document the question, note the lack of corroborating evidence, and then apply a standard forensic workflow: identify the source, review any physical or digital traces, and test whether the claim is supported by objective data."
    if "usb" in text or "drive" in text:
        return "The USB artifact should be traced through chain-of-custody, hash verification, and file-access timing before it becomes a reliable finding."
    if "mail" in text or "message" in text or "chat" in text:
        return "The communication channel should be reviewed for sender attribution, timing, and context before the narrative becomes a reportable conclusion."
    if "access" in text or "login" in text or "history" in text:
        return "Review the access window, privilege changes, and session overlaps to determine whether the evidence supports unauthorized access or a legitimate workflow."
    if "risk" in text or "incident" in text:
        return "Risk should be assessed from the evidence chain, exposure window, affected systems, and the likelihood of repeat compromise."
    if "timeline" in text or "when" in text:
        return "Align the timestamps from each artifact to the same reference clock and identify the first point of divergence before forming a timeline conclusion."
    if "report" in text or "summary" in text:
        return "A strong case summary should include the scope, findings, corroborating evidence, confidence rating, and the exact assumptions that remain unresolved."
    return "A sound forensic answer begins with the evidence, not the narrative. I would identify the artifact, map the timeline, test for corroboration, and then explain what can be concluded and what remains uncertain."


def build_chat_reply(message):
    text = (message or "").lower()
    if "usb" in text or "drive" in text:
        return "The USB artifact should be traced through chain-of-custody and hash comparison before the report is finalized."
    if "mail" in text or "message" in text or "chat" in text:
        return "The communication channel should be reviewed for timing and participant attribution before the narrative becomes a finding."
    if "access" in text or "login" in text or "history" in text:
        return "Review the access window and privilege changes to determine whether the evidence supports an unauthorized session."
    if "risk" in text or "incident" in text:
        return "Risk should be assessed from the evidence chain, exposure window, and affected data category."
    return "I can help correlate the evidence stream. Provide the artifact, access point, or timeline question you want to investigate."


FORENSICS_KB = {
    "digital forensics": {
        "keywords": ["digital forensic", "digital evidence", "disk forensic", "computer forensic", "malware"],
        "response": "Digital forensics focuses on recovering, preserving, and analyzing evidence from digital devices while protecting the chain of custody.",
    },
    "chain of custody": {
        "keywords": ["chain of custody", "evidence handling", "custody log", "tamper"],
        "response": "The chain of custody documents who handled the evidence, when they handled it, and under what conditions. A break in that chain can damage the credibility of the evidence.",
    },
    "dna": {
        "keywords": ["dna", "genetic", "pcr", "touch dna"],
        "response": "DNA analysis uses biological samples and STR profiling to compare genetic material and match it to a person or a known sample.",
    },
    "fingerprint": {
        "keywords": ["fingerprint", "latent print", "ridge pattern"],
        "response": "Fingerprint analysis compares ridge patterns and minutiae to identify whether a print matches a known source in a controlled forensic workflow.",
    },
    "network": {
        "keywords": ["network", "log", "timeline", "access", "server"],
        "response": "Network and access data is correlated across log files, timestamps, and user activity to reconstruct when and how an event took place.",
    },
    "general": {
        "keywords": ["forensic", "investigation", "crime scene", "evidence"],
        "response": "A strong forensic answer starts with the evidence. Preserve it, compare it to other artifacts, test the timeline, and report what can be proven versus what remains uncertain.",
    },
}

FORENSICS_SUGGESTIONS = [
    "How does DNA analysis work in forensics?",
    "What is the chain of custody?",
    "How are fingerprints collected at a crime scene?",
    "Explain blood spatter pattern analysis",
    "What tools do digital forensic investigators use?",
    "How is CCTV footage analysed as evidence?",
]


def forensics_llm(message: str):
    text = (message or "").lower().strip()
    if not text:
        return {"reply": "What evidence do you want to analyse?", "topic": "unknown", "confidence": 0.0, "suggestions": random.sample(FORENSICS_SUGGESTIONS, 3)}
    if any(word in text for word in ["hello", "hi", "hey", "greetings"]):
        return {
            "reply": "Hello, Investigator. I can help with evidence handling, digital forensics, DNA, fingerprints, CCTV, and timeline reconstruction.",
            "topic": "greeting",
            "confidence": 1.0,
            "suggestions": random.sample(FORENSICS_SUGGESTIONS, 3),
        }
    scores = {topic: sum(len(keyword.split()) for keyword in data["keywords"] if keyword in text) for topic, data in FORENSICS_KB.items()}
    best_topic = max(scores, key=scores.get)
    best_score = scores.get(best_topic, 0)
    if best_score > 0:
        return {
            "reply": FORENSICS_KB[best_topic]["response"],
            "topic": best_topic,
            "confidence": min(round(best_score / 3.0, 2), 1.0),
            "suggestions": random.sample(FORENSICS_SUGGESTIONS, 3),
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


@app.route('/cybervault-fp')
def cybervault_fp():
    return render_template('cybervault-fp.html')


@app.route('/cybervault-horror')
def cybervault_horror():
    return render_template('cybervault-horror.html')


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
        return jsonify({"error": "Message required", "case_id": case_id}), 400
    result = forensics_llm(message)
    result["case_id"] = case_id
    result["reply"] = result["reply"] + " " + build_chat_reply(message)
    return jsonify(result)


@app.route("/api/evidence")
def api_evidence():
    evidence = Evidence.query.order_by(Evidence.id).all()
    return jsonify([item.to_dict() for item in evidence])


@app.route("/api/ai-course-plan", methods=["POST"])
def api_ai_course_plan():
    payload = request.get_json(silent=True) or {}
    goal = str(payload.get("goal", "forensic investigation") or "forensic investigation")
    level = str(payload.get("level", "beginner") or "beginner").lower()
    learner_name = str(payload.get("learner", "Student") or "Student")

    recommendations = CourseRecommendation.query.order_by(CourseRecommendation.id).all()
    if not recommendations:
        recommendations = []

    recommendation_payload = [
        {
            "id": item.id,
            "title": item.title,
            "category": item.category,
            "level": item.level,
            "duration": item.duration,
            "materials": [material.strip() for material in item.materials.split("|") if material.strip()],
            "description": item.description,
            "progress": item.progress,
            "complete": item.complete,
        }
        for item in recommendations
    ]

    response = {
        "goal": goal,
        "level": level,
        "learner": learner_name,
        "recommendations": recommendation_payload,
        "instructions": [
            f"Start with the foundations of {goal} and define your evidence scope before making conclusions.",
            f"At the {level} level, review each artifact carefully, validate timestamps, and document the chain of custody.",
            "Practice one case at a time. Summarize what changed, who accessed it, and why it matters to the investigation.",
            "Revisit the confidence score and note what evidence supports your final conclusion before submitting a report.",
        ],
        "daily_streak": {"days": 3, "message": "Momentum is building. Keep going."},
        "progress_summary": {
            "average_progress": 35,
            "learner": learner_name,
            "current_level": level,
            "focus": goal,
            "next_step": "Complete the next course module and update your progress.",
        },
    }
    return jsonify(response)


@app.route("/api/site-walkthrough", methods=["POST"])
def api_site_walkthrough():
    payload = request.get_json(silent=True) or {}
    audience = str(payload.get("audience", "new learner") or "new learner")
    goal = str(payload.get("goal", "intro") or "intro")
    return jsonify(
        {
            "overview": f"Welcome to CyberVault, a secure forensic learning platform for {audience}. This site helps you explore the case lab, review evidence, track learning progress, and practice forensic thinking in a guided environment.",
            "goal": goal,
            "audience": audience,
            "steps": [
                {"title": "Start with the Mission", "description": "Review the case brief and learn the objective before you investigate."},
                {"title": "Open the Evidence Lab", "description": "Inspect the evidence board and timeline to understand how findings are pieced together."},
                {"title": "Use the Training Coach", "description": "Choose a level, save your profile, and keep track of your daily streak."},
                {"title": "Complete the learning loop", "description": "Mark courses complete and review badges, checkpoints, and daily challenges."},
            ],
        }
    )


@app.route("/api/learner-profile", methods=["POST"])
def api_learner_profile():
    payload = request.get_json(silent=True) or {}
    learner_name = str(payload.get("learner", "Student") or "Student")
    level = str(payload.get("level", "beginner") or "beginner").lower()

    progress_records = CourseProgress.query.filter_by(learner=learner_name).all()
    average_progress = int(sum(record.progress for record in progress_records) / len(progress_records)) if progress_records else 0

    response = {
        "learner": learner_name,
        "level": level,
        "streak_history": [
            {"date": "2026-09-18", "progress": 25, "course_id": 1},
            {"date": "2026-09-19", "progress": 35, "course_id": 1},
            {"date": "2026-09-20", "progress": 45, "course_id": 2},
        ],
        "daily_streak": {"days": 3, "message": "You are building a consistent learning rhythm."},
        "daily_challenge": {
            "title": "Evidence Basics Sprint",
            "description": "Review the chain of custody and finish one evidence summary.",
            "goal": "Complete one evidence checklist and one short report.",
        },
        "badges": [
            {"name": "Evidence Scout", "description": "Made your first evidence review."},
            {"name": "Momentum Builder", "description": "Maintained a 3-day streak."},
        ],
        "progress_summary": {
            "average_progress": average_progress,
            "learner": learner_name,
            "current_level": level,
            "focus": "forensic fundamentals",
            "next_step": "Complete the next course module and keep your streak alive.",
        },
    }
    return jsonify(response)


@app.route("/api/case/<case_id>")
def api_case(case_id):
    if case_id == "047":
        return jsonify({"id": "047", "title": "The Abandoned Warehouse", "briefing": "A suspicious incident occurred inside an abandoned warehouse."})
    return jsonify({"error": "Case not found"}), 404


@app.route("/api/game/session/start", methods=["POST"])
def api_session_start():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id") or "default-session")[:120]
    player_name = str(payload.get("player_name", "Investigator") or "Investigator")[:120]
    case_id = str(payload.get("case_id", "047") or "047")[:20]

    if not GameSession.query.filter_by(session_id=session_id).first():
        db.session.add(GameSession(session_id=session_id, case_id=case_id, player_name=player_name, score=0, solved=False))
        db.session.commit()

    return jsonify({"session_id": session_id, "status": "started"})


@app.route("/api/game/evidence/collect", methods=["POST"])
def api_collect_evidence():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "") or "")[:120]
    evidence_id = str(payload.get("evidence_id", "") or "")[:60]
    if not session_id or not evidence_id:
        return jsonify({"error": "session_id and evidence_id required"}), 400

    game_session = GameSession.query.filter_by(session_id=session_id).first()
    if game_session:
        db.session.add(CollectedEvidence(game_session_id=game_session.id, evidence_id=evidence_id, evidence_name=evidence_id, location="Case Lab"))
        db.session.commit()
    return jsonify({"collected": True, "evidence_id": evidence_id})


@app.route("/api/lab/fingerprint", methods=["POST"])
def api_lab_fingerprint():
    payload = request.get_json(silent=True) or {}
    code = str(payload.get("code", "") or "").strip().upper()
    matched = code == "R3V"
    return jsonify({"success": True, "match": matched, "suspect": {"id": "A", "name": "Marcus Reeve"} if matched else None})


@app.route("/api/lab/dna", methods=["POST"])
def api_lab_dna():
    payload = request.get_json(silent=True) or {}
    profile = str(payload.get("profile", "") or "").strip().upper()
    matched = profile == "A"
    return jsonify({"success": True, "match": matched, "suspect": {"id": "A", "name": "Marcus Reeve"} if matched else None})


@app.route("/api/submit-report", methods=["POST"])
def api_submit_report():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "anonymous") or "anonymous")[:120]
    suspect = str(payload.get("suspect", "") or "").strip().upper()
    evidence_ids = payload.get("evidence", []) or []
    conclusion = str(payload.get("conclusion", "") or "")[:2000]
    score = 85 if suspect == "A" else 60
    solved = suspect == "A"

    game_session = GameSession.query.filter_by(session_id=session_id).first()
    if not game_session:
        game_session = GameSession(session_id=session_id, case_id="047", player_name="Investigator")
        db.session.add(game_session)
        db.session.flush()

    game_session.score = score
    game_session.solved = solved
    db.session.add(
        InvestigationReport(
            game_session_id=game_session.id,
            case_id="047",
            suspect_id=suspect,
            suspect_name="Marcus Reeve" if suspect == "A" else "Unknown",
            when_event="20:51",
            evidence_cited=",".join(str(item) for item in evidence_ids),
            conclusion=conclusion,
            score=score,
            solved=solved,
            submitted_at=datetime.utcnow(),
        )
    )
    db.session.add(LeaderboardEntry(player_name="Investigator", case_id="047", score=score, solved=solved, evidence_cnt=len(evidence_ids)))
    db.session.commit()

    return jsonify({"solved": solved, "score": score, "max_score": 100, "feedback": [{"field": "suspect", "correct": solved, "msg": "Suspect identified."}]})


@app.route("/api/leaderboard")
def api_leaderboard():
    case_id = request.args.get("case_id", "047")[:20]
    entries = LeaderboardEntry.query.filter_by(case_id=case_id).order_by(LeaderboardEntry.score.desc()).limit(10).all()
    return jsonify({"source": "sqlite", "leaderboard": [entry.to_dict() for entry in entries]})


@app.route("/submit_report", methods=["POST"])
def submit_report():
    return redirect(url_for("index"))


@app.cli.command("initdb")
def initdb_command():
    db.create_all()
    seed_data()
    print("Initialized CyberVault database.")


with app.app_context():
    db.create_all()
    seed_data()


if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
