CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO posts(id,value) SELECT json_extract(value,'$.id'),value FROM json_each((SELECT json_extract(value,'$.posts') FROM document WHERE id=1));
UPDATE document SET value=json_remove(value,'$.posts') WHERE id=1;
