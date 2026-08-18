ALTER TABLE fishing_sessions ADD COLUMN outcome TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE fishing_sessions ADD COLUMN review_note TEXT;
