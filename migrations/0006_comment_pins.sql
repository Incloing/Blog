ALTER TABLE comments ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0,1));
ALTER TABLE comments ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0 CHECK(is_owner IN (0,1));
CREATE INDEX comments_pin_order ON comments(pinned DESC,id DESC);
-- This is the existing owner's welcome message, identified by its migration ID and date.
UPDATE comments SET pinned=1,is_owner=1 WHERE id=1 AND name='Incloing' AND created_at='2026-10-17T08:49:34Z';
