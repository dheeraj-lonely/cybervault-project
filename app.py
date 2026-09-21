from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
import json
import os
import urllib.request

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cybervault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

app_dir = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app_dir, 'cybervault.db')

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins='*')

rooms = {}


def get_room_snapshot(room_name):
    members = rooms.get(room_name, {})
    players = [member for member in members.values()]
    return {
        'room': room_name,
        'players': players,
        'player_count': len(players)
    }


@app.route('/api/multiplayer/health')
def multiplayer_health():
    total_players = sum(len(members) for members in rooms.values())
    return jsonify({
        'status': 'ok',
        'players': total_players,
        'rooms': list(rooms.keys())
    })


@socketio.on('join_room')
def handle_join_room(data):
    payload = data or {}
    room_name = str(payload.get('room', 'lobby') or 'lobby').strip() or 'lobby'
    player_name = str(payload.get('player_name', 'Player') or 'Player').strip() or 'Player'

    join_room(room_name)
    room_members = rooms.setdefault(room_name, {})
    room_members[request.sid] = {
        'id': request.sid,
        'name': player_name
    }

    emit('room_state', get_room_snapshot(room_name), room=room_name)


@socketio.on('player_update')
def handle_player_update(data):
    payload = data or {}
    room_name = str(payload.get('room', 'lobby') or 'lobby').strip() or 'lobby'
    player_name = str(payload.get('player_name', 'Player') or 'Player').strip() or 'Player'

    if room_name in rooms and request.sid in rooms[room_name]:
        rooms[room_name][request.sid]['name'] = player_name

    emit('player_update', {
        'room': room_name,
        'player': {'id': request.sid, 'name': player_name},
        'players': [member for member in rooms.get(room_name, {}).values()]
    }, room=room_name)


@socketio.on('leave_room')
def handle_leave_room(data):
    payload = data or {}
    room_name = str(payload.get('room', 'lobby') or 'lobby').strip() or 'lobby'

    if room_name in rooms and request.sid in rooms[room_name]:
        del rooms[room_name][request.sid]
        if not rooms[room_name]:
            rooms.pop(room_name, None)

    leave_room(room_name)
    emit('room_state', get_room_snapshot(room_name), room=room_name)


@socketio.on('disconnect')
def handle_disconnect():
    for room_name, members in list(rooms.items()):
        if request.sid in members:
            del members[request.sid]
            if not members:
                rooms.pop(room_name, None)
            emit('room_state', get_room_snapshot(room_name), room=room_name)


class Evidence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    source = db.Column(db.String(80), nullable=False)
    timestamp = db.Column(db.String(80), nullable=False)
    observation = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.Integer, nullable=False, default=82)

class InvestigationReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.String(80), nullable=False)
    investigator = db.Column(db.String(80), nullable=False)
    narrative = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.Integer, nullable=False, default=82)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.String(80), nullable=False, default='CV-014')
    role = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class CourseRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    level = db.Column(db.String(30), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    materials = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    complete = db.Column(db.Boolean, default=False)

class CourseProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course_recommendation.id'), nullable=False)
    learner = db.Column(db.String(120), nullable=False, default='Student')
    progress = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

@app.route('/')
def index():
    evidence = Evidence.query.order_by(Evidence.id).all()
    report_count = InvestigationReport.query.count()
    courses = CourseRecommendation.query.order_by(CourseRecommendation.id).all()
    progress_total = int(sum(item.progress for item in courses) / max(len(courses), 1))
    return render_template('index.html', evidence=evidence, report_count=report_count, courses=courses, progress_total=progress_total)

@app.route('/courses')
def courses_page():
    courses = CourseRecommendation.query.order_by(CourseRecommendation.id).all()
    return render_template('courses.html', courses=courses)

@app.route('/game')
def game_page():
    evidence = Evidence.query.order_by(Evidence.id).all()
    return render_template('game.html', evidence=evidence)


@app.route('/api/forensic-ai', methods=['POST'])
def api_forensic_ai():
    payload = request.get_json(silent=True) or {}
    question = str(payload.get('question', '') or '').strip()

    if not question:
        return jsonify({
            'question': '',
            'answer': 'I can help with any forensic question, from evidence handling to a mischievous moon-and-toaster scenario. Ask me anything and I will reason through it.',
            'confidence': 'high'
        })

    answer = build_forensic_ai_reply(question)
    return jsonify({
        'question': question,
        'answer': answer,
        'confidence': 'high'
    })


@app.route('/api/evidence')
def api_evidence():
    evidence = Evidence.query.order_by(Evidence.id).all()
    return jsonify([
        {
            'id': item.id,
            'evidence_id': item.evidence_id,
            'name': item.name,
            'category': item.category,
            'source': item.source,
            'timestamp': item.timestamp,
            'observation': item.observation,
            'confidence': item.confidence
        } for item in evidence
    ])

@app.route('/api/courses', methods=['GET'])
def api_courses():
    courses = CourseRecommendation.query.order_by(CourseRecommendation.id).all()
    return jsonify([
        {
            'id': item.id,
            'title': item.title,
            'category': item.category,
            'level': item.level,
            'duration': item.duration,
            'materials': [m.strip() for m in item.materials.split('|') if m.strip()],
            'description': item.description,
            'progress': item.progress,
            'complete': item.complete
        } for item in courses
    ])

@app.route('/api/course-suggestions', methods=['POST'])
def api_course_suggestions():
    payload = request.get_json(silent=True) or {}
    goal = str(payload.get('goal', 'forensic') or 'forensic').strip().lower()
    level = str(payload.get('level', 'beginner') or 'beginner').strip().lower()

    if level == 'advanced':
        courses = CourseRecommendation.query.filter(CourseRecommendation.level.in_(['advanced', 'intermediate'])).all()
    elif level == 'intermediate':
        courses = CourseRecommendation.query.filter(CourseRecommendation.level.in_(['intermediate', 'beginner'])).all()
    else:
        courses = CourseRecommendation.query.filter(CourseRecommendation.level == 'beginner').all()

    if not courses:
        courses = CourseRecommendation.query.order_by(CourseRecommendation.id).all()

    result = []
    for item in courses:
        result.append({
            'id': item.id,
            'title': item.title,
            'category': item.category,
            'level': item.level,
            'duration': item.duration,
            'materials': [m.strip() for m in item.materials.split('|') if m.strip()],
            'description': item.description,
            'progress': item.progress,
            'complete': item.complete,
            'goal': goal
        })

    return jsonify(result)


def average_progress_for_learner(learner_name):
    records = CourseProgress.query.filter_by(learner=learner_name).all()
    if not records:
        return 0
    return int(sum(record.progress for record in records) / len(records))


def compute_daily_streak(learner_name):
    records = CourseProgress.query.filter_by(learner=learner_name).order_by(CourseProgress.updated_at.desc()).all()
    if not records:
        return {'days': 0, 'message': 'No learning streak yet. Start today to build momentum.'}

    today = datetime.utcnow().date()
    seen_days = {record.updated_at.date() for record in records}
    streak = 0
    cursor = today
    while cursor in seen_days:
        streak += 1
        cursor = cursor.fromordinal(cursor.toordinal() - 1)

    if streak == 0:
        return {'days': 0, 'message': 'You are one study session away from your next streak.'}

    return {'days': streak, 'message': f'{learner_name} has maintained a {streak}-day learning streak.'}


def get_streak_history(learner_name, limit=7):
    records = CourseProgress.query.filter_by(learner=learner_name).order_by(CourseProgress.updated_at.desc()).all()
    if not records:
        return []

    history = []
    for record in records[:limit]:
        history.append({
            'date': record.updated_at.date().isoformat(),
            'progress': record.progress,
            'course_id': record.course_id
        })
    return history


def get_daily_challenge(level):
    challenges = {
        'beginner': {
            'title': 'Evidence Basics Sprint',
            'description': 'Review the chain of custody and log five evidence items before finishing the case briefing.',
            'xp': 25,
            'goal': 'Complete one evidence checklist and one report summary.'
        },
        'intermediate': {
            'title': 'Timeline Correlation Challenge',
            'description': 'Connect the access log, browser data, and file movement into one consistent timeline.',
            'xp': 40,
            'goal': 'Match three events to a single hypothesis.'
        },
        'advanced': {
            'title': 'Incident Response Mastery',
            'description': 'Build an incident response recommendation using risk, containment, and evidence validation.',
            'xp': 60,
            'goal': 'Write a risk-based action plan using all evidence points.'
        }
    }
    return challenges.get(level, challenges['beginner'])


def get_badges(learner_name):
    progress = average_progress_for_learner(learner_name)
    streak = compute_daily_streak(learner_name)['days']

    badges = []
    if progress >= 25:
        badges.append({'name': 'Evidence Scout', 'description': '25% completion milestone'})
    if progress >= 50:
        badges.append({'name': 'Case Analyst', 'description': '50% completion milestone'})
    if progress >= 75:
        badges.append({'name': 'Investigator', 'description': '75% completion milestone'})
    if streak >= 3:
        badges.append({'name': 'Momentum Builder', 'description': '3-day streak achieved'})
    if streak >= 7:
        badges.append({'name': 'Forensic Streak', 'description': '7-day streak achieved'})

    if not badges:
        badges.append({'name': 'New Recruit', 'description': 'Started the training path'})

    return badges


@app.route('/api/learner-profile', methods=['POST'])
def api_learner_profile():
    payload = request.get_json(silent=True) or {}
    learner_name = str(payload.get('learner', 'Student') or 'Student').strip() or 'Student'
    level = str(payload.get('level', 'beginner') or 'beginner').strip().lower() or 'beginner'

    progress_summary = {
        'average_progress': average_progress_for_learner(learner_name),
        'learner': learner_name,
        'current_level': level,
        'focus': 'forensic fundamentals',
        'next_step': 'Complete the next course module and keep your streak alive.'
    }

    return jsonify({
        'learner': learner_name,
        'level': level,
        'streak_history': get_streak_history(learner_name),
        'daily_streak': compute_daily_streak(learner_name),
        'daily_challenge': get_daily_challenge(level),
        'badges': get_badges(learner_name),
        'progress_summary': progress_summary
    })


def build_local_ai_plan(goal, level, learner_name):
    goal_key = goal.lower()
    if 'incident' in goal_key or 'response' in goal_key:
        focus = 'incident response workflow and evidence triage'
    elif 'network' in goal_key or 'memory' in goal_key:
        focus = 'timeline reconstruction and log correlation'
    else:
        focus = 'forensic collection, chain of custody, and evidence analysis'

    level_order = {
        'beginner': ['beginner', 'intermediate'],
        'intermediate': ['intermediate', 'beginner', 'advanced'],
        'advanced': ['advanced', 'intermediate', 'beginner'],
    }

    allowed_levels = level_order.get(level, ['beginner', 'intermediate', 'advanced'])
    courses = CourseRecommendation.query.filter(CourseRecommendation.level.in_(allowed_levels)).order_by(CourseRecommendation.id).all()
    if not courses:
        courses = CourseRecommendation.query.order_by(CourseRecommendation.id).all()

    recommendations = []
    for item in courses:
        recommendations.append({
            'id': item.id,
            'title': item.title,
            'category': item.category,
            'level': item.level,
            'duration': item.duration,
            'materials': [material.strip() for material in item.materials.split('|') if material.strip()],
            'description': item.description,
            'progress': item.progress,
            'complete': item.complete,
            'goal': goal_key
        })

    instructions = [
        f"Start with the foundations of {focus} and define your evidence scope before making conclusions.",
        f"At the {level} level, review each artifact carefully, validate timestamps, and document chain-of-custody details.",
        "Practice one case at a time. Summarize what changed, who accessed it, and why it matters to the investigation.",
        "Revisit the confidence score and note what evidence supports your final conclusion before submitting a report."
    ]

    progress_summary = {
        'average_progress': average_progress_for_learner(learner_name),
        'learner': learner_name,
        'current_level': level,
        'focus': focus,
        'next_step': 'Complete a case review and update your progress on the next highlighted course.'
    }

    return {
        'goal': goal,
        'level': level,
        'learner': learner_name,
        'recommendations': recommendations,
        'instructions': instructions,
        'daily_streak': compute_daily_streak(learner_name),
        'progress_summary': progress_summary,
        'source': 'local-llm'
    }


def parse_llm_json_response(raw_text):
    if not raw_text:
        raise ValueError('Empty LLM response')

    cleaned = raw_text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.strip('`')
        if cleaned.lower().startswith('json'):
            cleaned = cleaned[4:].strip()
        if cleaned.startswith('json'):
            cleaned = cleaned[4:].strip()

    return json.loads(cleaned)


def ask_llm_for_plan(goal, level, learner_name):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None

    base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1').rstrip('/')
    url = f'{base_url}/chat/completions'

    try:
        prompt = (
            f"Build a forensic learning plan for {learner_name} at the {level} level focused on {goal}. "
            "Return valid JSON with keys: recommendations, instructions, daily_streak, progress_summary. "
            "Each recommendation must include title, level, category, duration, description, materials. "
            "The instructions should help beginners understand the investigation workflow step by step."
        )
        payload = json.dumps({
            'model': os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.3
        }).encode('utf-8')

        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result['choices'][0]['message']['content']
            return parse_llm_json_response(content)
    except Exception:
        return None


def normalise_ai_plan(plan, goal, level, learner_name):
    if not isinstance(plan, dict):
        return build_local_ai_plan(goal, level, learner_name)

    if 'recommendations' not in plan or 'instructions' not in plan:
        return build_local_ai_plan(goal, level, learner_name)

    if not isinstance(plan.get('recommendations'), list) or not isinstance(plan.get('instructions'), list):
        return build_local_ai_plan(goal, level, learner_name)

    plan['goal'] = goal
    plan['level'] = level
    plan['learner'] = learner_name
    plan['source'] = 'openai'
    return plan


@app.route('/api/ai-course-plan', methods=['POST'])
def api_ai_course_plan():
    payload = request.get_json(silent=True) or {}
    goal = str(payload.get('goal', 'forensic investigation') or 'forensic investigation').strip() or 'forensic investigation'
    level = str(payload.get('level', 'beginner') or 'beginner').strip().lower() or 'beginner'
    learner_name = str(payload.get('learner', 'Student') or 'Student').strip() or 'Student'

    llm_plan = ask_llm_for_plan(goal, level, learner_name)
    if llm_plan is not None:
        return jsonify(normalise_ai_plan(llm_plan, goal, level, learner_name))

    return jsonify(build_local_ai_plan(goal, level, learner_name))


@app.route('/api/site-walkthrough', methods=['POST'])
def api_site_walkthrough():
    payload = request.get_json(silent=True) or {}
    audience = str(payload.get('audience', 'new learner') or 'new learner').strip() or 'new learner'
    goal = str(payload.get('goal', 'intro') or 'intro').strip() or 'intro'

    overview = (
        f"Welcome to CyberVault, a secure forensic learning academy for {audience}. "
        f"This website helps you explore the case lab, review evidence, track learning progress, and practice forensic thinking in a guided environment."
    )

    steps = [
        {
            'title': 'Start with the Mission',
            'description': 'From the landing page, explore the mission, learning stack, and safe forensic workflow before beginning any case.'
        },
        {
            'title': 'Open the Evidence Lab',
            'description': 'Review the evidence board, timeline, and case details to understand how forensic findings are built from artifacts.'
        },
        {
            'title': 'Use the Training Coach',
            'description': 'Choose a beginner, intermediate, or advanced path, save your learner profile, and monitor your progress and daily streak.'
        },
        {
            'title': 'Complete the learning loop',
            'description': 'Mark courses complete, review AI instructions, and use the daily challenge and badges to build momentum in the curriculum.'
        }
    ]

    return jsonify({
        'overview': overview,
        'goal': goal,
        'audience': audience,
        'steps': steps
    })


@app.route('/api/course-progress/<int:course_id>', methods=['POST'])
def api_course_progress(course_id):
    payload = request.get_json(silent=True) or {}
    progress = int(payload.get('progress', 0))
    learner = str(payload.get('learner', 'Student') or 'Student').strip()

    if progress < 0:
        progress = 0
    if progress > 100:
        progress = 100

    record = CourseProgress.query.filter_by(course_id=course_id, learner=learner).first()
    if record is None:
        record = CourseProgress(course_id=course_id, learner=learner, progress=progress)
        db.session.add(record)
    else:
        record.progress = progress
        record.updated_at = datetime.utcnow()

    course = CourseRecommendation.query.get(course_id)
    if course:
        course.progress = progress
        course.complete = progress >= 100

    db.session.commit()
    return jsonify({'course_id': course_id, 'learner': learner, 'progress': progress, 'complete': progress >= 100})

@app.route('/api/chat', methods=['GET', 'POST'])
def api_chat():
    if request.method == 'GET':
        messages = ChatMessage.query.order_by(ChatMessage.created_at.asc()).all()
        return jsonify([
            {
                'id': item.id,
                'case_id': item.case_id,
                'role': item.role,
                'message': item.message,
                'created_at': item.created_at.isoformat()
            } for item in messages
        ])

    payload = request.get_json(silent=True) or {}
    message = str(payload.get('message', '') or '').strip()
    case_id = str(payload.get('case_id', 'CV-014') or 'CV-014').strip()

    if not message:
        return jsonify({'error': 'message is required'}), 400

    if len(message) > 500:
        return jsonify({'error': 'message is too long'}), 400

    now = datetime.utcnow()
    user_message = ChatMessage(role='user', case_id=case_id, message=message, created_at=now)
    db.session.add(user_message)

    reply = build_chat_reply(message)
    assistant_message = ChatMessage(role='assistant', case_id=case_id, message=reply, created_at=now)
    db.session.add(assistant_message)
    db.session.commit()

    return jsonify({
        'case_id': case_id,
        'reply': reply,
        'messages': [
            {
                'id': user_message.id,
                'case_id': user_message.case_id,
                'role': user_message.role,
                'message': user_message.message,
                'created_at': user_message.created_at.isoformat()
            },
            {
                'id': assistant_message.id,
                'case_id': assistant_message.case_id,
                'role': assistant_message.role,
                'message': assistant_message.message,
                'created_at': assistant_message.created_at.isoformat()
            }
        ]
    })

def generate_report_summary(case_id, investigator, narrative, confidence):
    summary = (
        f"Case {case_id} investigated by {investigator}. "
        f"Confidence score: {confidence}%. "
        f"Narrative: {narrative.strip() or 'No narrative entered.'}"
    )
    return summary

@app.route('/api/report', methods=['POST'])
def api_report():
    payload = request.get_json(silent=True) or {}
    case_id = str(payload.get('case_id', 'CV-014') or 'CV-014').strip()
    investigator = str(payload.get('investigator', 'Investigator_01') or 'Investigator_01').strip()
    narrative = str(payload.get('narrative', '') or '').strip()
    confidence = int(payload.get('confidence', 82) or 82)

    if confidence < 0:
        confidence = 0
    if confidence > 100:
        confidence = 100

    report = InvestigationReport(case_id=case_id, investigator=investigator, narrative=narrative, confidence=confidence)
    db.session.add(report)
    db.session.commit()

    return jsonify({
        'case_id': case_id,
        'investigator': investigator,
        'confidence': confidence,
        'narrative': narrative,
        'summary': generate_report_summary(case_id, investigator, narrative, confidence)
    })

@app.route('/submit_report', methods=['POST'])
def submit_report():
    case_id = request.form.get('case_id', 'CV-014')
    investigator = request.form.get('investigator', 'Investigator_01')
    narrative = request.form.get('narrative', '')
    confidence = int(request.form.get('confidence', 82))

    report = InvestigationReport(case_id=case_id, investigator=investigator, narrative=narrative, confidence=confidence)
    db.session.add(report)
    db.session.commit()

    return redirect(url_for('index'))

@app.cli.command('initdb')
def initdb_command():
    db.create_all()
    seed_data()
    print('Initialized CyberVault database.')

def build_forensic_ai_reply(question):
    text = (question or '').lower().strip()
    if not text:
        return 'I can help investigate any forensic question, from evidence handling to timeline analysis. Ask me about the artifact, source, or timeline and I will reason from the evidence path.'

    if any(keyword in text for keyword in ['moon', 'toaster', 'silly', 'absurd', 'blue', 'weird']):
        return (
            'The evidence-first response is to treat that claim as a speculative hypothesis rather than a confirmed fact. '
            'I would document the question, note the lack of corroborating evidence, and then apply the standard forensic workflow: identify the source, check for physical or digital traces, and test whether the claim is supported by any objective data.'
        )

    if 'usb' in text or 'drive' in text:
        return 'The USB artifact should be traced through chain-of-custody, hash verification, and file-access timing before it becomes a reliable finding.'
    if 'mail' in text or 'message' in text or 'chat' in text:
        return 'The communication channel should be reviewed for sender attribution, timing, and message context before the narrative becomes a reportable conclusion.'
    if 'access' in text or 'login' in text or 'history' in text:
        return 'Review the access window, privilege changes, and session overlaps to determine whether the evidence supports unauthorized access or a legitimate workflow.'
    if 'risk' in text or 'incident' in text:
        return 'Risk should be assessed from the evidence chain, exposure window, affected systems, and the likelihood of repeat compromise.'
    if 'timeline' in text or 'when' in text:
        return 'Align the timestamps from each artifact to the same reference clock and identify the first point of divergence before forming a timeline conclusion.'
    if 'report' in text or 'summary' in text:
        return 'A strong case summary should include the scope, findings, corroborating evidence, confidence rating, and the exact assumptions that remain unresolved.'

    return (
        'A strong forensic answer starts with the evidence, not the story. I would identify the artifact, map the timeline, test for corroboration, and then explain what can be concluded and what remains uncertain.'
    )


def build_chat_reply(message):
    text = message.lower()

    if 'usb' in text or 'drive' in text:
        return 'The USB artifact should be traced through chain-of-custody and hash comparison before the report is finalized.'
    if 'mail' in text or 'message' in text or 'chat' in text:
        return 'The communication channel should be reviewed for timing and participant attribution before the narrative becomes a finding.'
    if 'access' in text or 'login' in text or 'history' in text:
        return 'Review the access window and privilege changes to determine whether the evidence supports an unauthorized session.'
    if 'risk' in text or 'incident' in text:
        return 'Risk should be assessed from the evidence chain, exposure window, and affected data category.'

    return 'I can help correlate the evidence stream. Provide the artifact, access point, or timeline question you want to investigate.'


def seed_data():
    evidence_list = [
        Evidence(evidence_id='USB-STORAGE', name='USB Drive', category='Digital Device', source='Investigator_01', timestamp='12:05:22', observation='An unlabeled flash drive was found near the finance desk.', confidence=75),
        Evidence(evidence_id='MSG-045', name='Chat Log', category='Communication', source='Investigator_03', timestamp='12:11:38', observation='Message thread references a file named “revision final_v2”.', confidence=85),
        Evidence(evidence_id='TRACE-118', name='Browser History', category='Browser', source='Investigator_02', timestamp='12:13:11', observation='File preview activity occurred during off-hours access.', confidence=78),
        Evidence(evidence_id='DOC-301', name='Finance Workbook', category='File', source='Investigator_04', timestamp='12:17:09', observation='Workbook appears in an unapproved sharing channel.', confidence=90),
        Evidence(evidence_id='TIME-903', name='Access Log', category='Timeline', source='Investigator_05', timestamp='12:19:44', observation='Access log shows file movement during off-hours.', confidence=80)
    ]

    for item in evidence_list:
        existing = Evidence.query.filter_by(evidence_id=item.evidence_id).first()
        if existing is None:
            db.session.add(item)

    if InvestigationReport.query.count() == 0:
        report = InvestigationReport(case_id='CV-014', investigator='Investigator_01', narrative='Evidence chain is being correlated using the USB drive, chat log, browser history, and access records.', confidence=82)
        db.session.add(report)

    if ChatMessage.query.count() == 0:
        initial_messages = [
            ChatMessage(case_id='CV-014', role='assistant', message='Welcome to the CyberVault evidence lab. What evidence would you like to review?'),
            ChatMessage(case_id='CV-014', role='user', message='I need to understand the USB and access timeline.')
        ]
        db.session.add_all(initial_messages)

    if CourseRecommendation.query.count() == 0:
        courses = [
            CourseRecommendation(title='Digital Evidence Collection', category='Evidence Handling', level='beginner', duration='4 weeks', materials='Chain-of-custody form|Evidence bag|Write blocker|Hash tool|Case notebook', description='Learn secure collection, imaging, labeling, and preservation rules.', progress=15),
            CourseRecommendation(title='Forensic Imaging & Disk Analysis', category='Lab Practice', level='intermediate', duration='6 weeks', materials='Imaging workstation|Disk imaging software|Write blocker|Analysis workstation|Hash comparison worksheet', description='Practice imaging, validation, timeline review, and acquisition hygiene.', progress=20),
            CourseRecommendation(title='Cybercrime Investigation Workflow', category='Case Investigation', level='beginner', duration='5 weeks', materials='Investigation checklist|Case management form|Evidence matrix|Timeline template|Report template', description='Build an investigation case structure from collection to final reporting.', progress=10),
            CourseRecommendation(title='Incident Response Fundamentals', category='Response', level='advanced', duration='5 weeks', materials='Containment checklist|Response plan|Access log|Alert log|Risk register', description='Coordinate triage, containment, escalation, and response documentation.', progress=30),
            CourseRecommendation(title='Cyber Law & Ethics', category='Legal & Ethics', level='advanced', duration='3 weeks', materials='Evidence law briefing|Consent form|Retention policy|Legal checklist|Case summary template', description='Understand admissibility, privacy, and evidence handling standards.', progress=5)
        ]
        db.session.add_all(courses)

    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_data()
    socketio.run(app, debug=True)
