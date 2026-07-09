CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  size TEXT,
  weight TEXT,
  spot TEXT,
  lure TEXT,
  date TEXT,
  time TEXT,
  image TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  water TEXT,
  structure TEXT,
  target TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gear (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  spec TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spots_created_at ON spots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gear_created_at ON gear(created_at DESC);
