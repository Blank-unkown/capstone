// routes/answer-key.js
const express = require("express");
const db = require("../db"); // promise pool
const router = express.Router();

// ✅ Save Answer Key (replace old one)
router.post("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;

  // Allow both { answers: [] } and [] directly
  let answers = [];
  if (Array.isArray(req.body)) {
    answers = req.body;
  } else if (Array.isArray(req.body.answers)) {
    answers = req.body.answers;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Delete old entries
    await conn.query(
      "DELETE FROM answer_keys WHERE class_id = ? AND subject_id = ?",
      [classId, subjectId]
    );

    // Insert new ones
    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      if (!ans) continue;
      await conn.query(
        `INSERT INTO answer_keys 
           (class_id, subject_id, question_number, correct_answer) 
         VALUES (?, ?, ?, ?)`,
        [classId, subjectId, i + 1, String(ans).toUpperCase()]
      );
    }

    await conn.commit();
    res.json({
      success: true,
      message: answers.length
        ? "✅ Answer Key saved!"
        : "✅ Answer Key cleared!",
      answers: answers.map((ans, i) => ({
        question: i + 1,
        correctAnswer: String(ans).toUpperCase(),
      })),
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error saving answer key:", err);
    res.status(500).json({ error: "Failed to save Answer Key" });
  } finally {
    conn.release();
  }
});

// ✅ Get Answer Key
router.get("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT question_number, correct_answer FROM answer_keys WHERE class_id = ? AND subject_id = ? ORDER BY question_number",
      [classId, subjectId]
    );

    // Map DB → frontend shape
    res.json(
      rows.map((r) => ({
        question: r.question_number,
        correctAnswer: r.correct_answer,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching answer key:", err);
    res.status(500).json({ error: "Failed to fetch Answer Key" });
  }
});

// ✅ Delete Answer Key
router.delete("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;

  try {
    await db.query(
      "DELETE FROM answer_keys WHERE class_id = ? AND subject_id = ?",
      [classId, subjectId]
    );
    res.json({ success: true, message: "✅ Answer Key deleted!" });
  } catch (err) {
    console.error("❌ Error deleting answer key:", err);
    res.status(500).json({ error: "Failed to delete Answer Key" });
  }
});

module.exports = router;
