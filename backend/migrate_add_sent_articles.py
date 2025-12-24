#!/usr/bin/env python3
"""
Migration: Add sent_articles table to track daily digest emails
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "veille.db"

SQL_CREATE_SENT_ARTICLES = """
CREATE TABLE IF NOT EXISTS sent_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  email_recipient TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  digest_type TEXT DEFAULT 'daily',
  created_ts INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (article_id) REFERENCES items(id),
  UNIQUE(article_id, email_recipient, digest_type)
);

CREATE INDEX IF NOT EXISTS idx_sent_articles_email ON sent_articles(email_recipient, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_articles_article ON sent_articles(article_id);
"""

def migrate():
    print(f"🔧 Running migration: Add sent_articles table")
    print(f"📂 Database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SQL_CREATE_SENT_ARTICLES)
        conn.commit()
        print("✅ Migration successful: sent_articles table created")

        # Verify table exists
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sent_articles'")
        if cursor.fetchone():
            print("✅ Table verification: sent_articles exists")
        else:
            print("❌ Table verification failed")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
