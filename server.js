const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
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
app.use("/subjects", subjectResultsRouter);
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
app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
