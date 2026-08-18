ALTER TABLE logs ADD COLUMN lure_name TEXT;
ALTER TABLE logs ADD COLUMN lure_weight TEXT;
ALTER TABLE gear ADD COLUMN weight_options TEXT;
CREATE INDEX IF NOT EXISTS idx_logs_lure_name ON logs(lure_name);
