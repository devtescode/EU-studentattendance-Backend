const express = require("express")
const { createLecturer, getLecturers, loginLecturer, getLecturerRecords, getLecturerDashboard} = require("../Controllers/lecturer.controllers")
const router = express.Router()
const authMiddleware = require("../middleware/auth");

router.post("/createLecturer", createLecturer);
router.get("/getLecturers", getLecturers);
router.post("/login", loginLecturer)
router.get("/lecturer-records", authMiddleware,  getLecturerRecords)
router.get("/dashboard", authMiddleware, getLecturerDashboard)


module.exports = router