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
    ref: "Profile", // Ensure this is correct
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
  profile: {
    type: mongoose.Schema.Types.ObjectId, // Ensure this is defined
    ref: "Profile",
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  isBikeOwner: { type: Boolean, default: false } 
});

module.exports = mongoose.model("User", userSchema);