const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  drivingLicenseNo: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  additionalDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile", // Links a User to their profile
  },
  image: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
});

module.exports = mongoose.model("User", userSchema);
