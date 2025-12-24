#!/usr/bin/env python3
"""
daily_digest.py - Daily email digest sender

Selects the best article(s) and sends via SendGrid to configured recipients.
Tracks sent articles to avoid duplicates.
"""
import os
import sqlite3
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional, Any
from zoneinfo import ZoneInfo

import yaml
from pydantic import BaseModel
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

from logger import get_logger

logger = get_logger("daily_digest", log_file="logs/daily_digest.log", level="INFO")

# ============================================================================
# Configuration Models
# ============================================================================

class Recipient(BaseModel):
    email: str
    name: str

class ScheduleConfig(BaseModel):
    frequency: str = "daily"
    time: str = "08:00"
    timezone: str = "Europe/Paris"
    days: List[str] = ["mon", "tue", "wed", "thu", "fri"]

class SelectionConfig(BaseModel):
    articles_per_digest: int = 1
    min_score_threshold: int = 60
    round_robin_categories: bool = True
    avoid_duplicates_days: int = 30

class EmailDigestConfig(BaseModel):
    enabled: bool = True
    sendgrid_api_key_env: str = "SENDGRID_API_KEY"
    from_email: str
    from_name: str
    recipients: List[Recipient]
    schedule: ScheduleConfig
    selection: SelectionConfig

# ============================================================================
# Article Selection
# ============================================================================

class ArticleSelector:
    """Selects best articles for daily digest, avoiding duplicates"""

    def __init__(self, db_path: str, config: SelectionConfig):
        self.db_path = db_path
        self.config = config
        self.category_counter = 0  # For round-robin

    def get_best_article(self, recipient_email: str) -> Optional[Dict[str, Any]]:
        """
        Select best article for a recipient:
        - Not sent to this recipient in last N days
        - Score >= threshold
        - Round-robin categories if enabled
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # Calculate cutoff timestamp for duplicate avoidance
            cutoff_ts = int((datetime.now() - timedelta(days=self.config.avoid_duplicates_days)).timestamp())

            # Build query to exclude already sent articles
            query = """
            SELECT
                i.id,
                i.url,
                i.title,
                i.summary,
                i.source_name,
                i.category_key,
                i.final_score,
                i.content,
                i.published_ts
            FROM items i
            WHERE i.final_score >= ?
              AND i.id NOT IN (
                SELECT article_id
                FROM sent_articles
                WHERE email_recipient = ?
                  AND sent_at >= ?
              )
            ORDER BY i.final_score DESC
            LIMIT 10
            """

            cursor.execute(query, (self.config.min_score_threshold, recipient_email, cutoff_ts))
            candidates = [dict(row) for row in cursor.fetchall()]

            if not candidates:
                logger.warning(f"No suitable articles found for {recipient_email}")
                return None

            # If round-robin enabled, prefer different categories
            if self.config.round_robin_categories:
                # Get last sent category for this recipient
                cursor.execute("""
                    SELECT i.category_key
                    FROM sent_articles sa
                    JOIN items i ON sa.article_id = i.id
                    WHERE sa.email_recipient = ?
                    ORDER BY sa.sent_at DESC
                    LIMIT 1
                """, (recipient_email,))
                last_row = cursor.fetchone()
                last_category = dict(last_row)["category_key"] if last_row else None

                # Try to find article from different category
                for article in candidates:
                    if article["category_key"] != last_category:
                        logger.info(f"Selected article (round-robin): {article['title'][:60]}")
                        return article

            # Fallback: return highest scored
            best = candidates[0]
            logger.info(f"Selected article (highest score): {best['title'][:60]}")
            return best

        finally:
            conn.close()

    def mark_as_sent(self, article_id: str, recipient_email: str, digest_type: str = "daily"):
        """Mark article as sent to recipient"""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO sent_articles (article_id, email_recipient, sent_at, digest_type)
                VALUES (?, ?, ?, ?)
            """, (article_id, recipient_email, int(time.time()), digest_type))
            conn.commit()
            logger.info(f"Marked article {article_id} as sent to {recipient_email}")
        finally:
            conn.close()

# ============================================================================
# Email Rendering & Sending
# ============================================================================

