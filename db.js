// db.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "bhbum2hafd5usbolftn0-mysql.services.clever-cloud.com",
  user: "unk2qvtpipwv8j1j",
  password: "SvJhaNaVM7JvM1Kzmkx5", // Clever Cloud password
  database: "bhbum2hafd5usbolftn0",   // Clever Cloud DB name
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
    return;
  }
  console.log("✅ Connected to Clever Cloud MySQL as id " + db.threadId);
});

module.exports = db;
