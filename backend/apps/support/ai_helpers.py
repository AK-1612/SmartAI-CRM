"""Lightweight, dependency-free AI helpers for the support module.

These are deliberately simple lexicon/keyword models so the module works out of
the box with no API keys or GPU. Swap `categorize_ticket` / `analyze_sentiment` /
`suggest_response` for calls into `ai/` (OpenAI, a fine-tuned classifier, etc.)
later without touching callers — they all take/return plain strings and floats.
"""
from __future__ import annotations

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "billing": ["invoice", "charge", "payment", "refund", "subscription", "billing", "price", "credit card"],
    "technical": ["bug", "error", "crash", "not working", "broken", "issue", "fail", "exception", "loading"],
    "account": ["login", "password", "access", "account", "locked", "sign in", "reset", "2fa"],
    "feature_request": ["feature", "request", "suggestion", "add support", "would be nice", "please add"],
    "complaint": ["disappointed", "unacceptable", "terrible", "worst", "angry", "frustrated", "complaint"],
}

POSITIVE_WORDS = {
    "great", "thanks", "thank you", "awesome", "excellent", "good", "love", "happy",
    "appreciate", "helpful", "perfect", "resolved", "amazing",
}
NEGATIVE_WORDS = {
    "bad", "terrible", "worst", "angry", "frustrated", "disappointed", "broken",
    "useless", "unacceptable", "hate", "awful", "horrible", "never", "refund",
    "cancel", "urgent", "asap", "furious",
}


def categorize_ticket(subject: str, description: str) -> str:
    """Keyword-match against subject+description; falls back to 'general'."""
    text = f"{subject} {description}".lower()
    best_category, best_hits = "general", 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in text)
        if hits > best_hits:
            best_category, best_hits = category, hits
    return best_category


def analyze_sentiment(text: str) -> tuple[str, float]:
    """Simple lexicon scoring in [-1, 1] plus a positive/neutral/negative label."""
    words = text.lower().split()
    if not words:
        return "neutral", 0.0

    positive_hits = sum(1 for w in words if w.strip(".,!?") in POSITIVE_WORDS)
    negative_hits = sum(1 for w in words if w.strip(".,!?") in NEGATIVE_WORDS)
    total_hits = positive_hits + negative_hits

    if total_hits == 0:
        return "neutral", 0.0

    score = (positive_hits - negative_hits) / total_hits
    if score > 0.15:
        label = "positive"
    elif score < -0.15:
        label = "negative"
    else:
        label = "neutral"
    return label, round(score, 2)


def suggest_priority(category: str, sentiment_label: str) -> str:
    """Rule-based priority suggestion combining category and sentiment."""
    if category == "complaint" or sentiment_label == "negative":
        return "high"
    if category in {"technical", "billing"}:
        return "medium"
    return "low"


def suggest_response(ticket, kb_articles) -> str:
    """Draft an opening reply using the matched category and any relevant KB article."""
    greeting = f"Hi {ticket.customer_name.split()[0] if ticket.customer_name else 'there'},"

    match = None
    ticket_text = f"{ticket.subject} {ticket.description}".lower()
    for article in kb_articles:
        haystack = f"{article.title} {' '.join(article.keywords)}".lower()
        if any(term in ticket_text for term in haystack.split()):
            match = article
            break

    if match:
        body = (
            f"Thanks for reaching out. This looks related to \"{match.title}\" — "
            f"here's a quick summary: {match.body[:200].rstrip()}... "
            "Let us know if that resolves it or if you'd like us to dig deeper."
        )
    else:
        category_label = ticket.get_category_display() if hasattr(ticket, "get_category_display") else ticket.category
        body = (
            f"Thanks for flagging this. We've logged it under {category_label} and "
            "a member of the team will follow up shortly with next steps."
        )

    return f"{greeting}\n\n{body}\n\n— Support Team"


def chatbot_reply(message: str, kb_articles) -> dict:
    """Very small FAQ matcher: finds the KB article with the most keyword overlap."""
    message_words = set(message.lower().split())
    best_article, best_score = None, 0
    for article in kb_articles:
        haystack_words = set(f"{article.title} {' '.join(article.keywords)}".lower().split())
        score = len(message_words & haystack_words)
        if score > best_score:
            best_article, best_score = article, score

    if best_article and best_score > 0:
        return {
            "answer": best_article.body[:400],
            "source_article_id": best_article.id,
            "source_title": best_article.title,
            "confidence": min(1.0, best_score / max(len(message_words), 1)),
        }
    return {
        "answer": "I couldn't find an exact match in the knowledge base. "
        "I've created a ticket so a support agent can help you directly.",
        "source_article_id": None,
        "source_title": None,
        "confidence": 0.0,
    }
