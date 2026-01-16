#!/usr/bin/env python3
"""
Analyse le sentiment des commentaires de la semaine écoulée via Groq LLM.
Calcule des patterns de sentiment par source/catégorie et les sauvegarde dans Firestore.

Usage:
    python analyze_comment_sentiment.py
    WEEK_OFFSET=-1 python analyze_comment_sentiment.py  # Force une semaine spécifique
"""

import os
import sys
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
from openai import OpenAI

from logger import get_logger
from veille_tech import week_bounds

logger = get_logger(__name__)


def init_firebase() -> firestore.Client:
    """
    Initialize Firebase Admin SDK.
    Requires FIREBASE_SERVICE_ACCOUNT_KEY environment variable.
    """
    if firebase_admin._apps:
        logger.info("Firebase already initialized")
        return firestore.client()

    cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not cred_json:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set")

    try:
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise


def get_last_week_label() -> str:
    """
    Get the week label for the previous week (WEEK_OFFSET or -1).
    Returns: Week label in format YYYYwWW (e.g., "2026w02")
    """
    week_offset = int(os.getenv("WEEK_OFFSET", "-1"))
    _, _, week_id = week_bounds(week_offset)
    logger.info(f"Analyzing comments for week: {week_id}")
    return week_id


def fetch_comments_for_week(db: firestore.Client, week_label: str) -> List[Dict]:
    """
    Fetch all comments from Firestore for a specific week.

    Args:
        db: Firestore client
        week_label: Week identifier (e.g., "2026w02")

    Returns:
        List of comment dictionaries
    """
    logger.info(f"Fetching comments for week {week_label}")

    try:
        comments_ref = db.collection('comments')
        query = comments_ref.where(filter=FieldFilter('week_label', '==', week_label))
        docs = query.stream()

        comments = []
        for doc in docs:
            comment_data = doc.to_dict()
            comment_data['id'] = doc.id
            comments.append(comment_data)

        logger.info(f"Fetched {len(comments)} comments for week {week_label}")
        return comments

    except Exception as e:
        logger.error(f"Failed to fetch comments: {e}")
        return []


