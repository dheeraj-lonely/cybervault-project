"""
CyberVault — SQLAlchemy Models (SQLite + PostgreSQL compatible)
All tables used by the application are defined here.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ══════════════════════════════════════════════════════════════════
#  SUBSCRIBERS
#  Stores newsletter/email subscriptions from the landing page.
# ══════════════════════════════════════════════════════════════════
class Subscriber(db.Model):
    __tablename__ = 'subscribers'

    id         = db.Column(db.Integer,     primary_key=True)
    email      = db.Column(db.String(255), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    source     = db.Column(db.String(60),  nullable=False, default='website')   # website | game | api

    def to_dict(self):
        return {
            'id':         self.id,
            'email':      self.email,
            'created_at': self.created_at.isoformat(),
            'source':     self.source,
        }

    def __repr__(self):
        return f'<Subscriber {self.email}>'


# ══════════════════════════════════════════════════════════════════
#  CHAT MESSAGES
#  Persists every ForensicAI conversation turn.
# ══════════════════════════════════════════════════════════════════
class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id         = db.Column(db.Integer,     primary_key=True)
    session_id = db.Column(db.String(120), nullable=False, index=True,
                           default='anonymous')          # browser-generated session id
    role       = db.Column(db.String(20),  nullable=False)   # 'user' | 'ai'
    message    = db.Column(db.Text,        nullable=False)
    topic      = db.Column(db.String(80),  nullable=True)    # matched KB topic
    confidence = db.Column(db.Float,       nullable=True)    # 0.0 – 1.0
    created_at = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'session_id': self.session_id,
            'role':       self.role,
            'message':    self.message,
            'topic':      self.topic,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<ChatMessage {self.role}:{self.id}>'


# ══════════════════════════════════════════════════════════════════
#  GAME SESSIONS
#  One row per investigation attempt (case + player).
# ══════════════════════════════════════════════════════════════════
class GameSession(db.Model):
    __tablename__ = 'game_sessions'

    id              = db.Column(db.Integer,     primary_key=True)
    session_id      = db.Column(db.String(120), nullable=False, unique=True, index=True)
    case_id         = db.Column(db.String(20),  nullable=False, default='047')
    player_name     = db.Column(db.String(120), nullable=False, default='Investigator')
    started_at      = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    completed_at    = db.Column(db.DateTime,    nullable=True)
    score           = db.Column(db.Integer,     nullable=False, default=0)
    solved          = db.Column(db.Boolean,     nullable=False, default=False)
    evidence_count  = db.Column(db.Integer,     nullable=False, default=0)
    suspect_chosen  = db.Column(db.String(10),  nullable=True)
    conclusion      = db.Column(db.Text,        nullable=True)

    # Relationship
    evidence_items = db.relationship('CollectedEvidence', backref='session',
                                     lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':             self.id,
            'session_id':     self.session_id,
            'case_id':        self.case_id,
            'player_name':    self.player_name,
            'started_at':     self.started_at.isoformat(),
            'completed_at':   self.completed_at.isoformat() if self.completed_at else None,
            'score':          self.score,
            'solved':         self.solved,
            'evidence_count': self.evidence_count,
            'suspect_chosen': self.suspect_chosen,
            'conclusion':     self.conclusion,
        }

    def __repr__(self):
        return f'<GameSession {self.session_id} score={self.score}>'


# ══════════════════════════════════════════════════════════════════
#  COLLECTED EVIDENCE
#  Tracks every piece of evidence a player picks up during a session.
# ══════════════════════════════════════════════════════════════════
class CollectedEvidence(db.Model):
    __tablename__ = 'collected_evidence'

    id             = db.Column(db.Integer,     primary_key=True)
    game_session_id = db.Column(db.Integer,    db.ForeignKey('game_sessions.id'), nullable=False)
    evidence_id    = db.Column(db.String(60),  nullable=False)   # e.g. 'fingerprint'
    evidence_name  = db.Column(db.String(120), nullable=False)
    location       = db.Column(db.String(120), nullable=True)
    collected_at   = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    analyzed       = db.Column(db.Boolean,     nullable=False, default=False)
    lab_result     = db.Column(db.Text,        nullable=True)

    def to_dict(self):
        return {
            'id':               self.id,
            'game_session_id':  self.game_session_id,
            'evidence_id':      self.evidence_id,
            'evidence_name':    self.evidence_name,
            'location':         self.location,
            'collected_at':     self.collected_at.isoformat(),
            'analyzed':         self.analyzed,
            'lab_result':       self.lab_result,
        }

    def __repr__(self):
        return f'<CollectedEvidence {self.evidence_id}>'


# ══════════════════════════════════════════════════════════════════
#  INVESTIGATION REPORTS
#  The final submitted report for each completed game session.
# ══════════════════════════════════════════════════════════════════
class InvestigationReport(db.Model):
    __tablename__ = 'investigation_reports'

    id              = db.Column(db.Integer,     primary_key=True)
    game_session_id = db.Column(db.Integer,     db.ForeignKey('game_sessions.id'),
                                nullable=False, unique=True)
    case_id         = db.Column(db.String(20),  nullable=False, default='047')
    suspect_id      = db.Column(db.String(10),  nullable=False)
    suspect_name    = db.Column(db.String(120), nullable=False)
    when_event      = db.Column(db.String(20),  nullable=True)
    evidence_cited  = db.Column(db.Text,        nullable=True)   # comma-separated ids
    conclusion      = db.Column(db.Text,        nullable=True)
    score           = db.Column(db.Integer,     nullable=False, default=0)
    solved          = db.Column(db.Boolean,     nullable=False, default=False)
    submitted_at    = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':               self.id,
            'game_session_id':  self.game_session_id,
            'case_id':          self.case_id,
            'suspect_id':       self.suspect_id,
            'suspect_name':     self.suspect_name,
            'when_event':       self.when_event,
            'evidence_cited':   self.evidence_cited,
            'conclusion':       self.conclusion,
            'score':            self.score,
            'solved':           self.solved,
            'submitted_at':     self.submitted_at.isoformat(),
        }

    def __repr__(self):
        return f'<InvestigationReport case={self.case_id} score={self.score}>'


# ══════════════════════════════════════════════════════════════════
#  LEADERBOARD
#  Top scores per case — derived from game_sessions but kept
#  denormalised for fast read access.
# ══════════════════════════════════════════════════════════════════
class LeaderboardEntry(db.Model):
    __tablename__ = 'leaderboard'

    id           = db.Column(db.Integer,     primary_key=True)
    player_name  = db.Column(db.String(120), nullable=False, default='Investigator')
    case_id      = db.Column(db.String(20),  nullable=False, default='047', index=True)
    score        = db.Column(db.Integer,     nullable=False, default=0)
    solved       = db.Column(db.Boolean,     nullable=False, default=False)
    evidence_cnt = db.Column(db.Integer,     nullable=False, default=0)
    created_at   = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':           self.id,
            'player_name':  self.player_name,
            'case_id':      self.case_id,
            'score':        self.score,
            'solved':       self.solved,
            'evidence_cnt': self.evidence_cnt,
            'created_at':   self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<LeaderboardEntry {self.player_name} score={self.score}>'


class Evidence(db.Model):
    __tablename__ = 'evidence'

    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.String(60), nullable=False, unique=True, index=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False, default='General')
    source = db.Column(db.String(120), nullable=False, default='Unknown')
    timestamp = db.Column(db.String(60), nullable=True)
    observation = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'evidence_id': self.evidence_id,
            'name': self.name,
            'category': self.category,
            'source': self.source,
            'timestamp': self.timestamp,
            'observation': self.observation,
            'confidence': self.confidence,
        }


class CourseRecommendation(db.Model):
    __tablename__ = 'course_recommendations'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    level = db.Column(db.String(40), nullable=False, default='beginner')
    duration = db.Column(db.String(40), nullable=False, default='30 mins')
    description = db.Column(db.Text, nullable=False)
    materials = db.Column(db.Text, nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    complete = db.Column(db.Boolean, nullable=False, default=False)


class CourseProgress(db.Model):
    __tablename__ = 'course_progress'

    id = db.Column(db.Integer, primary_key=True)
    learner = db.Column(db.String(120), nullable=False, index=True)
    course_id = db.Column(db.Integer, nullable=False, default=1)
    progress = db.Column(db.Integer, nullable=False, default=0)
    level = db.Column(db.String(40), nullable=False, default='beginner')
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
