const express = require("express")
const { userwelcome, getMyAttendance, getStudentAttendanceSessions } = require("../Controllers/attendance.controllers")
const router = express.Router()
const verifyStudent = require("../middleware/authstudent")


router.get("/my-attendance", verifyStudent, getMyAttendance)
router.get("/student-attendance", verifyStudent, getStudentAttendanceSessions)

module.exports = router