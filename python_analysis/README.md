# InterviewIQ – Python Analysis Module

An **independent, offline** Python NLP module that analyzes resumes and interview answers.
It sits alongside the main app (React + TypeScript + Vite, Lovable Cloud / PostgreSQL,
TypeScript Edge Functions, Gemini AI). It does **not** replace or run inside the web app —
it is a transparent, rule-based + TF-IDF baseline you can run locally and compare with the AI scores.

## Structure
```
python_analysis/
├── requirements.txt
├── interviewiq_analysis/
│   ├── __init__.py
│   ├── __main__.py         # CLI
│   ├── text_stats.py       # word/sentence stats, Flesch readability, filler words
│   ├── keywords.py         # role + Fresher/Mid/Senior keyword lists, matching
│   ├── similarity.py       # TF-IDF + cosine similarity (scikit-learn)
│   ├── resume_analyzer.py  # ATS-style weighted score + suggestions
│   └── answer_analyzer.py  # relevance, STAR structure, clarity score
├── samples/                # sample resume, job description, answer
└── tests/test_analysis.py  # unittest suite
```

## Setup & run
```bash
cd python_analysis
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Resume (txt or pdf), optional job description
python -m interviewiq_analysis resume samples/sample_resume.txt --role "Software Engineer" --level fresher --jd samples/sample_jd.txt

# Interview answer
python -m interviewiq_analysis answer --question "Tell me about a project you built" --answer-file samples/sample_answer.txt

# Tests
python -m unittest discover -s tests -v
```

## ATS score formula
| Component | Weight |
|---|---|
| Keyword match % (role + level) | 40% |
| Sections present | 20% |
| Action verbs | 15% |
| Contact + quantified results | 15% |
| Length (250–900 words ideal) | 10% |

If a job description is given, the above are scaled to 80% and TF-IDF cosine similarity
with the JD contributes the remaining 20%.

## Answer score
`0.45 × relevance (TF-IDF cosine vs question/reference) + 0.20 × STAR structure + 0.20 × clarity (fillers, sentence length) + 0.15 × length`.

These are heuristic scores for comparison/explainability, not hiring decisions.
