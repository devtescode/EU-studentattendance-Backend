const CourseSchedule = require("../Models/courseschedule.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");





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
    "Sunday","Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday"
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

    const deleted = await CourseSchedule.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};