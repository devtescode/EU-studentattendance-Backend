const express = require("express")
const {registerStudent } = require("../Controllers/student.controllers")
const router = express.Router()


router.post("/register", registerStudent)

module.exports = router