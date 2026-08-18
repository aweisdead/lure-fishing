ALTER TABLE logs ADD COLUMN spot_id TEXT;
CREATE INDEX IF NOT EXISTS idx_logs_spot_id ON logs(spot_id);
