"""Interview-answer analysis: relevance (TF-IDF cosine), structure, clarity."""

from .keywords import contains
from .similarity import tfidf_similarity
from .text_stats import basic_stats

STAR_CUES = {
    "situation": ["when", "during", "at my", "in my"],
    "task": ["goal", "needed to", "responsible", "task"],
    "action": ["i built", "i decided", "i implemented", "i created", "i worked", "i used"],
    "result": ["result", "as a result", "improved", "reduced", "increased", "learned"],
}


def analyze_answer(question: str, answer: str, reference_answer: str = "") -> dict:
    stats = basic_stats(answer)
    # Relevance: compare with reference answer if given, else with the question itself.
    relevance = tfidf_similarity(answer, reference_answer or question)
    star = {part: any(contains(answer, c) for c in cues) for part, cues in STAR_CUES.items()}

    wc = stats["word_count"]
    length_score = 100 if 60 <= wc <= 250 else 60 if wc >= 30 else 20
    filler_ratio = stats["filler_words"] / max(1, wc)
    clarity = max(0, 100 - filler_ratio * 400 - max(0, stats["avg_words_per_sentence"] - 25) * 2)

    relevance_score = min(100, relevance * 100 * (1.5 if reference_answer else 2.5))
    structure_score = 25 * sum(star.values())
    overall = round(0.45 * relevance_score + 0.2 * structure_score + 0.2 * clarity + 0.15 * length_score)

    tips = []
    if wc < 40:
        tips.append("Answer is short - aim for 60-200 words with an example.")
    if not star["result"]:
        tips.append("End with a result or what you learned (STAR method).")
    if stats["filler_words"] > 2:
        tips.append(f"Reduce filler words ({stats['filler_words']} found).")
    if relevance_score < 40:
        tips.append("Stay closer to the question - reuse its key terms.")

    return {
        "overall_score": overall,
        "relevance_similarity": relevance,
        "scores": {
            "relevance": round(relevance_score),
            "structure": structure_score,
            "clarity": round(clarity),
            "length": length_score,
        },
        "star_components": star,
        "text_stats": stats,
        "tips": tips,
    }
