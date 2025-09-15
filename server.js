const express = require("express");
const cors = require("cors");
const app = express();

// ✅ Explicit CORS config
app.use(cors({
  origin: ["http://localhost:8100", "https://capstone-wwbm.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Import routers
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const classesRoutes = require("./routes/class");
const subjectsRoutes = require("./routes/subject");
const tosRouter = require("./routes/tos");
const answerKeyRouter = require("./routes/answer-key");
const scanAnswersRouter = require("./routes/scanAnswers");
const scansRouter = require("./routes/scans");
const subjectResultsRouter = require("./routes/subjectResults");

// ✅ Mount routers
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/classes", classesRoutes);
app.use("/subjects", subjectsRoutes);
app.use("/subjects", tosRouter);
app.use("/subjects", answerKeyRouter);
app.use("/subjects", scansRouter);       // /subjects/:classId/:subjectId/scans
app.use("/scans", scanAnswersRouter);    // /scans/:scanId/scan-answers
app.use("/subjects", subjectResultsRouter);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
