const express = require("express");
const router = express.Router();
const db = require("../db"); // if you have a separate db.js, otherwise use connection from server.js

// CREATE Class
router.post("/", (req, res) => {
  const { name } = req.body;
  db.query("INSERT INTO classes (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, name });
  });
});

// READ Classes
router.get("/", (req, res) => {
  db.query("SELECT * FROM classes", (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// Get single class
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM classes WHERE id=?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows[0]);
  });
});

// UPDATE Class
router.put("/:id", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Class name is required" });
  }

  db.query(
    "UPDATE classes SET name=? WHERE id=?",
    [name, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ id: req.params.id, name }); // return updated class object
    }
  );
});

// DELETE Class
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM classes WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Class deleted" });
  });
});

module.exports = router;
