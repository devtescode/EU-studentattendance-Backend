const Lecturer = require("../Models/lecturer.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.createLecturer = async (req, res) => {
  try {
    const { name, email, department, password } = req.body;

    if (!name || !email || !department || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // CHECK DUPLICATE EMAIL
    const existing = await Lecturer.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const lecturer = await Lecturer.create({
      name,
      email,
      department,
      password,
    });

    return res.status(201).json({
      message: "Lecturer created successfully",
      lecturer,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// GET ALL LECTURERS
module.exports.getLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find().select("-password");

    return res.status(200).json({
      lecturers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};



module.exports.loginLecturer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const lecturer = await Lecturer.findOne({ email });

    if (!lecturer) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, lecturer.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: lecturer._id, role: "lecturer" },
      process.env.LECTURER_JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      lecturer,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};