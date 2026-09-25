"""TF-IDF + cosine similarity using scikit-learn."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def tfidf_similarity(text_a: str, text_b: str) -> float:
    """Return cosine similarity (0-1) between two texts' TF-IDF vectors."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
    matrix = vec.fit_transform([text_a, text_b])
    return round(float(cosine_similarity(matrix[0], matrix[1])[0][0]), 3)


def top_terms(text: str, reference: str, n: int = 10) -> list[str]:
    """Most important terms in `text` (by TF-IDF weight vs a reference doc)."""
    if not text.strip():
        return []
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vec.fit_transform([text, reference or " "])
    names = vec.get_feature_names_out()
    row = matrix[0].toarray()[0]
    ranked = sorted(zip(names, row), key=lambda x: x[1], reverse=True)
    return [t for t, w in ranked[:n] if w > 0]
