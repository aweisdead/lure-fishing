ALTER TABLE logs ADD COLUMN condition_snapshot TEXT;
ALTER TABLE logs ADD COLUMN condition_latitude REAL;
ALTER TABLE logs ADD COLUMN condition_longitude REAL;
ALTER TABLE logs ADD COLUMN condition_place TEXT;
ALTER TABLE logs ADD COLUMN condition_source TEXT;
ALTER TABLE logs ADD COLUMN condition_accuracy REAL;
ALTER TABLE logs ADD COLUMN condition_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_logs_condition_score ON logs(condition_score);
CREATE INDEX IF NOT EXISTS idx_logs_condition_place ON logs(condition_place);
