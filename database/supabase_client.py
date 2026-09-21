"""
CyberVault — Supabase Client & Sync Helpers

Provides:
  - get_supabase()          → authenticated Supabase client (anon key)
  - get_supabase_admin()    → service-role client (full access)
  - SupabaseSync            → helper class to mirror SQLite writes to Supabase
  - is_supabase_configured() → returns True only when env vars are set

All Supabase calls are wrapped in try/except so the app falls back
gracefully to SQLite if Supabase is unreachable or misconfigured.
"""

import os
import logging
from datetime import datetime
from typing import Optional

log = logging.getLogger(__name__)

# ── Lazy imports (supabase is optional at import time) ────────────
try:
    from supabase import create_client, Client
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False
    log.warning("supabase-py not installed — Supabase features disabled.")

# ── Module-level singletons ───────────────────────────────────────
_anon_client:    Optional[object] = None
_service_client: Optional[object] = None


def is_supabase_configured() -> bool:
    """Return True only when all required env vars are present and non-placeholder."""
    url = os.getenv('SUPABASE_URL', '')
    key = os.getenv('SUPABASE_ANON_KEY', '')
    return (
        _SUPABASE_AVAILABLE
        and bool(url)
        and bool(key)
        and 'your-project-id' not in url
        and 'your-anon' not in key
    )


def get_supabase():
    """Return (or create) the anon-key Supabase client."""
    global _anon_client
    if not is_supabase_configured():
        return None
    if _anon_client is None:
        url = os.environ['SUPABASE_URL']
        key = os.environ['SUPABASE_ANON_KEY']
        try:
            _anon_client = create_client(url, key)
            log.info("Supabase anon client initialised.")
        except Exception as exc:
            log.error("Failed to create Supabase anon client: %s", exc)
            return None
    return _anon_client


def get_supabase_admin():
    """Return (or create) the service-role Supabase client (full DB access)."""
    global _service_client
    if not is_supabase_configured():
        return None
    service_key = os.getenv('SUPABASE_SERVICE_KEY', '')
    if not service_key or 'your-service' in service_key:
        log.warning("SUPABASE_SERVICE_KEY not configured — using anon client.")
        return get_supabase()
    if _service_client is None:
        url = os.environ['SUPABASE_URL']
        try:
            _service_client = create_client(url, service_key)
            log.info("Supabase service-role client initialised.")
        except Exception as exc:
            log.error("Failed to create Supabase service client: %s", exc)
            return None
    return _service_client


# ══════════════════════════════════════════════════════════════════
#  SupabaseSync — mirrors SQLite writes to Supabase
# ══════════════════════════════════════════════════════════════════
class SupabaseSync:
    """
    Thin wrapper that upserts records into Supabase tables.
    Each method is a fire-and-log — failures are caught and logged
    without raising, so SQLite always remains the source of truth.
    """

    # ── Subscribers ──────────────────────────────────────────────
    @staticmethod
    def upsert_subscriber(email: str, source: str = 'website') -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('subscribers').upsert(
                {'email': email, 'source': source,
                 'created_at': datetime.utcnow().isoformat()},
                on_conflict='email'
            ).execute()
            log.info("[Supabase] Subscriber upserted: %s", email)
            return True
        except Exception as exc:
            log.error("[Supabase] upsert_subscriber failed: %s", exc)
            return False

    # ── Chat Messages ─────────────────────────────────────────────
    @staticmethod
    def insert_chat_message(session_id: str, role: str, message: str,
                             topic: str = None, confidence: float = None) -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('chat_messages').insert({
                'session_id': session_id,
                'role':       role,
                'message':    message,
                'topic':      topic,
                'confidence': confidence,
                'created_at': datetime.utcnow().isoformat(),
            }).execute()
            return True
        except Exception as exc:
            log.error("[Supabase] insert_chat_message failed: %s", exc)
            return False

    # ── Game Sessions ─────────────────────────────────────────────
    @staticmethod
    def upsert_game_session(session_data: dict) -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('game_sessions').upsert(
                session_data,
                on_conflict='session_id'
            ).execute()
            return True
        except Exception as exc:
            log.error("[Supabase] upsert_game_session failed: %s", exc)
            return False

    # ── Collected Evidence ────────────────────────────────────────
    @staticmethod
    def insert_evidence(evidence_data: dict) -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('collected_evidence').insert(evidence_data).execute()
            return True
        except Exception as exc:
            log.error("[Supabase] insert_evidence failed: %s", exc)
            return False

    # ── Investigation Reports ─────────────────────────────────────
    @staticmethod
    def upsert_report(report_data: dict) -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('investigation_reports').upsert(
                report_data,
                on_conflict='game_session_id'
            ).execute()
            return True
        except Exception as exc:
            log.error("[Supabase] upsert_report failed: %s", exc)
            return False

    # ── Leaderboard ───────────────────────────────────────────────
    @staticmethod
    def insert_leaderboard(entry_data: dict) -> bool:
        sb = get_supabase_admin()
        if not sb:
            return False
        try:
            sb.table('leaderboard').insert(entry_data).execute()
            return True
        except Exception as exc:
            log.error("[Supabase] insert_leaderboard failed: %s", exc)
            return False

    # ── Read helpers ──────────────────────────────────────────────
    @staticmethod
    def get_leaderboard(case_id: str = '047', limit: int = 10) -> list:
        sb = get_supabase()
        if not sb:
            return []
        try:
            res = (sb.table('leaderboard')
                     .select('*')
                     .eq('case_id', case_id)
                     .order('score', desc=True)
                     .limit(limit)
                     .execute())
            return res.data or []
        except Exception as exc:
            log.error("[Supabase] get_leaderboard failed: %s", exc)
            return []

    @staticmethod
    def get_chat_history(session_id: str, limit: int = 50) -> list:
        sb = get_supabase()
        if not sb:
            return []
        try:
            res = (sb.table('chat_messages')
                     .select('*')
                     .eq('session_id', session_id)
                     .order('created_at', desc=False)
                     .limit(limit)
                     .execute())
            return res.data or []
        except Exception as exc:
            log.error("[Supabase] get_chat_history failed: %s", exc)
            return []

    @staticmethod
    def get_subscriber_count() -> int:
        sb = get_supabase()
        if not sb:
            return 0
        try:
            res = sb.table('subscribers').select('id', count='exact').execute()
            return res.count or 0
        except Exception as exc:
            log.error("[Supabase] get_subscriber_count failed: %s", exc)
            return 0

    # ── Health check ──────────────────────────────────────────────
    @staticmethod
    def ping() -> bool:
        """Quick connectivity test — tries to select 1 row from subscribers."""
        sb = get_supabase()
        if not sb:
            return False
        try:
            sb.table('subscribers').select('id').limit(1).execute()
            return True
        except Exception:
            return False
