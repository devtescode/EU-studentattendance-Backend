const express = require("express");
const router = express.Router();

const {
  createSchedule,
  getMySessions,
  getActiveSessions,
  updateSession,
  deleteSession,
  getCourseStudents,
} = require("../Controllers/courseschedule.controllers");

const authMiddleware = require("../middleware/auth"); // adjust path if different

// ---------------- CREATE SCHEDULE ----------------
router.post("/create", authMiddleware, createSchedule);

// ---------------- GET ALL LECTURER SESSIONS ----------------
router.get("/my-sessions", authMiddleware, getMySessions);

// ---------------- GET ACTIVE (REAL-TIME) SESSIONS ----------------
// 🔥 This is what student page should use
router.get("/active", authMiddleware, getActiveSessions);

// ---------------- UPDATE SESSION ----------------
router.put("/update/:id", authMiddleware, updateSession);

// ---------------- DELETE SESSION ----------------
router.delete("/delete/:id", authMiddleware, deleteSession);

router.get("/course/:courseId", authMiddleware, getCourseStudents);

module.exports = router;