#!/usr/bin/env python3
"""
daily_feed.py - Génère les feeds continus (articles + vidéos/podcasts)

Exporte dans export/feed.json:
- articles: les 10 meilleurs articles récents
- videos: les 5 meilleures vidéos/podcasts récents

Usage:
    python daily_feed.py
    python daily_feed.py --days 7  # Articles des 7 derniers jours
"""

import argparse
import json
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import yaml


def load_config(config_path: str = "config.yaml") -> dict:
    """Charge la configuration."""
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_db_connection(db_path: str) -> sqlite3.Connection:
    """Crée une connexion à la base de données."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_top_articles(
    conn: sqlite3.Connection,
    limit: int = 10,
    days: int = 14,
    min_score: int = 40
) -> list[dict[str, Any]]:
    """
    Récupère les meilleurs articles (hors vidéos/podcasts).

    Args:
        conn: Connexion SQLite
        limit: Nombre max d'articles
        days: Nombre de jours à considérer
        min_score: Score minimum requis
    """
    cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())

    query = """
        SELECT
            id, url, title, summary, source_name, published_ts,
            category_key, final_score, content_type, tech_level,
            marketing_score, source_type
        FROM items
        WHERE published_ts >= ?
          AND final_score >= ?
          AND (source_type IS NULL OR source_type = 'article')
          AND is_excluded = 0
        ORDER BY final_score DESC, published_ts DESC
        LIMIT ?
    """

    cursor = conn.execute(query, (cutoff_ts, min_score, limit))
    rows = cursor.fetchall()

    return [dict(row) for row in rows]


def fetch_top_videos(
    conn: sqlite3.Connection,
    limit: int = 5,
    days: int = 14,
    min_score: int = 30
) -> list[dict[str, Any]]:
    """
    Récupère les meilleures vidéos et podcasts.

    Args:
        conn: Connexion SQLite
        limit: Nombre max de vidéos/podcasts
        days: Nombre de jours à considérer
        min_score: Score minimum requis
    """
    cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())

    query = """
        SELECT
            id, url, title, summary, source_name, published_ts,
            category_key, final_score, content_type, tech_level,
            marketing_score, source_type
        FROM items
        WHERE published_ts >= ?
          AND final_score >= ?
          AND source_type IN ('youtube', 'podcast')
          AND is_excluded = 0
        ORDER BY final_score DESC, published_ts DESC
        LIMIT ?
    """

    cursor = conn.execute(query, (cutoff_ts, min_score, limit))
    rows = cursor.fetchall()

    return [dict(row) for row in rows]


def format_item(item: dict[str, Any]) -> dict[str, Any]:
    """Formate un item pour l'export JSON."""
    return {
        "id": item["id"],
        "url": item["url"],
        "title": item["title"],
        "summary": item["summary"] or "",
        "source_name": item["source_name"],
        "published_ts": item["published_ts"],
        "category_key": item["category_key"],
        "score": item["final_score"],
        "content_type": item["content_type"] or "technical",
        "tech_level": item["tech_level"] or "intermediate",
        "source_type": item["source_type"] or "article",
    }


def generate_feed(
    config_path: str = "config.yaml",
    days: int = 14,
    articles_limit: int = 10,
    videos_limit: int = 5
) -> dict[str, Any]:
    """
    Génère le feed complet.

    Returns:
        Dict avec 'articles' et 'videos'
    """
    config = load_config(config_path)
    db_path = config["storage"]["sqlite_path"]

    conn = get_db_connection(db_path)

    try:
        articles = fetch_top_articles(conn, limit=articles_limit, days=days)
        videos = fetch_top_videos(conn, limit=videos_limit, days=days)

        feed = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "config": {
                "articles_limit": articles_limit,
                "videos_limit": videos_limit,
                "days_lookback": days,
            },
            "articles": [format_item(a) for a in articles],
            "videos": [format_item(v) for v in videos],
        }

        return feed

    finally:
        conn.close()


def export_feed(feed: dict[str, Any], output_dir: str = "export") -> Path:
    """Exporte le feed dans export/feed.json."""
    output_path = Path(output_dir) / "feed.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Génère les feeds continus")
    parser.add_argument("--config", default="config.yaml", help="Fichier de config")
    parser.add_argument("--days", type=int, default=14, help="Jours à considérer")
    parser.add_argument("--articles", type=int, default=10, help="Nombre d'articles")
    parser.add_argument("--videos", type=int, default=5, help="Nombre de vidéos")
    parser.add_argument("--output", default="export", help="Dossier de sortie")

    args = parser.parse_args()

    print(f"Génération du feed (derniers {args.days} jours)...")

    feed = generate_feed(
        config_path=args.config,
        days=args.days,
        articles_limit=args.articles,
        videos_limit=args.videos
    )

    print(f"  - {len(feed['articles'])} articles")
    print(f"  - {len(feed['videos'])} vidéos/podcasts")

    output_path = export_feed(feed, args.output)
    print(f"\nExporté dans {output_path}")

    return feed


if __name__ == "__main__":
    main()
