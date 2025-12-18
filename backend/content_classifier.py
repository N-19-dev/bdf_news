# content_classifier.py
"""
Classification des articles en deux types :
- "technical" : Articles techniques, tutoriels, documentation
- "rex" : Retours d'expérience (REX), All Hands, Post-mortems
"""

from typing import Dict, Any, List


def detect_content_type(title: str, summary: str, content: str, config: Dict[str, Any], source_name: str = "") -> str:
    """
    Détermine si un article est un REX/All Hands ou un article technique standard.

    Args:
        title: Titre de l'article
        summary: Résumé de l'article
        content: Contenu complet (premiers caractères)
        config: Configuration avec les mots-clés REX
        source_name: Nom de la source (pour filtrer les sources communautaires)

    Returns:
        "rex" ou "technical"
    """
    content_config = config.get("content_types", {})

    # Vérifier que la source est communautaire
    community_sources = content_config.get("community_sources", [])
    if source_name and community_sources:
        if source_name in community_sources:
            # Source communautaire = toujours "rex" (inclut newsletters, tutoriels, REX)
            return "rex"
        else:
            # Source corporate = toujours "technical"
            return "technical"

    # Si pas de liste de sources communautaires définie, fallback sur les patterns
    rex_keywords = content_config.get("rex_keywords", [])
    rex_title_bonus = content_config.get("rex_title_bonus", 30)
    rex_min_score = content_config.get("rex_min_score", 40)

    # Texte à analyser (titre + résumé + début du contenu)
    full_text = f"{title} {summary} {content[:500]}".lower()
    title_lower = title.lower()

    rex_score = 0

    # Compter les occurrences de mots-clés REX
    for keyword in rex_keywords:
        keyword_lower = keyword.lower()

        # Si dans le titre, bonus important
        if keyword_lower in title_lower:
            rex_score += rex_title_bonus

        # Si dans le texte complet
        count = full_text.count(keyword_lower)
        if count > 0:
            rex_score += count * 10  # 10 points par occurrence

    # Patterns supplémentaires pour REX (avec scoring différencié)
    # Patterns forts = mots-clés qui indiquent presque certainement un REX
    strong_rex_patterns = [
        "how we",
        "why we",
        "we migrated",
        "we scaled",
        "we built",
        "we learned",
        "our experience",
        "our approach",
        "our journey",
        "our story",
        "retour d'expérience",
        "all hands",
        "postmortem",
        "post-mortem",
        "incident report",
        "lessons learned",
        "what we learned",
        "year in review",
        "retrospective",
    ]

    # Patterns moyens = indicateurs possibles de REX
    medium_rex_patterns = [
        "building",
        "scaling",
        "migrating",
        "moving to",
        "switching to",
        "adopting",
        "implementing at",
        "journey to",
        "at scale",
        "in production",
        "real-world",
        "from the trenches",
        "in the wild",
        "battle-tested",
        "looking back",
        "deep dive into our",
        "inside",
        "behind the scenes",
    ]

    # Score pour patterns forts
    for pattern in strong_rex_patterns:
        if pattern in full_text:
            # Bonus titre important si dans le titre
            if pattern in title_lower:
                rex_score += 35  # Fort bonus titre
            else:
                rex_score += 20  # Fort bonus texte

    # Score pour patterns moyens
    for pattern in medium_rex_patterns:
        if pattern in full_text:
            # Bonus titre modéré si dans le titre
            if pattern in title_lower:
                rex_score += 20  # Moyen bonus titre
            else:
                rex_score += 8   # Moyen bonus texte

    # Décision finale
    if rex_score >= rex_min_score:
        return "rex"
    else:
        return "technical"


def get_content_type_emoji(content_type: str) -> str:
    """Retourne un emoji pour le type de contenu."""
    return "📖" if content_type == "rex" else "🔧"


def get_content_type_label(content_type: str) -> str:
    """Retourne un label lisible pour le type de contenu."""
    labels = {
        "rex": "REX / All Hands",
        "technical": "Article technique"
    }
    return labels.get(content_type, "Inconnu")


def split_by_content_type(items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Sépare une liste d'articles par type de contenu.

    Args:
        items: Liste d'articles avec un champ "content_type"

    Returns:
        {"technical": [...], "rex": [...]}
    """
    result = {
        "technical": [],
        "rex": []
    }

    for item in items:
        content_type = item.get("content_type", "technical")
        if content_type in result:
            result[content_type].append(item)

    return result
