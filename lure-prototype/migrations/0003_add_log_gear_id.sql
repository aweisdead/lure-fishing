ALTER TABLE logs ADD COLUMN gear_id TEXT;
CREATE INDEX IF NOT EXISTS idx_logs_gear_id ON logs(gear_id);
