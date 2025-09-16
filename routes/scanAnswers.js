// routes/scanAnswers.js
const express = require("express");
const db = require("../db");
const router = express.Router({ mergeParams: true });

/**
 * 📌 Save scanned answers for a scan (legacy/optional).
 * Request body: { answers: [{ question_number, marked }] }
 * We derive correct answers from answer_keys and recompute score/total.
 */
router.post("/:scanId/scan-answers", async (req, res) => {
  const { scanId } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: "answers[] are required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Find class/subject from the scan record
    const [[scan]] = await conn.query(
      `SELECT class_id, subject_id FROM scans WHERE id = ?`,
      [scanId]
    );
    if (!scan) {
      throw new Error("Scan not found.");
    }

    // ✅ Load answer key
    const [keyRows] = await conn.query(
      `SELECT question_number, correct_answer
         FROM answer_keys
        WHERE class_id = ? AND subject_id = ?
        ORDER BY question_number`,
      [scan.class_id, scan.subject_id]
    );
    if (!keyRows.length) {
      throw new Error("No answer key found.");
    }

    // ✅ Clear old answers
    await conn.query(`DELETE FROM scan_answers WHERE scan_id = ?`, [scanId]);

    // ✅ Index marked answers
    const markedMap = new Map();
    for (const a of answers) {
      if (!a || typeof a.question_number !== "number") continue;
      markedMap.set(a.question_number, a.marked ?? null);
    }

    // ✅ Insert full set
    let score = 0;
    let total = 0;

    for (const k of keyRows) {
      const qn = k.question_number;
      const correctAns = k.correct_answer || null;
      const marked = markedMap.has(qn) ? markedMap.get(qn) : null;

      const isCorrect =
        marked && correctAns &&
        String(marked).toUpperCase() === String(correctAns).toUpperCase()
          ? 1
          : 0;

      await conn.query(
        `INSERT INTO scan_answers (scan_id, question_number, marked, correct_answer, correct)
         VALUES (?, ?, ?, ?, ?)`,
        [scanId, qn, marked, correctAns, isCorrect]
      );

      total += 1;
      score += isCorrect;
    }

    // ✅ Update scan record
    await conn.query(
      `UPDATE scans SET score = ?, total = ? WHERE id = ?`,
      [score, total, scanId]
    );

    await conn.commit();
    res.json({ message: "✅ Scanned answers saved", scanId, score, total });
  } catch (error) {
    await conn.rollback();
    console.error("❌ Error saving scanned answers:", error);
    res.status(500).json({ message: "Failed to save scanned answers" });
  } finally {
    conn.release();
  }
});

/**
 * 📌 Get all scanned answers for a specific scan
 */
router.get("/:scanId/scan-answers", async (req, res) => {
  const { scanId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT id, scan_id, question_number, marked, correct_answer, correct
         FROM scan_answers
        WHERE scan_id = ?
        ORDER BY question_number`,
      [scanId]
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching scanned answers:", error);
    res.status(500).json({ message: "Failed to fetch scanned answers" });
  }
});

module.exports = router;
