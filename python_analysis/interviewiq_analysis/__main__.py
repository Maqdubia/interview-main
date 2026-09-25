"""Command-line interface.

Examples:
  python -m interviewiq_analysis resume samples/sample_resume.txt --role "Software Engineer" --level fresher
  python -m interviewiq_analysis resume my_resume.pdf --jd samples/sample_jd.txt
  python -m interviewiq_analysis answer --question "Tell me about a project" --answer-file samples/sample_answer.txt
"""

import argparse
import json
from pathlib import Path

from .answer_analyzer import analyze_answer
from .resume_analyzer import analyze_resume


def read_text(path: str) -> str:
    p = Path(path)
    if p.suffix.lower() == ".pdf":
        import pdfplumber  # only needed for PDFs
        with pdfplumber.open(p) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    return p.read_text(encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(prog="interviewiq_analysis")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("resume", help="Analyze a resume (.txt or .pdf)")
    r.add_argument("file")
    r.add_argument("--role", default="Software Engineer")
    r.add_argument("--level", default="fresher", choices=["fresher", "mid", "senior"])
    r.add_argument("--jd", help="Optional job description .txt file")

    a = sub.add_parser("answer", help="Analyze an interview answer")
    a.add_argument("--question", required=True)
    a.add_argument("--answer-file", required=True)
    a.add_argument("--reference-file", help="Optional ideal answer .txt")

    args = ap.parse_args()
    if args.cmd == "resume":
        jd = read_text(args.jd) if args.jd else ""
        result = analyze_resume(read_text(args.file), args.role, args.level, jd)
    else:
        ref = read_text(args.reference_file) if args.reference_file else ""
        result = analyze_answer(args.question, read_text(args.answer_file), ref)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
