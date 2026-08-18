ALTER TABLE logs ADD COLUMN length_cm REAL;
ALTER TABLE logs ADD COLUMN weight_g REAL;

UPDATE logs
SET length_cm = CASE
  WHEN lower(size) LIKE '%cm%' OR size LIKE '%厘米%' THEN CAST(replace(replace(replace(lower(size), 'cm', ''), '厘米', ''), ' ', '') AS REAL)
  WHEN lower(size) LIKE '%m%' OR size LIKE '%米%' THEN CAST(replace(replace(replace(lower(size), 'm', ''), '米', ''), ' ', '') AS REAL) * 100
  ELSE CAST(replace(size, ' ', '') AS REAL)
END
WHERE COALESCE(trim(size), '') <> '';

UPDATE logs
SET weight_g = CASE
  WHEN lower(weight) LIKE '%kg%' OR weight LIKE '%公斤%' OR weight LIKE '%千克%' THEN CAST(replace(replace(replace(replace(lower(weight), 'kg', ''), '公斤', ''), '千克', ''), ' ', '') AS REAL) * 1000
  WHEN lower(weight) LIKE '%g%' OR weight LIKE '%克%' THEN CAST(replace(replace(replace(lower(weight), 'g', ''), '克', ''), ' ', '') AS REAL)
  ELSE CAST(replace(weight, ' ', '') AS REAL) * 1000
END
WHERE COALESCE(trim(weight), '') <> '';

CREATE INDEX IF NOT EXISTS idx_logs_length_cm ON logs(length_cm);
CREATE INDEX IF NOT EXISTS idx_logs_weight_g ON logs(weight_g);
