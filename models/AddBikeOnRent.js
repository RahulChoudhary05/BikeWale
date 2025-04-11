const mongoose = require("mongoose");

// AddBikeRent Schema
const addbikerentSchema = new mongoose.Schema({
  typeofbike: {
    type: String,
    required: true,
    trim: true, // Automatically trims any extra spaces
  },
  bikemodel: {
    type: String,
    required: true,
    trim: true,
  },
  about: {
    type: String,
    trim: true,
    required: true,
  },
  registeredBikeNo: {
    type: String,
    required: true,
    unique: true, // Ensure unique registration numbers
  },
  rentprice: {
    type: Number,
    required: true,
    min: 1, // Rent price must be at least 1
  },
  totalTimesRented: {
    type: Number,
    default: 0, // Track how many times the bike has been rented
  },
  ratingAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatingAndReview", // Reference to Rating and Review schema
    },
  ],
  bikepic: {
    type: String,
    required: true,
  },
  tag: {
    type: [String],
    required: true,
    default: [], // Default to an empty array for tags
  },
  BikeAvailable: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Tracks users who have rented this bike
    },
  ],
  profile: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User owning the bike
    ref: "Profile",
    required: true,
  },
  averageRating: {
    type: Number,
    default: 0, // Average rating will be updated dynamically with ratings
    min: 0,
    max: 5, // Restrict range between 0 and 5
  },
  status: {
    type: String,
    enum: ["Draft", "Published", "Unavailable"], // Added an 'Unavailable' status
    default: "Draft",
  },
  isVerified: {
    type: Boolean, // Indicates whether the bike details are verified by admin
    default: false,
  },
  rentedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tracks who rented the bike (history of users)
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AddBikeRent", addbikerentSchema);
