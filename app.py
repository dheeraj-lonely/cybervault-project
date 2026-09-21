from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cybervault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

app_dir = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app_dir, 'cybervault.db')

db = SQLAlchemy(app)

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
    app.run(debug=True)
