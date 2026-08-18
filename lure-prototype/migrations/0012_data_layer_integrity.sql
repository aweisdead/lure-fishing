ALTER TABLE logs ADD COLUMN spot_name_snapshot TEXT;
ALTER TABLE logs ADD COLUMN session_name_snapshot TEXT;
ALTER TABLE logs ADD COLUMN gear_name_snapshot TEXT;
ALTER TABLE logs ADD COLUMN rod_name_snapshot TEXT;
ALTER TABLE logs ADD COLUMN reel_name_snapshot TEXT;

ALTER TABLE spots ADD COLUMN archived_at TEXT;
ALTER TABLE gear ADD COLUMN archived_at TEXT;
ALTER TABLE fishing_sessions ADD COLUMN archived_at TEXT;

UPDATE logs
SET spot_name_snapshot = (
  SELECT name FROM spots WHERE spots.id = logs.spot_id
)
WHERE COALESCE(spot_name_snapshot, '') = '' AND COALESCE(spot_id, '') <> '';

UPDATE logs
SET session_name_snapshot = (
  SELECT name FROM fishing_sessions WHERE fishing_sessions.id = logs.session_id
)
WHERE COALESCE(session_name_snapshot, '') = '' AND COALESCE(session_id, '') <> '';

UPDATE logs
SET gear_name_snapshot = (
  SELECT name FROM gear WHERE gear.id = logs.gear_id
)
WHERE COALESCE(gear_name_snapshot, '') = '' AND COALESCE(gear_id, '') <> '';

UPDATE logs
SET rod_name_snapshot = (
  SELECT name FROM gear WHERE gear.id = logs.rod_id
)
WHERE COALESCE(rod_name_snapshot, '') = '' AND COALESCE(rod_id, '') <> '';

UPDATE logs
SET reel_name_snapshot = (
  SELECT name FROM gear WHERE gear.id = logs.reel_id
)
WHERE COALESCE(reel_name_snapshot, '') = '' AND COALESCE(reel_id, '') <> '';

CREATE INDEX IF NOT EXISTS idx_logs_date_id ON logs(date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_spots_archived_at ON spots(archived_at);
CREATE INDEX IF NOT EXISTS idx_gear_archived_at ON gear(archived_at);
CREATE INDEX IF NOT EXISTS idx_sessions_archived_at ON fishing_sessions(archived_at);
