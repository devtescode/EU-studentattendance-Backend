const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User  = require("../Models/user.models");
env.config()




module.exports.userwelcome = async (req, res) => {
    res.status(200).json({ message: "Welcome to Attendance" })
}
