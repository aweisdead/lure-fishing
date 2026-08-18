CREATE TABLE IF NOT EXISTS location_cache (
  coordinate_key TEXT PRIMARY KEY,
  place TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_rate_limits (
  service TEXT PRIMARY KEY,
  last_request_at INTEGER NOT NULL
);
