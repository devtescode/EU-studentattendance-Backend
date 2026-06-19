const express = require("express")
const { userwelcome, getMyAttendance, getStudentAttendanceSessions, markAttendance } = require("../Controllers/attendance.controllers")
const router = express.Router()
const verifyStudent = require("../middleware/authstudent")


router.get("/my-attendance", verifyStudent, getMyAttendance)
router.get("/student-attendance", verifyStudent, getStudentAttendanceSessions)
router.post("/mark", verifyStudent, markAttendance)

module.exports = router