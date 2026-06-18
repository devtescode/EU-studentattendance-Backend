const Student = require("../Models/student.models");

/**
 * Register a new student
 * POST /api/students/register
 */
module.exports.registerStudent = async (req, res) => {
  try {
    const { name, email, matricNo, level, gender, department, password } = req.body;

    // -----------------------------
    // BASIC REQUIRED FIELD CHECK
    // -----------------------------
    if (!name || !email || !matricNo || !level || !gender || !department || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // -----------------------------
    // CHECK FOR DUPLICATES
    // -----------------------------
    const existingStudent = await Student.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { matricNo: matricNo.toUpperCase().trim() },
      ],
    });

    if (existingStudent) {
      let duplicateField = "";
      if (existingStudent.email === email.toLowerCase().trim()) {
        duplicateField = "email";
      } else if (existingStudent.matricNo === matricNo.toUpperCase().trim()) {
        duplicateField = "matric number";
      }

      return res.status(409).json({
        success: false,
        message: `Student already exists with this ${duplicateField}`,
        duplicateField,
      });
    }

    // -----------------------------
    // CREATE STUDENT
    // -----------------------------
    const studentData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      matricNo: matricNo.toUpperCase().trim(),
      level,
      gender,
      department: department.trim(),
      password, // Will be hashed by pre-save middleware
    };

    const student = await Student.create(studentData);

    // Remove password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: studentResponse,
    });

  } catch (error) {
    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Student already exists with this ${field}`,
        duplicateField: field,
      });
    }

    // Handle validation errors from mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    console.error("Error registering student:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};