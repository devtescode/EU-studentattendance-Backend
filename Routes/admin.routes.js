const express = require("express")
const { userwelcome, status, register, login } = require("../Controllers/admin.controllers")
const router = express.Router()


router.get('/welcome', userwelcome)
router.get("/status", status)
router.post("/register", register)
router.post("/login", login)

module.exports = router