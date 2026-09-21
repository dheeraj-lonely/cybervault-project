"""
CyberVault — Database Initialisation & Migration Script
========================================================
Run this script once (or any time you need to reset / re-seed):

    python database/init_db.py [--mode sqlite|supabase|dual] [--seed] [--reset]

Flags
-----
--mode sqlite    → create/migrate SQLite only           (default: reads DB_MODE from .env)
--mode supabase  → apply schema.sql to Supabase only
--mode dual      → both SQLite and Supabase
--seed           → insert sample data into both stores
--reset          → DROP + recreate all SQLite tables (destructive!)
--status         → print connection health for both DBs and exit

What it does
------------
1. Loads .env
2. Creates the SQLAlchemy engine / tables in SQLite
3. Optionally connects to Supabase and applies schema.sql
4. Optionally seeds sample rows (subscribers, game session, leaderboard)
"""

import os
import sys
import argparse
import logging
from datetime import datetime, timedelta

# ── Ensure project root is on sys.path ────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT, '.env'))

from flask import Flask
from database.models import (
    db, Subscriber, ChatMessage, GameSession,
    CollectedEvidence, InvestigationReport, LeaderboardEntry
)
from database.supabase_client import (
    is_supabase_configured, get_supabase_admin, SupabaseSync
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
#  Bootstrap a minimal Flask app for SQLAlchemy context
# ══════════════════════════════════════════════════════════════════
def make_app(sqlite_path: str) -> Flask:
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI']        = f'sqlite:///{sqlite_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS']  = False
    app.config['SECRET_KEY']                      = os.getenv('FLASK_SECRET_KEY', 'init-secret')
    db.init_app(app)
    return app


# ══════════════════════════════════════════════════════════════════
#  SQLite operations
# ══════════════════════════════════════════════════════════════════
def init_sqlite(app: Flask, reset: bool = False) -> bool:
    log.info("── SQLite ──────────────────────────────────────────")
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    log.info("  Path : %s", db_path)

    with app.app_context():
        if reset:
            log.warning("  RESET flag set — dropping all SQLite tables!")
            db.drop_all()
        db.create_all()
        log.info("  ✓ All tables created / verified.")
    return True


def seed_sqlite(app: Flask) -> None:
    log.info("  Seeding SQLite …")
    with app.app_context():
        # Subscriber
        if not Subscriber.query.filter_by(email='demo@cybervault.com').first():
            db.session.add(Subscriber(email='demo@cybervault.com', source='seed'))

        # Game session + evidence + report + leaderboard
        if not GameSession.query.filter_by(session_id='seed-session-001').first():
            session = GameSession(
                session_id='seed-session-001',
                case_id='047',
                player_name='DemoInvestigator',
                started_at=datetime.utcnow() - timedelta(minutes=30),
                completed_at=datetime.utcnow(),
                score=85,
                solved=True,
                evidence_count=6,
                suspect_chosen='A',
                conclusion='Evidence chain points to Suspect A entering the warehouse at 20:51.'
            )
            db.session.add(session)
            db.session.flush()  # get session.id

            evidence_items = [
                CollectedEvidence(game_session_id=session.id, evidence_id='fingerprint',
                                  evidence_name='Fingerprint', location='Door Handle',
                                  analyzed=True, lab_result='Match: Marcus Reeve (Suspect A)'),
                CollectedEvidence(game_session_id=session.id, evidence_id='cctv_footage',
                                  evidence_name='CCTV Footage', location='Security Terminal',
                                  analyzed=True, lab_result='Figure enters at 20:51'),
                CollectedEvidence(game_session_id=session.id, evidence_id='dna_sample',
                                  evidence_name='DNA Sample', location='Latex Glove',
                                  analyzed=True, lab_result='DNA profile matches Suspect A'),
            ]
            db.session.add_all(evidence_items)

            report = InvestigationReport(
                game_session_id=session.id,
                case_id='047',
                suspect_id='A',
                suspect_name='Marcus Reeve',
                when_event='t3',
                evidence_cited='fingerprint,cctv_footage,dna_sample',
                conclusion='Suspect A entered the warehouse at 20:51.',
                score=85,
                solved=True
            )
            db.session.add(report)

            lb = LeaderboardEntry(
                player_name='DemoInvestigator',
                case_id='047',
                score=85,
                solved=True,
                evidence_cnt=6
            )
            db.session.add(lb)

        # Chat messages
        if not ChatMessage.query.filter_by(session_id='seed-chat-001').first():
            db.session.add_all([
                ChatMessage(session_id='seed-chat-001', role='user',
                            message='How does DNA analysis work?', topic='dna', confidence=0.95),
                ChatMessage(session_id='seed-chat-001', role='ai',
                            message='DNA forensic analysis uses STR profiling…', topic='dna', confidence=0.95),
            ])

        db.session.commit()
        log.info("  ✓ SQLite seed complete.")


# ══════════════════════════════════════════════════════════════════
#  Supabase operations
# ══════════════════════════════════════════════════════════════════
def init_supabase() -> bool:
    log.info("── Supabase ────────────────────────────────────────")
    if not is_supabase_configured():
        log.warning("  Supabase not configured — skipping.")
        log.info("  To enable: fill in SUPABASE_URL, SUPABASE_ANON_KEY,")
        log.info("             SUPABASE_SERVICE_KEY in your .env file.")
        return False

    sb = get_supabase_admin()
    if not sb:
        log.error("  Could not connect to Supabase.")
        return False

    # Apply schema.sql via raw SQL through the Supabase REST API
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if not os.path.exists(schema_path):
        log.error("  schema.sql not found at %s", schema_path)
        return False

    with open(schema_path, 'r', encoding='utf-8') as f:
        raw_sql = f.read()

    # Split on semicolons and execute statement by statement
    statements = [s.strip() for s in raw_sql.split(';') if s.strip()]
    ok_count = 0
    fail_count = 0
    for stmt in statements:
        if not stmt or stmt.startswith('--'):
            continue
        try:
            sb.rpc('exec_sql', {'query': stmt}).execute()
            ok_count += 1
        except Exception as exc:
            # Many statements are CREATE IF NOT EXISTS — ignore "already exists" errors
            err_str = str(exc).lower()
            if 'already exists' in err_str or 'duplicate' in err_str:
                ok_count += 1
            else:
                log.warning("  SQL warning: %s", str(exc)[:120])
                fail_count += 1

    log.info("  ✓ Schema applied — %d ok, %d warnings.", ok_count, fail_count)
    return True


def seed_supabase() -> None:
    log.info("  Seeding Supabase …")
    sync = SupabaseSync()

    sync.upsert_subscriber('demo@cybervault.com', 'seed')

    sync.upsert_game_session({
        'session_id':     'seed-session-001',
        'case_id':        '047',
        'player_name':    'DemoInvestigator',
        'started_at':     (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
        'completed_at':   datetime.utcnow().isoformat(),
        'score':          85,
        'solved':         True,
        'evidence_count': 6,
        'suspect_chosen': 'A',
        'conclusion':     'Evidence chain points to Suspect A.',
    })

    sync.insert_chat_message(
        session_id='seed-chat-001',
        role='user',
        message='How does DNA analysis work?',
        topic='dna',
        confidence=0.95
    )
    sync.insert_chat_message(
        session_id='seed-chat-001',
        role='ai',
        message='DNA forensic analysis uses STR profiling…',
        topic='dna',
        confidence=0.95
    )

    sync.insert_leaderboard({
        'player_name':  'DemoInvestigator',
        'case_id':      '047',
        'score':        85,
        'solved':       True,
        'evidence_cnt': 6,
        'created_at':   datetime.utcnow().isoformat(),
    })
    log.info("  ✓ Supabase seed complete.")


# ══════════════════════════════════════════════════════════════════
#  Status check
# ══════════════════════════════════════════════════════════════════
def print_status(app: Flask) -> None:
    print("\n═══ CyberVault Database Status ═══════════════════════")

    # SQLite
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    exists  = os.path.exists(db_path)
    size    = os.path.getsize(db_path) if exists else 0
    print(f"\n  SQLite")
    print(f"    Path   : {db_path}")
    print(f"    Exists : {'✓' if exists else '✗'}")
    print(f"    Size   : {size:,} bytes")
    if exists:
        with app.app_context():
            try:
                subs  = Subscriber.query.count()
                chats = ChatMessage.query.count()
                games = GameSession.query.count()
                lb    = LeaderboardEntry.query.count()
                print(f"    Tables : subscribers={subs}, chat_messages={chats}, "
                      f"game_sessions={games}, leaderboard={lb}")
            except Exception as e:
                print(f"    Tables : error — {e}")

    # Supabase
    print(f"\n  Supabase")
    if is_supabase_configured():
        alive = SupabaseSync.ping()
        print(f"    URL    : {os.getenv('SUPABASE_URL','?')}")
        print(f"    Ping   : {'✓ reachable' if alive else '✗ unreachable'}")
        if alive:
            cnt = SupabaseSync.get_subscriber_count()
            print(f"    Subs   : {cnt}")
    else:
        print("    Status : not configured (fill .env to enable)")

    print("\n══════════════════════════════════════════════════════\n")


# ══════════════════════════════════════════════════════════════════
#  CLI entry point
# ══════════════════════════════════════════════════════════════════
def main() -> None:
    parser = argparse.ArgumentParser(description='CyberVault DB init script')
    parser.add_argument('--mode',   choices=['sqlite','supabase','dual'],
                        default=os.getenv('DB_MODE','dual'),
                        help='Which DB(s) to initialise (default: reads DB_MODE from .env)')
    parser.add_argument('--seed',   action='store_true', help='Insert sample data')
    parser.add_argument('--reset',  action='store_true', help='DROP + recreate SQLite tables')
    parser.add_argument('--status', action='store_true', help='Print health and exit')
    args = parser.parse_args()

    sqlite_path = os.path.join(ROOT, os.getenv('SQLITE_DB_PATH', 'cybervault.db'))
    app = make_app(sqlite_path)

    if args.status:
        init_sqlite(app)          # ensure tables exist before counting
        print_status(app)
        return

    log.info("CyberVault DB init — mode=%s seed=%s reset=%s", args.mode, args.seed, args.reset)

    if args.mode in ('sqlite', 'dual'):
        init_sqlite(app, reset=args.reset)
        if args.seed:
            seed_sqlite(app)

    if args.mode in ('supabase', 'dual'):
        init_supabase()
        if args.seed and is_supabase_configured():
            seed_supabase()

    log.info("Done.")
    print_status(app)


if __name__ == '__main__':
    main()
