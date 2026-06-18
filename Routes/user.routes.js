const express = require("express")
const { userwelcome } = require("../Controllers/user.controllers")
const router = express.Router()


router.get('/welcome', userwelcome)

module.exports = router