const Student = require("../Models/student.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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


// module.exports.loginStudent = async (req, res) => {
//   try {
//     const { matricNo, password } = req.body;

//     const student = await Student.findOne({ matricNo });

//     if (!student) {
//       return res.status(400).json({
//         message: "Invalid matric number or password",
//       });
//     }

//     const match = await bcrypt.compare(
//       password,
//       student.password
//     );

//     if (!match) {
//       return res.status(400).json({
//         message: "Invalid matric number or password",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: student._id,
//         role: "student",
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "1d",
//       }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       student: {
//         _id: student._id,
//         name: student.name,
//         matricNo: student.matricNo,
//         email: student.email,
//         department: student.department,
//         level: student.level,
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };
module.exports.loginStudent = async (req, res) => {
  try {
    const { matricNo, password } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!matricNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Matric number and password are required",
      });
    }

    // -----------------------------
    // FIND STUDENT (CASE-INSENSITIVE)
    // -----------------------------
    // Convert matric number to uppercase for consistent search
    // This ensures EU, Eu, eU, eu all work
    const normalizedMatricNo = matricNo.toUpperCase().trim();
    
    const student = await Student.findOne({ 
      matricNo: normalizedMatricNo 
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid matric number or password",
      });
    }

    // -----------------------------
    // VERIFY PASSWORD
    // -----------------------------
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid matric number or password",
      });
    }

    // -----------------------------
    // GENERATE JWT TOKEN
    // -----------------------------
    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
        matricNo: student.matricNo,
        email: student.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // -----------------------------
    // UPDATE LAST LOGIN (OPTIONAL)
    // -----------------------------
    // If you have a lastLogin field in your schema
    // student.lastLogin = new Date();
    // await student.save();

    // -----------------------------
    // RETURN RESPONSE
    // -----------------------------
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student: {
        _id: student._id,
        name: student.name,
        matricNo: student.matricNo,
        email: student.email,
        department: student.department,
        level: student.level,
        gender: student.gender,
        // Include other fields you want to send
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
