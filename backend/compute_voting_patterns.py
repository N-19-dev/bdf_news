#!/usr/bin/env python3
"""
Analyse les votes Firebase pour calculer les patterns de boost.
Exécuté chaque lundi avant analyze_relevance.py
"""
import os
import sys
from pathlib import Path
from typing import Dict, List
from collections import defaultdict
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# Logger
from logger import get_logger
logger = get_logger(__name__)

def init_firebase():
    """Initialize Firebase Admin SDK"""
    # Service account key from environment or file
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if cred_path and Path(cred_path).exists():
        cred = credentials.Certificate(cred_path)
    else:
        # Use default credentials (for GitHub Actions)
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)
    return firestore.client()

def get_last_week_label() -> str:
    """Get last week's label (e.g., '2026w01')"""
    today = datetime.now()
    last_week = today - timedelta(days=7)
    year = last_week.isocalendar()[0]
    week = last_week.isocalendar()[1]
    return f"{year}w{week:02d}"

def compute_bayesian_boost(upvotes: int, total_votes: int, confidence: int = 10, baseline: float = 0.5, sensitivity: float = 0.5) -> float:
    """
    Calcul Bayésien pour éviter overfitting.

    Args:
        upvotes: Nombre d'upvotes
        total_votes: Total de votes (up + down)
        confidence: Baseline de confiance (default 10)
        baseline: Moyenne neutre (default 0.5)
        sensitivity: Sensibilité du boost (default 0.5)

    Returns:
        Multiplicateur (1.0 = neutre, 1.2 = +20%)
    """
    if total_votes == 0:
        return 1.0

    ratio = upvotes / total_votes
    boost_score = (confidence * baseline + ratio * total_votes) / (confidence + total_votes)
    multiplier = 1.0 + (boost_score - baseline) * sensitivity

    # Cap entre 0.7 et 1.3 (±30%)
    return max(0.7, min(1.3, multiplier))

def compute_source_boosts(db, week_label: str) -> Dict[str, float]:
    """Analyse quelles sources obtiennent le plus d'upvotes"""
    logger.info(f"Computing source boosts for {week_label}")

    votes_ref = db.collection('votes').where('week_label', '==', week_label)
    votes = votes_ref.stream()

    source_stats = defaultdict(lambda: {'upvotes': 0, 'total': 0})

    for vote in votes:
        data = vote.to_dict()
        source = data.get('article_source', 'unknown')
        vote_value = data.get('vote_value', 0)

        source_stats[source]['total'] += 1
        if vote_value > 0:
            source_stats[source]['upvotes'] += 1

    boosts = {}
    for source, stats in source_stats.items():
        if stats['total'] >= 3:  # Minimum 3 votes
            boost = compute_bayesian_boost(stats['upvotes'], stats['total'])
            boosts[source] = boost
            logger.info(f"  {source}: {stats['upvotes']}/{stats['total']} → {boost:.3f}")

    return boosts

def compute_category_boosts(db, week_label: str) -> Dict[str, float]:
    """Analyse quelles catégories obtiennent le plus d'upvotes"""
    logger.info(f"Computing category boosts for {week_label}")

    votes_ref = db.collection('votes').where('week_label', '==', week_label)
    votes = votes_ref.stream()

    category_stats = defaultdict(lambda: {'upvotes': 0, 'total': 0})

    for vote in votes:
        data = vote.to_dict()
        category = data.get('article_category', 'unknown')
        vote_value = data.get('vote_value', 0)

        category_stats[category]['total'] += 1
        if vote_value > 0:
            category_stats[category]['upvotes'] += 1

    boosts = {}
    for category, stats in category_stats.items():
        if stats['total'] >= 2:  # Minimum 2 votes
            boost = compute_bayesian_boost(stats['upvotes'], stats['total'])
            boosts[category] = boost
            logger.info(f"  {category}: {stats['upvotes']}/{stats['total']} → {boost:.3f}")

    return boosts

def compute_keyword_boosts(db, week_label: str) -> Dict[str, float]:
    """
    Extrait keywords des articles upvotés.
    Simple: on regarde les mots techniques dans les titres upvotés.
    """
    logger.info(f"Computing keyword boosts for {week_label}")

    # Keywords tech à surveiller
    tech_keywords = ['dbt', 'airflow', 'dagster', 'spark', 'snowflake', 'databricks',
                     'kafka', 'kubernetes', 'docker', 'python', 'sql', 'terraform']

    votes_ref = db.collection('votes').where('week_label', '==', week_label)
    votes = votes_ref.stream()

    keyword_stats = defaultdict(lambda: {'upvotes': 0, 'total': 0})

    for vote in votes:
        data = vote.to_dict()
        article_url = data.get('article_url', '').lower()
        vote_value = data.get('vote_value', 0)

        # Check keywords in URL (simple heuristic)
        found_keywords = [kw for kw in tech_keywords if kw in article_url]

        for kw in found_keywords:
            keyword_stats[kw]['total'] += 1
            if vote_value > 0:
                keyword_stats[kw]['upvotes'] += 1

    boosts = {}
    for keyword, stats in keyword_stats.items():
        if stats['total'] >= 2:  # Minimum 2 votes
            boost = compute_bayesian_boost(stats['upvotes'], stats['total'])
            boosts[keyword] = boost
            logger.info(f"  {keyword}: {stats['upvotes']}/{stats['total']} → {boost:.3f}")

    return boosts

def save_patterns_to_firebase(db, patterns: Dict[str, Dict[str, float]], next_week: str):
    """Sauvegarde les patterns dans Firestore"""
    logger.info(f"Saving patterns for week {next_week}")

    batch = db.batch()
    patterns_ref = db.collection('voting_patterns')

    for pattern_type, boosts in patterns.items():
        for pattern_key, boost_score in boosts.items():
            doc_id = f"{pattern_type}_{pattern_key}_{next_week}".replace(' ', '_').replace('(', '').replace(')', '')
            doc_ref = patterns_ref.document(doc_id)

            batch.set(doc_ref, {
                'pattern_type': pattern_type,
                'pattern_key': pattern_key,
                'boost_score': boost_score,
                'vote_count': 0,  # TODO: track actual count
                'applied_from_week': next_week,
                'computed_at': firestore.SERVER_TIMESTAMP
            })

    batch.commit()
    logger.info(f"✅ Saved {sum(len(b) for b in patterns.values())} patterns")

def get_next_week_label(week_label: str) -> str:
    """Calculate next week label"""
    # Parse "2026w01" → 2026, 1
    year = int(week_label[:4])
    week = int(week_label[5:])

    # Increment week
    week += 1
    if week > 52:
        week = 1
        year += 1

    return f"{year}w{week:02d}"

def main():
    logger.info("🔥 Starting Firebase voting patterns computation")

    # Initialize Firebase
    db = init_firebase()

    # Get last week's label
    last_week = get_last_week_label()
    next_week = get_next_week_label(last_week)

    logger.info(f"Analyzing votes from {last_week} to apply to {next_week}")

    # Compute boosts
    source_boosts = compute_source_boosts(db, last_week)
    category_boosts = compute_category_boosts(db, last_week)
    keyword_boosts = compute_keyword_boosts(db, last_week)

    patterns = {
        'source_boost': source_boosts,
        'category_boost': category_boosts,
        'keyword_boost': keyword_boosts
    }

    # Save to Firestore
    save_patterns_to_firebase(db, patterns, next_week)

    logger.info("✅ Voting patterns computation completed")

if __name__ == "__main__":
    main()
