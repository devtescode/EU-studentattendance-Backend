const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Attendance  = require("../Models/attendance.models");
const CourseSchedule = require("../Models/courseschedule.models");
env.config()



module.exports.getMyAttendance = async (
  req,
  res
) => {
  try {
    const studentId = req.user.id;

    const attendance =
      await Attendance.find({
        studentId,
      })
        .populate(
          "courseId",
          "courseCode courseTitle"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      attendance,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports.getStudentAttendanceSessions = async (
  req,
  res
) => {
  try {
    const studentId = req.user.id;

    const now = new Date();

    const today = now.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const courses = await CourseSchedule.find({
      registeredStudentIds: studentId,
    }).populate("lecturerId", "name");

    const activeSessions = courses.filter((course) => {
      if (
        !course.days ||
        !course.days.includes(today)
      ) {
        return false;
      }

      const [startHour, startMinute] =
        course.startTime.split(":").map(Number);

      const [endHour, endMinute] =
        course.endTime.split(":").map(Number);

      const startMinutes =
        startHour * 60 + startMinute;

      const endMinutes =
        endHour * 60 + endMinute;

      return (
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes
      );
    });

    return res.status(200).json({
      sessions: activeSessions,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};