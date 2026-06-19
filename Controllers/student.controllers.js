const Student = require("../Models/student.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CourseSchedule = require("../Models/courseschedule.models")



module.exports.registerStudent = async (req, res) => {
  try {
    const { name, email, matricNo, level, gender, department, password } = req.body;

  
    if (!name || !email || !matricNo || !level || !gender || !department || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

   
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

 
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid matric number or password",
      });
    }

   
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


module.exports.getallcoursebystudent = async (req, res)=>{
     try {
    const courses = await CourseSchedule.find()
      .populate("lecturerId", "name")
      .sort({ createdAt: -1 });

    const formattedCourses = courses.map((course) => ({
      _id: course._id,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      days: course.days,
      startTime: course.startTime,
      endTime: course.endTime,
      lecturerName: course.lecturerId?.name || "Unknown",
    }));

    res.status(200).json({
      courses: formattedCourses,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch courses",
    });
  }

}


module.exports.registerCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    const course = await CourseSchedule.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const alreadyRegistered = student.registeredCourses?.some(
      (id) => id.toString() === courseId
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        message: "You have already registered this course",
      });
    }

    student.registeredCourses.push(courseId);

    await student.save();

    res.status(200).json({
      message: "Course registered successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports.getMyCourses = async(req, res) =>{
    try {
    const studentId = req.user.id;

    const student = await Student.findById(studentId)
      .populate({
        path: "registeredCourses",
        populate: {
          path: "lecturerId",
          select: "name",
        },
      });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json({
      courses: student.registeredCourses,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports.unregisterCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    student.registeredCourses =
      student.registeredCourses.filter(
        (id) => id.toString() !== courseId
      );

    await student.save();

    res.status(200).json({
      success: true,
      message: "Course removed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};