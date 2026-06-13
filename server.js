require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const membersRoutes = require("./routes/members");
const trainersRoutes = require("./routes/trainers");
const workoutPlansRoutes = require("./routes/workoutPlans");
const workoutDaysRoutes = require("./routes/workoutDays");
const dietPlansRoutes = require("./routes/dietPlans");
const mealsRoutes = require("./routes/meals");
const attendanceRoutes = require("./routes/attendance");
const sessionsRoutes = require("./routes/sessions");
const sessionNotesRoutes = require("./routes/sessionNotes");
const progressRoutes = require("./routes/progress");
const paymentsRoutes = require("./routes/payments");
const announcementsRoutes = require("./routes/announcements");
const plansRoutes = require("./routes/plans");
const branchesRoutes = require("./routes/branches");
const expensesRoutes = require("./routes/expenses");
const leadsRoutes = require("./routes/leads");
const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://kmarks-gym-dashboard.vercel.app'
  ],
  credentials: true
}));
app.use(express.json()); // Parse JSON request bodies

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/trainers", trainersRoutes);
app.use("/api/workout-plans", workoutPlansRoutes);
app.use("/api/workout-days", workoutDaysRoutes);
app.use("/api/diet-plans", dietPlansRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/session-notes", sessionNotesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/leads", leadsRoutes);
// ─── Health check ────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "K Mark's Gym API is running 🏋️" });
});

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏋️  K Mark's Gym server listening on port ${PORT}`);
});
