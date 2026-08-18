CREATE TABLE IF NOT EXISTS fishing_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  started_at TEXT,
  ended_at TEXT,
  spot_id TEXT,
  note TEXT,
  condition_snapshot TEXT,
  condition_latitude REAL,
  condition_longitude REAL,
  condition_place TEXT,
  condition_source TEXT,
  condition_accuracy REAL,
  condition_score INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE logs ADD COLUMN session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_fishing_sessions_created_at ON fishing_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_session_id ON logs(session_id);
