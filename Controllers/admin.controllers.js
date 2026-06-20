const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Admin = require("../Models/admin.models");
const Student = require("../Models/student.models");
const Course = require("../Models/courseschedule.models");
const Lecturer = require("../Models/lecturer.models");
const Session = require("../Models/attendance.models");
env.config()




module.exports.userwelcome = async (req, res) => {
    res.status(200).json({ message: "Welcome to Attendance" })
}

module.exports.status = async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();

        return res.status(200).json({
            hasAdmin: adminCount > 0,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
        });
    }
}

module.exports.register = async (req, res) => {
console.log("hittttttttt")
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.countDocuments();

    if (adminExists > 0) {
      return res.status(403).json({
        message: "Admin already exists",
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password, // raw password ONLY
    });
    console.log("admin log", admin)

    res.status(201).json({
      message: "Admin registered successfully",
      admin,
    });
    console.log("Admin create successfully")
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
    console.log(error, "error")
  }
};

module.exports.login = async (req, res)=> {
    try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(
      password,
      admin.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    return res.status(200).json({
      students,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ADMIN DASHBOARD DATA
module.exports.getAdminDashboard = async (req, res) => {
  try {
    const courses = await Course.find().lean();
    const lecturers = await Lecturer.find().lean();
    const students = await Student.find().lean();
    const sessions = await Session.find().lean();

    return res.status(200).json({
      courses,
      lecturers,
      students,
      sessions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};