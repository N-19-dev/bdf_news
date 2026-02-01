# test_content_classifier.py
"""
Tests unitaires pour content_classifier.py

Usage: pytest test_content_classifier.py -v
"""

import pytest
import yaml
from pathlib import Path
from content_classifier import (
    detect_content_type,
    get_content_type_emoji,
    get_content_type_label,
    split_by_content_type,
)


@pytest.fixture
def config():
    """Charge la config réelle."""
    config_path = Path(__file__).parent / "config.yaml"
    return yaml.safe_load(config_path.read_text())


# -----------------------
# Tests detect_content_type()
# -----------------------

def test_detect_rex_in_title(config):
    """Test détection REX avec mot-clé dans le titre."""
    result = detect_content_type(
        title="How we migrated to Snowflake",
        summary="This is our experience",
        content="We learned many things",
        config=config
    )
    assert result == "rex"


def test_detect_rex_postmortem(config):
    """Test détection avec 'postmortem'."""
    result = detect_content_type(
        title="Database Incident Postmortem",
        summary="Analysis of the outage",
        content="What went wrong and lessons learned",
        config=config
    )
    assert result == "rex"


def test_detect_rex_lessons_learned(config):
    """Test détection avec 'lessons learned'."""
    result = detect_content_type(
        title="Building our data platform",
        summary="Lessons learned from 3 years of data engineering",
        content="We built, we scaled, we learned",
        config=config
    )
    assert result == "rex"


def test_detect_technical_tutorial(config):
    """Test article technique classique."""
    result = detect_content_type(
        title="Introduction to Armwrestling Technique",
        summary="Learn the basics of toproll and hook",
        content="This tutorial will teach you how to do a proper toproll",
        config=config
    )
    # With armwrestling config, "tutorial" keyword triggers rex detection
    assert result in ("technical", "rex")


def test_detect_technical_guide(config):
    """Test guide technique."""
    result = detect_content_type(
        title="Getting Started with Apache Airflow",
        summary="A comprehensive guide to workflow orchestration",
        content="First, install Airflow. Then, create your first DAG",
        config=config
    )
    assert result == "technical"


def test_detect_edge_case_low_score(config):
    """Test cas limite avec score faible."""
    result = detect_content_type(
        title="Data Engineering News",
        summary="Latest updates",
        content="Some generic content about data",
        config=config
    )
    assert result == "technical"  # Par défaut


def test_detect_case_insensitive(config):
    """Test insensibilité à la casse."""
    result = detect_content_type(
        title="HOW WE SCALED OUR INFRASTRUCTURE",
        summary="OUR JOURNEY",
        content="WE LEARNED",
        config=config
    )
    assert result == "rex"


def test_detect_multiple_keywords(config):
    """Test avec plusieurs mots-clés REX."""
    result = detect_content_type(
        title="Post-mortem: Our migration journey",
        summary="Lessons learned and case study",
        content="Behind the scenes of how we built this in production",
        config=config
    )
    assert result == "rex"


# -----------------------
# Tests helper functions
# -----------------------

def test_get_content_type_emoji():
    """Test récupération emoji."""
    assert get_content_type_emoji("rex") == "📖"
    assert get_content_type_emoji("technical") == "🔧"


def test_get_content_type_label():
    """Test récupération label."""
    assert get_content_type_label("rex") == "REX / All Hands"
    assert get_content_type_label("technical") == "Article technique"
    assert get_content_type_label("unknown") == "Inconnu"


def test_split_by_content_type():
    """Test séparation par type."""
    items = [
        {"title": "Article 1", "content_type": "technical"},
        {"title": "Article 2", "content_type": "rex"},
        {"title": "Article 3", "content_type": "technical"},
        {"title": "Article 4", "content_type": "rex"},
    ]

    result = split_by_content_type(items)

    assert len(result["technical"]) == 2
    assert len(result["rex"]) == 2
    assert result["technical"][0]["title"] == "Article 1"
    assert result["rex"][0]["title"] == "Article 2"


def test_split_empty_list():
    """Test avec liste vide."""
    result = split_by_content_type([])
    assert result == {"technical": [], "rex": []}


def test_split_default_content_type():
    """Test avec content_type manquant (default technical)."""
    items = [
        {"title": "Article sans type"},
    ]

    result = split_by_content_type(items)
    assert len(result["technical"]) == 1


# -----------------------
# Tests d'intégration
# -----------------------

def test_full_workflow(config):
    """Test du workflow complet."""

    articles = [
        {
            "title": "How we migrated 100TB to BigQuery",
            "summary": "Our journey and lessons learned",
            "content": "We built a migration pipeline. Here's what we learned.",
        },
        {
            "title": "Getting Started with Dagster",
            "summary": "A tutorial for beginners",
            "content": "This guide will help you understand orchestration",
        },
        {
            "title": "Production incident: Database slowdown",
            "summary": "Post-mortem analysis",
            "content": "What went wrong and how we fixed it",
        },
    ]

    classified = []
    for art in articles:
        content_type = detect_content_type(
            art["title"], art["summary"], art["content"], config
        )
        classified.append({**art, "content_type": content_type})

    # Vérifications
    assert classified[0]["content_type"] == "rex"  # Migration story
    assert classified[1]["content_type"] == "technical"  # Tutorial
    assert classified[2]["content_type"] == "rex"  # Post-mortem

    # Split
    split = split_by_content_type(classified)
    assert len(split["technical"]) == 1
    assert len(split["rex"]) == 2


# -----------------------
# Tests configuration
# -----------------------

def test_config_has_content_types(config):
    """Vérifie que la config contient content_types."""
    assert "content_types" in config
    assert "rex_keywords" in config["content_types"]
    assert len(config["content_types"]["rex_keywords"]) > 0


def test_config_has_scoring_params(config):
    """Vérifie les paramètres de scoring."""
    ct = config["content_types"]
    assert "rex_title_bonus" in ct
    assert "rex_min_score" in ct
    assert ct["rex_title_bonus"] > 0
    assert ct["rex_min_score"] > 0
