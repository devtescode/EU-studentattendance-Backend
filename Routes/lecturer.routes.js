const express = require("express")
const { createLecturer, getLecturers, loginLecturer} = require("../Controllers/lecturer.controllers")
const router = express.Router()

router.post("/createLecturer", createLecturer);
router.get("/getLecturers", getLecturers);
router.post("/login", loginLecturer)

module.exports = router