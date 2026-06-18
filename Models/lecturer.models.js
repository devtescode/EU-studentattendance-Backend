const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const lecturerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  department: String,
  password: String,
});

// hash password
lecturerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Lecturer", lecturerSchema);