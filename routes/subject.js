const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE Subject
router.post("/", (req, res) => {
  const { name, class_id } = req.body;
  db.query("INSERT INTO subjects (name, class_id) VALUES (?, ?)", [name, class_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, name, class_id });
  });
});

// READ all subjects
router.get("/", (req, res) => {
  db.query(
    "SELECT subjects.id, subjects.name, subjects.class_id, classes.name AS class_name FROM subjects JOIN classes ON subjects.class_id = classes.id",
    (err, rows) => {
      if (err) return res.status(500).send(err);
      res.json(rows);
    }
  );
});

// ✅ READ subjects by class
router.get("/class/:classId", (req, res) => {
  const { classId } = req.params;
  db.query("SELECT * FROM subjects WHERE class_id = ?", [classId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// UPDATE Subject (name + optional class_id)
router.put("/:id", (req, res) => {
  const { name, class_id } = req.body;
  if (class_id) {
    db.query("UPDATE subjects SET name=?, class_id=? WHERE id=?", [name, class_id, req.params.id], (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Subject updated" });
    });
  } else {
    db.query("UPDATE subjects SET name=? WHERE id=?", [name, req.params.id], (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Subject updated" });
    });
  }
});

// DELETE Subject
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM subjects WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Subject deleted" });
  });
});

// In routes/subjects.js
router.get("/:classId/:subjectId", (req, res) => {
  db.query(
    "SELECT * FROM subjects WHERE class_id=? AND id=?",
    [req.params.classId, req.params.subjectId],
    (err, rows) => {
      if (err) return res.status(500).send(err);
      res.json(rows[0]);
    }
  );
});

module.exports = router;