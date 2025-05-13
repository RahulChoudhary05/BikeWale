const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");

// Import BikeRental controllers
const {
  addBikeOnRental,
  getAllBikes,
  getBikeDetails,
  editBikeDetails,
  deleteBike,
  updateHowManyTimeBikeRent
} = require("../controllers/BikeRental");

// Import Rating and Review controllers
const {
  createRating,
  getAverageRating,
  getAllRatingsAndReviews,
  getBestRatedBikes,
  getReviewsForBike,
} = require("../controllers/RatingAndReview");

// Bike rental routes
router.post("/addbikes", auth, addBikeOnRental);
router.get("/allbikes", getAllBikes);
router.get("/bikesinfo/:bikeID", getBikeDetails);
router.put("/update-bikedetails/:bikeID", auth, editBikeDetails);
router.delete("/deletebikes/:bikeID", auth, deleteBike);

// Bike rental usage tracking
router.post("/bikes/:bikeID/rent-count", auth, updateHowManyTimeBikeRent);

// Updated Rating and Review routes
router.post("/bikes/:bikeID/ratings", auth, createRating); // Create Rating and Review
router.get("/ratings/average/:bikeID", getAverageRating); // Get Average Rating for a Bike
router.get("/ratings", getAllRatingsAndReviews); // Get All Ratings and Reviews
router.get("/ratings/best", getBestRatedBikes); // Get Best Rated Bikes
router.get("/ratings/:bikeID", getReviewsForBike); // Get All Reviews for a Specific Bike

module.exports = router;
