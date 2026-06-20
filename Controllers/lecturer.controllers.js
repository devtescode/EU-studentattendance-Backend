const Lecturer = require("../Models/lecturer.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Attendance  = require("../Models/attendance.models");
const CourseSchedule = require("../Models/courseschedule.models");

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

module.exports.getLecturerRecords = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const records = await Attendance.find({
      lecturerId,
    })
      .populate("studentId", "name matricNo")
      .populate("courseId", "courseCode courseTitle")
      .sort({ createdAt: -1 });

    res.status(200).json({
      records,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};



module.exports.getLecturerDashboard = async (req, res) => {
  try {
    const lecturerId = req.user.id;

    // Lecturer Courses
    const courses = await CourseSchedule.find({
      lecturerId,
    });

    const courseIds = courses.map((c) => c._id);

    // Total Students (unique)
    const studentSet = new Set();

    courses.forEach((course) => {
      course.registeredStudentIds.forEach((id) => {
        studentSet.add(id.toString());
      });
    });

    const totalStudents = studentSet.size;

    // Active Attendance Sessions
    const now = new Date();

    const today = now
      .toLocaleDateString("en-US", {
        weekday: "long",
      })
      .toLowerCase();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    let activeSessions = 0;

    courses.forEach((course) => {
      const days = course.days.map((d) =>
        d.toLowerCase()
      );

      if (!days.includes(today)) return;

      const [sh, sm] = course.startTime
        .split(":")
        .map(Number);

      const [eh, em] = course.endTime
        .split(":")
        .map(Number);

      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      if (
        currentMinutes >= start &&
        currentMinutes <= end
      ) {
        activeSessions++;
      }
    });

    return res.status(200).json({
      totalCourses: courses.length,
      totalStudents,
      activeSessions,
      courses,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};``