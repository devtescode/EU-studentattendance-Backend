const express = require("express")
const { userwelcome, status, register, login, getAllStudents, getAdminDashboard } = require("../Controllers/admin.controllers")
const router = express.Router()


router.get('/welcome', userwelcome)
router.get("/status", status)
router.post("/register", register)
router.post("/login", login)
router.get("/getallstudents", getAllStudents)
router.get("/getadmindashboard", getAdminDashboard)

module.exports = router