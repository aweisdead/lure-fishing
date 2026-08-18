ALTER TABLE logs ADD COLUMN photo_id TEXT;

CREATE TABLE IF NOT EXISTS catch_photos (
  id TEXT PRIMARY KEY,
  log_id TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  data BLOB NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_photo_id ON logs(photo_id);
CREATE INDEX IF NOT EXISTS idx_catch_photos_log_id ON catch_photos(log_id);
