-- ═══════════════════════════════════════════════════════════════
--  CyberVault — Supabase / PostgreSQL Schema
--
--  Run this in the Supabase SQL Editor:
--    Dashboard → SQL Editor → New query → paste → Run
--
--  Tables created:
--    subscribers, chat_messages, game_sessions,
--    collected_evidence, investigation_reports, leaderboard
-- ═══════════════════════════════════════════════════════════════

-- ── Enable UUID extension (needed for uuid_generate_v4) ──────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ──────────────────────────────────────────────────────────────────
--  1. SUBSCRIBERS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
    id         SERIAL      PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    source     VARCHAR(60)  NOT NULL DEFAULT 'website',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything; anon can only insert
CREATE POLICY "Allow anon insert"  ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service all"  ON subscribers USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  2. CHAT MESSAGES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL       PRIMARY KEY,
    session_id VARCHAR(120) NOT NULL,
    role       VARCHAR(20)  NOT NULL CHECK (role IN ('user','ai')),
    message    TEXT         NOT NULL,
    topic      VARCHAR(80),
    confidence NUMERIC(5,2),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert chat"   ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select chat"   ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow service all chat"   ON chat_messages USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  3. GAME SESSIONS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
    id              SERIAL       PRIMARY KEY,
    session_id      VARCHAR(120) UNIQUE NOT NULL,
    case_id         VARCHAR(20)  NOT NULL DEFAULT '047',
    player_name     VARCHAR(120) NOT NULL DEFAULT 'Investigator',
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    score           INTEGER      NOT NULL DEFAULT 0,
    solved          BOOLEAN      NOT NULL DEFAULT FALSE,
    evidence_count  INTEGER      NOT NULL DEFAULT 0,
    suspect_chosen  VARCHAR(10),
    conclusion      TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_session_id ON game_sessions(session_id);
CREATE        INDEX IF NOT EXISTS idx_game_case_id    ON game_sessions(case_id);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert game"  ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select game"  ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anon update game"  ON game_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow service all game"  ON game_sessions USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  4. COLLECTED EVIDENCE
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collected_evidence (
    id               SERIAL       PRIMARY KEY,
    game_session_id  INTEGER      NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    evidence_id      VARCHAR(60)  NOT NULL,
    evidence_name    VARCHAR(120) NOT NULL,
    location         VARCHAR(120),
    collected_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    analyzed         BOOLEAN      NOT NULL DEFAULT FALSE,
    lab_result       TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_session ON collected_evidence(game_session_id);

ALTER TABLE collected_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert ev"  ON collected_evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select ev"  ON collected_evidence FOR SELECT USING (true);
CREATE POLICY "Allow service all ev"  ON collected_evidence USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  5. INVESTIGATION REPORTS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investigation_reports (
    id               SERIAL       PRIMARY KEY,
    game_session_id  INTEGER      NOT NULL UNIQUE REFERENCES game_sessions(id) ON DELETE CASCADE,
    case_id          VARCHAR(20)  NOT NULL DEFAULT '047',
    suspect_id       VARCHAR(10)  NOT NULL,
    suspect_name     VARCHAR(120) NOT NULL,
    when_event       VARCHAR(20),
    evidence_cited   TEXT,
    conclusion       TEXT,
    score            INTEGER      NOT NULL DEFAULT 0,
    solved           BOOLEAN      NOT NULL DEFAULT FALSE,
    submitted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE investigation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert rpt"  ON investigation_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select rpt"  ON investigation_reports FOR SELECT USING (true);
CREATE POLICY "Allow service all rpt"  ON investigation_reports USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  6. LEADERBOARD
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
    id           SERIAL       PRIMARY KEY,
    player_name  VARCHAR(120) NOT NULL DEFAULT 'Investigator',
    case_id      VARCHAR(20)  NOT NULL DEFAULT '047',
    score        INTEGER      NOT NULL DEFAULT 0,
    solved       BOOLEAN      NOT NULL DEFAULT FALSE,
    evidence_cnt INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_case_score ON leaderboard(case_id, score DESC);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert lb"  ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select lb"  ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow service all lb"  ON leaderboard USING (auth.role() = 'service_role');


-- ──────────────────────────────────────────────────────────────────
--  HELPER VIEW — Leaderboard top 10 per case
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_top10 AS
SELECT
    ROW_NUMBER() OVER (PARTITION BY case_id ORDER BY score DESC) AS rank,
    player_name,
    case_id,
    score,
    solved,
    evidence_cnt,
    created_at
FROM leaderboard
WHERE solved = TRUE
ORDER BY case_id, score DESC;


-- ──────────────────────────────────────────────────────────────────
--  HELPER FUNCTION — get_case_stats(case_id)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_case_stats(p_case_id VARCHAR)
RETURNS TABLE (
    total_sessions  BIGINT,
    solved_sessions BIGINT,
    avg_score       NUMERIC,
    max_score       INTEGER,
    total_subs      BIGINT
) LANGUAGE sql AS $$
    SELECT
        COUNT(*)                            AS total_sessions,
        COUNT(*) FILTER (WHERE solved)      AS solved_sessions,
        ROUND(AVG(score)::NUMERIC, 1)       AS avg_score,
        MAX(score)                          AS max_score,
        (SELECT COUNT(*) FROM subscribers)  AS total_subs
    FROM game_sessions
    WHERE case_id = p_case_id;
$$;


-- ──────────────────────────────────────────────────────────────────
--  SEED — Insert placeholder data so tables are not empty
-- ──────────────────────────────────────────────────────────────────
INSERT INTO subscribers (email, source) VALUES
    ('demo@cybervault.com', 'seed')
ON CONFLICT (email) DO NOTHING;

-- Done.
SELECT 'CyberVault schema applied successfully.' AS status;