class EmailSender:
    """Renders templates and sends via SendGrid"""

    def __init__(self, config: EmailDigestConfig, templates_dir: Path):
        self.config = config
        self.templates_dir = templates_dir

        # Load SendGrid API key
        api_key = os.getenv(config.sendgrid_api_key_env)
        if not api_key:
            raise ValueError(f"Missing env var: {config.sendgrid_api_key_env}")
        self.sg_client = SendGridAPIClient(api_key)

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render template with context (simple string replacement)"""
        template_path = self.templates_dir / template_name
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read()

        # Simple {{var}} replacement
        for key, value in context.items():
            template = template.replace(f"{{{{{key}}}}}", str(value))

        return template

    def estimate_read_time(self, content: str) -> int:
        """Estimate read time in minutes (250 words/min)"""
        word_count = len(content.split())
        return max(1, round(word_count / 250))

    def send_digest(self, article: Dict[str, Any], recipient: Recipient) -> bool:
        """Send daily digest email for an article"""
        # Prepare context for template
        context = {
            "recipient_name": recipient.name,
            "date": datetime.now(ZoneInfo(self.config.schedule.timezone)).strftime("%d %B %Y"),
            "title": article["title"],
            "url": article["url"],
            "source": article["source_name"],
            "summary": article.get("summary", "")[:300] + "..." if len(article.get("summary", "")) > 300 else article.get("summary", ""),
            "score": article["final_score"],
            "category": self._format_category(article["category_key"]),
            "read_time": self.estimate_read_time(article.get("content", "")),
            "archive_url": "https://n-19-dev.github.io/veille_tech_crawling/veille/",  # Update with your domain
            "manage_prefs_url": "https://n-19-dev.github.io/veille_tech_crawling/veille/preferences",
            "unsubscribe_url": f"https://n-19-dev.github.io/veille_tech_crawling/veille/unsubscribe?email={recipient.email}",
        }

        # Render templates
        html_content = self.render_template("daily_digest.html", context)
        text_content = self.render_template("daily_digest.txt", context)

        # Create SendGrid message
        message = Mail(
            from_email=Email(self.config.from_email, self.config.from_name),
            to_emails=To(recipient.email, recipient.name),
            subject=f"📡 Ton article tech du jour — {article['title'][:60]}",
            html_content=Content("text/html", html_content),
            plain_text_content=Content("text/plain", text_content),
        )

        try:
            response = self.sg_client.send(message)
            logger.info(f"✅ Email sent to {recipient.email} (status: {response.status_code})")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email to {recipient.email}: {e}")
            return False

    def _format_category(self, category_key: str) -> str:
        """Format category key to human-readable"""
        category_map = {
            "warehouses_engines": "Warehouses & Query Engines",
            "orchestration": "Orchestration & Workflows",
            "governance": "Governance & Metadata",
            "lakes": "Data Lakes & Lakehouses",
            "cloud_infra": "Cloud & Infrastructure",
            "python_dev": "Python & Dev Tools",
            "ai_ml": "AI & Machine Learning",
            "news": "News & Trends",
        }
        return category_map.get(category_key, category_key.replace("_", " ").title())

# ============================================================================
# Main Runner
# ============================================================================

def load_config(config_path: Path) -> EmailDigestConfig:
    """Load email_digest section from config.yaml"""
    with open(config_path, "r", encoding="utf-8") as f:
        full_config = yaml.safe_load(f)

    if "email_digest" not in full_config:
        raise ValueError("Missing 'email_digest' section in config.yaml")

    return EmailDigestConfig(**full_config["email_digest"])

def should_send_today(config: EmailDigestConfig) -> bool:
    """Check if we should send digest today based on schedule"""
    tz = ZoneInfo(config.schedule.timezone)
    now = datetime.now(tz)

    # Check if today is in allowed days
    day_map = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
    allowed_days = [day_map[d] for d in config.schedule.days]

    if now.weekday() not in allowed_days:
        logger.info(f"Skipping: Today is {now.strftime('%A')}, not in allowed days")
        return False

    return True

def main():
    """Main entry point for daily digest"""
    logger.info("=" * 60)
    logger.info("Starting daily digest process")
    logger.info("=" * 60)

    # Paths
    base_dir = Path(__file__).parent
    config_path = base_dir / "config.yaml"
    db_path = base_dir / "veille.db"
    templates_dir = base_dir / "templates"

    # Load config
    config = load_config(config_path)

    if not config.enabled:
        logger.info("Email digest is disabled in config. Exiting.")
        return

    if not should_send_today(config):
        logger.info("Not scheduled for today. Exiting.")
        return

    # Initialize components
    selector = ArticleSelector(str(db_path), config.selection)
    sender = EmailSender(config, templates_dir)

    # Process each recipient
    success_count = 0
    fail_count = 0

    for recipient in config.recipients:
        logger.info(f"Processing recipient: {recipient.email}")

        # Select best article
        article = selector.get_best_article(recipient.email)
        if not article:
            logger.warning(f"No article to send for {recipient.email}")
            fail_count += 1
            continue

        # Send email
        if sender.send_digest(article, recipient):
            selector.mark_as_sent(article["id"], recipient.email, "daily")
            success_count += 1
        else:
            fail_count += 1

    # Summary
    logger.info("=" * 60)
    logger.info(f"Daily digest completed: {success_count} sent, {fail_count} failed")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
