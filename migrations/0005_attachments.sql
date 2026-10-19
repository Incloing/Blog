CREATE TABLE attachments (
 key TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size > 0 AND size <= 10485760),
 etag TEXT NOT NULL,
 created INTEGER NOT NULL
);
CREATE TABLE attachment_chunks (
 key TEXT NOT NULL REFERENCES attachments(key) ON DELETE CASCADE,
 part INTEGER NOT NULL,
 data BLOB NOT NULL,
 PRIMARY KEY(key,part)
);
