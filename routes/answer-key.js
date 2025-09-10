const express = require("express");
const db = require("../db");
const router = express.Router();

// ✅ Save Answer Key (replace old one)
router.post("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;
  const answers = req.body; // ["A", "B", "C", ...]

  try {
    // Delete old entries
    await db
      .promise()
      .query("DELETE FROM answer_keys WHERE class_id = ? AND subject_id = ?", [
        classId,
        subjectId,
      ]);

    // Insert new ones
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i]) continue;
      await db
        .promise()
        .query(
          "INSERT INTO answer_keys (class_id, subject_id, question_number, correct_answer) VALUES (?, ?, ?, ?)",
          [classId, subjectId, i + 1, answers[i]]
        );
    }

    res.json({ success: true, message: "✅ Answer Key saved!" });
  } catch (err) {
    console.error("Error saving answer key:", err);
    res.status(500).json({ error: "Failed to save Answer Key" });
  }
});

// ✅ Get Answer Key
router.get("/:classId/:subjectId/answer-key", async (req, res) => {
  const { classId, subjectId } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT question_number, correct_answer FROM answer_keys WHERE class_id = ? AND subject_id = ? ORDER BY question_number",
        [classId, subjectId]
      );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching answer key:", err);
    res.status(500).json({ error: "Failed to fetch Answer Key" });
  }
});

module.exports = router;
