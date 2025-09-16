const express = require("express");
const db = require("../db"); // already exports promise pool
const router = express.Router();

// ✅ Save Answer Key (replace old one)
router.post("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;
  const answers = Array.isArray(req.body) ? req.body : [];

  try {
    // Delete old entries
    await db.query(
      "DELETE FROM answer_keys WHERE class_id = ? AND subject_id = ?",
      [classId, subjectId]
    );

    // Insert new ones
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i]) continue;
      await db.query(
        "INSERT INTO answer_keys (class_id, subject_id, question_number, correct_answer) VALUES (?, ?, ?, ?)",
        [classId, subjectId, i + 1, answers[i].toUpperCase()]
      );
    }

    res.json({
      success: true,
      message: answers.length
        ? "✅ Answer Key saved!"
        : "✅ Answer Key cleared!",
      answers: answers.map((ans, i) => ({
        questionNumber: i + 1,
        correctAnswer: ans,
      })),
    });
  } catch (err) {
    console.error("❌ Error saving answer key:", err);
    res.status(500).json({ error: "Failed to save Answer Key" });
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

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching answer key:", err);
    res.status(500).json({ error: "Failed to fetch Answer Key" });
  }
});

// (Optional) ✅ Delete Answer Key
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
