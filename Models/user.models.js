const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const Userschema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });


Userschema.pre("save", async function () {
  if (!this.isModified("password")) return; // no next()
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


module.exports = mongoose.model("User", Userschema);