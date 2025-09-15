// routes/scans.js
const express = require("express");
const db = require("../db");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
// 📂 Setup multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
 * 📌 Create a scan (with uploaded images + answers)
 */
router.post("/:classId/:subjectId/scans",upload.fields([{ name: "header" }, { name: "sheet" }]),
  async (req, res) => {
    const { classId, subjectId } = req.params;

    // ✅ Images from FormData
    const headerFile = req.files["header"]?.[0];
    const sheetFile = req.files["sheet"]?.[0];

    const header_image = headerFile
      ? `data:${headerFile.mimetype};base64,${headerFile.buffer.toString("base64")}`
      : null;
    const full_image = sheetFile
      ? `data:${sheetFile.mimetype};base64,${sheetFile.buffer.toString("base64")}`
      : null;

    // ✅ Metadata
    const { score, answers } = req.body;

    let parsedAnswers;
    try {
      parsedAnswers = JSON.parse(answers || "[]");
    } catch {
      return res.status(400).json({ error: "answers must be valid JSON" });
    }

    if (!Array.isArray(parsedAnswers)) {
      return res.status(400).json({ error: "answers[] is required" });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Insert scan metadata
      const [scanResult] = await conn.query(
        `INSERT INTO scans (class_id, subject_id, header_image, full_image, score, total, timestamp)
         VALUES (?, ?, ?, ?, 0, 0, NOW())`,
        [classId, subjectId, header_image, full_image]
      );
      const scanId = scanResult.insertId;

      // 2) Load the official answer key
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
        markedMap.set(a.question_number, a.marked ?? null);
      }

      // 4) Insert answers
      let computedScore = 0;
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
        computedScore += isCorrect;
      }

      // 5) Update scan with score/total
      await conn.query(
        `UPDATE scans SET score = ?, total = ? WHERE id = ?`,
        [computedScore, total, scanId]
      );

      await conn.commit();
      return res.json({ message: "✅ Scan saved", scanId, score: computedScore, total });
    } catch (err) {
      await conn.rollback();
      console.error("❌ Error saving scan:", err);
      return res.status(500).json({ error: "Failed to save scan" });
    } finally {
      conn.release();
    }
  });
/**
 * 📌 Get all scans for a subject/class with recomputed score/total
 */
router.get("/:classId/:subjectId/scans", async (req, res) => {
  const { classId, subjectId } = req.params;

  try {
    // ✅ Get scans
    const [scans] = await db.promise().query(
      "SELECT * FROM scans WHERE class_id = ? AND subject_id = ?",
      [classId, subjectId]
    );

    if (scans.length === 0) {
      return res.json([]);
    }

    // ✅ Get answer_keys once (to know total questions)
    const [answerKeys] = await db.promise().query(
      "SELECT question_number, correct_answer FROM answer_keys WHERE class_id = ? AND subject_id = ?",
      [classId, subjectId]
    );

    const total = answerKeys.length; // expected total per scan

    // ✅ Attach computed score/total to each scan
    for (let scan of scans) {
      const [scanAnswers] = await db.promise().query(
        `SELECT 
           ak.question_number,
           ak.correct_answer,
           sa.marked,
           (CASE WHEN sa.marked = ak.correct_answer THEN 1 ELSE 0 END) AS correct
         FROM answer_keys ak
         LEFT JOIN scan_answers sa 
           ON sa.scan_id = ? AND sa.question_number = ak.question_number
         WHERE ak.class_id = ? AND ak.subject_id = ?`,
        [scan.id, classId, subjectId]
      );

      scan.score = scanAnswers.filter(a => a.correct === 1).length;
      scan.total = total;
    }

    res.json(scans);
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
    // ✅ Get scan info
    const [[scan]] = await db.promise().query(
      "SELECT * FROM scans WHERE id = ? AND class_id = ? AND subject_id = ?",
      [scanId, classId, subjectId]
    );

    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    // ✅ Get answers joined with answer_keys
    const [scanAnswers] = await db.promise().query(
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

    // ✅ Compute score and total based on answer_keys
    const total = scanAnswers.length;
    const score = scanAnswers.filter(a => a.correct === 1).length;

    // ✅ Return full object
    res.json({ ...scan, score, total, scanAnswers });
  } catch (err) {
    console.error("❌ Error fetching scan details:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch scan details", details: err.message });
  }
});


module.exports = router;
