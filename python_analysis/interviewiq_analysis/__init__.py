"""InterviewIQ Python analysis module.

An offline, independent NLP toolkit that analyzes resume text and
interview-answer text. It complements (does not replace) the web app,
which uses React + TypeScript, Lovable Cloud and Gemini AI.
"""

from .resume_analyzer import analyze_resume
from .answer_analyzer import analyze_answer

__all__ = ["analyze_resume", "analyze_answer"]
