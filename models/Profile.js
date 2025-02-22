const mongoose = require("mongoose");

// Updated Profile Schema
const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
  },
  dateofBirth: {
    type: String,
  },
  about: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
  },
  // New Fields
  bikesCreated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AddBikeRent",
    },
  ], // Bikes created by the user
  bikesRented: [
    {
      bike: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddBikeRent",
      },
      rentedAt: { type: Date, default: Date.now },
    },
  ], // History of bikes rented by the user
});

module.exports = mongoose.model("Profile", profileSchema);
