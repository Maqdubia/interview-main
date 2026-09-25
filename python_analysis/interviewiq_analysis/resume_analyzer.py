"""Rule-based + TF-IDF ATS-style resume analysis."""

import re

from .keywords import ACTION_VERBS, SECTIONS, contains, keywords_for, match_keywords
from .similarity import tfidf_similarity, top_terms
from .text_stats import basic_stats


def analyze_resume(resume_text: str, role: str = "Software Engineer",
                   level: str = "fresher", job_description: str = "") -> dict:
    stats = basic_stats(resume_text)
    matched, missing = match_keywords(resume_text, keywords_for(role, level))
    keyword_pct = round(100 * len(matched) / max(1, len(matched) + len(missing)), 1)

    sections_found = [s for s in SECTIONS if contains(resume_text, s)]
    verbs_found = [v for v in ACTION_VERBS if contains(resume_text, v)]
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", resume_text))
    has_numbers = len(re.findall(r"\d+%|\d+\+?", resume_text)) >= 3  # quantified achievements

    jd_similarity = tfidf_similarity(resume_text, job_description) if job_description else None

    # Weighted ATS-style score (0-100). Weights are transparent on purpose.
    wc = stats["word_count"]
    length_score = 100 if 250 <= wc <= 900 else 60 if wc >= 120 else 30
    parts = {
        "keywords": (keyword_pct, 0.40),
        "sections": (100 * len(sections_found) / len(SECTIONS), 0.20),
        "action_verbs": (min(100, len(verbs_found) * 20), 0.15),
        "length": (length_score, 0.10),
        "contact_and_metrics": ((50 if has_email else 0) + (50 if has_numbers else 0), 0.15),
    }
    if jd_similarity is not None:  # blend in job-description similarity when available
        parts = {k: (v, w * 0.8) for k, (v, w) in parts.items()}
        parts["jd_similarity"] = (jd_similarity * 100, 0.20)
    ats_score = round(sum(v * w for v, w in parts.values()))

    suggestions = []
    if missing:
        suggestions.append(f"Add relevant keywords if true for you: {', '.join(missing[:5])}.")
    for s in ["education", "projects", "skills"]:
        if s not in sections_found:
            suggestions.append(f"Add a clear '{s.title()}' section heading.")
    if len(verbs_found) < 3:
        suggestions.append("Start bullet points with action verbs (built, developed, improved).")
    if not has_numbers:
        suggestions.append("Quantify results (e.g. 'reduced load time by 30%').")
    if not has_email:
        suggestions.append("Include a professional email address.")

    return {
        "role": role,
        "level": level,
        "ats_score": ats_score,
        "keyword_match_percent": keyword_pct,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "sections_found": sections_found,
        "action_verbs_found": verbs_found,
        "jd_similarity": jd_similarity,
        "top_terms": top_terms(resume_text, job_description),
        "score_breakdown": {k: round(v, 1) for k, (v, _) in parts.items()},
        "text_stats": stats,
        "suggestions": suggestions,
    }
