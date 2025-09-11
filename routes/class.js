const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE Class (with user_id)
router.post("/", (req, res) => {
  const { name, user_id } = req.body; // take user_id from request body for now

  if (!name || !user_id) {
    return res.status(400).json({ message: "Class name and user_id are required" });
  }

  db.query(
    "INSERT INTO classes (name, user_id) VALUES (?, ?)",
    [name, user_id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, name, user_id });
    }
  );
});

// READ Classes (filter by user_id)
router.get("/", (req, res) => {
  const { user_id } = req.query; // expect user_id in query string for now

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  db.query(
    "SELECT * FROM classes WHERE user_id = ?",
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).send(err);
      res.json(rows);
    }
  );
});

// Get single class (check user_id too)
router.get("/:id", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  db.query(
    "SELECT * FROM classes WHERE id=? AND user_id=?",
    [req.params.id, user_id],
    (err, rows) => {
      if (err) return res.status(500).send(err);
      res.json(rows[0]);
    }
  );
});

// UPDATE Class (must match user_id)
router.put("/:id", (req, res) => {
  const { name, user_id } = req.body;

  if (!name || !user_id) {
    return res.status(400).json({ message: "Class name and user_id are required" });
  }

  db.query(
    "UPDATE classes SET name=? WHERE id=? AND user_id=?",
    [name, req.params.id, user_id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Class not found or not owned by user" });
      }
      res.json({ id: req.params.id, name, user_id });
    }
  );
});

// DELETE Class (must match user_id)
router.delete("/:id", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  db.query(
    "DELETE FROM classes WHERE id=? AND user_id=?",
    [req.params.id, user_id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Class not found or not owned by user" });
      }
      res.json({ message: "Class deleted" });
    }
  );
});

module.exports = router;
