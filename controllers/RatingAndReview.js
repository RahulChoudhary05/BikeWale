const RatingAndReview = require("../models/RatingAndReviews");
const AddBikeRent = require("../models/AddBikeOnRent");
const mongoose = require("mongoose");

// Create Rating and Review
exports.createRating = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user ID
    const { rating, review, bikeID } = req.body;

    // Validate that the bike exists
    const bikeDetails = await AddBikeRent.findById(bikeID);
    if (!bikeDetails) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    // Ensure the user hasn't already reviewed the same bike
    const existingReview = await RatingAndReview.findOne({ user: userId, bike: bikeID });
    if (existingReview) {
      return res.status(403).json({
        success: false,
        message: "You have already reviewed this bike",
      });
    }

    // Create the rating and review
    const newRatingAndReview = await RatingAndReview.create({
      user: userId,
      bike: bikeID,
      rating,
      review,
    });

    // Update the bike with this rating and review ID
    bikeDetails.ratingAndReviews.push(newRatingAndReview._id);
    await bikeDetails.save();

    // Recalculate and update the average rating
    await updateAverageRating(bikeID);

    return res.status(201).json({
      success: true,
      message: "Rating and review added successfully",
      data: newRatingAndReview,
    });
  } catch (error) {
    console.error("Error creating rating and review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create rating and review",
      error: error.message,
    });
  }
};

// Function to Recalculate the Average Rating of a Bike
const updateAverageRating = async (bikeID) => {
  try {
    const ratings = await RatingAndReview.find({ bike: bikeID });
    const average = ratings.reduce((sum, review) => sum + review.rating, 0) / (ratings.length || 1);

    // Update the bike's average rating
    await AddBikeRent.findByIdAndUpdate(
      bikeID,
      { averageRating: average },
      { new: true }
    );
  } catch (error) {
    console.error("Failed to update averageRating:", error.message);
  }
};

// Get Average Rating for a Bike
exports.getAverageRating = async (req, res) => {
  try {
    const { bikeID } = req.params;

    // Validate that bikeID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(bikeID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bike ID",
      });
    }

    // Use the correct way to transform bikeID to an ObjectId
    const result = await RatingAndReview.aggregate([
      {
        $match: { bike: new mongoose.Types.ObjectId(bikeID) }, // Corrected ObjectId reference
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }, // Calculate the average of all ratings
        },
      },
    ]);

    // Return the average rating result
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    // If no reviews exist for the bike, return 0 as the average rating
    return res.status(200).json({
      success: true,
      averageRating: 0,
      message: "No ratings yet for this bike.",
    });
  } catch (error) {
    console.error("Error calculating average rating:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate average rating",
      error: error.message,
    });
  }
};

// Get All Ratings and Reviews
exports.getAllRatingsAndReviews = async (req, res) => {
  try {
    const reviews = await RatingAndReview.find({})
      .populate({ path: "user", select: "fullName email" })
      .populate({ path: "bike", select: "typeofbike bikemodel" })
      .sort({ rating: -1 }); // Sort by highest rating first

    return res.status(200).json({
      success: true,
      message: "All ratings and reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching ratings and reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews and ratings",
      error: error.message,
    });
  }
};

// Get Best-Rated Bikes
exports.getBestRatedBikes = async (req, res) => {
  try {
    const bestRatedBikes = await AddBikeRent.aggregate([
      {
        $lookup: {
          from: "ratingandreviews", // Reference the "RatingAndReviews" collection
          localField: "ratingAndReviews",
          foreignField: "_id",
          as: "ratings",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$ratings.rating" },
        },
      },
      {
        $sort: { averageRating: -1 }, // Sort by descending average rating
      },
      {
        $limit: 5, // Limit to top 5 bikes
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Best-rated bikes fetched successfully",
      data: bestRatedBikes,
    });
  } catch (error) {
    console.error("Error fetching best-rated bikes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch best-rated bikes",
      error: error.message,
    });
  }
};

// Get Reviews for a Specific Bike
exports.getReviewsForBike = async (req, res) => {
  try {
    const { bikeID } = req.params;

    const reviews = await RatingAndReview.find({ bike: bikeID })
      .populate({ path: "user", select: "fullName email" })
      .sort({ createdAt: -1 }); // Sort by most recent reviews

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews for bike:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};
