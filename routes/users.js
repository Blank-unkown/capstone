const express = require("express");
const router = express.Router();
const db = require("../db");

const bcrypt = require("bcrypt");

// CREATE (Add user)
router.post("/", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).send(err);

    db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hash],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ id: result.insertId, username, email });
      }
    );
  });
});

// READ (Get all users)
router.get("/", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// UPDATE (Edit user by id)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  db.query("UPDATE users SET username=?, email=? WHERE id=?", [username, email, id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ id, username, email });
  });
});

// DELETE (Remove user by id)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id=?", [id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "User deleted" });
  });
});

module.exports = router;
