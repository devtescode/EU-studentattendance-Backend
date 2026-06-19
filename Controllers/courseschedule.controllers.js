const CourseSchedule = require("../Models/courseschedule.models");
const Student = require("../Models/student.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");




module.exports.createSchedule = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const { courseCode, courseTitle, days, startTime, endTime } = req.body;

        if (!courseCode || !courseTitle || !days?.length || !startTime || !endTime) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const session = await CourseSchedule.create({
            lecturerId,
            courseCode,
            courseTitle,
            days,
            startTime,
            endTime,
        });

        res.status(201).json({
            message: "Schedule created successfully",
            session,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET ALL LECTURER SESSIONS
module.exports.getMySessions = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const sessions = await CourseSchedule.find({ lecturerId }).sort({
            createdAt: -1,
        });

        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};




const getCurrentDay = () => {
    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];
    return days[new Date().getDay()];
};

// convert "09:30" → minutes
const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

// GET ONLY ACTIVE SESSIONS for users (REAL TIME FILTER)
module.exports.getActiveSessions = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const sessions = await CourseSchedule.find({ lecturerId });

        const today = getCurrentDay();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const active = sessions.filter((s) => {
            const isToday = s.days.includes(today);

            const start = toMinutes(s.startTime);
            const end = toMinutes(s.endTime);

            const isWithinTime = currentMinutes >= start && currentMinutes <= end;

            return isToday && isWithinTime;
        });

        res.json({ sessions: active });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// UPDATE SESSION
module.exports.updateSession = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await CourseSchedule.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Session not found" });
        }

        res.json({
            message: "Updated successfully",
            session: updated,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE SESSION


module.exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Session id is required",
      });
    }

    // 🔥 FIND SESSION FIRST (optional but safer)
    const session = await CourseSchedule.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // 🔥 STEP 1: DELETE SESSION
    await CourseSchedule.findByIdAndDelete(id);

    // 🔥 STEP 2: CLEAN STUDENT REFERENCES (IMPORTANT FIX)
    await Student.updateMany(
      { registeredCourses: id },
      { $pull: { registeredCourses: id } }
    );

    // 🔥 STEP 3: REMOVE STUDENTS FROM COURSE REGISTERED LIST (SAFE CLEANUP)
    await Student.updateMany(
      {},
      { $pull: { registeredCourses: id } }
    );

    console.log(`✅ Session ${id} deleted and cleaned up`);

    return res.json({
      success: true,
      message: "Session deleted successfully",
    });

  } catch (err) {
    console.error("❌ deleteSession error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};





module.exports.getCourseStudents = async (req, res) => {
  try {
    console.log("🔥 getCourseStudents HIT");
    const { courseId } = req.params;
    // ✅ Validate courseId
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }
    // ✅ Find course
    const course = await CourseSchedule.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    // ✅ Safe fallback
    const registeredIds = course.registeredStudentIds || [];
    console.log("📌 Registered Student IDs:", registeredIds);
    // ✅ If no students registered yet
    if (registeredIds.length === 0) {
      return res.json({
        course: {
          id: course._id,
          code: course.courseCode,
          title: course.courseTitle,
          days: course.days,
          startTime: course.startTime,
          endTime: course.endTime,
          totalStudents: 0,
        },
        students: [],
      });
    }
    // ✅ Fetch students
    const students = await Student.find({
      _id: { $in: registeredIds },
    }).select("name matricNo email");
    console.log("👨‍🎓 Students Found:", students.length);
    return res.json({
      course: {
        id: course._id,
        code: course.courseCode,
        title: course.courseTitle,
        days: course.days,
        startTime: course.startTime,
        endTime: course.endTime,
        totalStudents: students.length,
      },
      students,
    });
  } catch (err) {
    console.error("❌ERROR in getCourseStudents:", err);
    return res.status(500).json({ message: "Server error" });
  }
};