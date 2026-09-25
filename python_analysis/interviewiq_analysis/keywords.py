"""Keyword dictionaries and matching for ATS-style checks.

Levels mirror the app's Fresher / Mid / Senior selector.
"""

import re

ROLE_KEYWORDS = {
    "software engineer": ["python", "java", "javascript", "typescript", "react", "sql", "git",
                          "data structures", "algorithms", "api", "rest", "testing", "oop", "html", "css"],
    "data analyst": ["python", "sql", "excel", "pandas", "numpy", "tableau", "power bi",
                     "statistics", "data cleaning", "visualization", "dashboard"],
    "frontend developer": ["html", "css", "javascript", "typescript", "react", "tailwind",
                           "responsive", "git", "api", "accessibility"],
}

LEVEL_KEYWORDS = {
    "fresher": ["project", "internship", "hackathon", "certification", "coursework", "b.tech", "degree"],
    "mid": ["production", "deployed", "ownership", "ci/cd", "docker", "code review"],
    "senior": ["architecture", "mentored", "led", "scalability", "system design", "stakeholders"],
}

SECTIONS = ["education", "experience", "projects", "skills", "certifications", "summary", "contact"]
ACTION_VERBS = ["built", "developed", "designed", "implemented", "created", "led", "improved",
                "optimized", "analyzed", "deployed", "automated", "managed"]


def contains(text: str, term: str) -> bool:
    return re.search(r"(?<![a-z])" + re.escape(term.lower()) + r"(?![a-z])", text.lower()) is not None


def match_keywords(text: str, keywords: list[str]) -> tuple[list[str], list[str]]:
    matched = [k for k in keywords if contains(text, k)]
    missing = [k for k in keywords if k not in matched]
    return matched, missing


def keywords_for(role: str, level: str) -> list[str]:
    base = ROLE_KEYWORDS.get(role.lower().strip(), ROLE_KEYWORDS["software engineer"])
    return base + LEVEL_KEYWORDS.get(level.lower(), LEVEL_KEYWORDS["fresher"])
