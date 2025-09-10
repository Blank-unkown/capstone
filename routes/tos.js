const express = require("express");
const db = require("../db");
const router = express.Router();

/**
 * ------------------------
 * Save TOS (insert/update one or multiple topics)
 * ------------------------
 */
router.post("/:classId/:subjectId/tos", async (req, res) => {
  const { classId, subjectId } = req.params;
  const tos = Array.isArray(req.body) ? req.body : [req.body];

  try {
    for (const entry of tos) {
      if (entry.id) {
        // Update existing row
        await db.promise().query(
          `UPDATE tos_entries 
           SET topic_name=?, learning_competency=?, days=?, percent=?, expected_items=?,
               remembering=?, understanding=?, applying=?, analyzing=?, evaluating=?, creating=?
           WHERE id=? AND class_id=? AND subject_id=?`,
          [
            entry.topicName,
            entry.learningCompetency,
            entry.days,
            entry.percent,
            entry.expectedItems,
            entry.remembering,
            entry.understanding,
            entry.applying,
            entry.analyzing,
            entry.evaluating,
            entry.creating,
            entry.id,
            classId,
            subjectId,
          ]
        );
      } else {
        // Insert new row
        const [result] = await db.promise().query(
          `INSERT INTO tos_entries 
           (class_id, subject_id, topic_name, learning_competency, days, percent, expected_items,
            remembering, understanding, applying, analyzing, evaluating, creating)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            classId,
            subjectId,
            entry.topicName,
            entry.learningCompetency,
            entry.days,
            entry.percent,
            entry.expectedItems,
            entry.remembering,
            entry.understanding,
            entry.applying,
            entry.analyzing,
            entry.evaluating,
            entry.creating,
          ]
        );
        entry.id = result.insertId;
      }
    }

    // Return saved topics
    const savedTopics = tos.map((t) => ({
      id: t.id,
      classId: Number(classId),
      subjectId: Number(subjectId),
      topicName: t.topicName,
      learningCompetency: t.learningCompetency,
      days: t.days,
      percent: t.percent,
      expectedItems: t.expectedItems,
      remembering: t.remembering,
      understanding: t.understanding,
      applying: t.applying,
      analyzing: t.analyzing,
      evaluating: t.evaluating,
      creating: t.creating,
    }));

    res.json({ success: true, savedTopics });
  } catch (err) {
    console.error("❌ Failed to save TOS:", err);
    res.status(500).json({ error: "Failed to save TOS" });
  }
});

/**
 * ------------------------
 * Update existing TOS (batch PUT)
 * ------------------------
 */
router.put("/:classId/:subjectId/tos", async (req, res) => {
  const { classId, subjectId } = req.params;
  const tos = Array.isArray(req.body) ? req.body : [req.body];

  try {
    for (const entry of tos) {
      if (!entry.id) continue; // skip rows with no ID
      await db.promise().query(
        `UPDATE tos_entries 
         SET topic_name=?, learning_competency=?, days=?, percent=?, expected_items=?,
             remembering=?, understanding=?, applying=?, analyzing=?, evaluating=?, creating=?
         WHERE id=? AND class_id=? AND subject_id=?`,
        [
          entry.topicName,
          entry.learningCompetency,
          entry.days,
          entry.percent,
          entry.expectedItems,
          entry.remembering,
          entry.understanding,
          entry.applying,
          entry.analyzing,
          entry.evaluating,
          entry.creating,
          entry.id,
          classId,
          subjectId,
        ]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to update TOS:", err);
    res.status(500).json({ error: "Failed to update TOS" });
  }
});

/**
 * ------------------------
 * Get TOS for a subject in a class
 * ------------------------
 */
router.get("/:classId/:subjectId/tos", async (req, res) => {
  const { classId, subjectId } = req.params;
  console.log("➡️ GET TOS for classId:", classId, "subjectId:", subjectId);

  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM tos_entries WHERE class_id=? AND subject_id=? ORDER BY id ASC",
        [classId, subjectId]
      );

    let itemCounter = 1;
    const mapped = rows.map((r) => {
      const expectedItems = r.expected_items || 0;
      const startQuestion = itemCounter;
      const endQuestion = itemCounter + expectedItems - 1;

      // advance counter for next row
      itemCounter = endQuestion + 1;

      return {
        id: r.id,
        classId: r.class_id,
        subjectId: r.subject_id,
        topicName: r.topic_name,
        learningCompetency: r.learning_competency,
        days: r.days,
        percent: r.percent,
        expectedItems,
        remembering: r.remembering,
        understanding: r.understanding,
        applying: r.applying,
        analyzing: r.analyzing,
        evaluating: r.evaluating,
        creating: r.creating,
        // 🔹 New fields
        startQuestion,
        endQuestion,
        numItems: expectedItems,
      };
    });

    console.log("📌 Returning mapped TOS with ranges:", mapped);
    res.json(mapped);
  } catch (err) {
    console.error("❌ Error fetching TOS:", err);
    res.status(500).json({ error: "Failed to fetch TOS" });
  }
});

/**
 * ------------------------
 * Delete a single TOS row
 * ------------------------
 */
router.delete("/:classId/:subjectId/tos/:id", async (req, res) => {
  const { classId, subjectId, id } = req.params;
  try {
    await db
      .promise()
      .query("DELETE FROM tos_entries WHERE id=? AND class_id=? AND subject_id=?", [
        id,
        classId,
        subjectId,
      ]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete TOS entry:", err);
    res.status(500).json({ error: "Failed to delete TOS entry" });
  }
});

module.exports = router;
