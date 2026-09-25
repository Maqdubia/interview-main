"""Basic text statistics and readability (pure Python)."""

import re

WORD_RE = re.compile(r"[A-Za-z][A-Za-z+#.\-]*")
SENTENCE_RE = re.compile(r"[.!?]+(?:\s|$)")

# Same filler words the web app counts in src/lib/audio.ts
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "so"]


def words(text: str) -> list[str]:
    return WORD_RE.findall(text)


def sentence_count(text: str) -> int:
    parts = [p for p in SENTENCE_RE.split(text.strip()) if p.strip()]
    return max(1, len(parts))


def count_syllables(word: str) -> int:
    """Simple vowel-group heuristic used by most readability formulas."""
    w = word.lower().strip(".")
    groups = re.findall(r"[aeiouy]+", w)
    n = len(groups)
    if w.endswith("e") and n > 1:
        n -= 1
    return max(1, n)


def flesch_reading_ease(text: str) -> float:
    """Flesch Reading Ease: higher = easier (60-70 is plain English)."""
    ws = words(text)
    if not ws:
        return 0.0
    syllables = sum(count_syllables(w) for w in ws)
    score = 206.835 - 1.015 * (len(ws) / sentence_count(text)) - 84.6 * (syllables / len(ws))
    return round(score, 1)


def filler_count(text: str) -> int:
    lower = " " + text.lower() + " "
    return sum(len(re.findall(r"\b" + re.escape(f) + r"\b", lower)) for f in FILLER_WORDS)


def basic_stats(text: str) -> dict:
    ws = words(text)
    sc = sentence_count(text)
    unique = {w.lower() for w in ws}
    return {
        "characters": len(text),
        "word_count": len(ws),
        "sentence_count": sc,
        "avg_words_per_sentence": round(len(ws) / sc, 1) if ws else 0,
        "unique_words": len(unique),
        "lexical_diversity": round(len(unique) / len(ws), 2) if ws else 0,
        "flesch_reading_ease": flesch_reading_ease(text),
        "filler_words": filler_count(text),
    }
