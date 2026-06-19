const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: String,
    matricNo: { type: String, unique: true },
    level: String,
    email: { type: String, unique: true },
    gender: String,
    department: String,
    password: String,
    registeredCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSchedule",
    },
  ],
  },
  { timestamps: true }
);


studentSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

module.exports = mongoose.model("Student", studentSchema);