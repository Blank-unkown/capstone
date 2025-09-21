// routes/scans.js
const express = require("express");
const db = require("../db"); // ✅ promise pool
const router = express.Router();
//const multer = require("multer");

// 📂 Setup multer for in-memory file storage
//const storage = multer.memoryStorage();
//const upload = multer({ storage });

/**
 * 📌 Create a scan AND save all answers in one flow.
 * Body:
 * {
 *   header_image?: string,
 *   full_image?: string,
 *   answers: [{ question_number: number, marked?: 'A'|'B'|'C'|'D'|null }]
 * }
 */

/**
 * 📌 Create a scan (JSON body with base64 images + answers array)
 */
router.post("/:classId/:subjectId/scans", async (req, res) => {
  const { classId, subjectId } = req.params;
  const { header_image, full_image, answers } = req.body;

  let parsedAnswers;
  try {
    parsedAnswers = Array.isArray(answers) ? answers : JSON.parse(answers || "[]");
  } catch {
    return res.status(400).json({ error: "answers must be valid JSON" });
  }

  if (!Array.isArray(parsedAnswers)) {
    return res.status(400).json({ error: "answers[] is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insert scan (score/total start at 0)
    const [scanResult] = await conn.query(
      `INSERT INTO scans (class_id, subject_id, header_image, full_image, score, total, timestamp)
       VALUES (?, ?, ?, ?, 0, 0, NOW())`,
      [classId, subjectId, header_image, full_image]
    );
    const scanId = scanResult.insertId;

    // 2) Load official answer key
    const [keyRows] = await conn.query(
      `SELECT question_number, correct_answer
       FROM answer_keys
       WHERE class_id = ? AND subject_id = ?
       ORDER BY question_number ASC`,
      [classId, subjectId]
    );
    if (!keyRows.length) {
      throw new Error("No answer key found for this class/subject.");
    }

    // 3) Index marked answers
    const markedMap = new Map();
    for (const a of parsedAnswers) {
      if (!a || typeof a.question_number !== "number") continue;
      markedMap.set(a.question_number, a.marked ? a.marked.toUpperCase() : null);
    }

    // 4) Insert answers + compute score
    let computedScore = 0;
    let total = keyRows.length;

    for (const k of keyRows) {
      const qn = k.question_number;
      const correctAns = k.correct_answer ? k.correct_answer.toUpperCase() : null;
      const marked = markedMap.get(qn) || null;
      const isCorrect = marked && correctAns && marked === correctAns ? 1 : 0;

      await conn.query(
        `INSERT INTO scan_answers (scan_id, question_number, marked, correct_answer, correct)
         VALUES (?, ?, ?, ?, ?)`,
        [scanId, qn, marked, correctAns, isCorrect]
      );

      computedScore += isCorrect;
    }

    // 5) Update scan with score/total
    await conn.query(
      `UPDATE scans SET score = ?, total = ? WHERE id = ?`,
      [computedScore, total, scanId]
    );

    await conn.commit();
    res.json({ message: "✅ Scan saved", scanId, score: computedScore, total });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error saving scan:", err);
    res.status(500).json({ error: "Failed to save scan", details: err.message });
  } finally {
    conn.release();
  }
});
/**
 * 📌 Get all scans for a subject/class
 */
router.get("/:classId/:subjectId/scans", async (req, res) => {
  const { classId, subjectId } = req.params;
  try {
    const [scans] = await db.query(
      "SELECT * FROM scans WHERE class_id = ? AND subject_id = ? ORDER BY timestamp DESC",
      [classId, subjectId]
    );

    const normalized = scans.map(s => ({
      id: s.id,
      headerImage: s.header_image,
      fullImage: s.full_image,
      score: s.score,
      total: s.total,
      subjectId: s.subject_id,
      classId: s.class_id,
      timestamp: s.timestamp
    }));

    res.json(normalized);
  } catch (err) {
    console.error("❌ Error fetching scans:", err);
    res.status(500).json({ error: "Failed to fetch scans", details: err.message });
  }
});

/**
 * 📌 Get full scan details (scan + answers joined with answer_keys)
 */
router.get("/:classId/:subjectId/scans/:scanId", async (req, res) => {
  const { scanId, classId, subjectId } = req.params;
  try {
    const [[scan]] = await db.query(
      "SELECT * FROM scans WHERE id = ? AND class_id = ? AND subject_id = ?",
      [scanId, classId, subjectId]
    );
    if (!scan) return res.status(404).json({ error: "Scan not found" });

    const [scanAnswers] = await db.query(
      `SELECT 
         ak.question_number,
         ak.correct_answer,
         sa.marked,
         (CASE WHEN sa.marked = ak.correct_answer THEN 1 ELSE 0 END) AS correct
       FROM answer_keys ak
       LEFT JOIN scan_answers sa
         ON sa.scan_id = ? AND sa.question_number = ak.question_number
       WHERE ak.class_id = ? AND ak.subject_id = ?
       ORDER BY ak.question_number ASC`,
      [scanId, classId, subjectId]
    );

    const normalizedAnswers = scanAnswers.map(a => ({
      question: a.question_number,
      marked: a.marked,
      correctAnswer: a.correct_answer,
      correct: !!a.correct
    }));

    res.json({
      id: scan.id,
      headerImage: scan.header_image,
      fullImage: scan.full_image,
      score: scan.score,
      total: scan.total,
      subjectId: scan.subject_id,
      classId: scan.class_id,
      timestamp: scan.timestamp,
      answers: normalizedAnswers
    });
  } catch (err) {
    console.error("❌ Error fetching scan details:", err);
    res.status(500).json({ error: "Failed to fetch scan details", details: err.message });
  }
});
module.exports = router;