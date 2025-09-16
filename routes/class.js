const express = require("express");
const router = express.Router();
const db = require("../db"); // ✅ uses pool.promise()

// CREATE Class (with user_id)
router.post("/", async (req, res) => {
  try {
    const { name, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({ message: "Class name and user_id are required" });
    }

    const [result] = await db.query(
      "INSERT INTO classes (name, user_id) VALUES (?, ?)",
      [name, user_id]
    );

    res.status(201).json({ id: result.insertId, name, user_id });
  } catch (err) {
    console.error("❌ Error creating class:", err);
    res.status(500).json({ error: "Failed to create class" });
  }
});

// READ Classes (filter by user_id)
router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    console.log("📥 Classes GET user_id =", user_id);

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const [rows] = await db.query("SELECT * FROM classes WHERE user_id = ?", [user_id]);
    console.log("✅ Classes returned:", rows);

    res.json(rows);
  } catch (err) {
    console.error("❌ DB Error in GET /classes:", err);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get single class (check user_id too)
router.get("/:id", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM classes WHERE id=? AND user_id=?",
      [req.params.id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Class not found or not owned by user" });
    }

    console.log("✅ Single class returned:", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ DB Error in GET /classes/:id:", err);
    res.status(500).json({ error: "Failed to fetch class" });
  }
});

// UPDATE Class
router.put("/:id", async (req, res) => {
  try {
    const { name, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({ message: "Class name and user_id are required" });
    }

    const [result] = await db.query(
      "UPDATE classes SET name=? WHERE id=? AND user_id=?",
      [name, req.params.id, user_id]
    );

    console.log("✅ Update result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Class not found or not owned by user" });
    }

    res.json({ id: req.params.id, name, user_id });
  } catch (err) {
    console.error("❌ DB Error in PUT /classes:", err);
    res.status(500).json({ error: "Failed to update class" });
  }
});

// DELETE Class
router.delete("/:id", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const [result] = await db.query(
      "DELETE FROM classes WHERE id=? AND user_id=?",
      [req.params.id, user_id]
    );

    console.log("✅ Delete result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Class not found or not owned by user" });
    }

    res.json({ message: "Class deleted" });
  } catch (err) {
    console.error("❌ DB Error in DELETE /classes:", err);
    res.status(500).json({ error: "Failed to delete class" });
  }
});

module.exports = router;
