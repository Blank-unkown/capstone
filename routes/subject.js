const express = require("express");
const router = express.Router();
const db = require("../db"); // ✅ uses pool.promise()

// CREATE Subject
router.post("/", async (req, res) => {
  try {
    const { name, class_id } = req.body;

    if (!name || !class_id) {
      return res.status(400).json({ message: "Subject name and class_id are required" });
    }

    const [result] = await db.query(
      "INSERT INTO subjects (name, class_id) VALUES (?, ?)",
      [name, class_id]
    );

    res.status(201).json({ id: result.insertId, name, class_id });
  } catch (err) {
    console.error("❌ Error creating subject:", err);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

// READ all subjects (with class names)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.class_id, c.name AS class_name
       FROM subjects s
       JOIN classes c ON s.class_id = c.id`
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ DB Error in GET /subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// READ subjects by class (with user_id check)
router.get("/class/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const [rows] = await db.query(
      `SELECT s.*
       FROM subjects s
       JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = ? AND c.user_id = ?`,
      [classId, user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ DB Error in GET /subjects/class/:classId:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// UPDATE Subject (name + optional class_id)
router.put("/:id", async (req, res) => {
  try {
    const { name, class_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    let query, params;
    if (class_id) {
      query = "UPDATE subjects SET name=?, class_id=? WHERE id=?";
      params = [name, class_id, req.params.id];
    } else {
      query = "UPDATE subjects SET name=? WHERE id=?";
      params = [name, req.params.id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({ message: "Subject updated" });
  } catch (err) {
    console.error("❌ DB Error in PUT /subjects/:id:", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
});

// DELETE Subject
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM subjects WHERE id=?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({ message: "Subject deleted" });
  } catch (err) {
    console.error("❌ DB Error in DELETE /subjects/:id:", err);
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

// Get single subject by class + subject ID
router.get("/:classId/:subjectId", async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM subjects WHERE class_id=? AND id=?",
      [classId, subjectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ DB Error in GET /subjects/:classId/:subjectId:", err);
    res.status(500).json({ error: "Failed to fetch subject" });
  }
});

module.exports = router;
