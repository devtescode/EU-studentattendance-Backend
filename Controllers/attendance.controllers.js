const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Attendance = require("../Models/attendance.models");
const CourseSchedule = require("../Models/courseschedule.models");
const AttendanceSession = require("../Models/attendanceSession.models")
const moment = require("moment-timezone");
env.config()



module.exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendance = await Attendance.find({ studentId })
      .populate("courseId", "courseCode courseTitle")
      .sort({ createdAt: -1 });

    const formatted = attendance.map((att) => ({
      id: att._id,

      course: {
        id: att.courseId?._id,
        code: att.courseId?.courseCode,
        title: att.courseId?.courseTitle,
      },

      weekKey: att.weekKey,

      markedAt: att.createdAt,
    }));

    return res.status(200).json({ attendance: formatted });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// module.exports.getStudentAttendanceSessions = async (req, res) => {
//   try {
//     const studentId = req.user.id;

//     const now = new Date();

//     const today = now
//       .toLocaleDateString("en-US", { weekday: "long" })
//       .toLowerCase();

//     const currentMinutes = now.getHours() * 60 + now.getMinutes();

//     const courses = await CourseSchedule.find({
//       registeredStudentIds: studentId,
//     });

//     const weekKey = getWeekKey();
//     const markedAttendance = await Attendance.find({
//       studentId,
//       weekKey,
//     }).select('courseId');

//     const markedCourseIds = markedAttendance.map(a => a.courseId.toString());

//     const sessions = courses
//       .filter((course) =>
//         course.days?.map((d) => d.toLowerCase()).includes(today)
//       )
//       .map((course) => {
//         const [sh, sm] = course.startTime.split(":").map(Number);
//         const [eh, em] = course.endTime.split(":").map(Number);

//         const start = sh * 60 + sm;
//         const end = eh * 60 + em;

//         return {
//           _id: course._id,
//           courseCode: course.courseCode,
//           courseTitle: course.courseTitle,
//           days: course.days,
//           startTime: course.startTime,
//           endTime: course.endTime,
//           isOpen: currentMinutes >= start && currentMinutes <= end,
//           isExpired: currentMinutes > end,
//           isAlreadyMarked: markedCourseIds.includes(course._id.toString()), // Add this
//         };
//       })
//       .filter((s) => !s.isExpired);

//     return res.status(200).json({ sessions });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };



module.exports.getStudentAttendanceSessions = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Nigeria timezone
    const lagosTime = moment().tz("Africa/Lagos");

    const today = lagosTime.format("dddd").toLowerCase();

    const currentMinutes =
      lagosTime.hour() * 60 +
      lagosTime.minute();

    const courses = await CourseSchedule.find({
      registeredStudentIds: studentId,
    });

    const weekKey = getWeekKey();

    const markedAttendance = await Attendance.find({
      studentId,
      weekKey,
    }).select("courseId");

    const markedCourseIds = markedAttendance.map(
      (a) => a.courseId.toString()
    );

    const sessions = courses
      .filter((course) =>
        course.days?.some(
          (day) => day.toLowerCase() === today
        )
      )
      .map((course) => {
        const [sh, sm] = course.startTime
          .split(":")
          .map(Number);

        const [eh, em] = course.endTime
          .split(":")
          .map(Number);

        const start = sh * 60 + sm;
        const end = eh * 60 + em;

        return {
          _id: course._id,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          days: course.days,
          startTime: course.startTime,
          endTime: course.endTime,

          isOpen:
            currentMinutes >= start &&
            currentMinutes <= end,

          isExpired:
            currentMinutes > end,

          isAlreadyMarked:
            markedCourseIds.includes(
              course._id.toString()
            ),
        };
      })
      .filter((session) => !session.isExpired);

    return res.status(200).json({
      currentTime: lagosTime.format(
        "YYYY-MM-DD HH:mm:ss"
      ),
      timezone: "Africa/Lagos",
      today,
      sessions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
// Replace this function
const getWeekKey = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);

  // Get the current day name
  const day = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  return `${now.getFullYear()}-W${week}-${day}`;
};

// module.exports.markAttendance = async (req, res) => {
//   try {
//     const studentId = req.user.id;
//     const { courseId } = req.body;

//     if (!courseId) {
//       return res.status(400).json({ message: "courseId is required" });
//     }

//     const course = await CourseSchedule.findById(courseId);

//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     const now = new Date();

//     const today = now
//       .toLocaleDateString("en-US", { weekday: "long" })
//       .toLowerCase();

//     const courseDays = course.days.map((d) => d.toLowerCase());

//     if (!courseDays.includes(today)) {
//       return res.status(400).json({
//         message: "Not an active day for this course",
//       });
//     }

//     const currentMinutes = now.getHours() * 60 + now.getMinutes();

//     const [sh, sm] = course.startTime.split(":").map(Number);
//     const [eh, em] = course.endTime.split(":").map(Number);

//     const start = sh * 60 + sm;
//     const end = eh * 60 + em;

//     if (currentMinutes < start || currentMinutes > end) {
//       return res.status(400).json({
//         message: "Attendance session closed",
//       });
//     }

//     // 🔥 WEEKLY LOCK SYSTEM - NOW INCLUDES DAY
//     const weekKey = getWeekKey();

//     const alreadyMarked = await Attendance.findOne({
//       studentId,
//       courseId,
//       weekKey,
//     });

//     if (alreadyMarked) {
//       return res.status(400).json({
//         message: "You already marked attendance for this week's session",
//       });
//     }

//     await Attendance.create({
//       studentId,
//       courseId,
//       lecturerId: course.lecturerId,
//       weekKey,
//     });

//     return res.status(201).json({
//       message: "Attendance marked successfully",
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

module.exports.markAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "courseId is required",
      });
    }

    const course = await CourseSchedule.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Nigeria timezone
    const lagosTime = moment().tz("Africa/Lagos");

    const today = lagosTime
      .format("dddd")
      .toLowerCase();

    const courseDays = course.days.map((d) =>
      d.toLowerCase()
    );

    if (!courseDays.includes(today)) {
      return res.status(400).json({
        message: "Not an active day for this course",
      });
    }

    const currentMinutes =
      lagosTime.hour() * 60 +
      lagosTime.minute();

    const [sh, sm] = course.startTime
      .split(":")
      .map(Number);

    const [eh, em] = course.endTime
      .split(":")
      .map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    if (
      currentMinutes < start ||
      currentMinutes > end
    ) {
      return res.status(400).json({
        message: "Attendance session closed",
      });
    }

    const weekKey = getWeekKey();

    const alreadyMarked =
      await Attendance.findOne({
        studentId,
        courseId,
        weekKey,
      });

    if (alreadyMarked) {
      return res.status(400).json({
        message:
          "You already marked attendance for this week's session",
      });
    }

    await Attendance.create({
      studentId,
      courseId,
      lecturerId: course.lecturerId,
      weekKey,
    });

    return res.status(201).json({
      message: "Attendance marked successfully",
      time: lagosTime.format(
        "YYYY-MM-DD HH:mm:ss"
      ),
      timezone: "Africa/Lagos",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports.getAttendanceHistory = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendance = await Attendance.find({ studentId })
      .populate("courseId", "courseCode courseTitle")
      .sort({ createdAt: -1 });

    const formatted = attendance.map((a) => ({
      _id: a._id,

      course: a.courseId
        ? {
          id: a.courseId._id,
          code: a.courseId.courseCode,
          title: a.courseId.courseTitle,
        }
        : null,

      weekKey: a.weekKey,

      markedAt: a.createdAt,
    }));

    return res.status(200).json({ attendance: formatted });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};