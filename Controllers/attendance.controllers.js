const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Attendance  = require("../Models/attendance.models");
const CourseSchedule = require("../Models/courseschedule.models");
env.config()



module.exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendance = await Attendance.find({
      studentId,
    })
      .populate("courseId", "courseCode courseTitle")
      .sort({ createdAt: -1 });

    // 🔥 FORMAT RESPONSE FOR FRONTEND
    const formatted = attendance.map((att) => ({
      _id: att._id,
      studentId: att.studentId,

      // IMPORTANT: this is what frontend uses
      sessionId: att.sessionId || att.courseId?._id,

      course: {
        id: att.courseId?._id,
        code: att.courseId?.courseCode,
        title: att.courseId?.courseTitle,
      },

      createdAt: att.createdAt,
    }));

    return res.status(200).json({
      attendance: formatted,
    });
  } catch (error) {
    console.log("❌ getMyAttendance error:", error);

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




module.exports.markAttendance = async (
  req,
  res
) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    const course =
      await CourseSchedule.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const registered =
      course.registeredStudentIds.some(
        (id) => id.toString() === studentId
      );

    if (!registered) {
      return res.status(403).json({
        message:
          "You are not registered for this course",
      });
    }

    const now = new Date();

    const today = now.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!course.days.includes(today)) {
      return res.status(400).json({
        message:
          "Attendance is not available today",
      });
    }

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] =
      course.startTime.split(":").map(Number);

    const [endHour, endMinute] =
      course.endTime.split(":").map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    if (
      currentMinutes < startMinutes ||
      currentMinutes > endMinutes
    ) {
      return res.status(400).json({
        message:
          "Attendance session is closed",
      });
    }

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const alreadyMarked =
      await Attendance.findOne({
        studentId,
        courseId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

    if (alreadyMarked) {
      return res.status(400).json({
        message:
          "Attendance already marked today",
      });
    }

    await Attendance.create({
      studentId,
      courseId,
      lecturerId: course.lecturerId,
    });

    return res.status(201).json({
      message:
        "Attendance marked successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};