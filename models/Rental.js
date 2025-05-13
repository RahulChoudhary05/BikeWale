const mongoose = require("mongoose");

const RentalSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  bikeId: String,
  hours: Number,
  totalPrice: Number,
  platformFee: Number,
  ownerEarnings: Number,
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Rental", RentalSchema);
