import unittest
from pathlib import Path

from interviewiq_analysis import analyze_answer, analyze_resume
from interviewiq_analysis.similarity import tfidf_similarity
from interviewiq_analysis.text_stats import basic_stats

SAMPLES = Path(__file__).resolve().parent.parent / "samples"


class TestTextStats(unittest.TestCase):
    def test_counts(self):
        s = basic_stats("I built an app. It works well!")
        self.assertEqual(s["word_count"], 7)
        self.assertEqual(s["sentence_count"], 2)

    def test_fillers(self):
        self.assertEqual(basic_stats("Um I uh think so")["filler_words"], 3)


class TestSimilarity(unittest.TestCase):
    def test_identical_and_unrelated(self):
        self.assertAlmostEqual(tfidf_similarity("python sql git", "python sql git"), 1.0, places=2)
        self.assertEqual(tfidf_similarity("python developer", "banana smoothie"), 0.0)


class TestResume(unittest.TestCase):
    def test_sample_resume(self):
        text = (SAMPLES / "sample_resume.txt").read_text()
        jd = (SAMPLES / "sample_jd.txt").read_text()
        r = analyze_resume(text, "Software Engineer", "fresher", jd)
        self.assertTrue(0 <= r["ats_score"] <= 100)
        self.assertIn("python", r["matched_keywords"])
        self.assertGreater(r["jd_similarity"], 0)

    def test_weak_resume_scores_lower(self):
        strong = analyze_resume((SAMPLES / "sample_resume.txt").read_text())
        weak = analyze_resume("I like computers.")
        self.assertLess(weak["ats_score"], strong["ats_score"])


class TestAnswer(unittest.TestCase):
    def test_sample_answer(self):
        ans = (SAMPLES / "sample_answer.txt").read_text()
        r = analyze_answer("Tell me about a project you built", ans)
        self.assertTrue(r["star_components"]["result"])
        self.assertTrue(0 <= r["overall_score"] <= 100)


if __name__ == "__main__":
    unittest.main()
