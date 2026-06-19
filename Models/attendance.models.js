const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSchedule",
      required: true,
    },

    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },

    // sessionId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Session"
    // }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);