def group_comments_by_article(comments: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Group comments by article_id.

    Args:
        comments: List of comment dictionaries

    Returns:
        Dictionary mapping article_id to list of comments
    """
    grouped = defaultdict(list)

    for comment in comments:
        article_id = comment.get('article_id')
        if article_id:
            grouped[article_id].append(comment)

    logger.info(f"Grouped comments into {len(grouped)} articles")

    # Filter articles with at least 3 comments
    filtered = {
        article_id: comments_list
        for article_id, comments_list in grouped.items()
        if len(comments_list) >= 3
    }

    logger.info(f"Filtered to {len(filtered)} articles with ≥3 comments")
    return filtered


def analyze_article_comments(
    article_id: str,
    comments: List[Dict],
    groq_client: OpenAI
) -> Optional[Dict]:
    """
    Analyze sentiment and perceived quality of comments using Groq LLM.

    Args:
        article_id: Article identifier
        comments: List of comment dictionaries for this article
        groq_client: OpenAI client configured for Groq API

    Returns:
        Dictionary with sentiment analysis results or None if failed
    """
    # Get article info from first comment
    article_title = comments[0].get('article_title', 'Article')
    article_url = comments[0].get('article_url', '')
    article_category = comments[0].get('article_category', 'unknown')
    article_source = comments[0].get('article_source', 'unknown')

    # Build comments text for LLM
    comments_text = "\n\n".join([
        f"Commentaire {i+1} (par {c.get('user_name', 'Anonymous')}): {c.get('content', '')}"
        for i, c in enumerate(comments)
    ])

    prompt = f"""Analyse les commentaires suivants sur l'article "{article_title}" :

{comments_text}

Réponds en JSON avec cette structure exacte :
{{
  "overall_sentiment": {{
    "score": float (-1.0 à 1.0, -1=très négatif, 0=neutre, 1=très positif),
    "summary": "Résumé du sentiment général en 1 phrase"
  }},
  "perceived_quality": {{
    "is_useful": boolean (commentaires mentionnent utilité/pratique),
    "is_clear": boolean (commentaires mentionnent clarté/compréhensible),
    "is_practical": boolean (commentaires mentionnent exemples/applicable),
    "summary": "Résumé de la qualité perçue en 1 phrase"
  }},
  "key_topics": ["liste", "des", "sujets", "mentionnés"]
}}

Ne retourne QUE le JSON, sans texte avant/après."""

    try:
        logger.info(f"Analyzing {len(comments)} comments for article: {article_title[:50]}...")

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Tu es un expert en analyse de sentiment. Tu réponds toujours en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()

        # Try to parse JSON (handle markdown code blocks)
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        analysis = json.loads(content)

        # Validate structure
        if not all(key in analysis for key in ['overall_sentiment', 'perceived_quality', 'key_topics']):
            logger.error(f"Invalid analysis structure for article {article_id}")
            return None

        # Add metadata
        analysis['article_id'] = article_id
        analysis['article_url'] = article_url
        analysis['article_title'] = article_title
        analysis['article_category'] = article_category
        analysis['article_source'] = article_source
        analysis['comment_count'] = len(comments)

        logger.info(f"✅ Analyzed article: sentiment={analysis['overall_sentiment']['score']:.2f}")
        return analysis

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response for article {article_id}: {e}")
        logger.error(f"Response content: {content[:500]}")
        return None

    except Exception as e:
        logger.error(f"Failed to analyze comments for article {article_id}: {e}")
        return None


def compute_sentiment_boost(sentiment_score: float, quality_data: dict) -> float:
    """
    Calculate boost multiplier based on sentiment and perceived quality.

    Args:
        sentiment_score: Sentiment score from -1.0 to 1.0
        quality_data: Dictionary with is_useful, is_clear, is_practical booleans

    Returns:
        Multiplier between 0.8 and 1.3
    """
    # Base sentiment contribution (-0.2 to +0.2)
    sentiment_multiplier = sentiment_score * 0.2

    # Quality bonus (+0.03 per validated attribute, max +0.09)
    quality_bonus = sum([
        0.03 if quality_data.get('is_useful') else 0,
        0.03 if quality_data.get('is_clear') else 0,
        0.03 if quality_data.get('is_practical') else 0
    ])

    # Total multiplier
    total_multiplier = 1.0 + sentiment_multiplier + quality_bonus

    # Cap between 0.8 and 1.3
    return max(0.8, min(1.3, total_multiplier))


def aggregate_by_source(article_sentiments: Dict[str, Dict]) -> Dict[str, Dict]:
    """
    Aggregate sentiment patterns by source.

    Args:
        article_sentiments: Dictionary of article analyses

    Returns:
        Dictionary mapping source name to aggregated pattern
    """
    source_patterns = defaultdict(lambda: {
        'sentiment_scores': [],
        'quality_boosts': [],
        'comment_counts': []
    })

    for article_id, analysis in article_sentiments.items():
        source = analysis.get('article_source', 'unknown')
        sentiment_score = analysis['overall_sentiment']['score']
        quality_boost = compute_sentiment_boost(
            sentiment_score,
            analysis['perceived_quality']
        )
        comment_count = analysis.get('comment_count', 0)

        source_patterns[source]['sentiment_scores'].append(sentiment_score)
        source_patterns[source]['quality_boosts'].append(quality_boost)
        source_patterns[source]['comment_counts'].append(comment_count)

    # Compute averages
    aggregated = {}
    for source, data in source_patterns.items():
        if data['sentiment_scores']:
            aggregated[source] = {
                'sentiment_score': sum(data['sentiment_scores']) / len(data['sentiment_scores']),
                'quality_boost': sum(data['quality_boosts']) / len(data['quality_boosts']),
                'comment_count': sum(data['comment_counts']),
                'article_count': len(data['sentiment_scores'])
            }

    logger.info(f"Aggregated {len(aggregated)} source patterns")
    return aggregated


def aggregate_by_category(article_sentiments: Dict[str, Dict]) -> Dict[str, Dict]:
    """
    Aggregate sentiment patterns by category.

    Args:
        article_sentiments: Dictionary of article analyses

    Returns:
        Dictionary mapping category to aggregated pattern
    """
    category_patterns = defaultdict(lambda: {
        'sentiment_scores': [],
        'quality_boosts': [],
        'comment_counts': []
    })

    for article_id, analysis in article_sentiments.items():
        category = analysis.get('article_category', 'unknown')
        sentiment_score = analysis['overall_sentiment']['score']
        quality_boost = compute_sentiment_boost(
            sentiment_score,
            analysis['perceived_quality']
        )
        comment_count = analysis.get('comment_count', 0)

        category_patterns[category]['sentiment_scores'].append(sentiment_score)
        category_patterns[category]['quality_boosts'].append(quality_boost)
        category_patterns[category]['comment_counts'].append(comment_count)

    # Compute averages
    aggregated = {}
    for category, data in category_patterns.items():
        if data['sentiment_scores']:
            aggregated[category] = {
                'sentiment_score': sum(data['sentiment_scores']) / len(data['sentiment_scores']),
                'quality_boost': sum(data['quality_boosts']) / len(data['quality_boosts']),
                'comment_count': sum(data['comment_counts']),
                'article_count': len(data['sentiment_scores'])
            }

    logger.info(f"Aggregated {len(aggregated)} category patterns")
    return aggregated


def save_sentiment_patterns(
    db: firestore.Client,
    source_patterns: Dict[str, Dict],
    category_patterns: Dict[str, Dict],
    applied_from_week: str
) -> None:
    """
    Save sentiment patterns to Firestore.

    Args:
        db: Firestore client
        source_patterns: Aggregated patterns by source
        category_patterns: Aggregated patterns by category
        applied_from_week: Week label when these patterns will be applied
    """
    patterns_ref = db.collection('sentiment_patterns')
    computed_at = firestore.SERVER_TIMESTAMP

    saved_count = 0

    # Save source patterns
    for source, data in source_patterns.items():
        doc_id = f"source_{source}_{applied_from_week}".replace('/', '_').replace('.', '_')

        try:
            patterns_ref.document(doc_id).set({
                'pattern_type': 'source_sentiment',
                'pattern_key': source,
                'sentiment_score': data['sentiment_score'],
                'quality_boost': data['quality_boost'],
                'comment_count': data['comment_count'],
                'article_count': data['article_count'],
                'applied_from_week': applied_from_week,
                'computed_at': computed_at
            })
            saved_count += 1
            logger.info(f"✅ Saved source pattern: {source} (boost={data['quality_boost']:.3f})")
        except Exception as e:
            logger.error(f"Failed to save source pattern {source}: {e}")

    # Save category patterns
    for category, data in category_patterns.items():
        doc_id = f"category_{category}_{applied_from_week}".replace('/', '_').replace('.', '_')

        try:
            patterns_ref.document(doc_id).set({
                'pattern_type': 'category_sentiment',
                'pattern_key': category,
                'sentiment_score': data['sentiment_score'],
                'quality_boost': data['quality_boost'],
                'comment_count': data['comment_count'],
                'article_count': data['article_count'],
                'applied_from_week': applied_from_week,
                'computed_at': computed_at
            })
            saved_count += 1
            logger.info(f"✅ Saved category pattern: {category} (boost={data['quality_boost']:.3f})")
        except Exception as e:
            logger.error(f"Failed to save category pattern {category}: {e}")

    logger.info(f"💾 Saved {saved_count} sentiment patterns to Firestore")


def main():
    """
    Main workflow:
    1. Initialize Firebase
    2. Get last week's label
    3. Fetch comments from Firestore
    4. Group by article (min 3 comments)
    5. Analyze sentiment with Groq LLM
    6. Compute boosts
    7. Aggregate by source and category
    8. Save patterns to Firestore (applied from next week)
    """
    logger.info("=" * 80)
    logger.info("Starting comment sentiment analysis")
    logger.info("=" * 80)

    # Check for required environment variables
    if not os.getenv("GROQ_API_KEY"):
        logger.error("GROQ_API_KEY environment variable not set")
        sys.exit(1)

    if not os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY"):
        logger.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set")
        sys.exit(1)

    try:
        # Initialize Firebase
        db = init_firebase()

        # Get last week's label
        last_week_label = get_last_week_label()

        # Compute next week (when patterns will be applied)
        # WEEK_OFFSET=-1 → last_week_label=2026w01 → next_week=2026w02
        week_offset = int(os.getenv("WEEK_OFFSET", "-1"))
        _, _, next_week_label = week_bounds(week_offset + 1)
        logger.info(f"Patterns will be applied from week: {next_week_label}")

        # Fetch comments
        comments = fetch_comments_for_week(db, last_week_label)

        if not comments:
            logger.warning("No comments found for analysis. Exiting.")
            return

        # Group by article
        articles_with_comments = group_comments_by_article(comments)

        if not articles_with_comments:
            logger.warning("No articles with ≥3 comments found. Exiting.")
            return

        # Initialize Groq client
        groq_client = OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )

        # Analyze each article
        article_sentiments = {}
        for article_id, comments_list in articles_with_comments.items():
            analysis = analyze_article_comments(article_id, comments_list, groq_client)
            if analysis:
                article_sentiments[article_id] = analysis

        if not article_sentiments:
            logger.warning("No successful sentiment analyses. Exiting.")
            return

        logger.info(f"Successfully analyzed {len(article_sentiments)} articles")

        # Aggregate by source and category
        source_patterns = aggregate_by_source(article_sentiments)
        category_patterns = aggregate_by_category(article_sentiments)

        # Save to Firestore
        save_sentiment_patterns(db, source_patterns, category_patterns, next_week_label)

        logger.info("=" * 80)
        logger.info("✅ Comment sentiment analysis completed successfully")
        logger.info("=" * 80)

    except Exception as e:
        logger.error(f"Fatal error in sentiment analysis: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
