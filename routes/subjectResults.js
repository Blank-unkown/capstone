// routes/subjectResults.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// ✅ Get aggregated results for a subject
router.get("/:classId/:subjectId/results", async (req, res) => {
  const { classId, subjectId } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  try {
    // ✅ Ensure subject belongs to this user
    const [check] = await db.query(
      `SELECT s.id 
         FROM subjects s 
         JOIN classes c ON s.class_id = c.id
        WHERE s.id = ? AND s.class_id = ? AND c.user_id = ?`,
      [subjectId, classId, user_id]
    );

    if (!check.length) {
      return res.status(404).json({ message: "Subject not found or not owned by user" });
    }

    // ✅ 1. Get all scans for this subject
    const [scans] = await db.query(
      `SELECT * FROM scans WHERE class_id = ? AND subject_id = ?`,
      [classId, subjectId]
    );

    if (!scans.length) {
      return res.json({
        results: [],
        meanPercentage: 0,
        answerDist: { A: 0, B: 0, C: 0, D: 0 },
        cognitive: {},
        competency: {}
      });
    }

    // ✅ 2. Get all answers joined with scans
    const [answers] = await db.query(
      `SELECT sa.*, s.id AS scan_id 
         FROM scan_answers sa 
         JOIN scans s ON s.id = sa.scan_id 
        WHERE s.class_id = ? AND s.subject_id = ?`,
      [classId, subjectId]
    );

    // ✅ 3. Build results per scan
    const results = scans.map(s => {
      const ans = answers
        .filter(a => a.scan_id === s.id)
        .map(a => ({
          question: a.question_number,
          marked: a.marked,
          correctAnswer: a.correct_answer,
          correct: !!a.correct,
          topic: a.topic,
          competency: a.competency,
          level: a.level,
        }));

      // Answer distribution for this scan
      const dist = { A: 0, B: 0, C: 0, D: 0 };
      ans.forEach(a => { if (a.marked) dist[a.marked]++; });

      // Cognitive breakdown for this scan
      const cog = {};
      ans.forEach(a => {
        const lvl = a.level || "N/A";
        if (!cog[lvl]) cog[lvl] = { correct: 0, total: 0 };
        cog[lvl].total++;
        if (a.correct) cog[lvl].correct++;
      });

      return {
        id: s.id,
        headerImage: s.header_image,
        fullImage: s.full_image,
        score: s.score,
        total: s.total,
        subjectId: s.subject_id,
        classId: s.class_id,
        timestamp: s.timestamp,
        answers: ans,
        answerDistribution: dist,
        cognitiveBreakdown: cog,
      };
    });

    // ✅ 4. Compute subject-level aggregates
    const meanPercentage =
      results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / results.length;

    const answerDist = { A: 0, B: 0, C: 0, D: 0 };
    const cognitive = {};

    results.forEach(r => {
      // merge answer distribution
      Object.keys(r.answerDistribution).forEach(k => {
        answerDist[k] += r.answerDistribution[k];
      });

      // merge cognitive breakdown
      Object.entries(r.cognitiveBreakdown).forEach(([lvl, val]) => {
        if (!cognitive[lvl]) cognitive[lvl] = { correct: 0, total: 0 };
        cognitive[lvl].correct += val.correct;
        cognitive[lvl].total += val.total;
      });
    });

    // TODO: hook in TOS for competency breakdown if needed
    res.json({ results, meanPercentage, answerDist, cognitive });
  } catch (err) {
    console.error("❌ Error loading subject results:", err);
    res.status(500).json({ error: "Failed to load results", details: err.message });
  }
});

module.exports = router;
