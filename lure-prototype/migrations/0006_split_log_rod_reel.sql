ALTER TABLE logs ADD COLUMN rod_id TEXT;
ALTER TABLE logs ADD COLUMN reel_id TEXT;
CREATE INDEX IF NOT EXISTS idx_logs_rod_id ON logs(rod_id);
CREATE INDEX IF NOT EXISTS idx_logs_reel_id ON logs(reel_id);
