const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  bike: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "AddBikeRent",
  },
  rating: {
    type: Number, // Use "number" instead of "string" for mathematical operations (e.g., avg)
    required: true,
    min: 1,
    max: 5, // Constrain ratings between 1 and 5
  },
  review: {
    type: String,
    required: true,
  },
});

// Exporting RatingAndReview model
module.exports = mongoose.model("RatingAndReviews", ratingAndReviewSchema);
