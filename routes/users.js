const express = require("express");
const router = express.Router();
const db = require("../db"); // ✅ uses pool.promise()
const bcrypt = require("bcrypt");

// CREATE (Add user)
router.post("/", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hash]
    );

    res.status(201).json({ id: result.insertId, username, email });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// READ (Get all users)
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT id, username, email FROM users");
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// UPDATE (Edit user by id)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    await db.query(
      "UPDATE users SET username=?, email=? WHERE id=?",
      [username, email, id]
    );

    res.json({ id, username, email });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE (Remove user by id)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id=?", [id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
