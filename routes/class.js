const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE Class (with user_id)
router.post("/", (req, res) => {
  const { name, user_id } = req.body;

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
  const { user_id } = req.query;
  console.log("📥 Classes GET user_id =", user_id);

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  db.query(
    "SELECT * FROM classes WHERE user_id = ?",
    [user_id],
    (err, rows) => {
      if (err) {
        console.error("❌ DB Error in GET /classes:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }
      console.log("✅ Classes returned:", rows);
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
      if (err) {
        console.error("❌ DB Error in GET /classes/:id:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }
      console.log("✅ Single class returned:", rows);
      res.json(rows);
    }
  );
});

// UPDATE Class
router.put("/:id", (req, res) => {
  const { name, user_id } = req.body;

  if (!name || !user_id) {
    return res.status(400).json({ message: "Class name and user_id are required" });
  }

  db.query(
    "UPDATE classes SET name=? WHERE id=? AND user_id=?",
    [name, req.params.id, user_id],
    (err, result) => {
      if (err) {
        console.error("❌ DB Error in PUT /classes:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }
      console.log("✅ Update result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Class not found or not owned by user" });
      }
      res.json({ id: req.params.id, name, user_id });
    }
  );
});

// DELETE Class
router.delete("/:id", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  db.query(
    "DELETE FROM classes WHERE id=? AND user_id=?",
    [req.params.id, user_id],
    (err, result) => {
      if (err) {
        console.error("❌ DB Error in DELETE /classes:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }
      console.log("✅ Delete result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Class not found or not owned by user" });
      }
      res.json({ message: "Class deleted" });
    }
  );
});

module.exports = router;
